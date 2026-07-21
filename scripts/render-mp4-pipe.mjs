#!/usr/bin/env node
/**
 * render-mp4-pipe.mjs — 管道模式：CDP 帧直接写入 FFmpeg stdin，不落盘
 *
 * 相比 render-mp4.mjs（逐帧写 JPEG 文件）的区别：
 *  - 帧数据通过 stdin pipe 直接给 FFmpeg，省掉 14000 次磁盘 I/O
 *  - 第一遍只编视频（无音频），第二遍 mux 音频
 *  - 预计节省 1-2 分钟
 *
 * 依赖：
 *  - Node 22+
 *  - Chrome
 *  - FFmpeg（在 PATH）
 *  - npm i chrome-remote-interface
 *
 * 用法：
 *  node scripts/render-mp4-pipe.mjs <projectRoot> [--output output2.mp4]
 */

import { spawn, spawnSync } from 'node:child_process';
import { readFileSync, existsSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { createServer } from 'node:http';
import { createRequire } from 'node:module';
import { join, resolve, extname, dirname } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';

// ============================================================
// 参数解析
// ============================================================
const argv = process.argv.slice(2);
const projectRoot = argv.find(a => !a.startsWith('--'));
if (!projectRoot) {
  console.error('Usage: node render-mp4-pipe.mjs <projectRoot> [--output output2.mp4]');
  process.exit(1);
}

const opts = {};
for (let i = 0; i < argv.length; i++) {
  const a = argv[i];
  if (a.startsWith('--')) {
    const key = a.replace(/^--/, '');
    if (i + 1 < argv.length && !argv[i + 1].startsWith('--')) {
      opts[key] = argv[i + 1];
      i++;
    } else {
      opts[key] = true;
    }
  }
}

const WIDTH = parseInt(opts.width || '1920', 10);
const HEIGHT = parseInt(opts.height || '1080', 10);
const FPS = parseInt(opts.fps || '30', 10);
const CDP_START_PORT = parseInt(opts.port || '9226', 10);
const HTTP_START_PORT = parseInt(opts['http-port'] || '3022', 10);
const CHROME_PATH = opts.chrome || findChromePath();
const OUTPUT_NAME = opts.output || 'output-pipe.mp4';

const ROOT = resolve(projectRoot);
const INDEX_HTML = join(ROOT, 'index.html');
const AUDIO_MP3 = join(ROOT, 'audio.mp3');
const TIMING_JSON = join(ROOT, 'scene-timing.json');
const OUTPUT_MP4 = join(ROOT, OUTPUT_NAME);
const TEMP_VIDEO = join(ROOT, '.temp-nosound.mp4');

if (!existsSync(INDEX_HTML)) die(`index.html not found at ${INDEX_HTML}`);
if (!existsSync(AUDIO_MP3)) die(`audio.mp3 not found at ${AUDIO_MP3}`);
if (!existsSync(TIMING_JSON)) die(`scene-timing.json not found at ${TIMING_JSON}`);
if (!CHROME_PATH || !existsSync(CHROME_PATH)) die(`Chrome not found`);

// ============================================================
// 计算总时长
// ============================================================
const timing = JSON.parse(readFileSync(TIMING_JSON, 'utf-8'));
const scenes = Array.isArray(timing) ? timing : (timing.scenes || []);
const totalDuration = Math.max(...scenes.map(s => s.endTime ?? (s.end ?? 0) ?? (s.sceneOffset + s.duration) ?? 0));
if (!totalDuration || totalDuration <= 0) die(`Cannot infer total duration`);

console.log('▶ render-mp4-pipe');
console.log('  root       :', ROOT);
console.log('  size       :', WIDTH, '×', HEIGHT, '@', FPS, 'fps');
console.log('  duration   :', totalDuration.toFixed(2), 's');
console.log('  output     :', OUTPUT_MP4);

// ============================================================
// 全局清理
// ============================================================
let chromeProc = null;
let server = null;
let client = null;
let ffmpegProc = null;
let cdpPort = CDP_START_PORT;
let httpPort = HTTP_START_PORT;
let cleaningUp = false;

function cleanup() {
  if (cleaningUp) return;
  cleaningUp = true;
  try { ffmpegProc?.stdin?.end(); } catch {}
  try { ffmpegProc?.kill(); } catch {}
  try { client?.close(); } catch {}
  try { chromeProc?.kill(); } catch {}
  try { server?.close(); } catch {}
  // 清理临时视频
  try { if (existsSync(TEMP_VIDEO)) rmSync(TEMP_VIDEO, { force: true }); } catch {}
}

process.on('SIGINT', () => { console.log('\n⏹  interrupted'); cleanup(); process.exit(130); });
process.on('SIGTERM', cleanup);

// ============================================================
// 起 HTTP 服务（自动找可用端口）
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
if (!server) die(`Cannot find available HTTP port`);
console.log(`▶ http://localhost:${httpPort}/`);

// ============================================================
// 加载 chrome-remote-interface
// ============================================================
let CDP;
try {
  const req = createRequire(import.meta.url);
  CDP = req('chrome-remote-interface');
} catch (e) {
  cleanup();
  die(`chrome-remote-interface not installed`);
}

// ============================================================
// 启动 Chrome（自动找可用 CDP 端口）
// ============================================================
for (let attempt = 0; attempt < 20; attempt++) {
  cdpPort = CDP_START_PORT + attempt;
  if (cdpPort === httpPort) continue;

  const args = [
    `--remote-debugging-port=${cdpPort}`, '--headless=new', '--disable-gpu',
    '--mute-audio', `--window-size=${WIDTH},${HEIGHT}`, '--hide-scrollbars',
    '--autoplay-policy=no-user-gesture-required', '--disable-renderer-backgrounding',
    '--disable-background-timer-throttling', '--disable-backgrounding-occluded-windows',
    '--font-render-hinting=none', '--no-first-run', '--no-default-browser-check',
    `http://localhost:${httpPort}/index.html`
  ];
  console.log(`▶ launch chrome (cdp port ${cdpPort})`);
  chromeProc = spawn(CHROME_PATH, args, { stdio: ['ignore', 'ignore', 'ignore'] });

  try {
    await waitForCDP(CDP, cdpPort, 12);
    break;
  } catch {
    chromeProc.kill();
    chromeProc = null;
  }
}
if (!chromeProc) die(`Cannot start Chrome on any CDP port`);

// ============================================================
// 连接 CDP
// ============================================================
client = await CDP({ port: cdpPort });
const { Page, Runtime, Emulation } = client;
await Page.enable();
await Runtime.enable();
await Emulation.setDeviceMetricsOverride({ width: WIDTH, height: HEIGHT, deviceScaleFactor: 1, mobile: false });

// 等页面加载
console.log('▶ waiting page load...');
await waitFor(async () => {
  const { result } = await Runtime.evaluate({ expression: `document.readyState === 'complete'`, returnByValue: true });
  return result.value === true;
}, 15000);

const { result: domCheck } = await Runtime.evaluate({
  expression: `(function(){var a=document.getElementById('audio-player');return 'audio='+(!!a)})()`,
  returnByValue: true
});
console.log('  DOM:', domCheck.value);

// ============================================================
// 启动 FFmpeg（管道模式）
// ============================================================
console.log('▶ start ffmpeg pipe');
ffmpegProc = spawn('ffmpeg', [
  '-y',
  '-f', 'image2pipe',
  '-framerate', String(FPS),
  '-i', '-',           // 从 stdin 读
  '-c:v', 'libx264',
  '-preset', 'medium',
  '-crf', '20',
  '-pix_fmt', 'yuv420p',
  '-an',               // 无音频（后面 mux）
  TEMP_VIDEO
], { stdio: ['pipe', 'inherit', 'inherit'] });

let frameIndex = 0;
let writeError = false;

ffmpegProc.stdin.on('error', (e) => {
  writeError = true;
  console.error('✗ pipe write error:', e.message);
});

// ============================================================
// 收帧 → 直接写管道
// ============================================================
Page.screencastFrame(async ({ data, sessionId }) => {
  if (writeError) return;
  try {
    const buf = Buffer.from(data, 'base64');
    // 写 JPEG 数据 + 新帧分隔（image2pipe 靠文件头识别边界）
    const ok = ffmpegProc.stdin.write(buf);
    if (!ok) {
      // 背压：等待 drain
      await new Promise(resolve => ffmpegProc.stdin.once('drain', resolve));
    }
    frameIndex++;
  } catch (e) {
    writeError = true;
  }
  await Page.screencastFrameAck({ sessionId });
});

console.log('▶ start screencast');
await Page.startScreencast({
  format: 'jpeg', quality: 85,
  everyNthFrame: Math.max(1, Math.round(60 / FPS)),
  maxWidth: WIDTH, maxHeight: HEIGHT
});

// 触发播放
await Runtime.evaluate({
  expression: `document.getElementById('audio-player').play()`,
  awaitPromise: true
});
console.log('▶ audio.play() triggered');

// ============================================================
// 等待播放完成（定期报进度）
// ============================================================
const startTs = Date.now();
await waitFor(
  async () => {
    const { result } = await Runtime.evaluate({
      expression: `(function(){var a=document.getElementById('audio-player');return a.ended || (a.currentTime >= ${totalDuration - 0.05})})()`,
      returnByValue: true
    });
    return result.value === true;
  },
  (totalDuration + 60) * 1000,
  async () => {
    const elapsed = Math.floor((Date.now() - startTs) / 1000);
    if (elapsed > 0 && elapsed % 10 === 0) {
      const { result: ct } = await Runtime.evaluate({
        expression: `document.getElementById('audio-player')?.currentTime || 0`,
        returnByValue: true
      });
      const pct = Math.min(100, ((ct.value || 0) / totalDuration * 100)).toFixed(1);
      console.log(`  [${elapsed}s] ${pct}% | ${frameIndex} frames piped`);
    }
  }
);

console.log(`▶ playback done in ${((Date.now() - startTs) / 1000).toFixed(1)}s`);
console.log(`▶ piped ${frameIndex} frames`);

// 关管道
await Page.stopScreencast();
ffmpegProc.stdin.end();
await new Promise(resolve => ffmpegProc.on('exit', resolve));

await client.close();
chromeProc.kill();
server.close();

if (writeError || frameIndex < 5) die(`Failed: ${frameIndex} frames`);
if (!existsSync(TEMP_VIDEO)) die(`Temp video not created`);

// ============================================================
// Mux 音频
// ============================================================
console.log('▶ mux audio');
const mux = spawnSync('ffmpeg', [
  '-y', '-i', TEMP_VIDEO, '-i', AUDIO_MP3,
  '-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k',
  '-shortest', OUTPUT_MP4
], { stdio: 'inherit' });
if (mux.status !== 0) die(`mux failed`);

// 清理临时视频
try { rmSync(TEMP_VIDEO, { force: true }); } catch {}

console.log('✅ output:', OUTPUT_MP4);
process.exit(0);

// ============================================================
// helpers
// ============================================================
function die(msg) { console.error('✗', msg); cleanup(); process.exit(1); }

function findChromePath() {
  return ['C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
          'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
          process.env.CHROME_PATH].filter(Boolean).find(p => existsSync(p)) || null;
}

async function waitForCDP(CDP, port, retries) {
  for (let i = 0; i < retries; i++) {
    try { const list = await CDP.List({ port }); if (list?.length) return; } catch {}
    await delay(500);
  }
  throw new Error(`Chrome CDP not ready on port ${port}`);
}

async function waitFor(check, timeoutMs, onTick) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    if (await check()) return;
    if (onTick) await onTick();
    await delay(2000);
  }
  throw new Error(`waitFor timeout after ${timeoutMs}ms`);
}

function tryCreateServer(rootDir, port) {
  return new Promise((resolve, reject) => {
    const MIME = { '.html':'text/html; charset=utf-8', '.js':'application/javascript', '.css':'text/css', '.json':'application/json', '.mp3':'audio/mpeg', '.png':'image/png', '.jpg':'image/jpeg' };
    const srv = createServer((req, res) => {
      res.setHeader('Access-Control-Allow-Origin', '*');
      let url = decodeURIComponent(req.url.split('?')[0]);
      if (url === '/') url = '/index.html';
      const fp = join(rootDir, url);
      if (!existsSync(fp)) { res.statusCode = 404; return res.end('404'); }
      res.setHeader('Content-Type', MIME[extname(fp)] || 'application/octet-stream');
      res.setHeader('Cache-Control', 'no-store');
      res.end(readFileSync(fp));
    });
    srv.on('error', reject);
    srv.listen(port, () => resolve(srv));
  });
}
