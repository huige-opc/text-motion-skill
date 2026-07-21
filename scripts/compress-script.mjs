#!/usr/bin/env node
/**
 * 详细口播稿 → 精简口播稿（保留场景边界 + 锚点词）
 *
 * 压缩策略考虑动画时长需求：每个场景至少保留 --min-duration 秒的说话时间，
 * 否则自动与相邻场景合并，确保视频每一帧都有足够的动效编排空间。
 *
 * 用法:
 *   node scripts/compress-script.mjs --input <path> --target-duration <s> [选项]
 *
 * 选项:
 *   --input <path>              详细口播稿 markdown 路径（必填）
 *   --output <path>             输出路径（缺省: 同目录下的 script-compressed.md）
 *   --target-words <N>          目标总字数（与 --target-duration 二选一）
 *   --target-duration <s>       目标时长秒数（与 --target-words 二选一, 按 rate 换算）
 *   --rate <N>                  语速参考, 缺省 257 字/分钟
 *   --min-duration <s>          每个场景最少保留秒数, 缺省 6s（低于此值会合并）
 *   --json                      同时输出 JSON 格式到 {output}.json
 *
 * 输入格式（详细口播稿）:
 *   ## 场景01 [视觉类型]
 *   ...
 *   --- 或空行分隔
 *   ## 场景02 [视觉类型]
 *   ...
 *
 * 输出格式（精简口播稿）:
 *   ## 场景01 [视觉类型] [时长: 12s] [锚点: 口播录好了]
 *   精简后的文案...
 *   ---
 *   ## 场景02 [视觉类型] [时长: 8s] [锚点: 弄了一整天]
 *   精简后的文案...
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join, dirname, basename, extname } from 'path';
import { parseArgs } from 'util';

const { values } = parseArgs({
  options: {
    'input': { type: 'string' },
    'output': { type: 'string' },
    'target-words': { type: 'string' },
    'target-duration': { type: 'string' },
    'rate': { type: 'string' },
    'min-duration': { type: 'string' },
    'json': { type: 'boolean', default: false }
  }
});

// ── 参数校验 ──
const inputPath = values['input'];
if (!inputPath || !existsSync(inputPath)) {
  console.error('错误: 必须提供有效的 --input 路径');
  process.exit(1);
}

const speakingRate = values['rate'] ? parseInt(values['rate'], 10) : 257;
const minDuration = values['min-duration'] ? parseFloat(values['min-duration']) : 6;
// 每个场景最少保留字数（按 257 字/分钟, 6s = ~26 字）
const MIN_CHARS_PER_SCENE = Math.max(15, Math.round(speakingRate / 60 * minDuration));

let targetWords;
if (values['target-words']) {
  targetWords = parseInt(values['target-words'], 10);
} else if (values['target-duration']) {
  targetWords = Math.round(parseInt(values['target-duration'], 10) / 60 * speakingRate);
} else {
  console.error('错误: 必须提供 --target-words 或 --target-duration');
  process.exit(1);
}

const inputDir = dirname(inputPath);
const inputBase = basename(inputPath, extname(inputPath));
const outputPath = values['output'] || join(inputDir, `${inputBase}-compressed.md`);

console.log(`详细稿: ${inputPath}`);
console.log(`目标字数: ${targetWords} 字 (语速 ${speakingRate} 字/分钟 ≈ ${Math.round(targetWords / speakingRate * 60)}s)`);

// ── 解析详细稿 ──
const raw = readFileSync(inputPath, 'utf-8');

// 用 ## 场景XX 分割
const sceneBlocks = raw.split(/(?=^##\s*场景)/m).filter(b => b.trim());

let scenes = [];
let currentScene = null;

for (const block of sceneBlocks) {
  const lines = block.trim().split('\n');
  const headerLine = lines[0];

  // 解析头部: ## 场景01 [视觉类型]
  const headerMatch = headerLine.match(/##\s*场景(\d+)\s*(?:\[(.+?)\])?/);
  if (!headerMatch) continue;

  const sceneId = headerMatch[1];
  const sceneType = (headerMatch[2] || '').trim();

  const textLines = lines.slice(1)
    .filter(l => !l.trim().startsWith('---') && !l.trim().startsWith('>'))
    .join('')
    .replace(/\s+/g, '')
    .replace(/\*\*/g, '');

  if (textLines.length > 0) {
    scenes.push({
      id: sceneId,
      type: sceneType,
      rawText: lines.slice(1).join('\n').trim(),
      cleanText: textLines,
      charCount: [...textLines].length
    });
  }
}

