<!-- ════════════════════════════════════════════════════════════════
 ⚠️ 强制执行。以下规则 AI 必须逐条遵守，不得绕过、不得简化。
═══════════════════════════════════════════════════════════════════ -->

═══════════════════════════════════════════════════════════════════ -->


# 审美安全阀：避免模板感和廉价特效

本规则用于防止任一主题把“风格元素”堆成廉价模板。原则：主题负责方向，内容负责层级，特效只能做小面积强调。

## 1. 通用硬规则

- 大标题优先清晰，不默认发光、描边、故障、阴影叠满。
- 不使用 glitch、散景、胶片颗粒、玻璃态、霓虹发光、像素化或重度动感模糊作为默认风格。
- 同一 scene 的装饰元素不得多于信息元素；dense/overload 场景必须减少装饰。
- 扫光只能服务小面积线条或状态点，不服务整段正文。
- 大面积背景装饰优先用选定的主题背景图；额外网格/速度线透明度不超过 0.04。
- 所有主题都要保留一个“安静层”：至少 60% 画面区域应是干净背景或低干扰背景。

## 2. 各主题风险与克制策略

| 主题 | 容易廉价的原因 | 默认克制策略 |
|---|---|---|
| tech | 霓虹、RGB glitch、网格、扫描线堆叠 | 用“精密科技”：文字只保留中性投影；用小面积色彩线条和数据结构表达主题 |
| business | 金色、玻璃态、厚阴影堆叠 | 用“克制商务”：金色只做小面积强调；卡片使用实色/半透明色块和轻阴影 |
| nature | 柔光、粒子、光斑堆叠 | 用“清爽自然”：依靠背景图、留白和实色文字，不叠加粒子或光斑 |
| fashion | 荧光色、描边、动感模糊过多 | 用“高级时尚”：少色块、大留白、强排版；荧光只点缀，不全屏闪 |
| warmth | 暖光、散景、粉橙渐变过甜 | 用“真实温暖”：减少粉色和心形/散景；用暖白、低饱和橙、柔和阴影 |
| professional | 过多卡片和图标导致课件感 | 用“信息产品感”：更多结构线、层级和图表；少用无意义卡片框 |
| energy | 震动、爆炸、速度线、荧光黄过量 | 用“运动品牌感”：强对比、斜向构图和粗体字，不震动或闪烁 |
| artistic | 纹理、印章、手写体、胶片颗粒过量 | 用“编辑设计感”：用衬线字、留白和线条建立气质 |

## 3. Tech 主题的高级化规则

Tech 默认不是“霓虹夜店”，而是“深色精密界面”：

- 标题字体可用无衬线或等宽，但不要整行强发光。
- 主标题阴影默认只保留黑色投影或极弱主色光：`0 10px 30px rgba(0,0,0,.32)`。
- 禁止 RGB glitch、多层文字 glow、扫描线和大面积光球。
- 优先使用 `vignette`、`shimmer-sweep` 的克制适配，或更轻的线条/状态点。
- 青色/绿色/紫色三色不要同时高亮大面积文字；一屏只选一个主强调色。

## 4. 生成后审核口径

若出现以下任一情况，视为审美风险：

- 每 scene 平均 `text-shadow` 超过 4。
- 每 scene 平均 `box-shadow` 超过 5。
- 每 scene 平均 `filter: blur/drop-shadow` 超过 2。
- scene-plan 或 scene 实现出现 glitch、motion-blur、pixelate-wipe 或 kinetic-slam。
- contact sheet 中画面看起来”全都在发光/全都在动/全都很满”，即使没有文字重叠，也要降级特效。

## 5. 绝对禁用：grain / glass / noise 类纹理层 + 全屏色彩转场

> 用户在 2026-07-09 项目反馈中明确要求：「玻璃纹理这种不需要，对于画面特别难看，以后视频都不要加」。后续又要求："完全不要转场"。这两条规则优先于 §1-§4 任何豁免条款。

### 5.1 全部禁用清单

任何主题下，以下效果**绝对不出现**：

**A. 纹理层（同 §5.0 历史）：**

