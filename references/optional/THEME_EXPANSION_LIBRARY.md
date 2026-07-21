# Theme Expansion Library

Optional reference. Do not load during normal generation.

> Use this reference only when the user asks to add, extend, customize, or choose a theme outside the built-in theme set. Keep the active theme selector lean; treat this file as a pending-theme idea bank and conversion guide.

## 1. Usage contract

Load this file when the user says things like:

- “我想增加一个主题 / 风格 / 视觉系统”
- “有没有适合某某行业的视频主题”
- “帮我扩展主题库”
- “我想做成某某平台 / 某某品牌 / 某某审美”
- “当前主题不够用，帮我选一个新主题方向”

Do not load this file for normal SRT-to-video generation if the user did not ask for a new theme. For normal generation, use the built-in themes and the current `select-theme.mjs`.

## 2. Expansion principle

A valid theme is a visual system, not a mood word.

Every expanded theme must define:

```text
themeId
Chinese name
one-line positioning
best-fit scenes
poor-fit scenes
palette
background grammar
typography grammar
layout bias
component bias
motion rhythm
visual density
subtitle-safe behavior
forbidden elements
trigger keywords
example prompts
```

## 3. Required deliverables for every new active theme

When the user decides to promote any pending theme into the usable theme set, complete these four deliverables. Do not treat a theme description alone as an active theme.

### 3.1 `themes/{themeId}/theme.json`

Create or update the theme config with at least:

```json
{
  "id": "{themeId}",
  "name": "{Chinese name}",
  "palette": {
    "background": "#...",
    "surface": "#...",
    "textPrimary": "#...",
    "textSecondary": "#...",
    "accent": "#...",
    "accent2": "#..."
  },
  "typography": {
    "title": "...",
    "body": "...",
    "numericOrCode": "..."
  },
  "background": {
    "file": "assets/theme-backgrounds/{number}-{themeId}.png",
    "fallback": "..."
  },
  "motion": {
    "entrance": "...",
    "emphasis": "...",
    "ambient": "...",
    "rhythm": "slow|medium|fast",
    "sceneTransition": "hard-cut"
  },
  "safeArea": {
    "subtitleBandBottomPercent": 18,
    "minMainVisualWidthPercent": 55,
    "minMainVisualHeightPercent": 48
  }
}
```

Keep `sceneTransition` as `hard-cut`; do not introduce scene-to-scene transitions through themes.

### 3.2 Background image

Add one theme background image under:

```text
{skillRoot}/assets/theme-backgrounds\{number}-{themeId}.png
```

The background must be suitable for 16:9 explainer videos: readable behind text, not too noisy, and not dependent on tiny details. If no final image is available, define a deterministic fallback background recipe and mark the theme as not fully active until the image exists.

### 3.3 Keyword mapping

Update theme selection keywords in `references/THEME_SELECTOR.md` and the selection script when needed. Use strong and weak triggers instead of vague style words.

Example mapping style:

```text
脚本 / Skill / 步骤 / 教程 / 手把手 -> blueprint
Codex / Claude Code / Agent / 自动执行 / 终端 -> ai-console
测评 / 对比 / 哪个好用 / 模型清单 -> tool-review
踩坑 / 错误 / 风险 / 不建议 -> warning-alert
案例 / 复盘 / 拆解 / 结果 -> case-study
```

Avoid keyword collisions: if a new theme steals too many matches from an existing built-in, narrow its triggers or require explicit user selection.

### 3.4 Visual hard constraints

Every active theme must define constraints that prevent common video-generation failures:

```text
- Components, cards, lower-thirds, and summary bars must not enter the lower 18% subtitle band.
- The dominant visual object should be at least 55% of frame width or 48% of frame height when it carries the beat.
- Use no more than 3 core semantic blocks in one scene unless the scene is explicitly a data/process/map layout.
- Use no more than 4 small tags/pills/badges in one scene.
- Do not fill the frame with icons, decorative panels, stickers, or micro-components just to look designed.
- Preserve clear reading hierarchy: title first, support second, decoration last.
- Prefer one strong visual grammar over many mixed effects.
```

If a pending theme cannot satisfy these constraints, keep it in the expansion library and do not promote it to the active theme set.
When converting a pending theme into an active theme, add it to:

