#!/usr/bin/env node
/**
 * render-mp4.mjs — CDP (Chrome DevTools Protocol) 自动化 MP4 渲染
 *
 * 原理：
 *  1. 起本地 HTTP 服务，指向项目根目录
 *  2. 启动 headless Chrome，加载 index.html
 *  3. 通过 CDP 触发 audio.play()
 *  4. 用 Page.startScreencast 逐帧收 JPEG
 *  5. audio 结束 → stopScreencast → close Chrome
 *  6. FFmpeg 把帧序列 + audio.mp3 合成 MP4
 *  7. 清理临时帧
 *
 * 依赖：
 *  - Node 22+
 *  - Chrome（找系统安装的 chrome.exe）
 *  - FFmpeg（在 PATH）
 *  - npm i chrome-remote-interface (在技能目录装)
 *
 * 用法：
 *  node scripts/render-mp4.mjs <projectRoot>
 *    --width 1920 --height 1080   帧尺寸
 *    --fps 30                      帧率
 *    --port 9222                   CDP 调试起始端口（被占自动+1）
 *    --http-port 3009              HTTP 服务起始端口（被占自动+1）
 *    --chrome "path/to/chrome.exe" 显式指定 Chrome 路径
 *    --keep-frames                 不清理临时帧目录（调试用）
 */