- ❌ `grain-overlay` / `grain-texture`（颗粒噪点层，SVG `feTurbulence` 覆盖）
- ❌ `glass-morphism` / `glass-panel` / `backdrop-filter: blur(...)`（整屏和卡片都禁用）
- ❌ `paper-texture` / `paper-noise` / `paper-grain`（纸张纹理层）
- ❌ `film-grain` / `noise-overlay`（胶片颗粒）
- ❌ `bokeh` / `bokeh-circles` / `bokeh-overlay`（散景光斑层）
- ❌ `texture-mask` / `texture-overlay` 用作全屏或大面积底图
- ❌ `mesh-gradient` 带噪点（gradient 本身可，纯色或双色渐变可）
- ❌ `box-shadow: inset ...` 用作全局渐变暗角（用 vignette radial-gradient 替代，且只到 0.5 opacity）

**B. 场景切换转场（2026-07-09 用户反馈追加）：**

- ❌ `chromatic-split`（RGB 撕裂 / 大色块斜切，tech 主题默认就有）
- ❌ `flash-through-white`（白色闪光，energy 主题默认）
- ❌ `smooth-slide`（横向滑动）
- ❌ `glitch`（故障切换）
- ❌ `blur-dissolve`（模糊消散）
- ❌ `fade-through`（黑色淡入淡出）

**所有 scene-to-scene 转场一律 hard-cut**（直接切换，无任何过渡效果）。`main.js` 场景切换固定用瞬时 `innerHTML` 替换，无过渡效果，不保留绕过口。

**判断依据**：任何 `<div class=”...”>` 用以下类名/ID 全屏/大面积铺背景：

```
hf-registry-grain, hf-registry-noise, hf-registry-texture,
hf-registry-glass, hf-registry-bokeh, hf-registry-paper,
grain-overlay, noise-overlay, paper-texture, film-grain,
bokeh-circles, texture-mask-text, bokeh-overlay
```

或者用 inline `<style>` 写了 `background: url(“data:image/svg+xml,...feTurbulence...”);` 这种内嵌 SVG 噪点。

### 5.2 场景实现时自查

写场景 HTML 时，**AI 必须自查是否引入了 §5.1 禁用清单里的类名/结构**。如果场景 plan 或参考素材里出现 grain-overlay 之类，实现时必须**清洗掉**，不能出现在 scene HTML 里。

### 5.3 Creator 提示模板硬编码

`scene-creator.md` 的实现提示必须包含以下 hard ban：

```
禁用清单（绝对不出现）：
- ❌ grain-overlay / noise / paper-grain / film-grain
- ❌ glass-morphism / backdrop-blur 用于整屏
- ❌ bokeh-circles / texture-overlay

允许：
- ✓ 实色或高不透明度卡片
- ✓ 极细 grid lines（透明度 ≤ 0.04）
- ✓ radial-gradient vignette（≤ 0.5 inner edge）
```

### 5.4 校验硬门槛

出现以下情况**禁止进入 MP4 渲染**：

```
- scene 包含 grain-overlay / noise-overlay / paper-texture / film-grain / bokeh-circles / texture-mask 全屏组件
- scene 包含 backdrop-filter: blur(...) 用在非 card 元素上
- scene 内嵌 <style> 里出现 feTurbulence SVG 噪点
```

任何场景出现上述任一，AI 必须**先修正 HTML** 再继续。这是硬性质量门槛，不允许"这次先跑过下次改"。

### 5.5 theme 模板同步

`AESTHETIC_THEMES.md` 中所有提到 grain / glass / bokeh / paper-texture 的描述必须删掉。
各主题「质感」段落改为：

```
质感：
  背景：纯色或极简渐变（透明度 ≤ 0.4），禁止 grain / glass / bokeh
  卡片：使用实色或高不透明度色块，不使用 backdrop-blur
  装饰：极细线条、低透明几何、状态点
```

### 5.6 例外豁免（不允许）

即使以下理由也不豁免 grain/glass：
- ❌ 主题是「复古 artistic」 / 「电影感」 / 「文艺手账」
- ❌ 创作者主张「能提升场景氛围」
- ❌ 透明度已经很低（< 0.05 也不行，因为视觉上仍是噪点）
- ❌ 客户临时要求（必须在生成前先改这条规则，得到用户确认）

## 6. 主题可切换性硬门槛（v2 新增）

