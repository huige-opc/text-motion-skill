<!-- ════════════════════════════════════════════════════════════════
 ⚠️ 强制执行。以下规则 AI 必须逐条遵守，不得绕过、不得简化。
═══════════════════════════════════════════════════════════════════ -->

═══════════════════════════════════════════════════════════════════ -->


# Scene Creator（v2 网页版）

本文件是**场景片段实现协议**。AI 按 `scene-timing.json` 中列出的每个场景，写出独立可播放的 `scenes/NN-xxx.html`。

## 核心原理：RAF 咬合齿轮

- **上齿轮**：`audio.mp3` 的 `currentTime`（时间轴的绝对真理）
- **下齿轮**：CSS class 揭示（画面元素跟着时间轴出场）
- **咬合点**：`main.js` 每一帧读 `currentTime`，到点了就给 `#mount` 加上对应的 `reveal-*` class，CSS 里对应的选择器命中，动画就跑

这个机制自成一体，**不依赖任何外部引擎**，浏览器打开就能动。

## 输入契约

主 Agent 传入以下路径和事实：

- `projectRoot`: 项目根目录（扁平结构，index.html 在根）
- `sceneTimingPath`: `{projectRoot}/scene-timing.json`
- `scriptDetailedPath`: `{projectRoot}/script-detailed.md`（详细口播稿，供画面设计参考）
- `srtPath`: `{projectRoot}/audio.srt`（每个 beat 的精确时间戳）
- `referencesRoot`: skill 的 `references` 目录
- `templatesRoot`: skill 的 `templates/` 目录（布局模板如 `fullscreen`、`portrait-right`）
- `tokensPath`: `{projectRoot}/assets/tokens.css`（当前主题 token）
- `themePath`: `{projectRoot}/theme.json`（当前主题元数据）

## 必读顺序

开始工作前按顺序读取：

1. `{sceneTimingPath}`：每个场景的 id / 起止时间 / 时长（时间轴事实）
2. `{scriptDetailedPath}`：详细口播稿（画面画什么的内容源）
3. `{srtPath}`：SRT beat 时间戳
4. `{tokensPath}`：当前主题的颜色、字体、动效参数
5. `{themePath}`：主题元数据（nameZh, nameEn, colors, mood）
6. `{referencesRoot}/CREATIVE_RULES.md`：内容密度、统一风格、禁用特效
7. `{referencesRoot}/SYNC_ENGINE.md`：如何根据 SRT beat 控制元素揭示时间
8. `{referencesRoot}/AESTHETIC_GUARDRAILS.md`：审美硬约束（尤其禁用清单）
9. `{referencesRoot}/components/INDEX.md`：**优先读取**，了解可用组件（参考手册）
10. `{referencesRoot}/components/LAYOUTS/*.md`：场景骨架参考
11. `{referencesRoot}/components/MICRO/*.md` 和 `MACRO/*.md`：按需读取
12. `{referencesRoot}/layout-patterns/*.md`：布局模式补充
13. `{referencesRoot}/MOTION-CANON.md`：自定义动画时读取

## 组件库定位（参考手册，不是死规矩）

- ✅ **有合适的组件** → 抄现成的
- ✅ **没合适的** → AI 自由发挥
- ✅ **发挥出好东西** → 反哺 `components/`，后续项目复用
- ✅ **用户指定** → 必须去 `components/` 找

## 审美提示词应用

每个 scene 必须根据主题应用对应的审美：

### Tech 主题
- 背景：`#0a0a1a`（深夜蓝黑），极细网格 opacity ≤ 0.04
- 高亮：`#00d4ff`（科技青，小面积）+ `#a855f7`（紫点缀）
- 动效：偏快 0.4-0.6s，`ease-out`，禁 Glitch
- 质感：细线 + 状态点，禁 grain / glass / noise

### Business 主题
- 背景：`#0f172a`（深海军蓝），几何线条装饰
- 高亮：`#f4d03f`（金）+ `#60a5fa`（冰蓝）
- 动效：简洁滑入、卡片弹出，`cubic ease-out`
- 质感：实色卡片 + 轻阴影，禁 backdrop-filter

其他主题详见 `AESTHETIC_THEMES.md`。

## ⚠️ 硬禁用清单（所有主题通用）

**绝对不出现**：

- ❌ `grain-overlay` / `feTurbulence` 颗粒噪点
- ❌ `glass-morphism` 全屏 backdrop-filter
- ❌ `paper-texture` / `film-grain` / `bokeh` 全屏
- ❌ `mesh-gradient` 带噪点
- ❌ 全屏 `box-shadow: inset ...` 暗角

**允许**：

- ✓ 实色卡片 + 高不透明度
- ✓ 极细 `grid-overlay`（opacity ≤ 0.04）
- ✓ `radial-gradient(...)` vignette（inner-edge opacity ≤ 0.5）
- ✓ 简单双色渐变

