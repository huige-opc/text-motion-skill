#!/usr/bin/env node
/**
 * 精简口播稿 → AI配音 + SRT + 场景时间轴（一键完成）
 *
 * 场景音频过短时自动补静音（沉默填充），保证每帧有足够的动画执行时间。
 *
 * 用法:
 *   node scripts/generate-full-audio.mjs --script <path> [选项]
 *
 * 选项:
 *   --script <path>         精简口播稿 JSON 路径（必填）
 *   --output-dir <dir>      输出目录（缺省: 脚本所在目录）
 *   --per <id>              音色 ID（缺省: 114086）
 *   --baidu-key <key>       百度 API Key（缺省读环境变量 BAIDU_API_KEY）
 *   --baidu-secret <sec>    百度 Secret（缺省读环境变量 BAIDU_SECRET）
 *   --min-scene-duration <s> 每个场景最少总时长（缺省: 6s, 含静音填充）
 *   --max-silence <s>       最大静音填充长度（缺省: 2s）
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname, resolve } from 'path';
import { parseArgs } from 'util';
import { execSync } from 'child_process';
import './lib/load-env.mjs';

const { values } = parseArgs({
  options: {
    'script': { type: 'string' },
    'output-dir': { type: 'string' },
    'per': { type: 'string' },
    'baidu-key': { type: 'string' },
    'baidu-secret': { type: 'string' },
    'min-scene-duration': { type: 'string' },
    'max-silence': { type: 'string' }
  }
});

const scriptPath = values['script'];
if (!scriptPath || !existsSync(scriptPath)) {
  console.error('错误: 必须提供有效的 --script 路径');
  process.exit(1);
}

const BAIDU_KEY = values['baidu-key'] || process.env.BAIDU_API_KEY;
const BAIDU_SECRET = values['baidu-secret'] || process.env.BAIDU_SECRET;
if (!BAIDU_KEY || !BAIDU_SECRET) {
  console.error('错误: 缺少百度 API 凭证。请通过 --baidu-key/--baidu-secret 参数或环境变量 BAIDU_API_KEY/BAIDU_SECRET 传入。');
  process.exit(1);
}
const VOICE_ID = values['per'] || '114086';
const MIN_SCENE_DURATION = parseFloat(values['min-scene-duration']) || 6;
const MAX_SILENCE = parseFloat(values['max-silence']) || 4;
const projectDir = resolve(values['output-dir'] || dirname(scriptPath));

const scriptData = JSON.parse(readFileSync(scriptPath, 'utf-8'));
const scenes = scriptData.scenes || [];
if (scenes.length === 0) { console.error('错误: 无场景数据'); process.exit(1); }

console.log(`场景数: ${scenes.length}`);
console.log(`音色: ${VOICE_ID}`);
console.log(`最少场景时长: ${MIN_SCENE_DURATION}s | 最大静音填充: ${MAX_SILENCE}s`);

// ── 1. 获取百度 Token ──
console.log('\n1. 获取百度 token...');
const tokenRes = await fetch('https://aip.baidubce.com/oauth/2.0/token', {
  method: 'POST',
  headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  body: `grant_type=client_credentials&client_id=${BAIDU_KEY}&client_secret=${BAIDU_SECRET}`
});
const { access_token: token } = await tokenRes.json();
if (!token) { console.error('❌ token 失败'); process.exit(1); }
console.log('✅ token 获取成功');

// ── 2. 逐场景生成 TTS + 静音填充 ──
console.log('\n2. 逐场景生成音频...');
const tempDir = join(projectDir, '.tts-temp');
mkdirSync(tempDir, { recursive: true });

const apiUrl = 'https://aip.baidubce.com/rest/2.0/speech/publiccloudspeech/v1/voice/clone/tts';
const sceneAudios = [];
const concatFiles = []; // 用于 ffmpeg concat 的文件列表
let accumulatedTime = 0;

for (let i = 0; i < scenes.length; i++) {
  const scene = scenes[i];
  const text = (scene.compressed || scene.original || '').trim();
  if (!text) continue;

  process.stdout.write(`  场景${scene.id}...`);

  // ── 2a. 生成 TTS ──
  const res = await fetch(apiUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ tok: token, tex: text, per: VOICE_ID, spd: '5', pit: '5', vol: '5' })
  });

  const ct = res.headers.get('content-type') || '';
  if (!ct.includes('audio') && !ct.includes('octet-stream')) {
    const err = await res.text();
    console.log(` ❌ ${err.slice(0, 60)}`);
    continue;
  }

  const buf = Buffer.from(await res.arrayBuffer());
  const mp3Path = join(tempDir, `scene-${scene.id}.mp3`);
  writeFileSync(mp3Path, buf);

  // 用 ffprobe 获取精确时长
  let speechDuration = 0;
  try {
    const probe = execSync(
      `ffprobe -v error -show_entries format=duration -of csv=p=0 "${mp3Path}"`,
      { stdio: 'pipe', encoding: 'utf-8' }
    ).trim();
    speechDuration = parseFloat(probe) || 0;
  } catch {}

  // ── 2b. 静音填充 ──
  const silenceNeeded = Math.max(0, MIN_SCENE_DURATION - speechDuration);
  const silenceToAdd = Math.min(silenceNeeded, MAX_SILENCE);

  const startTime = accumulatedTime;
  const speechEndTime = accumulatedTime + speechDuration;
  const sceneEndTime = speechEndTime + silenceToAdd;
  const totalDuration = sceneEndTime - startTime;
  accumulatedTime = sceneEndTime;

  concatFiles.push(`file '${mp3Path.replace(/'/g, "'\\''")}'`);

  if (silenceToAdd > 0.5) {
    const silencePath = join(tempDir, `silence-${scene.id}.mp3`);
    try {
      execSync(
        `ffmpeg -y -f lavfi -i anullsrc=r=44100:cl=mono -t ${silenceToAdd.toFixed(2)} -c:a libmp3lame -q:a 9 "${silencePath}"`,
        { stdio: 'pipe' }
      );
      concatFiles.push(`file '${silencePath.replace(/'/g, "'\\''")}'`);
      console.log(` ${speechDuration.toFixed(2)}s +${silenceToAdd.toFixed(1)}s静音=${totalDuration.toFixed(2)}s`);
    } catch {
      console.log(` ${speechDuration.toFixed(2)}s (无静音)`);
    }
  } else {
    console.log(` ${speechDuration.toFixed(2)}s`);
  }

  sceneAudios.push({
    scene: scene.id, path: mp3Path, text,
    startTime, speechEndTime, endTime: sceneEndTime,
    speechDuration, silenceToAdd, totalDuration,
    size: buf.length
  });
}

if (sceneAudios.length === 0) { console.error('❌ 所有场景生成失败'); process.exit(1); }

// ── 3. 生成 SRT（含静音段） ──
console.log('\n3. 生成 SRT...');
let srtContent = '';
let srtIdx = 1;

for (const sa of sceneAudios) {
  const segments = sa.text.split(/(?<=[。！？，、；：])/g).filter(s => s.trim());
  if (segments.length === 0) continue;

  const segDuration = sa.speechDuration / segments.length;
  let segStart = sa.startTime;

  for (const seg of segments) {
    const segEnd = Math.min(segStart + segDuration, sa.speechEndTime);
    if (segEnd - segStart < 0.3) { segStart = segEnd; continue; }
    srtContent += `${srtIdx}\n`;
    srtContent += `${fmtTime(segStart)} --> ${fmtTime(segEnd)}\n`;
    srtContent += `${seg.trim()}\n\n`;
    srtIdx++;
    segStart = segEnd;
  }
  // 场景末尾的静音段不加字幕
}

const srtPath = join(projectDir, 'audio.srt');
writeFileSync(srtPath, srtContent, 'utf-8');
console.log(`  SRT: ${srtPath} (${srtIdx - 1} 条字幕)`);

// ── 4. 写入场景时间轴（直接计算，不依赖 match-scene-timing） ──
console.log('\n4. 写入场景时间轴...');
const sceneTiming = sceneAudios.map((sa, idx) => ({
  scene: `scene-${sa.scene}`,
  start: sa.startTime,
  end: sa.endTime,
  duration: sa.totalDuration,
  speechDuration: sa.speechDuration,
  silenceToAdd: sa.silenceToAdd
}));
const timingPath = join(projectDir, 'scene-timing.json');
writeFileSync(timingPath, JSON.stringify(sceneTiming, null, 2), 'utf-8');
console.log(`  时间轴: ${timingPath}`);

// ── 5. 合并所有音频段（说话+静音） ──
console.log('\n5. 合并音频...');
const concatFile = join(tempDir, 'concat.txt');
writeFileSync(concatFile, concatFiles.join('\n'), 'utf-8');

const audioPath = join(projectDir, 'audio.mp3');
try {
  execSync(
    `ffmpeg -y -f concat -safe 0 -i "${concatFile}" -c:a libmp3lame -q:a 2 "${audioPath}"`,
    { stdio: 'pipe' }
  );
  console.log(`  音频: ${audioPath}`);
} catch (e) {
  console.error('  ❌ 合并失败:', e.message);
}

// ── 清理临时文件 ──
try { execSync(`rmdir /s /q "${tempDir}" 2>nul`, { stdio: 'pipe' }); } catch {}

// ── 输出摘要 ──
const totalDuration = accumulatedTime;
console.log('\n=== 完成摘要 ===');
console.log(`场景: ${sceneAudios.length}/${scenes.length}`);
console.log(`总时长: ${totalDuration.toFixed(1)}s`);
for (const sa of sceneAudios) {
  const silenceNote = sa.silenceToAdd > 0 ? ` (含 ${sa.silenceToAdd.toFixed(1)}s 静音)` : '';
  console.log(`  场景${sa.scene}: ${sa.speechDuration.toFixed(1)}s${silenceNote} → ${sa.totalDuration.toFixed(1)}s`);
}
console.log(`音频: ${audioPath}`);
console.log(`SRT: ${srtPath}`);
console.log(`时间轴: ${timingPath}`);

function fmtTime(s) {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const ms = Math.floor((sec - Math.floor(sec)) * 1000);
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(Math.floor(sec)).padStart(2, '0')},${String(ms).padStart(3, '0')}`;
}
