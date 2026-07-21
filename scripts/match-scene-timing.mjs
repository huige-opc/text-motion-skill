#!/usr/bin/env node
/**
 * SRT + 精简口播稿(锚点) → scene-timing.json
 *
 * 用法:
 *   node scripts/match-scene-timing.mjs --srt <path> --script <path> [选项]
 *
 * 选项:
 *   --srt <path>        SRT 文件路径（必填）
 *   --script <path>     精简口播稿 JSON 路径（必填, compress-script.mjs --json 的输出）
 *   --output <path>     输出路径（缺省: SRT 同目录下的 scene-timing.json）
 *   --strict            严格模式: 每个场景都必须匹配到锚点, 否则报错退出
 *
 * 匹配策略:
 *   1. 顺序优先: 按场景顺序遍历 SRT 段落
 *   2. 锚点匹配: 用场景的 anchor 词做精确包含匹配
 *   3. Jaccard 兜底: 锚点未命中时, 用 Jaccard 相似度匹配
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { parseArgs } from 'util';

const { values } = parseArgs({
  options: {
    'srt': { type: 'string' },
    'script': { type: 'string' },
    'output': { type: 'string' },
    'strict': { type: 'boolean', default: false }
  }
});

// ── 参数校验 ──
const srtPath = values['srt'];
const scriptPath = values['script'];

if (!srtPath || !existsSync(srtPath)) {
  console.error('错误: 必须提供有效的 --srt 路径');
  process.exit(1);
}
if (!scriptPath || !existsSync(scriptPath)) {
  console.error('错误: 必须提供有效的 --script 路径');
  process.exit(1);
}

const outputPath = values['output'] || join(dirname(srtPath), 'scene-timing.json');

// ── 解析 SRT ──
const srtRaw = readFileSync(srtPath, 'utf-8');
const blocks = srtRaw.trim().split(/\r\n\r\n|\n\n+/);

const toMs = (h, m, s, ms) => h * 3600000 + m * 60000 + s * 1000 + ms;

const srtSegments = blocks.map(block => {
  const lines = block.trim().split('\n');
  if (lines.length < 3) return null;
  const sm = lines[1].match(/(\d{2}):(\d{2}):(\d{2}),(\d{3})/);
  const em = lines[1].split(' --> ')[1]?.match(/(\d{2}):(\d{2}):(\d{2}),(\d{3})/);
  if (!sm || !em) return null;
  return {
    idx: parseInt(lines[0], 10),
    startMs: toMs(+sm[1], +sm[2], +sm[3], +sm[4]),
    endMs: toMs(+em[1], +em[2], +em[3], +em[4]),
    text: lines.slice(2).join(' ').trim()
  };
}).filter(Boolean);

console.log(`SRT 解析完成: ${srtSegments.length} 条字幕`);

// ── 解析精简口播稿 ──
let scriptData;
try {
  scriptData = JSON.parse(readFileSync(scriptPath, 'utf-8'));
} catch {
  console.error('错误: 无法解析精简口播稿 JSON, 请确保提供 compress-script.mjs 的 JSON 输出');
  process.exit(1);
}

const scenes = scriptData.scenes || [];
if (scenes.length === 0) {
  console.error('错误: 精简口播稿中没有场景数据');
  process.exit(1);
}

console.log(`精简稿解析完成: ${scenes.length} 个场景`);

// ── Jaccard 相似度 ──
function jaccardSimilarity(a, b) {
  const setA = new Set([...a.replace(/\s+/g, '')]);
  const setB = new Set([...b.replace(/\s+/g, '')]);
  const intersection = new Set([...setA].filter(x => setB.has(x)));
  const union = new Set([...setA, ...setB]);
  return intersection.size / union.size;
}

// ── 场景 → SRT 匹配 ──
// 策略: 顺序遍历, 每个场景找到匹配的 SRT 段落后, 标记起始和结束
let currentSrtIdx = 0;
const sceneTimings = [];

for (let si = 0; si < scenes.length; si++) {
  const scene = scenes[si];
  const anchors = [scene.anchor, ...(scene.anchorFallbacks || [])].filter(Boolean);

  // 在当前 SRT 位置开始往后找
  let matchStartIdx = -1;
  let matchEndIdx = -1;

  // 阶段1: 锚点精确匹配
  for (let j = currentSrtIdx; j < srtSegments.length; j++) {
    const seg = srtSegments[j];
    for (const anchor of anchors) {
      if (seg.text.includes(anchor)) {
        matchStartIdx = j;
        console.log(`  场景${scene.id}: 锚点 "${anchor}" → SRT #${seg.idx} "${seg.text.slice(0, 20)}..."`);
        break;
      }
    }
    if (matchStartIdx >= 0) break;
  }

  // 阶段2: Jaccard 兜底
  if (matchStartIdx < 0) {
    console.log(`  场景${scene.id}: 锚点未命中, 尝试 Jaccard 匹配...`);
    let bestSim = 0;
    let bestIdx = -1;

    for (let j = currentSrtIdx; j < Math.min(currentSrtIdx + 10, srtSegments.length); j++) {
      const sim = jaccardSimilarity(scene.compressed || '', srtSegments[j].text);
      if (sim > bestSim) {
        bestSim = sim;
        bestIdx = j;
      }
    }

    if (bestSim > 0.15 && bestIdx >= 0) {
      matchStartIdx = bestIdx;
      console.log(`  场景${scene.id}: Jaccard 匹配 → SRT #${srtSegments[bestIdx].idx} (相似度: ${bestSim.toFixed(2)})`);
    } else {
      matchStartIdx = currentSrtIdx;
      console.log(`  场景${scene.id}: ⚠ 无匹配, 从当前 SRT 位置开始 (SRT #${srtSegments[currentSrtIdx]?.idx || '?'})`);
    }
  }

  // 确定结束位置: 下一个场景的开始或 SRT 末尾
  let nextSceneStartIdx = srtSegments.length - 1;
  if (si < scenes.length - 1) {
    // 先看下一个场景的锚点能不能在当前场景之后找到
    const nextScene = scenes[si + 1];
    const nextAnchors = [nextScene.anchor, ...(nextScene.anchorFallbacks || [])].filter(Boolean);
    for (let j = matchStartIdx + 1; j < srtSegments.length; j++) {
      for (const anchor of nextAnchors) {
        if (srtSegments[j].text.includes(anchor)) {
          nextSceneStartIdx = j - 1;
          break;
        }
      }
      if (nextSceneStartIdx < srtSegments.length - 1) break;
    }
  }
  matchEndIdx = nextSceneStartIdx;

  if (matchEndIdx < matchStartIdx) {
    matchEndIdx = matchStartIdx;
  }

  const startMs = srtSegments[matchStartIdx].startMs;
  const endMs = srtSegments[matchEndIdx].endMs;

  const allAnchors = [scene.anchor, ...(scene.anchorFallbacks || [])].filter(Boolean);
  const matchedByAnchor = allAnchors.length > 0 &&
    srtSegments.slice(matchStartIdx, matchEndIdx + 1)
      .some(s => allAnchors.some(a => s.text.includes(a)));

  sceneTimings.push({
    scene: `scene-${scene.id}`,
    start: Math.round(startMs / 10) / 100,
    end: Math.round(endMs / 10) / 100,
    duration: Math.round((endMs - startMs) / 10) / 100,
    srtCount: matchEndIdx - matchStartIdx + 1,
    anchor: scene.anchor || '',
    matchMethod: matchedByAnchor ? 'anchor' :
      matchStartIdx === currentSrtIdx && currentSrtIdx > 0 ? 'sequential' : 'jaccard'
  });

  // 下一个场景从当前场景末尾的 SRT 索引开始
  currentSrtIdx = matchEndIdx + 1;
  if (currentSrtIdx >= srtSegments.length) break;
}

// ── 输出 ──
const totalDuration = sceneTimings.length > 0 ? sceneTimings[sceneTimings.length - 1].end : 0;

writeFileSync(outputPath, JSON.stringify(sceneTimings, null, 2), 'utf-8');
console.log(`\n场景时间轴生成完成: ${sceneTimings.length} 个场景`);
console.log(`输出: ${outputPath}`);
console.log(`总时长: ${totalDuration}s (约 ${Math.round(totalDuration / 60)} 分 ${Math.round(totalDuration % 60)} 秒)`);

// 检查未匹配
const strict = values['strict'] || false;
let hasUnmatched = false;
sceneTimings.forEach((t, i) => {
  const label = `  ${String(i + 1).padStart(2, ' ')}. ${t.scene.padEnd(22)} ${t.start.toFixed(1)}s → ${t.end.toFixed(1)}s (${t.duration.toFixed(1)}s) [${t.srtCount}段] [${t.matchMethod}]`;
  console.log(label);
  if (t.matchMethod === 'sequential' && i > 0) {
    hasUnmatched = true;
  }
});

if (strict && hasUnmatched) {
  console.error('\n⚠ 严格模式: 存在未匹配锚点的场景');
  process.exit(1);
}

// 同步脚注: 场景的 projectedDuration 与实际 duration 对比
console.log('\n=== 预计 vs 实际时长对比 ===');
sceneTimings.forEach((t, i) => {
  const scene = scenes[i];
  if (scene && scene.projectedDuration) {
    const diff = t.duration - scene.projectedDuration;
    const pct = scene.projectedDuration > 0 ? Math.round(diff / scene.projectedDuration * 100) : 0;
    const marker = Math.abs(pct) > 50 ? '⚠' : '✓';
    console.log(`  ${marker} 场景${scene.id}: 预计 ${scene.projectedDuration}s → 实际 ${t.duration}s (${pct > 0 ? '+' : ''}${pct}%)`);
  }
});