详见 `AESTHETIC_GUARDRAILS.md`。

## 工作流

对 `scene-timing.json` 中的每个场景依次完成：

1. **理解语义**：这段口播真正要传递什么信息
2. **应用审美**：主题色 / 字体 / 动效风格 / 质感
3. **选组件/布局**：`components/LAYOUTS/*.md` 是首选，`layout-patterns/*.md` 是补充
4. **写内容**：从 `script-detailed.md` 中提取当前场景的画面内容
5. **绑定时间轴**：`beats` 数组 + `revealMap` 定义元素揭示顺序
6. **写 CSS 动画**：`@keyframes` + `#mount.reveal-XX .element { animation: ... }`
7. **写 JS**：RAF 循环读 `audio.currentTime`，到点给 `#mount` 加 class

## Scene HTML 骨架（v2 标准写法）

每个场景是一个**独立 HTML 片段**（不含 `<html>/<head>/<body>`），包含 `<style>` + HTML + `<script>` 三段。

```html
<!-- scenes/01-hook.html -->
<style>
  /* ========= 布局与基础样式 ========= */
  .s1-wrap {
    position: absolute; inset: 0;
    display: flex; flex-direction: column;
    justify-content: center; align-items: center;
    padding: 60px;
  }
  .s1-eb {
    display: inline-flex; align-items: center; gap: 8px;
    padding: 7px 20px;
    border-radius: 999px;
    background: rgba(255,255,255,.05);
    font-size: 15px; color: var(--muted);
    opacity: 0;  /* ← 初始隐藏，等 reveal 触发 */
  }
  .s1-title {
    font-size: 72px; font-weight: 800;
    color: #fff; line-height: 1.1;
    text-align: center; margin-top: 24px;
    opacity: 0;
  }
  .s1-sub {
    font-size: 24px; color: var(--muted);
    margin-top: 12px;
    opacity: 0;
  }

  /* ========= 动画定义 ========= */
  @keyframes up-fade {
    from { transform: translateY(24px); opacity: 0; }
    to   { transform: translateY(0);    opacity: 1; }
  }
  @keyframes scale-in {
    from { transform: scale(0.92); opacity: 0; }
    to   { transform: scale(1);    opacity: 1; }
  }

  /* ========= reveal 触发（关键：作用在子元素上！）========= */
  #mount.reveal-eb  .s1-eb    { animation: up-fade   .5s ease-out both; }
  #mount.reveal-t1  .s1-title { animation: scale-in  .7s ease-out both; }
  #mount.reveal-sub .s1-sub   { animation: up-fade   .5s ease-out both; }
</style>

<div class="s1-wrap">
  <div class="s1-eb">开场</div>
  <h1 class="s1-title">这就是文字动画的秘密</h1>
  <p class="s1-sub">RAF 咬合齿轮，让口播和画面完美对齐</p>
</div>

<script>
(function(){
  var SCENE_OFFSET = 0;      // 该场景在 timeline 上的起始时间（scene-timing.json 里给出）
  var SCENE_DUR = 8.0;       // 场景时长
  var a = document.getElementById('audio-player');
  if (!a) return;

  // SRT beat 时间轴（相对于场景起点）
  var beats = [
    [0.0, 1.6, '这就是'],
    [1.6, 4.2, '文字动画的秘密'],
    [4.2, 8.0, 'RAF 咬合齿轮，让口播和画面完美对齐']
  ];

  // reveal 映射 [触发的 class 名, 所属 beat 索引, 提前秒数（负=提前）, 描述]
  var revealMap = [
    ['reveal-eb',  0,  0.00, 'eyebrow 开场标签'],
    ['reveal-t1',  1, -0.12, '主标题（提前 120ms 出）'],
    ['reveal-sub', 2, -0.15, '副标题（提前 150ms 出）']
  ];

  var revealed = {};
  function doReveal(cls){
    var m = document.getElementById('mount');
    if (m) m.classList.add(cls);
  }
  function tick(){
    var t = a.currentTime - SCENE_OFFSET;
    if (t > 0 && t < SCENE_DUR) {
      for (var b = 0; b < beats.length; b++) {
        var bs = beats[b][0];
        for (var r = 0; r < revealMap.length; r++) {
          var item = revealMap[r];
          if (item[1] !== b || revealed[item[0]]) continue;
          if (t >= bs + item[2]) {
            revealed[item[0]] = true;
            doReveal(item[0]);
          }
        }
      }
    }
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
})();
</script>
```

## 关键规则

### 元素初始状态

**所有需要动画揭示的元素，必须在 CSS 里显式设置 `opacity: 0`**（或 `transform: translateY(20px); opacity: 0`），等 reveal class 命中后动画才把它揭示出来。

### CSS reveal 选择器（易错点！）