```text
themes/{themeId}/theme.json
references/AESTHETIC_THEMES.md
references/THEME_SELECTOR.md
scripts/select-theme.mjs
scripts/init-project.mjs background mapping
assets/theme-backgrounds/{number}-{themeId}.png
```

Then run the theme selection and project initialization smoke test.

## 4. Pending theme matrix

Use this matrix to choose candidate themes before writing full theme specs.

### 4.1 科技未来系统

| themeId | 中文名 | 视觉定位 | 适合场景 | 禁用倾向 |
|---|---|---|---|---|
| cyber-neon | 赛博霓虹 | 黑紫底、青粉霓虹、小面积高亮 | 未来科技、年轻化科技、酷炫产品 | 满屏霓虹、廉价 glitch、强扫描线 |
| ai-console | AI 控制台 | 终端、任务队列、模型状态、代码面板 | Agent、自动化、代码执行、AI 工作流 | 字体过小、终端信息堆满屏 |
| data-grid | 数据网格 | 深色数据面板、网格、图表、指标卡 | 数据分析、趋势、算法、指标解读 | 图表过多、数字过小 |
| hologram-ui | 全息界面 | 深色空间、半透明线框、立体界面感 | 概念产品、未来发布、智能硬件 | 玻璃拟态过强、发光过量 |
| robotics-lab | 机器人实验室 | 冷灰、机械蓝、模块化标注 | 机器人、自动化设备、智能硬件 | 工业元素堆砌、机械贴图廉价化 |
| space-tech | 深空科技 | 深蓝黑、星轨线、轨道结构 | 航天、宏大科技、未来叙事 | 星空壁纸感、光斑过多 |

### 4.2 商业专业系统

| themeId | 中文名 | 视觉定位 | 适合场景 | 禁用倾向 |
|---|---|---|---|---|
| corporate-clean | 企业白蓝 | 白底、蓝灰、官网级清爽 | 公司介绍、B2B 方案、产品说明 | 普通 PPT 感、卡片边框过多 |
| premium-dark | 高级暗色 | 黑灰、低饱和金属色、发布会感 | 高端产品、咨询、品牌升级 | 土豪金、大面积金色、厚阴影 |
| finance-terminal | 金融终端 | 深色行情盘、数字表格、价格线 | 投资、财报、市场数据、商业趋势 | 红绿闪烁过多、交易软件照搬 |
| pitch-deck | 融资路演 | 简洁大标题、图表、里程碑 | 创业、BP、项目介绍、方案展示 | 信息太密、像真实 PPT 截图 |
| luxury-brand | 奢华品牌 | 黑白金、极简留白、精致排版 | 高端消费、品牌故事、精品服务 | 俗气金色、珠宝感装饰堆叠 |
| consulting-grid | 咨询网格 | MECE 结构、矩阵、象限、诊断卡 | 咨询分析、战略拆解、企业培训 | 框线太多、术语压缩过密 |

### 4.3 教育知识系统

| themeId | 中文名 | 视觉定位 | 适合场景 | 禁用倾向 |
|---|---|---|---|---|
| blueprint | 蓝图教程 | 蓝白线框、步骤流、流程箭头 | 手把手教程、SOP、Skill 制作 | 线条过细、步骤字太小 |
| minimal-board | 极简白板 | 白底黑字、少量高亮、教学板书 | 概念解释、框架总结、科普 | 装饰过多、空白但没重点 |
| academic-paper | 学术论文 | 论文卡、引用块、严肃排版 | 论文解读、研究报告、严肃科普 | 小字堆论文截图、脚注过多 |
| checklist-card | 清单卡片 | 大号 checklist、编号步骤、收藏感 | 方法清单、步骤总结、避坑列表 | 勾选项过多、卡片堆满屏 |
| classroom-soft | 课堂轻教学 | 柔和浅色、黑板/白板隐喻 | 课程、培训、入门教学 | 儿童课件感、图标幼稚 |
| knowledge-map | 知识地图 | 节点关系、概念树、结构图 | 框架体系、知识图谱、课程目录 | 节点太多、连线杂乱 |

### 4.4 内容媒体系统

