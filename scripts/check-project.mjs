#!/usr/bin/env node
/**
 * check-project.mjs — 项目合规检查（RAF 优先）
 *
 * 用法：node scripts/check-project.mjs <projectRoot>
 */

import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join, basename } from 'node:path';

const root = process.argv[2];
if (!root || !existsSync(root)) {
  console.error('Usage: node check-project.mjs <projectRoot>');
  process.exit(1);
}

let errors = 0, warnings = 0;
const E = (msg) => { console.error('  ✗ ' + msg); errors++; };
const W = (msg) => { console.warn('  ⚠ ' + msg); warnings++; };
const OK = (msg) => { console.log('  ✓ ' + msg); };

console.log('\n=== RAF 合规检查: ' + basename(root) + ' ===\n');

const scenesDir = join(root, 'scenes');
const timingPath = join(root, 'scene-timing.json');
const audioPath = join(root, 'audio.mp3');
let timing = null;

// load timing first
try {
  if (existsSync(timingPath)) {
    timing = JSON.parse(readFileSync(timingPath, 'utf-8'));
    if (!Array.isArray(timing)) timing = null;
  }
} catch (e) { timing = null; }

// ============================================================
// 1. RAF tick 机制（最核心 — tick 错全片废）
// ============================================================
console.log('── 1. RAF tick 机制 ──');