```css
/* ✅ 正确 —— 作用在子元素上 */
#mount.reveal-t1 .s1-title { animation: up-fade .5s ease-out both; }

/* ❌ 错误 —— 这会动画化 #mount 本身，子元素不动 */
.reveal-t1 { animation: up-fade .5s ease-out both; }
```

### 揭示顺序原则

- 场景切入时**内容全部 `opacity:0`**（通过 CSS base state 设置）
- 元素按 SRT beat 时间**逐步揭示**，不提前剧透后续 beat
- **视觉领先**：元素出现时间控制在对应口播 beat 起始前 **0.08–0.18s**，最大不超过 **0.35s**
- 同一时刻不超过 **2 个元素**在运动
- **最后一个元素揭示完成时间应接近该场景的 end 时间**

### 动画时长参考

- **入场动画**：0.5s–0.7s（不要短于 0.35s）
- **连续循环动画**（infinite）全片不超过 2 处，且必须有叙事意义
- **帧间过渡**：240ms 淡出 + 替换内容 + 240ms 淡入（约 480ms）

### ⚠️ 硬规则：同一元素的多个 animation 禁止覆盖（v2 血训）

**背景**：2026-07-20 07-personas 场景中，三张卡片在 `reveal-c3d` 触发后全部消失。

**根因**：卡片 `#c3` 先后有两条 animation 规则：

```css
/* 先定义 —— 入场动画，控制 opacity 0→1 */
#mount.reveal-c3a #c3 { animation: s7-cb .55s ... both; }

/* 后定义 —— 发光效果，只改了 box-shadow */
#mount.reveal-c3d #c3 { animation: s7-card-glow 1s ... forwards; }
```

选择器优先级完全相同，后定义的 `animation` shorthand **完整覆盖**前一个：
- `animation-name` 被替换，前一个的 `opacity`/`transform` 动画停止
- 元素回退到 CSS 初始值 `opacity: 0`
- 三张卡全部消失

**错误假设**：认为"animation 只改自己声明的属性"。实际 `animation` shorthand 会重置所有子属性（name、duration、delay、fill-mode 等），新动画不涉及的属性回退到 CSS 规则值。

### ✅ 三种正确做法

**方案 A：后定义的 keyframes 显式保持前一个的属性**
```css
@keyframes s7-card-glow {
  from { opacity:1; transform:translateY(0) scale(1); }
  to   { opacity:1; transform:translateY(0) scale(1); box-shadow:...; }
}
```

**方案 B：附加效果用伪元素或子元素实现**（推荐，避免冲突）
```css
#c3::after {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  opacity: 0;
  transition: opacity .6s, box-shadow .6s;
}
#mount.reveal-c3d #c3::after {
  opacity: 1;
  box-shadow: 0 0 0 1px var(--hf-primary);
}
```

**方案 C：如果动画只加一次不重复，用 `transition` 代替 `animation`**
```css
#c3 { transition: box-shadow .6s, border-color .6s; }
#mount.reveal-c3d #c3 { box-shadow: ...; border-color: ...; }
```

### 自检

场景写完后，搜同一元素（`#xxx`）是否有多条 `animation` 规则命中：
```powershell
Get-ChildItem "{projectRoot}/scenes" -Filter "*.html" |
  Select-String -Pattern "#[a-zA-Z0-9_-]+.*\{[^}]*animation:" |
  ForEach-Object { Write-Host "$($_.Path):$($_.LineNumber) $($_.Line.Trim())" }
```
**任何匹配** = 可能有覆盖风险，逐一确认后定义的 keyframes 是否维持了前一个的必要属性（opacity / transform）。

### 场景时间轴来源

- 直接根据 `scene-timing.json` 中每个场景的 `sceneOffset` / `duration` 使用
- SRT beats 通过 `scripts/parse-srt.mjs` 或 `match-scene-timing.mjs` 得出，映射到局部时间

### 长场景处理（> 5s）

- 必须加 **JS 驱动的持续进度/状态变化**，确保全程有动效
- 合适的效果：数字计数（count-up）、进度条填充、播放头走位、步骤逐一点亮
- 使用 `requestAnimationFrame` 驱动，**不做 CSS `infinite`**

## 严禁清单

- ❌ 依赖 GSAP、Anime.js 等外部库（v2 只用**纯 CSS animation + JS RAF**）
- ❌ 呼吸动效（infinite 循环的淡入淡出）
- ❌ 抖动/晃动动画（视觉上像丢帧）
- ❌ 场景内使用 `id="mount"`（由 `main.js` 的 `#mount` 容器管理）
- ❌ 场景内嵌 `<html>` / `<head>` / `<body>` 标签
- ❌ 内联 `<audio>` 标签（audio 由外层播放器管理）
- ❌ **在场景 `<style>` 内硬编码颜色值**（见下节「主题可切换性」）

## 🎨 主题可切换性（v2 硬约束）

**目标**：一份场景 HTML，能同时在暖米/冷蓝/森绿等所有主题下**都好看且文字清晰**。做法：颜色全部走变量，主题层反相时子元素自动跟着走。

