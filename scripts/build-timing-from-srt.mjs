#!/usr/bin/env node
/**
 * 基于 SRT 字幕生成场景时间轴
 *
 * 用法:
 *   node build-timing-from-srt.mjs --srt-path <path> [选项]
 *
 * 选项:
 *   --srt-path <path>       SRT 文件路径（必填）
 *   --output <path>         输出 JSON 路径（默认: SRT 同目录下的 scene-timing.json）
 *   --segments <N>          均匀分成 N 个场景段（与 --config 互斥）
 *   --max-duration <秒>      每段最长秒数（与 --config 互斥）
 *   --config <path>         锚点配置文件 JSON（与 --segments / --max-duration 互斥）
 *                           JSON 格式: { "anchors": ["短语1","短语2",...], "scenes": ["id1","id2",...] }
 *
 * 示例:
 *   # 按段落数均匀分割
 *   node build-timing-from-srt.mjs --srt-path ./audio.srt --segments 10
 *
 *   # 按最大时长分割
 *   node build-timing-from-srt.mjs --srt-path ./audio.srt --max-duration 15
 *
 *   # 锚点匹配模式
 *   node build-timing-from-srt.mjs --srt-path ./audio.srt --config ./timing-config.json
 */
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { parseArgs } from 'util';

const { values } = parseArgs({
  options: {
    'srt-path': { type: 'string' },
    'output': { type: 'string' },
    'segments': { type: 'string' },
    'max-duration': { type: 'string' },
    'config': { type: 'string' }
  }
});

const srtPath = values['srt-path'];
if (!srtPath || !existsSync(srtPath)) {
  console.error('错误: 必须提供有效的 --srt-path');
  process.exit(1);
}

const outputPath = values['output'] || join(dirname(srtPath), 'scene-timing.json');
const segmentsArg = values['segments'] ? parseInt(values['segments'], 10) : null;
const maxDurationArg = values['max-duration'] ? parseFloat(values['max-duration']) : null;
const configPath = values['config'] || null;

// 1. 解析 SRT
const srtRaw = readFileSync(srtPath, 'utf-8');
const blocks = srtRaw.trim().split(/\r\n\r\n|\n\n+/);

const toMs = (h, m, s, ms) => h * 3600000 + m * 60000 + s * 1000 + ms;

const segments = blocks.map(block => {
  const lines = block.trim().split('\n');
  if (lines.length < 3) return null;
  const sm = lines[1].match(/(\d{2}):(\d{2}):(\d{2}),(\d{3})/);
  const em = lines[1].split(' --> ')[1]?.match(/(\d{2}):(\d{2}):(\d{2}),(\d{3})/);
  if (!sm || !em) return null;
  return {
    idx: parseInt(lines[0], 10),
    start: toMs(+sm[1], +sm[2], +sm[3], +sm[4]),
    end: toMs(+em[1], +em[2], +em[3], +em[4]),
    text: lines.slice(2).join(' ')
  };
}).filter(Boolean);

if (segments.length === 0) {
  console.error('错误: SRT 解析失败或为空');
  process.exit(1);
}

console.log(`SRT 解析完成: ${segments.length} 条字幕`);

// 2. 构建场景时间轴
let result;

if (configPath) {
  // ---- 锚点模式 ----
  const config = JSON.parse(readFileSync(configPath, 'utf-8'));
  const anchors = config.anchors || [];
  const scenes = config.scenes || [];
  if (!anchors.length) {
    console.error('错误: 配置文件缺少 anchors 数组');
    process.exit(1);
  }
  const sceneNames = scenes.length >= anchors.length ? scenes : anchors;

  const anchorIndices = anchors.map(anchor => {
    const found = segments.findIndex(s => s.text.includes(anchor));
    return { anchor, idx: found, seg: found >= 0 ? segments[found] : null };
  });

  const missing = anchorIndices.filter(a => a.idx < 0);
  if (missing.length > 0) {
    console.log('⚠ 未匹配锚点:');
    missing.forEach(m => console.log(`   ${m.anchor}`));
  }

  const validAnchors = anchorIndices.filter(a => a.idx >= 0);
  if (validAnchors.length === 0) {
    console.error('错误: 没有锚点匹配到 SRT 内容');
    process.exit(1);
  }

  result = [];
  for (let i = 0; i < validAnchors.length; i++) {
    const current = validAnchors[i];
    const next = validAnchors[i + 1];
    const startMs = current.seg.start;
    const endMs = next
      ? (segments[next.idx - 1]?.end || next.seg.start)
      : segments[segments.length - 1].end;

    result.push({
      scene: sceneNames[i] || `scene-${String(i + 1).padStart(2, '0')}`,
      start: Math.round(startMs / 10) / 100,
      end: Math.round(endMs / 10) / 100,
      duration: Math.round((endMs - startMs) / 10) / 100,
      anchor: current.anchor,
      segments: next ? next.idx - current.idx : segments.length - current.idx
    });
  }
} else {
  // ---- 自动分割模式 ----
  const sceneIndices = [];
  const totalDurationMs = segments[segments.length - 1].end;
  const segmentCount = segmentsArg || Math.max(1, Math.ceil(totalDurationMs / (maxDurationArg * 1000)));

  if (maxDurationArg) {
    // 按最大时长分割
    const maxMs = maxDurationArg * 1000;
    let currentSeg = 0;
    while (currentSeg < segments.length) {
      const startMs = segments[currentSeg].start;
      let endSeg = currentSeg;
      while (endSeg < segments.length && (segments[endSeg].start - startMs) < maxMs) {
        endSeg++;
      }
      sceneIndices.push({ start: currentSeg, end: Math.min(endSeg, segments.length - 1) });
      currentSeg = endSeg;
    }
  } else {
    // 均匀分段
    const segsPerScene = Math.max(1, Math.ceil(segments.length / segmentCount));
    for (let i = 0; i < segmentCount; i++) {
      const start = i * segsPerScene;
      const end = Math.min((i + 1) * segsPerScene - 1, segments.length - 1);
      sceneIndices.push({ start, end });
    }
  }

  result = sceneIndices.map((r, i) => {
    const startMs = segments[r.start].start;
    const endMs = segments[r.end].end;
    return {
      scene: `scene-${String(i + 1).padStart(2, '0')}`,
      start: Math.round(startMs / 10) / 100,
      end: Math.round(endMs / 10) / 100,
      duration: Math.round((endMs - startMs) / 10) / 100,
      segments: r.end - r.start + 1
    };
  });
}

// 3. 输出
writeFileSync(outputPath, JSON.stringify(result, null, 2));
console.log(`\n场景时间轴生成完成: ${result.length} 个场景`);
console.log(`输出: ${outputPath}`);

const total = result[result.length - 1].end;
console.log(`总时长: ${total}s (约 ${Math.round(total / 60)} 分 ${Math.round(total % 60)} 秒)`);
result.forEach((r, i) => {
  console.log(`  ${String(i + 1).padStart(2, ' ')}. ${r.scene.padEnd(22)} ${r.start.toFixed(1)}s → ${r.end.toFixed(1)}s (${r.duration.toFixed(1)}s) [${r.segments || '?'}段]`);
});