import { spawn, spawnSync } from 'node:child_process';
import { readFileSync, existsSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { createServer } from 'node:http';
import { createRequire } from 'node:module';
import { join, resolve, extname } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';

// ============================================================
// 参数解析
// ============================================================
const argv = process.argv.slice(2);
const projectRoot = argv.find(a => !a.startsWith('--'));
if (!projectRoot) {
  console.error('Usage: node render-mp4.mjs <projectRoot> [--width 1920 --height 1080 --fps 30 --port 9222 --http-port 3009 --chrome path]');
  process.exit(1);
}

// 健壮的 opts 解析：遍历 argv，遇到 --xxx 就取下一个
const opts = {};
for (let i = 0; i < argv.length; i++) {
  const a = argv[i];
  if (a.startsWith('--')) {
    const key = a.replace(/^--/, '');
    if (i + 1 < argv.length && !argv[i + 1].startsWith('--')) {
      opts[key] = argv[i + 1];
      i++; // 跳过值
    } else {
      opts[key] = true;
    }
  }
}

const WIDTH = parseInt(opts.width || '1920', 10);
const HEIGHT = parseInt(opts.height || '1080', 10);
const FPS = parseInt(opts.fps || '30', 10);
const CDP_START_PORT = parseInt(opts.port || '9222', 10);
const HTTP_START_PORT = parseInt(opts['http-port'] || '3009', 10);
const CHROME_PATH = opts.chrome || findChromePath();

const ROOT = resolve(projectRoot);
const INDEX_HTML = join(ROOT, 'index.html');
const AUDIO_MP3 = join(ROOT, 'audio.mp3');
const TIMING_JSON = join(ROOT, 'scene-timing.json');
const OUTPUT_MP4 = join(ROOT, 'output.mp4');
const FRAMES_DIR = join(ROOT, '.frames');

if (!existsSync(INDEX_HTML)) die(`index.html not found at ${INDEX_HTML}`);
if (!existsSync(AUDIO_MP3)) die(`audio.mp3 not found at ${AUDIO_MP3}`);
if (!existsSync(TIMING_JSON)) die(`scene-timing.json not found at ${TIMING_JSON}`);
if (!CHROME_PATH || !existsSync(CHROME_PATH)) die(`Chrome not found; pass --chrome "path/to/chrome.exe"`);

// ============================================================
// 计算总时长
// ============================================================
const timing = JSON.parse(readFileSync(TIMING_JSON, 'utf-8'));
const scenes = Array.isArray(timing) ? timing : (timing.scenes || []);
const totalDuration = Math.max(...scenes.map(s => s.endTime ?? (s.end ?? 0) ?? (s.sceneOffset + s.duration) ?? 0));
if (!totalDuration || totalDuration <= 0) die(`Cannot infer total duration from scene-timing.json`);

console.log('▶ render-mp4');
console.log('  root       :', ROOT);
console.log('  size       :', WIDTH, '×', HEIGHT, '@', FPS, 'fps');
console.log('  chrome     :', CHROME_PATH);
console.log('  duration   :', totalDuration.toFixed(2), 's');
console.log('  frames     :', Math.ceil(totalDuration * FPS));

// ============================================================
// 清理 & 准备帧目录（EPERM 兼容：被 Chrome 锁定时用替代目录名）
// ============================================================
let framesDir = FRAMES_DIR;
function ensureFramesDir() {
  if (existsSync(framesDir)) {
    try {
      rmSync(framesDir, { recursive: true, force: true });
    } catch (e) {
      if (e.code === 'EPERM') {
        // 被 Chrome crashpad 锁住 → 用随机后缀
        framesDir = FRAMES_DIR + '-' + Date.now();
        console.warn(`⚠  ${FRAMES_DIR} locked, using ${framesDir}`);
        if (existsSync(framesDir)) rmSync(framesDir, { recursive: true, force: true });
      } else {
        throw e;
      }
    }
  }
  mkdirSync(framesDir, { recursive: true });
}
ensureFramesDir();

// ============================================================
// 全局清理（SIGINT / 异常退出）
// ============================================================
let chromeProc = null;
let server = null;
let client = null;
let cdpPort = CDP_START_PORT;
let httpPort = HTTP_START_PORT;
let cleaningUp = false;

function cleanup() {
  if (cleaningUp) return;
  cleaningUp = true;
  try { client?.close(); } catch {}
  try { chromeProc?.kill(); } catch {}
  try { server?.close(); } catch {}
}

process.on('SIGINT', () => {
  console.log('\n⏹  interrupted, cleaning up...');
  cleanup();
  process.exit(130);
});
process.on('SIGTERM', cleanup);

// ============================================================
// 起本地 HTTP 服务（自动找可用端口）
// ============================================================
for (let attempt = 0; attempt < 20; attempt++) {
  httpPort = HTTP_START_PORT + attempt;
  try {
    server = await tryCreateServer(ROOT, httpPort);
    break;
  } catch (e) {
    if (e.code === 'EADDRINUSE') continue;
    throw e;
  }
}
if (!server) die(`Cannot find available HTTP port (tried ${HTTP_START_PORT}-${HTTP_START_PORT + 19})`);
console.log(`▶ http://localhost:${httpPort}/ serving ${ROOT}`);

// ============================================================
// 加载 chrome-remote-interface（用 createRequire 兼容）
// ============================================================
let CDP;
try {
  const req = createRequire(import.meta.url);
  CDP = req('chrome-remote-interface');
} catch (e) {
  cleanup();
  die(`chrome-remote-interface not installed. Run: npm i chrome-remote-interface`);
}

// ============================================================
// 启动 headless Chrome（自动找可用 CDP 端口）
// ============================================================
for (let attempt = 0; attempt < 20; attempt++) {
  cdpPort = CDP_START_PORT + attempt;
  // 跳过已被 HTTP 服务占用的端口
  if (cdpPort === httpPort) continue;

  const chromeArgs = [
    `--remote-debugging-port=${cdpPort}`,
    '--headless=new',
    '--disable-gpu',
    '--mute-audio',
    `--window-size=${WIDTH},${HEIGHT}`,
    '--hide-scrollbars',
    '--autoplay-policy=no-user-gesture-required',
    '--disable-renderer-backgrounding',
    '--disable-background-timer-throttling',
    '--disable-backgrounding-occluded-windows',
    '--font-render-hinting=none',
    '--no-first-run',
    '--no-default-browser-check',
    '--user-data-dir=' + join(framesDir, '.chrome-profile'),
    `http://localhost:${httpPort}/index.html`
  ];

  console.log(`▶ launch chrome (cdp port ${cdpPort})`);
  chromeProc = spawn(CHROME_PATH, chromeArgs, { stdio: ['ignore', 'ignore', 'ignore'] });

  // 等 Chrome CDP 就绪
  try {
    await waitForCDP(CDP, cdpPort, 12);  // 6s timeout (12 × 500ms)
    break;
  } catch (e) {
    console.log(`  port ${cdpPort} not available, trying next...`);
    chromeProc.kill();
    chromeProc = null;
    // 清理可能残留的 user-data-dir
    const profileDir = join(framesDir, '.chrome-profile');
    if (existsSync(profileDir)) {
      try { rmSync(profileDir, { recursive: true, force: true }); } catch {}
    }
  }
}

if (!chromeProc) die(`Cannot start Chrome on any CDP port (tried ${CDP_START_PORT}-${CDP_START_PORT + 19})`);

// ============================================================
// 连接 CDP
// ============================================================
client = await CDP({ port: cdpPort });
const { Page, Runtime, Emulation } = client;
await Page.enable();
await Runtime.enable();
await Emulation.setDeviceMetricsOverride({
  width: WIDTH, height: HEIGHT, deviceScaleFactor: 1, mobile: false
});

// 等页面就绪后，检查 audio 状态
console.log('▶ waiting page load...');
await waitFor(async () => {
  const { result } = await Runtime.evaluate({
    expression: `document.readyState === 'complete'`,
    returnByValue: true
  });
  return result.value === true;
}, 15000);

// 检查 audio 元素状态并打印诊断信息
const { result: domCheck } = await Runtime.evaluate({
  expression: `(function(){
    var v=document.getElementById('viewport');
    var m=document.getElementById('mount');
    var a=document.getElementById('audio-player');
    var body='body:'+document.body.innerHTML.substring(0,200);
    return 'viewport='+(!!v)+' mount='+(!!m)+' audio='+(!!a)+' | '+body.replace(/\\n/g,' ').trim()
  })()`,
  returnByValue: true
});
console.log('  DOM:', domCheck.value);

// 不管 readyState 直接进行（preload 在 headless 可能不会触发 readyState>=2）

// ============================================================
// 收帧
// ============================================================
let frameIndex = 0;
let lastFrameTime = Date.now();

Page.screencastFrame(async ({ data, sessionId }) => {
  const path = join(framesDir, `frame-${String(frameIndex++).padStart(6, '0')}.jpg`);
  writeFileSync(path, Buffer.from(data, 'base64'));
  lastFrameTime = Date.now();
  await Page.screencastFrameAck({ sessionId });
});

console.log('▶ start screencast');
await Page.startScreencast({
  format: 'jpeg',
  quality: 85,
  everyNthFrame: Math.max(1, Math.round(60 / FPS)),
  maxWidth: WIDTH,
  maxHeight: HEIGHT
});

// 等几帧确认 screencast 在工作
await delay(3000);
if (frameIndex === 0) {
  console.warn('⚠  no frames received after 3s, screencast may not work');
}

// 触发播放
await Runtime.evaluate({
  expression: `document.getElementById('audio-player').play()`,
  awaitPromise: true
});
console.log('▶ audio.play() triggered');

// ============================================================
// 等待播放完成（每 5s 报进度）
// ============================================================
const startTs = Date.now();
let lastLogFrame = 0;
const CHECK_INTERVAL = 2000;     // 每 2s 查一次状态
const PROGRESS_LOG_INTERVAL = 5; // 每 5s 打一次日志

function logProgress(elapsed, curTime, fps) {
  const pct = Math.min(100, (curTime / totalDuration * 100)).toFixed(1);
  const eta = curTime > 0 ? ((totalDuration - curTime) / curTime * elapsed).toFixed(0) : '?';
  console.log(`  [${elapsed}s] ${pct}% | ${curTime.toFixed(1)}s/${totalDuration.toFixed(1)}s | ${frameIndex} frames | ${fps} fps | ETA ${eta}s`);
}

await waitFor(
  async () => {
    const { result } = await Runtime.evaluate({
      expression: `(function(){var a=document.getElementById('audio-player');return a.ended || (a.currentTime >= ${totalDuration - 0.05})})()`,
      returnByValue: true
    });
    return result.value === true;
  },
  (totalDuration + 60) * 1000,  // 总时长 + 60s 额外等待
  async () => {
    // 进度回调：每 2s 检查一次
    const elapsed = Math.floor((Date.now() - startTs) / 1000);
    if (elapsed > 0 && elapsed % PROGRESS_LOG_INTERVAL === 0 && frameIndex !== lastLogFrame) {
      lastLogFrame = frameIndex;
      const { result: ctResult } = await Runtime.evaluate({
        expression: `document.getElementById('audio-player')?.currentTime || 0`,
        returnByValue: true
      });
      const fps = elapsed > 0 ? (frameIndex / elapsed).toFixed(1) : '?';
      logProgress(elapsed, ctResult.value || 0, fps);
    }

    // 帧捕获超时检查（超过 15s 没收到新帧）
    if (frameIndex > 0 && Date.now() - lastFrameTime > 15000) {
      console.warn('⚠  no new frames for 15s, screencast may have stalled');
    }
  }
);

console.log(`▶ playback done in ${((Date.now() - startTs) / 1000).toFixed(1)}s`);
console.log(`▶ captured ${frameIndex} frames`);

await Page.stopScreencast();
await client.close();
chromeProc.kill();
server.close();

// ============================================================
// FFmpeg 合成 MP4
// ============================================================
if (frameIndex < 5) die(`too few frames captured (${frameIndex}), aborting`);

console.log('▶ ffmpeg encode');
const framePattern = join(framesDir, 'frame-%06d.jpg');
const ffArgs = [
  '-y',
  '-framerate', String(FPS),
  '-i', framePattern,
  '-i', AUDIO_MP3,
  '-c:v', 'libx264',
  '-pix_fmt', 'yuv420p',
  '-preset', 'medium',
  '-crf', '20',
  '-c:a', 'aac',
  '-b:a', '192k',
  '-shortest',
  OUTPUT_MP4
];
const ff = spawnSync('ffmpeg', ffArgs, { stdio: 'inherit' });
if (ff.status !== 0) die(`ffmpeg failed with code ${ff.status}`);

// ============================================================
// 清理帧目录
// ============================================================
if (!opts['keep-frames']) {
  rmSync(framesDir, { recursive: true, force: true });
  console.log('▶ frames cleaned');
}

console.log('✅ output:', OUTPUT_MP4);
process.exit(0);

// ============================================================
// helpers
// ============================================================
function die(msg) {
  console.error('✗', msg);
  cleanup();
  process.exit(1);
}

function findChromePath() {
  const candidates = [
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    process.env.CHROME_PATH
  ].filter(Boolean);
  return candidates.find(p => existsSync(p)) || null;
}

async function waitForCDP(CDP, port, retries) {
  for (let i = 0; i < retries; i++) {
    try {
      const list = await CDP.List({ port });
      if (list?.length) return;
    } catch {}
    await delay(500);
  }
  throw new Error(`Chrome CDP did not come up on port ${port}`);
}

async function waitFor(check, timeoutMs, onTick, intervalMs = 2000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    if (await check()) return;
    if (onTick) await onTick();
    await delay(intervalMs);
  }
  throw new Error(`waitFor timeout after ${timeoutMs}ms`);
}