### ✅ 允许

```css
color: var(--hf-text);
color: var(--hf-text-muted);
background: var(--hf-bg);
background: var(--hf-bg-surface);
background: color-mix(in srgb, var(--hf-primary) 15%, transparent);
border: 1px solid color-mix(in srgb, var(--hf-primary) 30%, transparent);
box-shadow: 0 8px 24px color-mix(in srgb, var(--hf-primary) 20%, transparent);
```

### ❌ 禁止

```css
/* 这些都会在切主题时翻车 —— 白字白底或深字深底 */
color: #1F1E1D;                 ← 直接指定墨黑
color: #F5F0E6;                 ← 直接指定米白
background: #fff;               ← 白卡（暗主题下反而变白岛）
background: rgba(255,255,255,0.78);  ← 米白玻璃
background: #C15F3C;            ← 陶土橙硬色（陶土主题外都会脏）
border-color: rgba(193,95,60,0.15);  ← 陶土橙 rgba
color: rgba(107,104,98,0.5);    ← 灰色 rgba
:root { --brand: #C15F3C; }     ← 在场景内重定义品牌变量（会顶掉主题）
```

### ⚠️ 例外豁免

只有以下 3 类可以出现硬编码色，且必须**在中性范围**：

| 用途 | 允许写法 |
|---|---|
| 中性阴影 | `rgba(0,0,0,.3)` / `rgba(0,0,0,.5)` |
| 白色描边/发光 | `rgba(255,255,255,.06)` `rgba(255,255,255,.14)` |
| 纯白/纯黑文字（仅当明确要与背景反相） | `#fff` `#000` |

### 变量清单（`--hf-*`）

以下变量由主题 `tokens.css` 提供，写场景时优先用：

```
--hf-primary        主色
--hf-secondary      辅色
--hf-accent         点缀色
--hf-highlight      高亮色（通常 = --hf-primary）
--hf-bg             主背景
--hf-bg-gradient    主背景渐变
--hf-text           正文色
--hf-text-muted     弱文字
--hf-title-color    标题色
--hf-subtitle-color 副标题色
--hf-font-display   标题字体栈
--hf-font-body      正文字体栈
--hf-shadow-soft    柔阴影
--hf-radius-lg      大圆角
```

### 自检 —— 场景写完后必做

在提交场景 HTML 前，AI 自己扫一遍：

```
1. Ctrl+F 搜 "#" 在 <style> 里出现几次？
   → 除了 #fff / #000 / #mount，其他都必须换成 var(--hf-*)
2. Ctrl+F 搜 "rgb(" / "rgba("
   → 三通道数字如果不是 (0,0,0,...) 或 (255,255,255,...)，全部违规
3. Ctrl+F 搜 "--brand" / "--ink-" / "--bg-cream"
   → 老 v2 变量名一律禁用，改为 --hf-*
4. Ctrl+F 搜 ":root{" 或 ":root {"
   → 场景内禁止定义 :root 变量（会顶掉主题）
```

**任何一项违反，重写该处**。这不是审美问题，是"切主题就翻车"的正确性问题。

## 🎯 SVG 图标必须描线化（v2 硬规则）

**目标**：所有场景内的 `<svg>` 图标必须能跟随外层 CSS 的 `color` 变量自动换色。切主题时，跟着 `--hf-primary` / `--hf-text` 走。

### ❌ 错误写法（会在深色主题下变黑色实心块）

```html
<!-- svg 自身没写 fill/stroke -->
<svg viewBox="0 0 24 24">
  <path d="M14 2H6..." />        ← 默认 fill:black
  <polyline points="14 2 14 8" /> ← 默认 fill:black stroke:none
</svg>
```

外层 CSS 就算写了 `.ic { color: var(--hf-primary); }`，也无效 —— 因为 `currentColor` 没被引用。

### ✅ 正确写法（三选一）

**方案 A（推荐）：SVG 标签上直接声明**

```html
<svg viewBox="0 0 24 24"
     fill="none"
     stroke="currentColor"
     stroke-width="2"
     stroke-linecap="round"
     stroke-linejoin="round">
  <path d="..." />
  <polyline points="..." />
</svg>
```

**方案 B：外层 CSS 统一声明**

```css
.icon svg {
  fill: none;
  stroke: currentColor;
  stroke-width: 2;
  stroke-linecap: round;
  stroke-linejoin: round;
}
```

**方案 C：只有实心图标才写 fill="currentColor"**

只有像"星形/三角形/圆点"这种**明确要求实心**的装饰性图标，才写：

```html
<svg viewBox="0 0 24 24" fill="currentColor">
  <polygon points="12 2 15 8 22 9 17 14 18 21 12 17 6 21 7 14 2 9 8 8 12 2"/>
</svg>
```

### 自检 —— 场景写完后必做