| themeId | 中文名 | 视觉定位 | 适合场景 | 禁用倾向 |
|---|---|---|---|---|
| creator-studio | 创作者工作台 | 时间轴、素材卡、剪辑面板 | 自媒体、剪辑、脚本、素材管理 | 软件界面太满、按钮小到看不清 |
| editorial-magazine | 杂志编辑风 | 大标题、留白、图文排版、版式感 | 观点表达、审美内容、人物专题 | 文字压边、过度杂志化难读 |
| news-briefing | 新闻快讯 | 信息条、日期、事实卡、播报感 | 行业新闻、事件盘点、版本更新 | 电视新闻模板感、红蓝条过俗 |
| tool-review | 工具测评 | 对比卡、评分条、优缺点矩阵 | 工具测评、模型对比、插件推荐 | 参数小字太多、评分装饰过密 |
| case-study | 案例档案 | 档案卡、证据链、前后对比 | 案例拆解、项目复盘、效果证明 | 文件夹贴纸感、证据图太小 |
| documentary-frame | 纪录片字幕风 | 黑底/影像底、克制标题、时间地点 | 人物故事、事件回顾、深度内容 | 字幕压底部、暗到看不清 |

### 4.5 社交平台系统

| themeId | 中文名 | 视觉定位 | 适合场景 | 禁用倾向 |
|---|---|---|---|---|
| social-pop | 社媒流行 | 高饱和、贴纸、浮层、节奏快 | 抖音、小红书、轻知识、种草 | 贴纸过多、儿童化、廉价动效 |
| viral-hook | 爆款钩子 | 大字压迫感、反差色、强观点框 | 强开头、反差观点、转化型视频 | 震动闪烁过度、标题党感太重 |
| comment-wall | 评论墙 | 评论气泡、弹幕、用户反馈墙 | 评论互动、问答、用户案例 | 评论太多、真实平台样式侵权感 |
| creator-growth | 账号增长 | 数据仪表、粉丝曲线、转化漏斗 | 运营增长、平台复盘、涨粉策略 | 数据密集、漏斗过小 |
| app-store-clean | 应用商店风 | 应用卡、功能亮点、评分 | App 推荐、工具合集、功能介绍 | 像广告素材、星级评分乱用 |
| community-board | 社群公告板 | 公告卡、群聊摘要、任务卡 | 社群运营、活动、训练营 | 群聊截图堆满、信息噪音 |

### 4.6 生活情绪系统

| themeId | 中文名 | 视觉定位 | 适合场景 | 禁用倾向 |
|---|---|---|---|---|
| healing-pastel | 治愈粉彩 | 低饱和粉彩、柔和曲线 | 心理、成长、女性向、轻情绪 | 太甜、光晕过多、幼态 |
| cinematic-story | 电影叙事 | 宽银幕感、暗部、克制字幕 | 故事型视频、人物、纪录感 | 字幕安全区冲突、电影滤镜过重 |
| travel-journal | 旅行手账 | 地图、票据、照片边框、路线 | 旅行、城市、生活记录 | 手账贴纸过多、照片太小 |
| wellness-clean | 健康生活 | 清爽白绿、呼吸感、健康卡片 | 健康、运动恢复、饮食、睡眠 | 医疗严肃误导、图标廉价 |
| family-warm | 家庭温情 | 暖色、柔和照片框、陪伴感 | 亲情、家庭、回忆、节日 | 影楼相册感、过度煽情 |
| mindfulness-zen | 禅意极简 | 米白、墨灰、东方留白 | 冥想、情绪管理、东方美学 | 伪古风、印章/水墨堆叠 |

### 4.7 文艺审美系统

| themeId | 中文名 | 视觉定位 | 适合场景 | 禁用倾向 |
|---|---|---|---|---|
| retro-print | 复古印刷 | 复古色、粗标题、版画式块面 | 复古内容、文化、书影音 | 纸张纹理、胶片颗粒、脏旧过度 |
| gallery-minimal | 画廊极简 | 大留白、细线、作品式构图 | 艺术、设计、作品展示 | 空到没信息、标题太小 |
| poetic-serif | 诗性衬线 | 衬线大字、慢节奏、情绪留白 | 文案、读书、故事、审美观点 | 过度文艺、不适合信息密集 |
| collage-editorial | 拼贴编辑 | 几何拼贴、图片层级、杂志感 | 文化、趋势、视觉内容 | 拼贴太乱、素材边缘廉价 |
| mono-ink | 单色墨感 | 黑白灰、强对比、克制线条 | 思辨、观点、文学、哲学 | 水墨特效、宣纸纹理 |
| design-museum | 设计博物馆 | 展签、展墙、作品编号 | 设计案例、产品美学、作品集 | 展签字小、过于静态 |

