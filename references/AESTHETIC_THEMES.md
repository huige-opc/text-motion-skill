<!-- ════════════════════════════════════════════════════════════════
 🚫 这是「规则/机制说明书」，不是模板。

 本文档教的是规范和原理，不提供可抄的视觉方案。理解规则后，
 每个场景的视觉实现必须由你独立创造，不得千篇一律。
═══════════════════════════════════════════════════════════════════ -->


# 视频审美主题规范库（8 主题版）

> 本文档定义了 8 种视频主题的完整视觉规范，供 AI Agent 在生成视频时自动匹配和应用。

---

## 目录

1. [主题快速匹配表](#1-主题快速匹配表)
2. [详细视觉规范](#2-详细视觉规范)
3. [布局模式](#3-布局模式)
4. [转场特效](#4-转场特效)

---

## 1. 主题快速匹配表

| themeId | 名称 | 匹配关键词 | 主色调 | 质感风格 |
|---------|------|-----------|--------|---------|
| tech | 科技 Tech | AI、数字、未来、智能、数据、代码 | 深蓝+低饱和青+电紫点缀 | 精密界面+低透明网格 |
| business | 商业 Business | 增长、业绩、财富、品牌、发展 | 深蓝+金色 | 克制商务卡片+柔和渐变 |
| nature | 自然 Nature | 环保、绿色、生态、户外、阳光 | 森林绿+土棕+天空蓝 | 背景图+清爽留白+实色文字 |
| fashion | 时尚 Fashion | 潮流、酷炫、街头、个性、态度 | 暗黑+粉色+青色小面积点缀 | 编辑式大字+色块+留白 |
| warmth | 温暖 Warmth | 爱、关怀、温馨、情感、回忆 | 暖橙+奶油白+珊瑚粉 | 柔和暖光+低饱和渐变 |
| professional | 专业 Professional | 咨询、教育、培训、知识、方案 | 深灰+蓝白+薄荷绿 | 简洁清晰+扁平化 |
| energy | 活力 Energy | 运动、突破、激情、挑战、力量 | 橙红+深黑+金黄小面积点缀 | 强对比+斜向构图+粗体字 |
| artistic | 文艺 Artistic | 故事、情感、手工、文创、生活 | 复古棕+奶油+墨绿 | 编辑感留白+衬线字+细线 |

---

## 2. 详细视觉规范

---

### 2.1 科技 Tech (tech)

**适用场景**：AI、人工智能、数据、代码、数字化、未来科技、智能硬件

```
色彩：
  主背景：    #0a0a1a （深夜蓝黑）
  渐变遮罩：  rgba(0, 20, 50, 0.5)
  文字主色：  #ffffff
  高亮色1：   #00d4ff （科技青，降低使用面积）
  高亮色2：   #a855f7 （电紫色，仅点缀）
  强调色：    #00ff88 （状态绿，仅用于小标签/状态点）

字体：
  标题：      精密无衬线/等宽点缀，避免整行霓虹
  正文字体：  Inter / 无衬线，中高字重

动效：
  缓动：      Easing.out(Easing.expo) — 科技感快速启动
  特色：      数据结构、轻量线条和状态点
  时长：      偏快，25-40帧

质感：
  背景：      纯色或极简渐变（≤ 0.4 透明度）。禁止 grain / glass / bokeh。
  文字：      清晰实色 + 中性弱阴影，不发光
  装饰：      细线条 + 少量状态点
```

**克制要求**：禁止 RGB glitch、多层文字发光、扫描线和大光球。普通讲解场景优先"高级深色界面"，不是"霓虹夜店"。
**全局约束**：参见 `AESTHETIC_GUARDRAILS.md` §5 — grain / glass / noise 纹理永远禁用。

**背景图**：`{skillRoot}/assets/theme-backgrounds/01-tech-v2.png`

---

### 2.2 商业 Business (business)

**适用场景**：企业宣传、品牌推广、增长业绩、财富金融、战略咨询

```
色彩：
  主背景：    #0f172a （深海军蓝）
  渐变遮罩：  rgba(15, 25, 50, 0.4)
  文字主色：  #ffffff
  高亮色1：   #f4d03f （金色）
  高亮色2：   #60a5fa （冰蓝）
  强调色：    #ffffff

字体：
  标题：      粗体 + 高级感（Inter Bold）
  正文字体：  干净无衬线

动效：
  缓动：      Easing.out(Easing.cubic) — 稳重优雅减速
  特色：      简洁滑入、轻卡片弹出（不用光泽扫过）
  时长：      中等，35-50帧

质感：
  背景：      纯色或几何线条装饰。禁止 grain / glass / bokeh。
  卡片：      实色或高不透明度色块 + 轻阴影，不使用 backdrop-filter
  文字：      干净色彩 + 微妙阴影
```

**全局约束**：参见 `AESTHETIC_GUARDRAILS.md` §5 — grain / glass / noise 纹理永远禁用。

**背景图**：`{skillRoot}/assets/theme-backgrounds/02-business-v2.png`

---

### 2.3 自然 Nature (nature)

**适用场景**：环保主题、绿色生活、生态保护、户外探险、自然风光

```
色彩：
  主背景：    从自然图片中提色
  渐变遮罩：  rgba(0, 50, 30, 0.3) 到透明
  文字主色：  #ffffff
  高亮色1：   #22c55e （鲜绿）
  高亮色2：   #f59e0b （阳光金）
  强调色：    #38bdf8 （天空蓝）

字体：
  标题：      手写风或圆润无衬线
  正文字体：  柔和无衬线

动效：
  缓动：      Easing.out(Easing.quart) — 柔和流畅
  特色：      缓慢深度位移和细线延展
  时长：      偏慢，45-60帧

质感：
  背景：      纯色或极简渐变。禁止 grain / glass / bokeh / light-spots。
  文字：      柔和阴影（无 warm-tone glow）
  装饰：      简单几何图形 + 状态点
```

**全局约束**：参见 `AESTHETIC_GUARDRAILS.md` §5 — grain / glass / noise 纹理永远禁用。

**背景图**：`{skillRoot}/assets/theme-backgrounds/03-nature-v2.png`

---

### 2.4 时尚 Fashion (fashion)

**适用场景**：潮流品牌、街头文化、个性表达、年轻态度、酷炫风格

```
色彩：
  主背景：    #000000 （纯黑）
  渐变遮罩：  rgba(0, 0, 0, 0.6)
  文字主色：  #ffffff
  高亮色1：   #ff0080 （荧光粉）
  高亮色2：   #00ffff （电光蓝）
  强调色：    #ffff00 （荧光黄）

字体：
  标题：      极粗体 + 紧凑字间距 + 全大写
  正文字体：  细瘦无衬线

动效：
  缓动：      Easing.out(Easing.back) — 弹性冲击
  特色：      编辑式切片、色块和大字层级
  时长：      快，20-35帧

质感：
  背景：      纯黑或高对比图。禁止 grain / glass / bokeh。
  文字：      实色大字 + 克制高对比
  装饰：      焦点框、裁切线和小面积色块
```

**全局约束**：参见 `AESTHETIC_GUARDRAILS.md` §5 — grain / glass / noise 纹理永远禁用。

**背景图**：`{skillRoot}/assets/theme-backgrounds/04-fashion-v2.png`

---

### 2.5 温暖 Warmth (warmth)

**适用场景**：家庭亲情、情感表达、温馨回忆、爱与关怀

```
色彩：
  主背景：    #1a0a05 （暖棕黑）
  渐变遮罩：  rgba(50, 20, 10, 0.4)
  文字主色：  #fff8f0 （暖白）
  高亮色1：   #fb923c （暖橙）
  高亮色2：   #f472b6 （珊瑚粉）
  强调色：    #fcd34d （奶油黄）

字体：
  标题：      圆润粗体
  正文字体：  柔和衬线或手写风

动效：
  缓动：      Easing.out(Easing.quad) — 温柔减速
  特色：      简洁淡入、柔边出现
  时长：      慢，50-70帧

质感：
  背景：      纯色或简单暖色径向渐变。禁止 grain / glass / bokeh / heartbeat pulse。
  文字：      干净 + 弱阴影
  装饰：      简单几何 + 状态点
```

**全局约束**：参见 `AESTHETIC_GUARDRAILS.md` §5 — grain / glass / noise 纹理永远禁用。

**背景图**：`{skillRoot}/assets/theme-backgrounds/05-warmth-v2.png`

---

### 2.6 专业 Professional (professional)

**适用场景**：咨询培训、教育课程、知识分享、方法论、解决方案

```
色彩：
  主背景：    #f8fafc （冷白）
  渐变遮罩：  rgba(255, 255, 255, 0.8)
  文字主色：  #1e293b （深灰）
  高亮色1：   #3b82f6 （品牌蓝）
  高亮色2：   #10b981 （薄荷绿）
  强调色：    #f59e0b （琥珀）

字体：
  标题：      粗体无衬线（Inter）
  正文字体：  清晰无衬线

动效：
  缓动：      Easing.out(Easing.cubic) — 直接干净
  特色：      简洁滑入、淡入淡出、缩放
  时长：      快，25-40帧

质感：
  背景：      纯色或极简渐变。禁止任何装饰纹理。
  文字：      深色 + 清晰阴影
  装饰：      简单几何图形
```

**全局约束**：参见 `AESTHETIC_GUARDRAILS.md` §5 — grain / glass / noise 纹理永远禁用。

**背景图**：`{skillRoot}/assets/theme-backgrounds/06-professional-v2.png`

---

### 2.7 活力 Energy (energy)

**适用场景**：体育运动、挑战极限、激情热血、冲刺突破

```
色彩：
  主背景：    #0f0a0a （深红黑）
  渐变遮罩：  rgba(100, 0, 0, 0.5)
  文字主色：  #ffffff
  高亮色1：   #ef4444 （烈焰红）
  高亮色2：   #f97316 （橙红）
  强调色：    #facc15 （荧光黄）

字体：
  标题：      极粗体 + 斜体 + 全大写
  正文字体：  粗壮无衬线

动效：
  缓动：      Easing.out(Easing.cubic) — 快速但稳定
  特色：      方向性位移、斜向构图和粗体字
  时长：      快，20-30帧

质感：
  背景：      纯色或径向渐变。禁止 grain / glass / bokeh。
  文字：      实色粗体 + 中性投影
  装饰：      斜线、进度块和小面积高对比色
```

**全局约束**：参见 `AESTHETIC_GUARDRAILS.md` §5 — grain / glass / noise 纹理永远禁用。

**背景图**：`{skillRoot}/assets/theme-backgrounds/07-energy-v2.png`

---

### 2.8 文艺 Artistic (artistic)

**适用场景**：手作文艺、生活方式、故事分享、文创设计

```
色彩：
  主背景：    #1a1512 （复古棕黑）
  渐变遮罩：  rgba(40, 25, 15, 0.5)
  文字主色：  #fef3c7 （奶油白）
  高亮色1：   #d97706 （琥珀）
  高亮色2：   #065f46 （墨绿）
  强调色：    #7c2d12 （赭红）

字体：
  标题：      衬线体（Georgia）+ 书法感
  正文字体：  手写或衬线

动效：
  缓动：      Easing.out(Easing.quad) — 手工感
  特色：      简洁淡入 + 缩放位移
  时长：      中等，35-55帧

质感：
  背景：      纯色或简单双色渐变。禁止 grain / glass / paper-texture / ink-bleed / film-grain / stamp marks。
  文字：      干净衬线
  装饰：      简单几何 + 状态点
```

**全局约束**：参见 `AESTHETIC_GUARDRAILS.md` §5 — grain / glass / noise / paper-texture / film-grain 永远禁用。

**背景图**：`{skillRoot}/assets/theme-backgrounds/08-artistic-v4.png`

---

## 3. 布局模式

### 3.1 常用布局

| layoutId | 名称 | 适用场景 | 描述 |
|----------|------|---------|------|
| center-title | 居中标题 | 大标题、slogan | 文字居中，配合背景图 |
| center-card | 居中卡片 | 数据展示、核心信息 | 实色或高不透明度信息面板居中 |
| bottom-left | 左下文字 | 字幕、副标题 | 文字位于左下角 |
| bottom-right | 右下文字 | 补充信息 | 文字位于右下角 |
| left-card | 左侧卡片 | 对比、列表 | 左侧卡片+右侧说明 |
| split | 分屏 | 对比、并列 | 左右或上下分屏 |

### 3.2 布局选择规则

```
根据字幕内容类型选择布局：

数据/数字展示 → center-card（居中卡片突出数字）
大标题/slogan → center-title（居中标题）
情感/诗意 → bottom-left 或 center-title
列表/对比 → left-card 或 split
补充说明 → bottom-right
```

---

## 4. 转场特效

> **2026-07-09 用户反馈硬规则：所有场景切换只允许 hard-cut（无任何转场效果）。** 详见 `AESTHETIC_GUARDRAILS.md` §5。

### 4.1 内置转场（默认全部禁用）

| transitionId | 名称 | 时长 | 默认状态 | 适用主题 |
|-------------|------|------|---------|---------|
| none | 无转场 / hard-cut | 0s | **默认** | 所有主题 |
| flash-through-white | 白色闪光 | 0.4s | 禁用 | 科技、商业、活力 |
| smooth-slide | 平滑滑动 | 0.5s | 禁用 | 所有主题 |
| blur-dissolve | 模糊消散 | 0.6s | 禁用 | 自然、温暖、文艺 |
| fade-through | 淡入淡出 | 0.5s | 禁用 | 专业、文艺 |
| chromatic-split | 色差分离（RGB 撕裂） | 0.5s | **禁用（用户反馈特别指出廉价）** | 科技、时尚 |
| glitch | 故障效果 | 0.3s | 禁用 | 科技、时尚 |

### 4.2 转场选择规则

```
全部场景：none（hard-cut，0s）
```

---

## 5. 动效参数速查

### 5.1 各主题动效参数

| 主题 | entrance 动画 | duration | easing | ambient |
|-----|--------------|---------|--------|--------|
| tech | precision-rise | 0.4s | ease-out-expo | subtle-grid-drift |
| business | side-reveal | 0.4s | ease-out-cubic | soft-light-sweep |
| nature | soft-rise | 0.4s | ease-out-quart | slow-depth-drift |
| fashion | editorial-scale | 0.4s | ease-out-cubic | editorial-line-shift |
| warmth | soft-rise | 0.4s | ease-out-quad | soft-light-drift |
| professional | fade-in | 0.3s | ease-out-cubic | none |
| energy | impact-rise | 0.2s | ease-out-cubic | directional-line-pulse |
| artistic | soft-rise | 0.8s | ease-out-quad | editorial-line-drift |

---

## 6. 廉价感风险提示

所有主题都可能因为”风格元素过量”而显得廉价：

- tech：霓虹/glitch/网格过量。
- business：金色/厚阴影过量。
- nature：柔光/光斑过量。
- fashion：荧光/描边/动感模糊过量。
- warmth：粉橙/柔光过甜。
- professional：卡片和图标过多，像普通课件。
- energy：震动/闪烁/速度线过多。
- artistic：手写/印章过多。

> **反查硬规则（2026-07-09）**：所有主题下，**grain / glass-morphism / bokeh / paper-texture / film-grain / texture-overlay / mesh-gradient-noise + 所有 scene-to-scene 转场（chromatic-split / flash-through-white / smooth-slide / fade-through / blur-dissolve / glitch）+ 装饰伪标签（meta-pill / status-pill / eyebrow-text / tag 等）** 都不允许出现在任何场景实现里。详见 `AESTHETIC_GUARDRAILS.md` §5.A（纹理禁用）、§5.B（转场禁用），以及 `AESTHETIC_ANALYSIS.md` 顶部”重要提示”。这是用户 2026-07-09 明确反馈的硬禁用项。

详见 `AESTHETIC_GUARDRAILS.md`。生成时优先保留清晰层级，特效只做局部强调。

---

*文档版本：1.0*
*最后更新：2026-07-07*


## 7. 扩展正式主题（30 主题版新增）

以下 22 个主题已经从待拓展库升级为正式可调用主题。详细 tokens 以各自 `themes/{themeId}/theme.json` 为准；所有主题继承底部 18% 字幕安全区、主视觉最小尺寸、hard-cut 转场、禁用 grain/glass/bokeh 等硬约束。

| themeId | 中文名 | 适用场景 | 背景图 |
|---|---|---|---|
| cyber-neon | 赛博霓虹 | 赛博、霓虹、未来感、酷炫科技、年轻化科技 | 09-cyber-neon.png |
| ai-console | AI 控制台 | Agent、Codex、Claude Code、终端、自动执行 | 10-ai-console.png |
| data-grid | 数据网格 | 数据分析、趋势、指标、算法、图表 | 11-data-grid.png |
| hologram-ui | 全息界面 | 全息、概念产品、未来产品、智能硬件、发布会 | 12-hologram-ui.png |
| corporate-clean | 企业白蓝 | 企业、B2B、官网、公司介绍、解决方案 | 13-corporate-clean.png |
| premium-dark | 高级暗色 | 高端、高级、发布会、品牌升级、咨询 | 14-premium-dark.png |
| finance-terminal | 金融终端 | 金融、投资、财报、市场数据、行情 | 15-finance-terminal.png |
| pitch-deck | 融资路演 | 路演、融资、BP、创业、项目介绍 | 16-pitch-deck.png |
| blueprint | 蓝图教程 | 教程、步骤、手把手、SOP、流程 | 17-blueprint.png |
| minimal-board | 极简白板 | 概念、框架、解释、总结、白板 | 18-minimal-board.png |
| academic-paper | 学术论文 | 论文、研究、报告、学术、引用 | 19-academic-paper.png |
| checklist-card | 清单卡片 | 清单、检查表、步骤、SOP、收藏 | 20-checklist-card.png |
| creator-studio | 创作者工作台 | 自媒体、剪辑、脚本、素材、视频制作 | 21-creator-studio.png |
| editorial-magazine | 杂志编辑风 | 观点、审美、杂志、专题、人物 | 22-editorial-magazine.png |
| news-briefing | 新闻快讯 | 新闻、快讯、盘点、大事件、更新 | 23-news-briefing.png |
| tool-review | 工具测评 | 测评、对比、哪个好、推荐、优缺点 | 24-tool-review.png |
| case-study | 案例档案 | 案例、复盘、拆解、结果、证据 | 25-case-study.png |
| healing-pastel | 治愈粉彩 | 治愈、心理、成长、女性向、轻情绪 | 26-healing-pastel.png |
| cinematic-story | 电影叙事 | 故事、叙事、人物、纪录、悬念 | 27-cinematic-story.png |
| warning-alert | 警示避坑 | 避坑、风险、错误、不建议、警示 | 28-warning-alert.png |
| social-pop | 社媒流行 | 抖音、小红书、种草、社媒、爆款 | 29-social-pop.png |
| viral-hook | 爆款钩子 | 钩子、爆款、开头、反差、强观点 | 30-viral-hook.png |