```
1. Ctrl+F 搜 "<svg" 在 <style> 里出现几次
2. 每个 svg 标签自身或外层 CSS 必须至少满足一项：
   - <svg fill="none" stroke="currentColor" ...>
   - <svg fill="currentColor">（明确实心）
   - CSS 里 .xxx svg { fill: ...; stroke: ...; }
3. 如果都不满足 → 该 svg 在深色主题下会变黑块，必须修
```

### 例外

`<img>` 图片、`<canvas>`、`<video>` 不受此约束。只针对场景 HTML 里内联的 `<svg>`。

## 🈶 中文字符完整性自检（v2 硬规则）

**背景**：2026-07-20 实测发现，07-personas / 08-finale 两个场景的中文文本大面积出现 `�`（U+FFFD 替换字符）。原因是某次 SearchReplace 操作时，中文标点（"。"、"？"、"，"）作为多字节 UTF-8 字符被截断了最后一字节，导致后续解码全部失败。

### 硬规则

**写完场景 HTML 后必做**：搜 `�` 字符，任何一处出现就重写那段文本。

```powershell
# 一键扫全项目
Get-ChildItem -Path "{projectRoot}/scenes" -Filter "*.html" |
  Select-String -Pattern "\uFFFD" -Encoding UTF8 |
  Format-Table Path, LineNumber, Line
```

### 常见坏字符模式

- 句末的 `�?` → 应该是 `。'` 或 `。"`（中文句号 + 闭引号被截）
- 中文里的 `�?/span>` → 应该是 `者</span>` 或 `。</span>`（汉字被截）
- 注释 `xxx�? -->` → 应该是 `xxx。" -->`

### 修复原则

- 每个 `�` 根据**上下文语义**推断应该是什么中文字符
- 保持 HTML 标签闭合完整（`</span>` `</li>` 不能截断）
- JS 字符串里的 beats/revealMap 注释也要修（虽然不影响运行，但 grep 时会漏）

### 为什么会发生

- SearchReplace 工具按字符匹配，如果 old_string 起点/终点落在多字节字符中间，切割会破坏字符
- 编辑器复制粘贴时编码不一致（UTF-8 vs GBK）也会引入
- Read/Write 工具虽然全 UTF-8，但**上游 SearchReplace 已经写坏**就没法恢复

### AI 自检工作流

1. 写完场景 → `grep '�'` 全项目扫描
2. 有匹配 → 定位每一处，根据上下文重写
3. 再扫一遍确认 0 匹配 → 才算完成

**这是"网页交付前"的最后一道正确性关口**，不允许"这次先跑过下次改"。

## ⏱️ tick 契约：下界 `t >= 0` + 无上界 + 活性检查（v2 硬规则）

**背景**：
- 2026-07-20 (早)：键盘按 → 切到最后一帧时元素全不显示。根因：`tick` 写了 `t > 0`，而 `goTo(i)` 精确 seek 到 `SCENES[i].start`，此时 `t = 0`，`t > 0` 为 false → reveal 全部跳过。
- 2026-07-20 (晚)：修完 `t >= 0` 后仍反馈"倒数第 2 帧错位、最后一帧看不到"。**真根因是 `t < SCENE_DUR` 上界**：`SCENE_DUR` 通常等于最后一条 beat 的 end，而 revealMap 里最后一项常带正 offset（比如 `+0.4s` 的 reveal-btm / reveal-cta）。触发时刻 = beat_end + offset > SCENE_DUR → **永远进不去 reveal 分支**。加上音频总长 > timing 末场景 end 的情形，最后一段 beat 直接被丢帧。

### ✅ 正确写法（v2 最终版）

```js
function tick(){
  // 1. 活性检查：场景已卸载则彻底停止 tick（避免污染下一场景的 #mount）
  if(!document.querySelector('.sX')) return;   // ← 换成本场景根 class 或稳定 id
  var t = a.currentTime - SCENE_OFFSET;
  // 2. 只保留下界 t >= 0，无上界 —— 保证末段带正 offset 的 reveal 项能追平
  if(t >= 0){
    for (var b = 0; b < beats.length; b++) {
      // reveal 逻辑
    }
  }
  requestAnimationFrame(tick);
}
```

三个关键点：
1. **下界 `t >= 0`**：兼容键盘 goTo 精确落点
2. **无上界**：不写 `t < SCENE_DUR`，避免末段 reveal 被越界丢帧
3. **活性检查提前 return**：`main.js` 切场景会替换 `mount.innerHTML`，DOM 一没就 return，tick 自然停；不再需要用 SCENE_DUR 作为"这个场景 tick 该停了"的信号

### ❌ 三种错误写法（都踩过）