> 背景：老 v2 项目场景内硬写 `#C15F3C` / `rgba(107,104,98,...)`，切主题后白底白字看不清 —— 这类项目在切主题时**几乎无法一键切**，只能靠打补丁 CSS。v2 硬规则**从源头堵住**。

### 6.1 场景 `<style>` 内的颜色白名单

只允许出现以下 3 类颜色：

**A. 主题变量（首选）**

```
var(--hf-primary)      var(--hf-secondary)   var(--hf-accent)
var(--hf-bg)           var(--hf-text)        var(--hf-text-muted)
var(--hf-title-color)  var(--hf-subtitle-color)
var(--hf-highlight)    var(--hf-shadow-*)    var(--hf-radius-*)
```

**B. color-mix 混色（需要透明度或混合时用）**

```css
color-mix(in srgb, var(--hf-primary) 15%, transparent)
color-mix(in srgb, var(--hf-text)    50%, transparent)
```

**C. 中性豁免（阴影/描边/极端反相）**

```
rgba(0,0,0,.3)         rgba(0,0,0,.5)       ← 中性阴影
rgba(255,255,255,.06)  rgba(255,255,255,.14) ← 白色描边
#fff  #000  transparent                       ← 纯色仅限反相文字
```

### 6.2 禁止清单

场景 `<style>` 内**绝对不出现**：

- ❌ 任何 `#RRGGBB` 除 `#fff` `#000`
- ❌ 任何 `rgb()` / `rgba()` 通道非 (0,0,0,...) 或 (255,255,255,...)
- ❌ `:root { ... }` 定义（会顶掉主题变量）
- ❌ 老 v2 变量名：`--brand` / `--ink-1..4` / `--bg-cream` / `--dark-*` / `--pos` / `--info`

### 6.3 自检脚本（一键扫全项目）

写完场景 HTML 后，AI 用 Grep 扫一遍：

```powershell
# 扫描硬编码颜色
Get-ChildItem -Path "{projectRoot}/scenes" -Filter "*.html" | ForEach-Object {
  $violations = Select-String -Path $_.FullName -Pattern "#[0-9a-fA-F]{3,8}(?!ff|FF|00)" -CaseSensitive
  if ($violations) { Write-Host "❌ $($_.Name)"; $violations }
}

# 扫描非中性 rgba
Get-ChildItem -Path "{projectRoot}/scenes" -Filter "*.html" | ForEach-Object {
  $violations = Select-String -Path $_.FullName `
    -Pattern "rgba?\((?!0,0,0|255,255,255|0,\s*0,\s*0|255,\s*255,\s*255)\d+"
  if ($violations) { Write-Host "❌ $($_.Name)"; $violations }
}

# 扫描老变量残留
Get-ChildItem -Path "{projectRoot}/scenes" -Filter "*.html" | `
  Select-String -Pattern "--brand|--ink-|--bg-cream|--dark-\d"
```

### 6.4 硬门槛

以下情况**禁止进入 MP4 渲染**：

- 场景 `<style>` 内出现除 `#fff/#000` 外的 hex 颜色
- 场景 `<style>` 内出现非中性 rgba
- 场景 `<style>` 内定义 `:root {}`
- 场景内引用了 `--brand` / `--ink-*` / `--bg-cream` 等老变量名

违反的场景必须**重写为 `var(--hf-*)` + `color-mix()`**，不允许"这次先跑过下次改"。

### 6.5 用途导向的变量选择

写场景时，先明确"这个颜色是干什么用的"，再选变量：

| 用途 | 选哪个变量 |
|---|---|
| 大段正文文字 | `var(--hf-text)` |
| 副标题/说明文字 | `var(--hf-text-muted)` |
| 强调 / 品牌标识 | `var(--hf-primary)` |
| 二级点缀 | `var(--hf-secondary)` |
| 卡片背景 | `color-mix(in srgb, var(--hf-text) 5%, transparent)` |
| 卡片描边 | `color-mix(in srgb, var(--hf-primary) 20%, transparent)` |
| 分割线 | `color-mix(in srgb, var(--hf-text) 12%, transparent)` |
| 高亮块底 | `color-mix(in srgb, var(--hf-primary) 12%, transparent)` |
| 阴影（中性） | `rgba(0,0,0,.25)` 或 `var(--hf-shadow-soft)` |
| 状态成功 | `var(--hf-accent)`（或主题定义的 pos） |
| 状态信息 | `var(--hf-secondary)` |