if (!existsSync(scenesDir)) {
  E('scenes/ 目录缺失');
} else {
  const sceneFiles = readdirSync(scenesDir).filter(f => f.endsWith('.html') && !f.startsWith('_'));

  if (sceneFiles.length === 0) {
    W('无场景文件');
  }

  sceneFiles.forEach(f => {
    const html = readFileSync(join(scenesDir, f), 'utf-8');
    const issues = [];

    // 1a. 基础：有没有 tick 函数
    const hasTick = /function\s+tick\s*\(/.test(html);
    const hasRAF = /requestAnimationFrame\s*\(\s*tick\s*\)/.test(html);
    if (!hasTick && !hasRAF) { OK(f + ' (无 tick，纯 CSS 场景)'); return; }
    if (!hasRAF) { issues.push('缺少 requestAnimationFrame(tick)'); }

    // 1b. 上界检查：t < SCENE_DUR = 末段丢帧
    if (/t\s*<\s*SCENE_DUR/.test(html)) {
      issues.push('有 t < SCENE_DUR 上界 → 末段带正 offset 的 reveal 永远丢帧');
    }

    // 1c. 下界：t > 0 但不是 t >= 0
    if (/if\s*\(\s*t\s*>\s*0\s*[)&]/.test(html) && !/t\s*>=\s*0/.test(html)) {
      issues.push('用 t > 0 而非 t >= 0 → 键盘 goTo 切帧到 t=0 漏 reveal');
    }

    // 1d. 活性检查：必须有 querySelector 且建议 mount-specific
    const hasLiveness = /querySelector\s*\(/.test(html);
    if (!hasLiveness) {
      issues.push('缺少 querySelector 活性检查 → 场景切换后 RAF 不停止');
    }
    if (/document\s*\.\s*querySelector\s*\(\s*['"]\./.test(html)) {
      W(f + ': 活性检查用 document.querySelector（全局），建议用 mount.getElementById + mount.querySelector');
    }

    // 1e. 禁止 setTimeout 替代 RAF
    if (/setTimeout\s*\(\s*function|setTimeout\s*\(\s*\(\)|setTimeout\s*\(\s*\w+\s*=>/.test(html)) {
      issues.push('有 setTimeout → 可能用于替代 RAF 控制出场时机');
    }

    // 1f. 禁止 CSS animation-delay 替代 RAF
    if (/animation-delay\s*:\s*[1-9]/.test(html)) {
      issues.push('有 CSS animation-delay ≥1s → 可能替代 RAF 控制出场时机');
    }

    // 1g. revealMap 存在且格式正确
    const hasRevealMap = /revealMap\s*=/.test(html);
    if (!hasRevealMap) {
      issues.push('缺少 revealMap → 非标准 tick 模式');
    }

    // 1h. revealMap beat 索引越界检查
    const revealMatch = html.match(/revealMap\s*=\s*\[([\s\S]*?)\]/);
    const beatMatch = html.match(/beats\s*=\s*\[([\s\S]*?)\]/);
    if (revealMatch && beatMatch) {
      const beatCount = (beatMatch[1].match(/\d+\.?\d*/g) || []).length / 3;
      const revealEntries = revealMatch[1].match(/\[[^\]]+\]/g) || [];
      revealEntries.forEach(entry => {
        const parts = entry.replace(/[\[\]'"]/g, '').split(',');
        if (parts.length >= 2) {
          const beatIdx = parseInt(parts[1].trim());
          if (beatIdx >= beatCount) {
            issues.push('revealMap beat 索引 ' + beatIdx + ' 越界（beats 只有 ' + Math.floor(beatCount) + ' 条）');
          }
        }
      });
    }

    // 1i. beat 时间是否疑似等距伪造
    if (beatMatch) {
      const nums = beatMatch[1].match(/\d+\.?\d*/g);
      if (nums && nums.length >= 6) {
        const starts = [];
        for (let i = 0; i < nums.length; i += 3) starts.push(parseFloat(nums[i]));
        const diffs = [];
        for (let i = 1; i < starts.length; i++) diffs.push(starts[i] - starts[i - 1]);
        const allEqual = diffs.every(d => Math.abs(d - diffs[0]) < 0.001);
        if (allEqual && diffs.length >= 2) {
          issues.push('beat 时间完全等距 (' + diffs[0].toFixed(3) + 's) → 疑似未用真 SRT 转写');
        }
        if (starts[0] > 0.01) {
          issues.push('beat[0] start=' + starts[0] + ' != 0 → SCENE_OFFSET 可能设错');
        }
      }
    }

    // 1j. doReveal 目标 mount 检查
    const doRevealMatch = html.match(/getElementById\s*\(\s*['"](\S+?)['"]\s*\)/);
    if (doRevealMatch) {
      const mountId = doRevealMatch[1];
      if (!['mount', 'mount-left', 'mount-right'].includes(mountId)) {
        W(f + ': doReveal 挂载点 "' + mountId + '" 不是标准 mount ID');
      }
    }

    // 1k. CSS reveal 选择器与 JS revealMap 一致性
    const cssRevealClasses = html.match(/#\S+\.reveal-\S+/g) || [];
    const jsRevealClasses = (revealMatch ? revealMatch[1].match(/reveal-[a-zA-Z0-9_-]+/g) : null) || [];
    jsRevealClasses.forEach(rc => {
      const found = cssRevealClasses.some(c => c.includes(rc));
      if (!found) {
        W(f + ': revealMap 中的 "' + rc + '" 没有对应 CSS 规则');
      }
    });

    if (issues.length === 0) {
      OK(f);
    } else {
      issues.forEach(msg => E(f + ': ' + msg));
    }
  });
}

// ============================================================
// 2. 文件结构
// ============================================================
console.log('\n── 2. 文件结构 ──');
for (const f of ['index.html', 'assets/main.js', 'scene-timing.json']) {
  existsSync(join(root, f)) ? OK(f) : E(f + ' 缺失');
}
existsSync(audioPath) ? OK('audio.mp3') : E('audio.mp3 缺失');
const scenes = readdirSync(scenesDir).filter(f => f.endsWith('.html') && !f.startsWith('_'));
OK('scenes/ 有 ' + scenes.length + ' 个场景');

// ============================================================
// 3. scene-timing.json
// ============================================================
console.log('\n── 3. scene-timing.json ──');
if (timing) {
  OK(timing.length + ' 个场景');
  timing.forEach((s, i) => {
    if (!s.scene) E('场景[' + i + '] 缺 scene');
    if (typeof s.start !== 'number') E('场景[' + i + '] 缺 start');
    if (typeof s.end !== 'number') E('场景[' + i + '] 缺 end');
    if (s.start >= s.end) E('场景[' + i + '] start >= end');
    if (i > 0 && s.start < timing[i - 1].end - 0.001) W('场景[' + i + '] 与前场景有重叠');
  });
  timing.forEach(s => {
    if (!scenes.includes(s.scene + '.html') && !sceneFiles(s.scene + '.html')) {
      W('"' + s.scene + '.html" 未找到');
    }
  });
} else {
  E('解析失败');
}

// ============================================================
// 4. 硬编码颜色
// ============================================================
console.log('\n── 4. 硬编码颜色 ──');
if (existsSync(scenesDir)) {
  const files = readdirSync(scenesDir).filter(f => f.endsWith('.html') && !f.startsWith('_'));
  files.forEach(f => {
    const html = readFileSync(join(scenesDir, f), 'utf-8');
    const hexes = html.match(/#[0-9a-fA-F]{3,8}/g) || [];
    const bad = hexes.filter(h => {
      const lo = h.toLowerCase();
      return lo !== '#000' && lo !== '#000000' && lo !== '#fff' && lo !== '#ffffff';
    });
    if (bad.length > 0) E(f + ': ' + bad.length + ' 处硬编码 ' + bad.slice(0, 4).join(' '));
  });
}

// ============================================================
// 5. JS 花括号平衡
// ============================================================
console.log('\n── 5. JS 花括号平衡 ──');
if (existsSync(scenesDir)) {
  const files = readdirSync(scenesDir).filter(f => f.endsWith('.html') && !f.startsWith('_'));
  files.forEach(f => {
    const html = readFileSync(join(scenesDir, f), 'utf-8');
    const scriptBlocks = html.match(/<script[^>]*>([\s\S]*?)<\/script>/gi) || [];
    scriptBlocks.forEach((s, i) => {
      const body = s.replace(/<\/?script[^>]*>/gi, '');
      const open = (body.match(/\{/g) || []).length;
      const close = (body.match(/\}/g) || []).length;
      if (open !== close) E(f + ' 脚本[' + i + ']: { ' + open + ' vs } ' + close);
    });
  });
}

// ============================================================
// 6. 对抗式：CSS 陷阱
// ============================================================
console.log('\n── 6. 对抗式 CSS 检查 ──');
if (existsSync(scenesDir)) {
  const files = readdirSync(scenesDir).filter(f => f.endsWith('.html') && !f.startsWith('_'));
  files.forEach(f => {
    const html = readFileSync(join(scenesDir, f), 'utf-8');

    // 6a. inset:0 同元素缺 padding
    const blocks = html.match(/[^}]*position\s*:\s*absolute[^}]*inset\s*:\s*0[^}]*/g) || [];
    blocks.forEach(block => {
      if (!/padding/.test(block)) {
        W(f + ': position:absolute;inset:0 同元素无 padding');
      }
    });

    // 6b. 同一选择器多条 animation（后面覆盖前面）
    const animRules = html.match(/([#.]\S+)\s*\{[^}]*animation\s*:[^}]+/g) || [];
    const counts = {};
    animRules.forEach(r => {
      const sel = r.match(/^([#.]\S+)/);
      if (sel) counts[sel[1]] = (counts[sel[1]] || 0) + 1;
    });
    Object.entries(counts).forEach(([sel, c]) => {
      if (c > 1) W(f + ': ' + sel + ' 有 ' + c + ' 条 animation（可能覆盖）');
    });
  });
}

// ============================================================
// 7. audio 对齐
// ============================================================
console.log('\n── 7. audio 对齐 ──');
if (existsSync(audioPath) && timing) {
  console.log('  末场景 end: ' + timing[timing.length - 1].end.toFixed(3) + 's');
  console.log('  用 ffprobe 确认音频总长 ≥ ' + timing[timing.length - 1].end.toFixed(3) + 's');
}

// ============================================================
console.log('\n=== 结果: ' + errors + ' 错误 ' + warnings + ' 警告 ===');
if (errors > 0) process.exit(1);
else if (warnings > 0) console.log('  ⚠ 通过但有警告');
else console.log('  ✓ 全部通过');