```js
// 错误 1：t > 0 排除 0 → 键盘切帧丢 reveal
if (t > 0 && t < SCENE_DUR) { ... }

// 错误 2：t < SCENE_DUR 上界 → 末段带正 offset 的 reveal 项被丢帧
if (t >= 0 && t < SCENE_DUR) { ... }

// 错误 3：没有活性检查 → 场景切走后 tick 还在跑，污染下一场景
function tick(){ var t = ...; if(t >= 0){...}; requestAnimationFrame(tick); }
```

### 自检

场景写完后 grep：

```powershell
Get-ChildItem "{projectRoot}/scenes" -Filter "*.html" |
  Select-String -Pattern "t\s*>\s*0\s*&&|t\s*<\s*SCENE_DUR"
```

**任何匹配 = 必须改为无上界写法**。同时确认每个 tick 首行都有 `if(!document.querySelector('.xx')) return;`。

## 🕐 场景时间必须以 SRT 为唯一真相（v2 核心硬规则）

**背景**：2026-07-20 用户反馈"倒数第 2 帧视频提前了"。对抗式检查发现，`scene-timing.json` 里 07-personas 的 start=81.672，但音频 SRT 里"那这套东西适合什么人用呢？"实际从 83.671s 才开始。**scene-timing.json 是估算，SRT 是真相**，两者错位 2 秒 = 画面切了但音频还在上一段。

### 数据一致性契约

**三处必须同步的时间数据**：

| 位置 | 变量 | 来源 |
|---|---|---|
| `scene-timing.json` | `start` / `end` / `duration` | **必须**从 audio.srt 反推 |
| `scenes/NN-xxx.html` | `SCENE_OFFSET` | 必须 = scene-timing.json 的 `start` |
| `scenes/NN-xxx.html` | `SCENE_DUR` | 必须 = scene-timing.json 的 `duration` |

三处不同步 = 音画错位、reveal 触发时机错、切帧到"空场景"。

### 唯一权威：audio.srt

**audio.srt 是唯一真相**。生成流程：

1. 用 `generate-full-audio.mjs` 生成 audio.mp3 + audio.srt + scene-timing.json（**脚本自动保证同步**）
2. 或 用户提供 audio.mp3，用 whisper 转 SRT，然后 `build-timing-from-srt.mjs` 反推 scene-timing.json
3. **禁止**手写 scene-timing.json 里的时间戳
4. **禁止**在 "详细口播稿的目标时长" 上做累加得到 start/end

### 自检 —— 写完场景后必做

```javascript
// 验证脚本：scene-timing.json 里的 start/duration 
// 必须匹配 scenes/*.html 里的 SCENE_OFFSET/SCENE_DUR
const timing = require('./scene-timing.json');
for (const t of timing) {
  const html = fs.readFileSync(`scenes/${t.scene}.html`, 'utf8');
  const offset = html.match(/SCENE_OFFSET\s*=\s*([\d.]+)/)[1];
  const dur = html.match(/SCENE_DUR\s*=\s*([\d.]+)/)[1];
  if (Math.abs(offset - t.start) > 0.05) console.error(`❌ ${t.scene} offset mismatch`);
  if (Math.abs(dur - t.duration) > 0.05) console.error(`❌ ${t.scene} dur mismatch`);
}
```

### 为什么会踩这个坑

- 早期在**没有真实音频**时，就按详细口播稿"目标时长"累加得到 timing
- 真实音频生成后，配音节奏比预期快/慢 → SRT 实际时间 ≠ 计划时间
- 场景 HTML 里的 SCENE_OFFSET 是从 timing 复制过来的旧值，**没有更新**
- 结果：音频 91s 时还在说"字幕"，画面已经切到"那这套东西适合什么人用呢"

### 修复方式

当发现音画错位：