## 7. 手绘 / 涂鸦风元素禁用（v2 硬规则）

> 背景：2026-07-20 用户明确要求"去掉手绘箭头"。手绘感 SVG 在多主题下往往显得违和，且经常没走 `currentColor`，切主题后变成黑色乱线。

### 7.1 禁用清单

场景内**绝对不出现**：

- ❌ 手绘感 SVG 箭头（如 `stroke-dasharray` + `stroke-dashoffset` 的抖动感描线动画）
- ❌ 手绘涂鸦圈（不闭合、故意歪扭的椭圆/圆圈 SVG）
- ❌ 波浪装饰线 / 抖动感强调线
- ❌ 类似 CSS class 命名：`sketch-arrow` / `scribble` / `hand-drawn` / `doodle` / `wobble-line`

### 7.2 替代方案

如果需要"引导注意力"或"连接元素"：

- ✅ 正式箭头字符 `→` `⇒` `➜` + 主题色
- ✅ SVG 直线连接器 `<line>` + `stroke="currentColor"`
- ✅ CSS 边框 / 分割线 + `var(--hf-primary)`
- ✅ 光标图标 + 主题色

### 7.3 硬门槛

出现以下类名或 SVG 特征**禁止进入 MP4 渲染**：

- `.sketch-*` / `.scribble` / `.hand-drawn` / `.doodle`
- 一个 SVG path 有 `stroke-dasharray` + `stroke-dashoffset` **且**外形是"箭头/圈/曲线"（正式的 stroke-draw 动画在图表/进度线中允许）

## 8. 主题变量完整性硬规则（v2）

> 背景：2026-07-20 实测发现，切换到 nature 主题后场景元素消失。根源：主题 tokens.css 只定义了核心变量（--hf-primary、--hf-bg、--hf-text），场景常用的扩展变量（--hf-info、--hf-pos、--hf-bg-surface）没定义 → 空值 = 元素透明。

### 8.1 加载顺序（模板层已固化）

```html
<link href="assets/theme-defaults.css">  ← 必须先加载（兜底所有扩展变量）
<link href="assets/tokens.css">          ← 后加载（主题定义的会覆盖兜底）
<link href="assets/tokens-extra.css">    ← 最后加载（--tvp-* 独有变量）
```

**scene 开发者不用管这个**。写场景时只管用 `var(--hf-*)`，能不能生效由 `theme-defaults.css` 兜底保证。

### 8.2 允许在场景里使用的完整 `--hf-*` 清单

**核心（每个主题必定义）**：
- `--hf-primary` `--hf-secondary` `--hf-accent`
- `--hf-bg` `--hf-bg-gradient`
- `--hf-text` `--hf-text-muted`
- `--hf-title-color` `--hf-subtitle-color` `--hf-highlight`

**扩展（`theme-defaults.css` 兜底，主题可覆盖）**：
- `--hf-info` `--hf-pos`（语义色）
- `--hf-bg-surface` `--hf-bg-alt`（次级背景）
- `--hf-text-faint`（弱化文字）
- `--hf-dark-text` `--hf-dark-1` `--hf-dark-2`（深色场景专用）
- `--hf-grid-line`（网格线）
- `--hf-shadow-card/mock/lift/soft`（阴影）

**结构（`tokens-extra.css` 提供）**：
- `--r-window` `--r-card` `--r-pill`（圆角）
- `--tvp-*`（其他模板级变量）

### 8.3 兜底规则（写主题 tokens.css 时不用担心）

`theme-defaults.css` 所有兜底都用 `color-mix + var(--hf-*)` 派生，**主题感知**：

```css
--hf-bg-surface:  color-mix(in srgb, var(--hf-text) 8%, var(--hf-bg));
--hf-grid-line:   color-mix(in srgb, var(--hf-text) 8%, transparent);
```

浅底主题（`--hf-text: 黑`）→ 卡片是"背景+8%黑" = 浅灰卡；
深底主题（`--hf-text: 白`）→ 卡片是"背景+8%白" = 深卡带亮层；
永远和文字色反差正确，不会白底白字。