### 4.8 强刺激传播系统

| themeId | 中文名 | 视觉定位 | 适合场景 | 禁用倾向 |
|---|---|---|---|---|
| warning-alert | 警示避坑 | 黑黄/红、风险等级、错误框 | 避坑、风险、错误案例、提醒 | 整屏红、恐怖片感、闪烁过多 |
| impact-energy | 冲击能量 | 斜切、大字、速度线、强节奏 | 运动、挑战、热血、突破 | 动感模糊过重、震动过量 |
| debate-arena | 观点辩论 | 左右对抗、强观点、裁判线 | 争议观点、正反对比、辩论 | 对抗色过满、像综艺包装 |
| myth-buster | 破除误区 | 谣言/事实对照、打叉、证据卡 | 辟谣、误区纠正、认知反差 | 红叉太多、低级标题党 |
| countdown-launch | 倒计时发布 | 数字倒计时、发布节奏、揭晓 | 新品发布、课程开售、活动预告 | 倒计时占满全片、压字幕 |
| challenge-mode | 挑战模式 | 任务卡、进度条、成就徽章 | 挑战、训练营、打卡、游戏化学习 | 游戏 UI 过幼稚、徽章太多 |

### 4.9 电商产品系统

| themeId | 中文名 | 视觉定位 | 适合场景 | 禁用倾向 |
|---|---|---|---|---|
| product-hero | 产品主视觉 | 大产品位、功能卖点、简洁高光 | 产品介绍、卖点拆解、发布 | 产品图太小、卖点卡压底部 |
| beauty-cosmetic | 美妆护肤 | 柔和粉白、成分卡、质感排版 | 美妆、护肤、女性消费 | 珠光/闪粉过量、网红滤镜感 |
| food-fresh | 食物清新 | 暖白、鲜艳食材色、清爽卡片 | 美食、餐饮、食谱、探店 | 饱和度过高、菜单字小 |
| ecommerce-deal | 电商促销 | 价格牌、优惠券、强转化模块 | 促销、直播间、带货短视频 | 低价弹窗感、元素爆炸 |
| packaging-clean | 包装展示 | 包装盒、规格卡、场景陈列 | 包装设计、开箱、品牌商品 | 包装图像不清、标签太密 |
| saas-product | SaaS 产品 | UI 面板、功能路径、产品卡 | 软件产品、SaaS、功能演示 | 截图太小、像官网静态页 |

### 4.10 行业垂直系统

| themeId | 中文名 | 视觉定位 | 适合场景 | 禁用倾向 |
|---|---|---|---|---|
| medical-trust | 医疗可信 | 白蓝绿、清洁、图示克制 | 医疗科普、健康服务 | 诊断承诺、恐怖病灶图、红色恐吓 |
| legal-formal | 法律正式 | 深蓝灰、文书、条款高亮 | 法律科普、合同、合规 | 字小如合同原文、法槌俗套 |
| real-estate | 房产空间 | 建筑线、户型框、空间卡片 | 房产、装修、城市楼盘 | 楼盘广告感、户型字小 |
| automotive-tech | 汽车科技 | 黑灰金属、速度线、座舱 UI | 汽车、智能座舱、新能源 | 速度感过强、炫光廉价 |
| agriculture-fresh | 农业田园 | 土绿、农田线、产地卡 | 农业、乡村、食品溯源 | 土味海报、绿色过脏 |
| manufacturing-industrial | 工业制造 | 深灰橙、机械模块、流程线 | 工厂、制造、供应链 | 工业危险符号乱用、钢铁纹理过重 |

### 4.11 文化地域系统

| themeId | 中文名 | 视觉定位 | 适合场景 | 禁用倾向 |
|---|---|---|---|---|
| chinese-modern | 新中式现代 | 米白、朱砂、墨色、现代留白 | 国风、传统文化、品牌东方感 | 伪古风、印章堆叠、水墨特效 |
| festive-red | 节庆红金 | 克制红金、节日卡片、礼盒感 | 春节、活动、节庆营销 | 土味红金、爆炸贴纸 |
| city-night | 都市夜景 | 深色城市线、霓虹点缀、街景感 | 城市、职场、夜生活、消费 | 夜店感、霓虹过量 |
| heritage-museum | 文博展陈 | 展陈牌、文物色、典雅排版 | 文博、历史、城市文化 | 旧纸纹理、古风滤镜过重 |
| youth-campus | 青春校园 | 清爽蓝绿、笔记、课程表 | 校园、学习、成长、考试 | 幼稚贴纸、课件感 |
| public-service | 公益公共 | 蓝白、清晰图标、公告系统 | 公益、政务、公共服务 | 官宣海报感、标语太满 |