1. 打开 audio.srt，找每段场景**开头那句台词**的时间戳（如 07-personas 的 "那这套东西适合什么人用呢？" 在 SRT #47 = 83.671s）
2. 更新 scene-timing.json 的 start
3. 同步更新对应 scenes/*.html 的 SCENE_OFFSET
4. 相邻场景的 end 和 duration 也要跟着调

## 排版硬约束

- 主标题最多 **2 行**；dense 场景最多 3 行
- 正文最多 **3-4 行**，超出时提炼关键词
- 所有文字容器：`max-width`、合理 `line-height`、`overflow-wrap: break-word`
- 装饰元素让位给文字；dense 场景减少大面积光球、粒子、边框
- sparse 场景不要只放一个小标题，增加轻量标签、指标、图标补足画面
- 内容包围盒占据画面宽度 **48%-72%**，避免左上堆积、右侧空置

---

## 🎯 v3 血训沉淀（2026-07-21）

以下规则是 20260721-1 项目全程实战验证的硬约束，**优先级高于本文档任何早期示例代码里的字号/字重**。

### 1. 字号规范（1080p 画布下最小可读性）

| 元素 | 字号 | 字重 | line-height | 备注 |
|------|------|------|-------------|------|
| **眉标 `.eb`** | **20px** | **700** | 默认 | 加粗才有存在感，500 太弱 |
| 主标题 `.t` | **52-88px**（按密度调） | 800 | **1.5** | 稀疏帧用 88px；密集帧 52-64px |
| 副标题 `.sb` | **24-32px** | 400-500 | **1.8** | 用行高做呼吸感 |
| 卡片主字 `.n / .ttl` | **24-32px** | 800 | **1.4** | 短语强调 |
| 卡片描述 `.desc / .m` | **16-18px** | 400 | **1.6** | 一屏 3-4 行 |
| 数字/统计值 `.n` | 36-96px | 800 | **1**（关键） | 必须 `white-space:nowrap` |
| pill / tag | **18px** | 600 | 1.4 | 太小会挤成竖排 |
| 底部番号 `.br .bl` | 11-13px | 400 | — | 装饰性小字，允许小 |

**铁律**：
- 任何字号 <15px 的中文文本都难读；只允许"次要装饰性番号"低于 15px
- `letter-spacing` >0 的短标签（如 `STEP · 01`）必须 `white-space:nowrap`
- 中文正文优先用 `line-height:1.6`（有呼吸），标题用 1.5，数字用 1

### 2. 换行控制（避免长/短不平衡）

**问题**：`AI 不是替代你 · 是把 重复的机械的活 扛走 · 把你解放出来 · 去 想内容 · 讲故事 · 做表达` 自然换行只留 3 个字尾巴，视觉极丑。

**做法**：在语义分隔符 `·` / `—` / `——` 处主动 `<br>` 断行，让每行长度均衡（差异 <30%）。

```html
<!-- ❌ 长/短不平衡 -->
<div class="quote2">AI 不是替代你 · 是把 <span class="h">重复的机械的活</span> 扛走 · 把你解放出来 · 去 <span class="h">想内容 · 讲故事 · 做表达</span></div>

<!-- ✅ 主动断行 -->
<div class="quote2">AI 不是替代你 · 是把 <span class="h">重复的机械的活</span> 扛走<br>把你解放出来 · 去 <span class="h">想内容 · 讲故事 · 做表达</span></div>
```

### 3. `position:absolute` 的元素必须防换行

badge/tag 等定位在角落的元素，容易被相邻元素挤压后触发中文竖排：

```css
/* ✅ 必须加 nowrap */
.badge{position:absolute;top:14px;right:14px;
       padding:3px 8px;letter-spacing:1px;
       white-space:nowrap; /* ← 缺这行会挤成竖排 */
       font-size:14px}
```

### 4. Flex 对齐陷阱（logo + 双行文字）

**问题**：`.brand { display:flex } .logo(88x88) + .txt(品牌名+tag两行)`，logo 中心对齐的是两行文字的中心，视觉上 logo 明显高于品牌名。

**做法**：把品牌名和 tag 拆开成两层结构，让 logo 只和主字对齐：

```html
<div class="brand" style="display:flex;flex-direction:column;align-items:center;gap:10px">
  <div class="row" style="display:flex;align-items:center;gap:20px">
    <div class="logo">…</div>    <!-- 只和主字水平对齐 -->
    <div class="n">品牌名</div>
  </div>
  <div class="tag">副标签独立居中</div>  <!-- 独立下方 -->
</div>
```

### 5. SVG 图标使用原则

**只在信息位置加，禁止四角装饰**：

- ✅ tag / pill / button / 卡片前面的**功能图标**
- ✅ checkmark / arrow / play / share 等**语义图标**
- ✅ 品牌 logo / 步骤 icon 等**内容元素**
- ❌ 场景四角"漂浮"网格/星芒/闪电类**纯装饰**（违反"装饰元素不得多于信息元素"）

技术规格：
```html
<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
     stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <path d="…"/>