if (scenes.length === 0) {
  // 尝试按 --- 或空行分割（无 ## 场景 标记的纯文本）
  console.log('未检测到场景标记，尝试按空行分割...');
  const paragraphs = raw.split(/\n\s*\n/).filter(p => p.trim());
  scenes = paragraphs.map((p, i) => {
    const clean = p.replace(/\s+/g, '').replace(/\*\*/g, '');
    return {
      id: String(i + 1).padStart(2, '0'),
      type: '',
      rawText: p.trim(),
      cleanText: clean,
      charCount: [...clean].length
    };
  });
}

console.log(`解析到 ${scenes.length} 个场景`);
const totalChars = scenes.reduce((a, b) => a + b.charCount, 0);
console.log(`详细稿总字数: ${totalChars} 字`);

// ── 按权重分配目标字数 ──
// 权重: 长场景获得更多压缩比例, 短场景保留更多
// 策略: 所有场景至少保留 30%, 其余按比例分配
const minRatio = 0.3;

// 计算每个场景的目标字数
const totalWeight = scenes.reduce((a, s) => a + s.charCount, 0);
let allocated = 0;

const sceneTargets = scenes.map(s => {
  // 最少保留 minRatio, 剩余池按原始比例分配
  const baseline = Math.max(15, Math.round(s.charCount * minRatio));
  return {
    ...s,
    baseline,
    weight: s.charCount / totalWeight
  };
});

const totalBaseline = sceneTargets.reduce((a, b) => a + b.baseline, 0);
let remaining = Math.max(0, targetWords - totalBaseline);

const sceneAllocations = sceneTargets.map(s => {
  const extra = Math.round(remaining * s.weight);
  const target = s.baseline + extra;
  return { ...s, target };
});