### 4.12 沉浸空间系统

| themeId | 中文名 | 视觉定位 | 适合场景 | 禁用倾向 |
|---|---|---|---|---|
| futuristic-room | 未来空间 | 暗色空间、透视面板、深度感 | 未来办公、产品概念、展厅 | 3D 假透视错乱、过暗 |
| game-hud | 游戏 HUD | 状态栏、任务卡、技能槽 | 游戏化学习、挑战、电竞 | 游戏 UI 过满、信息太碎 |
| cinematic-dark | 电影暗调 | 暗部、局部高光、叙事标题 | 情绪故事、悬念、纪录 | 黑到看不清、字幕冲突 |
| dreamy-gradient | 梦幻渐变 | 低饱和渐变、柔边形体 | 情绪、愿景、轻品牌内容 | mesh noise、光斑、玻璃过度 |
| isometric-world | 等距世界 | 等距小场景、模块化空间 | 流程、系统、城市、产品生态 | 元素小、像素材库拼贴 |
| dashboard-command | 指挥大屏 | 多窗口、监控面板、调度感 | 运营中心、数据看板、系统演示 | 屏幕太密、像真实监控截图 |

## 5. Theme selection guide

When the user asks for a new theme, choose by visual intent first, then content domain.

```text
Want trust / B2B / clarity -> corporate-clean, consulting-grid, pitch-deck
Want AI / code / automation -> ai-console, tech, data-grid
Want cool / futuristic -> cyber-neon, hologram-ui, futuristic-room
Want tutorial / knowledge -> blueprint, minimal-board, checklist-card
Want news / review / case -> news-briefing, tool-review, case-study
Want social / viral -> social-pop, viral-hook, comment-wall
Want warm / lifestyle -> healing-pastel, wellness-clean, family-warm
Want premium / luxury -> premium-dark, luxury-brand, gallery-minimal
Want warning / contrast -> warning-alert, myth-buster, debate-arena
Want product / ecommerce -> product-hero, saas-product, ecommerce-deal
Want industry-specific -> medical-trust, legal-formal, real-estate, automotive-tech, manufacturing-industrial
Want cultural / local -> chinese-modern, heritage-museum, festive-red, city-night
```

If two themes fit, ask the user to choose only when the choice changes the visual promise materially. Otherwise choose the safer, clearer option.

## 6. Theme conversion template

Use this template when turning a pending theme into a built-in or user-defined active theme.

```markdown
## {themeId} — {中文名}

一句话定位：

适合：

不适合：

色彩：
- background:
- surface:
- textPrimary:
- textSecondary:
- accent:
- accent2:
- danger/warning:

背景语法：
- base:
- allowed:
- forbidden:

字体语法：
- title:
- body:
- numeric/code:

布局偏好：
- primary:
- secondary:
- avoid:

组件偏好：
- preferred:
- cautious:
- forbidden:

动效规则：
- entrance:
- emphasis:
- ambient:
- scene transition: hard-cut only

画面约束：
- visualDensity:
- dominantObject:
- subtitleSafe:
- maxSemanticBlocks:

关键词：
- strong:
- weak:
- emotion:

示例提示：
- 
```

## 7. Activation checklist

Before promoting a pending theme into the active theme set:

- Keep the theme distinct from existing built-ins; do not add near-duplicates.
- Prefer one strong visual grammar over many decorative effects.
- Define forbidden elements more concretely than allowed elements.
- Confirm that the theme can produce clear 16:9 educational/explainer scenes.
- Confirm that the theme can protect the lower 18% subtitle-safe band.
- Confirm that a dominant visual object can occupy at least 55% width or 48% height when needed.
- Provide one background image or deterministic background recipe.
- Add keywords without stealing matches from stronger existing themes.
- Run a short SRT smoke test and inspect frames before sharing.



