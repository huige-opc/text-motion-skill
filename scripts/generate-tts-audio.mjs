#!/usr/bin/env node
/**
 * 从精简口播稿 JSON 生成 TTS 音频（百度声音克隆）
 *
 * 用法:
 *   node scripts/generate-tts-audio.mjs --script <path> [选项]
 *
 * 选项:
 *   --script <path>     精简口播稿 JSON 路径（必填, compress-script.mjs --json 的输出）
 *   --output <path>     输出音频路径（缺省: 脚本所在目录的 audio.mp3）
 *   --per <id>          音色 ID（缺省: 114086, 你的克隆音色）
 *   --baidu-key <key>   百度 API Key（缺省读环境变量 BAIDU_API_KEY）
 *   --baidu-secret <secret>  百度 Secret Key（缺省读环境变量 BAIDU_SECRET）
 *   --silent-between <s> 场景间静音秒数（缺省: 0.5）
 *
 * 流程:
 *   1. 读取精简稿 JSON，获取每个场景的 compressed 文本
 *   2. 逐段调用百度语音合成 API
 *   3. 用 ffmpeg 拼接各段音频 + 插入静音间隔
 *   4. 输出合并后的 audio.mp3
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname, basename, extname } from 'path';
import { parseArgs } from 'util';
import { execSync } from 'child_process';
import { randomUUID } from 'crypto';
import './lib/load-env.mjs';

const { values } = parseArgs({
  options: {
    'script': { type: 'string' },
    'output': { type: 'string' },
    'per': { type: 'string' },
    'baidu-key': { type: 'string' },
    'baidu-secret': { type: 'string' },
    'silent-between': { type: 'string' }
  }
});

// ── 参数 ──
const scriptPath = values['script'];
if (!scriptPath || !existsSync(scriptPath)) {
  console.error('错误: 必须提供有效的 --script 路径（compress-script.mjs 的 JSON 输出）');
  process.exit(1);
}

const BAIDU_API_KEY = values['baidu-key'] || process.env.BAIDU_API_KEY;
const BAIDU_SECRET = values['baidu-secret'] || process.env.BAIDU_SECRET;
if (!BAIDU_API_KEY || !BAIDU_SECRET) {
  console.error('错误: 缺少百度 API 凭证。请通过 --baidu-key/--baidu-secret 参数或环境变量 BAIDU_API_KEY/BAIDU_SECRET 传入。');
  process.exit(1);
}
const VOICE_ID = values['per'] || '114086';
const SILENT_BETWEEN = parseFloat(values['silent-between'] || '0.5');
const outputPath = values['output'] || join(dirname(scriptPath), 'audio.mp3');

// ── 读取精简稿 ──
const scriptData = JSON.parse(readFileSync(scriptPath, 'utf-8'));
const scenes = scriptData.scenes || [];
if (scenes.length === 0) {
  console.error('错误: 精简口播稿中没有场景数据');
  process.exit(1);
}

console.log(`精简稿: ${scenes.length} 个场景`);
const totalChars = scenes.reduce((a, s) => a + [...(s.compressed || '')].length, 0);
console.log(`总字数: ~${totalChars} 字`);
console.log(`音色 ID: ${VOICE_ID}`);

// ── 获取百度 Token ──
console.log('\n1. 获取百度 access_token...');
const tokenRes = await fetch('https://aip.baidubce.com/oauth/2.0/token', {
  method: 'POST',
  headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  body: `grant_type=client_credentials&client_id=${BAIDU_API_KEY}&client_secret=${BAIDU_SECRET}`
});
const tokenData = await tokenRes.json();
const token = tokenData.access_token;
if (!token) {
  console.error('❌ token 获取失败:', tokenData.error_description || JSON.stringify(tokenData));
  process.exit(1);
}
console.log('✅ token 获取成功');

// ── 逐场景生成 TTS ──
console.log('\n2. 逐场景生成 TTS 音频...');
const tempDir = join(dirname(outputPath), '.tts-temp-' + Date.now());
mkdirSync(tempDir, { recursive: true });

const wavFiles = [];
const apiUrl = 'https://aip.baidubce.com/rest/2.0/speech/publiccloudspeech/v1/voice/clone/tts';

for (let i = 0; i < scenes.length; i++) {
  const scene = scenes[i];
  const text = (scene.compressed || scene.original || '').trim();
  if (!text) {
    console.log(`  场景${scene.id}: ⏭ 跳过（无文本）`);
    continue;
  }

  const charCount = [...text].length;
  process.stdout.write(`  场景${scene.id} (${charCount}字)...`);

  try {
    const res = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        tok: token,
        tex: text,
        per: VOICE_ID,
        spd: '5',
        pit: '5',
        vol: '5'
      })
    });

    const contentType = res.headers.get('content-type') || '';
    if (contentType.includes('audio') || contentType.includes('octet-stream')) {
      const buf = Buffer.from(await res.arrayBuffer());
      const wavPath = join(tempDir, `scene-${scene.id}.mp3`);
      writeFileSync(wavPath, buf);
      wavFiles.push({ id: scene.id, path: wavPath, size: buf.length });
      console.log(` ✅ ${(buf.length / 1024).toFixed(0)}KB`);
    } else {
      const err = await res.text();
      console.log(` ❌ ${err.slice(0, 100)}`);
    }
  } catch (e) {
    console.log(` ❌ ${e.message}`);
  }
}

if (wavFiles.length === 0) {
  console.error('错误: 所有场景都生成失败');
  process.exit(1);
}

console.log(`\n生成完成: ${wavFiles.length}/${scenes.length} 个场景`);

// ── 拼接音频 ──
console.log('\n3. 拼接音频...');

// 生成 ffmpeg 拼接文件列表
const concatFile = join(tempDir, 'concat.txt');
let concatContent = '';

for (const f of wavFiles) {
  concatContent += `file '${f.path.replace(/'/g, "'\\''")}'\n`;
  if (SILENT_BETWEEN > 0 && f !== wavFiles[wavFiles.length - 1]) {
    // 生成静音文件
    const silentPath = join(tempDir, `silent-${f.id}.mp3`);
    try {
      execSync(
        `ffmpeg -y -f lavfi -i anullsrc=r=44100:cl=mono -t ${SILENT_BETWEEN} -c:a libmp3lame "${silentPath}"`,
        { stdio: 'pipe' }
      );
      concatContent += `file '${silentPath.replace(/'/g, "'\\''")}'\n`;
    } catch {
      // 静音生成失败就跳过
    }
  }
}

writeFileSync(concatFile, concatContent, 'utf-8');

try {
  execSync(
    `ffmpeg -y -f concat -safe 0 -i "${concatFile}" -c:a libmp3lame -q:a 2 "${outputPath}"`,
    { stdio: 'pipe' }
  );
  const totalSize = wavFiles.reduce((a, f) => a + f.size, 0);
  console.log(`✅ 音频合并完成: ${outputPath}`);
  console.log(`   场景数: ${wavFiles.length}, 预估总大小: ${(totalSize / 1024).toFixed(0)}KB`);
} catch (e) {
  console.error('❌ 拼接失败:', e.message);
  process.exit(1);
}

// ── 清理临时文件 ──
try {
  execSync(`rmdir /s /q "${tempDir}"`, { stdio: 'pipe' });
} catch {
  // 清理失败不影响
}

// ── 输出摘要 ──
console.log('\n=== 配音摘要 ===');
const totalDuration = scenes.reduce((a, s) => a + (s.projectedDuration || 0), 0);
console.log(`总字数: ${totalChars} 字`);
console.log(`预计朗读时长: ~${totalDuration}s (${Math.round(totalDuration / 60)}分 ${totalDuration % 60}秒)`);
console.log(`音色: ${VOICE_ID}`);
console.log(`输出: ${outputPath}`);
console.log('\n下一步: 用语音识别（Whisper/百度ASR）将 audio.mp3 转写为 audio.srt，然后运行 match-scene-timing.mjs');
