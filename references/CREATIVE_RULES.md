<!-- ════════════════════════════════════════════════════════════════
 ⚠️ 强制执行。以下规则 AI 必须逐条遵守，不得绕过、不得简化。
═══════════════════════════════════════════════════════════════════ -->

═══════════════════════════════════════════════════════════════════ -->


# Creative Rules

Use this as the compact creative contract for normal generation.

## Storyboard First

Group SRT into semantic storyboard beats before layout:

- one claim or takeaway -> title/card/statement scene
- step sequence -> list, rail, process cards, or timeline
- data/result -> dominant number, chart, stat deck, or proof card in pure-graphic mode
- comparison -> split, before/after, tradeoff matrix
- dense content -> split or compress before implementation

Each pure-graphic scene must choose:

1. `semanticAction`
2. `primaryVisualFamily`
3. `layoutVariant`
4. `dominantObject`
5. up to two `supportingObjects`

If there is no dominant object, the plan is not ready.

## Density And Layout

- `sparse`: fewer than 18 Chinese characters and more than 3s. Use a large title/card or add one light supporting structure.
- `balanced`: 18-56 characters. Use center-card, card-grid, stats-grid, split-focus, or title with clear support.
- `dense`: 57-92 characters or 3 subtitle segments. Use center-card, list-items, or card-grid; reduce decoration.
- `overload`: more than 92 characters or more than 16 chars/s. Split or compress.

Keep one main visual object. Avoid tiny primary graphics and avoid empty cards with too little content.

## Pure-Graphic Mode

Pure-graphic scenes may use meaningful charts, process diagrams, code windows, screenshots, or data visuals when they carry the beat. They must be readable, dominant, and synced to SRT. Do not copy talking-head restrictions into pure graphics.

## Talking-Head Overlay Mode

Talking-head overlay is different: the real video is the primary image. Use safe text packaging, not chart-heavy visuals. Avoid face/subtitle zones and keep a unified component family.

## Unified Style

- Keep one selected theme across the whole video.
- Theme identity comes from palette, typography, spacing, line work, background image, and restrained motion.
- Do not create a scene that feels like a different product style.
- Do not hardcode scene colors or custom fonts; use theme tokens.
- **Text color is not limited to 2 colors.** Use the full theme palette — primary, secondary, accent, muted, and their opacity variants — to create visual hierarchy. Ensure sufficient contrast ratio (≥4.5:1 for body text, ≥3:1 for large/decorative text) against the background. Avoid pure black on pure white (use warm/cool off-tones instead).

## Anti-Cheap-Effect Rules

Do not use grain, glass, bokeh, glitch, RGB split, flash transitions, blur transitions, shake, or heavy motion blur. Use hard cuts only.

CSS `@keyframes` animations are fully allowed. **Entry/exit animations only** — no idle/breathe/float/drift effects (infinite opacity fade-in-out loops, floating dots, particle drift, breathing glow). Every animation must serve a narrative entry or exit purpose. Continuous ambient motion (grid drift) is permitted only as static background texture, not as animated decoration.

**Allowed narrative effects**: typewriter (逐字出现), scanline (CRT扫描线), pipeline flow (管道流动进度), grid drift (网格流动), **shimmer-sweep** (品牌 logo 表面斜向扫光, 3s 周期), **pulse-ring** (咬合/能量传递多层脉冲环, 0.6s 错峰), **wave-bars** (音频信号 5-7 根柱状), **playhead-glow** (时间轴播放头拖尾), **gear-spin** (齿轮/机械叙事场景). These simulate real mechanics or serve a specific narrative metaphor.

**新增硬约束（2026-07-21）**：
- 一屏最多 **1 处**叙事型循环，服务当前 beat 的隐喻
- 幅度/亮度/速度都要"可忽略级"（不吸走注意力，opacity 峰值 ≤0.6）
- 禁止叠加多个叙事循环
- 禁止把叙事循环用在"填空白"（如四角漂浮装饰）—— 装饰必须服务信息位

## ⚠️ mount.className 覆盖坑（场景第一帧不显示时优先排查）

**根因**：`main.js` 的 `show()` 函数中 `mount.className = 'scene active grid-bg'` 是**覆盖赋值**（不是追加）。如果用 `#mount.r-xx .element{animation:...}` 这种依赖 RAF 加 class 的 CSS 选择器，在以下情况会静默失效：

1. **切帧/重载场景时**：className 被重置，之前 RAF 加的所有 `r-xx` 类全部丢失
2. **`var()` 在 animation shorthand 里**：变量未定义时整条 animation 规则丢弃，无报错，元素永远 `opacity:0`
3. **`ch` 单位与中文字体不匹配**：`width:11ch` 约等于 5-6 个中文字宽，剩余文字被 `overflow:hidden` 裁剪
4. **RAF tick 内 JS 语法错误**：如 `!function st(){}requestAnimationFrame(st)` 不合法 → tick 停掉，全部不显示

**推荐的正确方案（纯 JS RAF）**：
- CSS 只设初始 `opacity:0`、`transform: translateY(14px)` 等起始状态
- 不写 `@keyframes` 和 `animation`（完全避免 animation 静默失败）
- RAF tick 里直接用 `el.style.opacity='1'` + `el.style.transform='none'` 揭示元素
- 打字机/count-up/进度条等持续效果全部 JS RAF 驱动
- 优势：不受 `mount.className` 覆盖影响，不受 `var()` / `ch` 单位问题影响

**如果用 CSS animation 方案**（skill 允许），必须：
- 确保 animation shorthand 里无 `var()`（全硬编码）
- 如需控制宽度用 `em` 不用 `ch`（避免字体未加载时单位出错）
- tick 条件用 `if(ct >= beatTime)`，不依赖 class 切换

## Frame Review

Reject contact sheets where text overlaps, subtitle bands are blocked, content is too small, the frame is too empty/crowded, adjacent scenes look the same, or the background/theme is visually hidden.