</svg>
```

- 颜色只走 `currentColor`（跟随父元素 color）
- 尺寸：功能图标 14-18px；卡片 icon 24-44px；logo 36-72px

### 6. 叙事型持续动画（能加，但要有语义）

规范禁止"idle / breathe / float / drift"这种无意义循环。但**服务叙事**的循环允许：

| 允许的动画 | 叙事意义 | 位置 |
|-----------|---------|------|
| `shimmer-sweep` | 品牌质感 | logo 表面斜向扫光 |
| `pulse-ring` | 能量传递 / 咬合 | 齿轮之间、按钮周围 |
| `wave-bars` | 音频信号 | 代码窗/播放器角落 |
| `playhead-glow` | 时间在流动 | 时间轴播放头 |
| `gear-spin` | 机械运转 | 齿轮场景 |
| `grid-drift` | 极慢背景流动 | 场景背景 |

铁律：
- 一屏最多 **1 处**这种循环，服务当前 beat 的隐喻
- 幅度 / 亮度 / 速度 都要"可忽略级"（不吸走注意力）
- 禁止叠加多个

### 7. 三张卡片入场用 localT 而非 audio.currentTime

**问题**：用 `if(ct>=2.4) reveal(card1); if(ct>=3.3) reveal(card2); if(ct>=4.6) reveal(card3);` 时，如果场景不是从 0 秒进入（键盘切帧 / audio 已跑），tick 首次读取 ct 已 >4.6 → 三张卡在同一 tick 全部触发 → 瞬间齐出，没有递进感。

**做法**：用 `localT`（场景进入后的挂钟秒数）驱动 stagger 入场：

```js
var enterT=null;
function tk(){
  var r=document.querySelector('.sN');if(!r)return;
  var ct=a.currentTime-SCENE_OFFSET;
  if(ct<0){ requestAnimationFrame(tk); return; }
  if(enterT===null) enterT=performance.now();
  var localT=(performance.now()-enterT)/1000;

  // 入场链用 localT（保证从进入的那一刻起递进）
  if(localT>=1.5&&!d.s1){d.s1=1;X.fadeUp(cards[0],550,24)}
  if(localT>=2.4&&!d.s2){d.s2=1;X.fadeUp(cards[1],550,24)}
  if(localT>=3.5&&!d.s3){d.s3=1;X.fadeUp(cards[2],550,24)}

  // 结尾语句/音画同步元素仍用 ct
  if(ct>=6.5&&!d.ft){d.ft=1;X.fadeUp(ft,550,12)}
  requestAnimationFrame(tk);
}
```

**分工**：
- `localT` → 入场链、卡片 stagger、纯视觉递进
- `ct` (audio) → 结尾语、要和口播关键词同步的元素、进度条

### 8. 共享 RAF 助手 `window.AX`

`assets/main.js` 应导出统一动画助手，各 scene 通过 `window.AX` 调用，避免每帧重复写缓动逻辑：

```js
window.AX = {
  fadeUp(el, dur, offY),      // 上浮淡入
  pop(el, dur),                // scale+fade 弹入
  scaleX(el, dur),             // 水平展开（下划线/进度条）
  countUp(el, to, dur, suf),   // 数字递增
  typewriter(el, txt, dur),    // 打字机
  fadeUpBar(el, dur),          // 保留 translateX(-50%) 的底部条
  stagger(nodeList, gap, fn),  // 阶梯触发
};
```

优点：
- CSS 只写初始 `opacity:0 / transform:translateY(…)` 状态，不写 `@keyframes` 也不写 `animation`
- 完全避开 CSS `animation` 静默失败 + `var()` 覆盖等 v2 血训坑
- tick 里只判定"什么时候触发"，不管缓动实现

### 9. 场景命名：语义 > 序号

第 5 帧不叫 `05-pain-story`，叫 `05-timeline-hell`（时间轴地狱）。
文件名要能一眼看出画什么，方便后期改稿。

### 10. 硬编码颜色 = 主题切换即翻车

**只允许**：
- `#fff` `#000` `transparent`
- `rgba(0,0,0,.x)` `rgba(255,255,255,.x)` 做中性阴影/描边

**禁止**：任何具体色（`#C15F3C` / `#F5F0E6` / mac dots 的 `#ED6A5E` 等）—— 一律走 `var(--hf-primary/secondary/accent/text/bg/text-muted)` 或 `color-mix(in srgb, var(--hf-*) X%, transparent)`。

check-project.mjs 会扫这一条，**必须过 0 错误**。

---


## 审美克制约束

- 大标题不要默认强发光、强描边、强 glitch
- 同一 scene 最多 **一个强风格**效果
- Tech/fashion/energy 的强刺激组件不得连续 3 个 scene 出现
- Business/nature/warmth/artistic 的质感层只做背景氛围，不压过正文
- Professional 主题避免"普通 PPT 卡片堆叠"，用结构线/图表/流程关系提升设计感

## 语音同步硬约束

- 每个场景的 `beats` 来自 SRT 时间，**不要改写 startTime / endTime**
- 每个语义元素通过 `revealMap` 绑到对应 beat，不允许把后 beat 的文字放在前 beat 的可见元素里
- 装饰元素如果不跟随语音，可以在 `revealMap` 中省略（即"立即显示"）
- 一个元素可以服务多个短 beat，但绑定到最早出现的那个 beat

## 组件反哺机制

当你在某个场景里做出一个**通用性强、视觉效果好**的组件（比如一个新的进度条、一种新的卡片布局），完成后要做两件事：

1. **提取**：把该组件的 HTML/CSS 剥离出来，写成 `references/components/MICRO/xxx.md` 或 `MACRO/xxx.md`
2. **记录**：更新 `references/components/INDEX.md`，加上组件名 + 用途 + 使用示例

这样每个项目都在为下一个项目积累素材，组件库越用越强。

## 返回格式

完成后报告：
1. 每个 scene 的 beats + revealMap 摘要
2. 使用了哪些既有组件、创造了哪些新组件
3. 主题应用说明
4. 长场景（>5s）的持续动效方案