function tryCreateServer(rootDir, port) {
  return new Promise((resolve, reject) => {
    const MIME = {
      '.html': 'text/html; charset=utf-8',
      '.js':   'application/javascript; charset=utf-8',
      '.mjs':  'application/javascript; charset=utf-8',
      '.css':  'text/css; charset=utf-8',
      '.json': 'application/json; charset=utf-8',
      '.mp3':  'audio/mpeg',
      '.png':  'image/png',
      '.jpg':  'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.webp': 'image/webp',
      '.svg':  'image/svg+xml',
      '.woff': 'font/woff',
      '.woff2':'font/woff2',
      '.ttf':  'font/ttf'
    };
    const srv = createServer((req, res) => {
      res.setHeader('Access-Control-Allow-Origin', '*');
      let url = decodeURIComponent(req.url.split('?')[0]);
      if (url === '/') url = '/index.html';
      const filePath = join(rootDir, url);
      if (!existsSync(filePath)) {
        res.statusCode = 404;
        return res.end('404 ' + url);
      }
      const ext = extname(filePath).toLowerCase();
      res.setHeader('Content-Type', MIME[ext] || 'application/octet-stream');
      res.setHeader('Cache-Control', 'no-store');
      res.end(readFileSync(filePath));
    });
    srv.on('error', reject);
    srv.listen(port, () => resolve(srv));
  });
}