// ── 压缩每个场景 ──
// 使用启发式压缩: 保留首句 + 含数字/引号的句子 + 尾句
function compressText(text, targetLen) {
  const clean = text.replace(/\s+/g, '').replace(/\*\*/g, '');
  const chars = [...clean];
  if (chars.length <= targetLen) return clean;

  // 按标点分割句子
  const sentences = text
    .split(/(?<=[。！？，、；：])/g)
    .map(s => s.trim())
    .filter(s => s.length > 0);

  if (sentences.length <= 1) {
    // 只有一句, 截取前 targetLen 字
    return [...clean].slice(0, targetLen).join('');
  }

  // 评分: 含数字/引号/关键词的句子优先级高
  const scored = sentences.map((s, i) => {
    const cleanS = s.replace(/\s+/g, '').replace(/\*\*/g, '');
    let score = 0;
    // 首句 +1
    if (i === 0) score += 3;
    // 尾句 +1
    if (i === sentences.length - 1) score += 2;
    // 含数字
    if (/\d+/.test(s)) score += 2;
    // 含引号
    if (/["「『]/.test(s)) score += 1;
    // 含关键词标记
    if (/关键|核心|重点|注意|总结/.test(s)) score += 1;
    // 短句优先
    if (cleanS.length < 15) score += 0.5;

    return { text: s, clean: cleanS, score, len: cleanS.length, idx: i };
  });

  // 按分数排序, 优先选高分的
  scored.sort((a, b) => b.score - a.score);

  let result = '';
  let resultLen = 0;
  let selected = [];

  // 先选首句
  const first = scored.find(s => s.idx === 0);
  if (first && first.len <= targetLen) {
    selected.push(first);
    resultLen += first.len;
  }

  // 再按分数选其他句子
  for (const s of scored) {
    if (s.idx === 0) continue; // 已经加了
    if (resultLen + s.len > targetLen) continue;
    if (selected.find(sel => sel.idx === s.idx)) continue;
    selected.push(s);
    resultLen += s.len;
  }

  // 按原始顺序重排
  selected.sort((a, b) => a.idx - b.idx);

  return selected.map(s => s.clean).join('');
}

// ── 提取锚点词 ──
// 从原文中提取最长的唯一短语做锚点，用于后续 SRT 匹配
// SRT 记录的是人实际说的内容，所以锚点必须来自原文，而不是压缩后的文本
function extractKeywords(originalText) {
  const clean = originalText.replace(/\s+/g, '').replace(/\*\*/g, '');
  if (clean.length < 4) return [];

  // 按标点分割成短句，从每个短句中提取候选锚点
  const sentences = originalText.split(/(?<=[。！？，、；：])/g).map(s => s.trim()).filter(s => s.length > 0);

  const candidates = [];

  for (const sentence of sentences) {
    const sClean = sentence.replace(/\s+/g, '').replace(/\*\*/g, '');
    if (sClean.length < 4) continue;

    // 对每个短句，提取所有长度 5-15 的子串
    for (let len = Math.min(15, sClean.length); len >= 5; len--) {
      for (let i = 0; i + len <= sClean.length; i++) {
        const sub = sClean.slice(i, i + len);
        // 过滤: 不以标点开头/结尾，不含多余空格
        if (/^[，。！？、；：]/.test(sub) || /[，。！？、；：]$/.test(sub)) continue;
        candidates.push({ text: sub, len, sourceIdx: sentences.indexOf(sentence) });
      }
    }
  }

  // 去重: 移除被其他候选包含的
  const unique = [];
  const seen = new Set();
  for (const c of candidates.sort((a, b) => b.len - a.len)) {
    if (seen.has(c.text)) continue;
    // 检查是否被更长的候选包含
    if (unique.some(u => u.text.includes(c.text) && u.text !== c.text)) continue;
    unique.push(c);
    seen.add(c.text);
    if (unique.length >= 5) break;
  }

  // 按长度排序，返回最长的 3 个
  return unique.slice(0, 3).map(u => u.text);
}

// ── 执行压缩 ──
const compressedScenes = scenes.map((s, i) => {
  const target = sceneAllocations[i].target;
  const compressed = compressText(s.rawText, target);
  const keywords = extractKeywords(s.rawText);
  const projectedDuration = Math.round([...compressed].length / speakingRate * 60);

  return {
    id: s.id,
    type: s.type,
    original: s.rawText,
    compressed,
    charCount: [...compressed].length,
    originalCharCount: s.charCount,
    reduction: s.charCount > 0 ? Math.round((1 - [...compressed].length / s.charCount) * 100) : 0,
    anchor: keywords[0] || '',
    anchorFallbacks: keywords.slice(1),
    projectedDuration // 秒
  };
});

// ── 压缩后合并过短场景 ──
function mergeShortCompressed(scenes) {
  const result = [];
  for (let i = 0; i < scenes.length; i++) {
    const cur = { ...scenes[i] };
    // 先尝试保留更多原文（不合并）
    let compressed = cur.compressed;
    if ([...compressed].length < MIN_CHARS_PER_SCENE) {
      // 从原文补充字到 MIN_CHARS_PER_SCENE
      const origClean = cur.original.replace(/\s+/g, '').replace(/\*\*/g, '');
      const origChars = [...origClean];
      if (origChars.length > [...compressed].length) {
        compressed = origChars.slice(0, Math.max([...compressed].length + 10, MIN_CHARS_PER_SCENE)).join('');
        console.log(`  📝 场景${cur.id} 压缩后仅 ${[...cur.compressed].length} 字 < ${MIN_CHARS_PER_SCENE} 字，保留更多原文到 ${[...compressed].length} 字`);
      }
      cur.compressed = compressed;
      cur.charCount = [...compressed].length;
      cur.reduction = cur.originalCharCount > 0 ? Math.round((1 - cur.charCount / cur.originalCharCount) * 100) : 0;
      cur.projectedDuration = Math.round(cur.charCount / speakingRate * 60);
    }
    while (cur.projectedDuration < minDuration && i + 1 < scenes.length) {
      const next = scenes[i + 1];
      console.log(`  ⚠ 场景${cur.id} 压缩后仅 ${cur.projectedDuration}s < ${minDuration}s，合并到场景${next.id}`);
      cur.id = `${cur.id}-${next.id}`;
      cur.compressed = cur.compressed + next.compressed;
      cur.charCount = [...cur.compressed].length;
      cur.originalCharCount += next.originalCharCount;
      cur.projectedDuration = Math.round(cur.charCount / speakingRate * 60);
      cur.anchor = cur.anchor || next.anchor;
      if (next.anchorFallbacks?.length) cur.anchorFallbacks = [...(cur.anchorFallbacks || []), ...next.anchorFallbacks];
      i++;
    }
    result.push(cur);
  }
  return result;
}

let mergedCount = compressedScenes.length;
const finalScenes = mergeShortCompressed(compressedScenes);
if (finalScenes.length !== mergedCount) console.log(`合并后 ${finalScenes.length} 个场景`);
const totalCompressedChars = finalScenes.reduce((a, b) => a + b.charCount, 0);

// ── 输出 ──

// Markdown 格式（精简口播稿）
let md = '# 精简口播稿\n\n';
md += `> 源文件: ${basename(inputPath)}\n`;
md += `> 目标字数: ${targetWords} 字 | 实际字数: ${totalCompressedChars} 字\n`;
md += `> 语速参考: ${speakingRate} 字/分钟 | 预计时长: ${Math.round(totalCompressedChars / speakingRate * 60)}s\n\n`;
md += `| 场景 | 类型 | 原字数 | 压缩后 | 压缩比 | 预计时长 | 锚点词 |\n`;
md += `|------|------|--------|--------|--------|----------|--------|\n`;

for (const s of finalScenes) {
  md += `| ${s.id} | ${s.type || '-'} | ${s.originalCharCount} | ${s.charCount} | ${s.reduction}% | ${s.projectedDuration}s | ${s.anchor} |\n`;
}

md += '\n---\n\n';

for (const s of finalScenes) {
  const anchorStr = s.anchor ? ` [锚点: ${s.anchor}]` : '';
  const typeStr = s.type ? ` [${s.type}]` : '';
  md += `## 场景${s.id}${typeStr} [时长: ${s.projectedDuration}s]${anchorStr}\n\n`;
  md += s.compressed + '\n\n';
  md += '---\n\n';
}

writeFileSync(outputPath, md, 'utf-8');
console.log(`\n精简口播稿: ${outputPath}`);
console.log(`实际字数: ${totalCompressedChars} / 目标 ${targetWords}`);
console.log(`预计时长: ${Math.round(totalCompressedChars / speakingRate * 60)}s`);

// JSON 输出
if (values['json']) {
  const jsonPath = outputPath.replace(/\.md$/, '.json');
  const json = {
    meta: {
      source: basename(inputPath),
      targetWords,
      actualWords: totalCompressedChars,
      speakingRate,
      projectedDuration: Math.round(totalCompressedChars / speakingRate * 60),
      sceneCount: finalScenes.length
    },
    scenes: compressedScenes
  };
  writeFileSync(jsonPath, JSON.stringify(json, null, 2), 'utf-8');
  console.log(`JSON 输出: ${jsonPath}`);
}

console.log('\n每场景明细:');
let shortSceneCount = 0;
finalScenes.forEach(s => {
  const warn = s.projectedDuration < minDuration ? ` ⚠ 低于动画最低时长 ${minDuration}s` : '';
  if (s.projectedDuration < minDuration) shortSceneCount++;
  console.log(`  场景${s.id}: ${s.originalCharCount}字 → ${s.charCount}字 (${s.reduction}%) | ${s.projectedDuration}s${warn} | 锚点: "${s.anchor}"`);
});
if (shortSceneCount > 0) {
  console.log(`\n⚠️ 有 ${shortSceneCount} 个场景文字太少（低于 ${minDuration}s），建议：`);
  console.log(`  1. 增加这些场景的文案（至少 ${MIN_CHARS_PER_SCENE} 字/场景）`);
  console.log(`  2. 或合并到相邻场景（用 --min-duration 控制）`);
  console.log(`  3. 或增加更多场景来填充目标时长`);
}
if (totalCompressedChars < targetWords * 0.8) {
  console.log(`\n⚠️ 总字数 ${totalCompressedChars} 只达到目标的 ${Math.round(totalCompressedChars/targetWords*100)}%，稿子太短。`);
  console.log(`  建议用 koubo-script-writer 重新生成长度足够的详细稿，或在每个场景补充更多内容。`);
}
