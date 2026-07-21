#!/usr/bin/env node
/**
 * render-mp4-gdigrab.mjs — 方案 D：FFmpeg gdigrab 直接录屏
 *
 * 原理：
 *  1. 起本地 HTTP 服务
 *  2. 开一个可见的 Chrome 窗口（非 headless）
 *  3. FFmpeg gdigrab 直接录 Chrome 窗口画面
 *  4. 通过 CDP 触发 audio.play()
 *  5. 播完停录 → mux 音频 → output.mp4
 *
 * 优点：不需要 CDP 逐帧截图，编码效率由 FFmpeg 决定
 * 缺点：必须弹窗口，录制期间窗口不能被遮挡
 *
 * 依赖：
 *  - Node 22+
 *  - Chrome
 *  - FFmpeg（在 PATH）
 *  - npm i chrome-remote-interface
 *
 * 用法：
 *  node scripts/render-mp4-gdigrab.mjs <projectRoot>
 *    --chrome "path/to/chrome.exe"  显式指定 Chrome 路径
 *    --output output-gdigrab.mp4    输出文件名
 */

import { spawn, spawnSync } from 'node:child_process';
import { readFileSync, existsSync, mkdirSync, rmSync } from 'node:fs';
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
  console.error('Usage: node render-mp4-gdigrab.mjs <projectRoot> [--output output-gdigrab.mp4]');
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
const CDP_PORT = parseInt(opts.port || '9227', 10);
const HTTP_PORT = parseInt(opts['http-port'] || '3023', 10);
const CHROME_PATH = opts.chrome || findChromePath();
const OUTPUT_NAME = opts.output || 'output-gdigrab.mp4';

const ROOT = resolve(projectRoot);
const INDEX_HTML = join(ROOT, 'index.html');
const AUDIO_MP3 = join(ROOT, 'audio.mp3');
const TIMING_JSON = join(ROOT, 'scene-timing.json');
const OUTPUT_MP4 = join(ROOT, OUTPUT_NAME);
const TEMP_VIDEO = join(ROOT, '.temp-gdigrab-nosound.mp4');

if (!existsSync(INDEX_HTML)) die(`index.html not found`);
if (!existsSync(AUDIO_MP3)) die(`audio.mp3 not found`);
if (!existsSync(TIMING_JSON)) die(`scene-timing.json not found`);
if (!CHROME_PATH || !existsSync(CHROME_PATH)) die(`Chrome not found`);

// ============================================================
// 计算总时长
// ============================================================
const timing = JSON.parse(readFileSync(TIMING_JSON, 'utf-8'));
const scenes = Array.isArray(timing) ? timing : (timing.scenes || []);
const totalDuration = Math.max(...scenes.map(s => s.endTime ?? (s.end ?? 0) ?? 0));
if (!totalDuration || totalDuration <= 0) die(`Cannot infer total duration`);

console.log('▶ render-mp4-gdigrab');
console.log('  root     :', ROOT);
console.log('  size     :', WIDTH, '×', HEIGHT, '@', FPS, 'fps');
console.log('  duration :', totalDuration.toFixed(2), 's');
console.log('  ⚠  窗口将出现在 (0,0)，录制期间请勿遮挡');

// ============================================================
// 全局清理
// ============================================================
let chromeProc = null;
let server = null;
let client = null;
let ffmpegProc = null;
let cleaningUp = false;

function cleanup() {
  if (cleaningUp) return;
  cleaningUp = true;
  try { ffmpegProc?.stdin?.end(); } catch {}
  try { ffmpegProc?.kill('SIGTERM'); } catch {}
  try { client?.close(); } catch {}
  try { chromeProc?.kill(); } catch {}
  try { server?.close(); } catch {}
  try { if (existsSync(TEMP_VIDEO)) rmSync(TEMP_VIDEO, { force: true }); } catch {}
}

process.on('SIGINT', () => { console.log('\n⏹  interrupted'); cleanup(); process.exit(130); });
process.on('SIGTERM', cleanup);

// ============================================================
// 起 HTTP 服务
// ============================================================
for (let attempt = 0; attempt < 20; attempt++) {
  try {
    server = await tryCreateServer(ROOT, HTTP_PORT + attempt);
    break;
  } catch (e) { if (e.code !== 'EADDRINUSE') throw e; }
}
if (!server) die(`Cannot find available HTTP port`);
const httpPort = server.address().port;
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
// 打开 Chrome（可见窗口，非 headless）
// ============================================================
const pageTitle = '辉哥AI';
const chromeArgs = [
  `--remote-debugging-port=${CDP_PORT}`,
  `--window-size=${WIDTH},${HEIGHT}`,
  `--window-position=0,0`,
  '--new-window',
  '--no-first-run',
  '--no-default-browser-check',
  '--disable-infobars',
  '--disable-session-crashed-bubble',
  '--autoplay-policy=no-user-gesture-required',
  '--disable-renderer-backgrounding',
  '--disable-background-timer-throttling',
  `http://localhost:${httpPort}/index.html`
];
console.log('▶ launch chrome');
chromeProc = spawn(CHROME_PATH, chromeArgs, { stdio: ['ignore', 'ignore', 'ignore'] });

await delay(2000); // 等 Chrome 窗口创建

// ============================================================
// 启动 FFmpeg gdigrab 录屏
// ============================================================
console.log('▶ start ffmpeg gdigrab (capturing window)...');
ffmpegProc = spawn('ffmpeg', [
  '-y',
  '-f', 'gdigrab',
  '-framerate', String(FPS),
  '-i', `title=${pageTitle}`,
  '-c:v', 'libx264',
  '-preset', 'medium',
  '-crf', '20',
  '-pix_fmt', 'yuv420p',
  '-an',
  TEMP_VIDEO
], { stdio: ['ignore', 'inherit', 'inherit'] });

// 等 gdigrab 稳定
await delay(2000);

// ============================================================
// 连接 CDP 触发播放
// ============================================================
await waitForCDP(CDP, CDP_PORT, 20);

client = await CDP({ port: CDP_PORT });
const { Runtime, Emulation } = client;
await Runtime.enable();

await Emulation.setDeviceMetricsOverride({ width: WIDTH, height: HEIGHT, deviceScaleFactor: 1, mobile: false });

// 等页面加载
console.log('▶ waiting page ready...');
await waitFor(async () => {
  const { result } = await Runtime.evaluate({ expression: `document.readyState === 'complete'`, returnByValue: true });
  return result.value === true;
}, 15000);

const { result: domCheck } = await Runtime.evaluate({
  expression: `(function(){var a=document.getElementById('audio-player');return 'audio='+(!!a)})()`,
  returnByValue: true
});
console.log('  DOM:', domCheck.value);

// 触发音频播放
await Runtime.evaluate({
  expression: `document.getElementById('audio-player').play()`,
  awaitPromise: true
});
console.log('▶ audio.play() triggered');

// ============================================================
// 等待播放完成
// ============================================================
const startTs = Date.now();

// 先聚焦页面（确保键盘可用，窗口在最前）
await Runtime.evaluate({ expression: `window.focus(); document.body.focus()` });

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
      console.log(`  [${elapsed}s] ${pct}%`);
    }
  }
);

console.log(`▶ playback done in ${((Date.now() - startTs) / 1000).toFixed(1)}s`);

await client.close();
chromeProc.kill();
ffmpegProc.kill('SIGTERM');

// 等 FFmpeg 写完文件
await delay(1500);

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
