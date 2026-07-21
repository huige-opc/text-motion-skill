<!-- ════════════════════════════════════════════════════════════════
 ⚠️ 强制执行。以下规则 AI 必须逐条遵守，不得绕过、不得简化。
═══════════════════════════════════════════════════════════════════ -->

═══════════════════════════════════════════════════════════════════ -->


# 排版引擎规则

把排版当作生成前的硬约束，而不是生成后的"美化建议"。本规则用于从 SRT 生成视频时控制文字重叠、画面密度、留白和镜头节奏。

## 1. 文本密度分级

按单个 scene 的中文字符数、字幕条数和持续时间判断密度：

| 等级 | 条件 | 允许版式 | 禁止 |
|---|---|---|---|
| sparse | 少于 18 字且时长大于 3 秒 | `center-title`, `big-stat`, `center-card` | 空背景只放小字 |
| balanced | 18-56 字 | `center-title`, `center-card`, `card-grid`, `stats-grid` | 过多装饰元素 |
| dense | 57-92 字或 3 条字幕 | `center-card`, `list-items`, `card-grid` | `big-stat`, 纯居中大标题 |
| overload | 超过 92 字或每秒超过 16 字 | 拆分 scene，或强制 `list-items` | 所有文字同屏堆叠 |

密度高时优先减少装饰、缩小字号、增加容器宽度；密度低时补充关键词标签、数据点、轻装饰线或视觉图形，避免画面发空。

## 2. 版式降级规则

- 当正文超过 56 字，不使用 `center-title` 作为最终布局，改用 `center-card` 或 `list-items`。
- 当出现“第一、第二、首先、然后、1、2、3”等流程词，优先 `list-items`。
- 当出现数字、百分比、倍数且文本少于 50 字，优先 `big-stat` 或 `stats-grid`。
- 连续两个 scene 不使用同一 layout；如果内容强制相同，改变对齐、密度或动效入口。
- 同一屏最多 1 个主标题、1 个副标题、3 个信息块。超过则拆分或压缩为关键词。

## 3. 文字安全规则

所有 scene 的文字必须满足：

- 位于安全区内：16:9 默认左右 160px、上下 88px；9:16 默认左右 72px、上下 120px。
- 主标题最多 2 行；dense/overload 时最多 3 行但字号下调。
- 正文最多 3 行；列表项最多 3 个，每项最多 18 个中文字符。
- 使用 `overflow-wrap: break-word`、`word-break: break-word`、合理 `line-height`。
- 不把长句复制到多个卡片；先提炼为关键词，再放入卡片。

## 4. 画面密度目标

每个 scene 目标密度为 0.45-0.72：

- 低于 0.35：太空。增加辅助标签、关键词、图标、细线或一层轻动效。
- 高于 0.78：太挤。减少装饰、压缩文本、换成列表/卡片或拆 scene。

## 4.1 画面重心与左右平衡

每个 scene 不只检查“有没有内容”，还要检查“内容摆在哪里”：

- 16:9 画面中，主要内容包围盒建议占画面宽度 48%-72%、高度 34%-62%。
- 内容视觉中心建议位于 x=43%-58%、y=38%-58%。不要长期偏左上。
- 如果左侧已有标题和两张卡片，右侧必须有辅助面板、时间轴、关键词栈、图形结构或留白意图；不能只是空。
- 连续 2 个 scene 不要都左上重心。需要交替使用居中、左右分栏、时间轴、底部总结条、右侧说明面板。
- 当 `layoutHealth.notes` 包含 `balance-left-right-zones` 时，优先使用 `split-focus`、`timeline-rail`、`list-items`，少用单纯 `center-card`。
- 卡片内容少于 28 字时，不要给过大的空卡片；缩小卡片、增加图标/编号/关系线，或改成关键词标签。

## 5. 动效避免“呆”

每个 scene 必须有一个清晰的视觉动作：

- 数据类：数字增长、条形生长、指标卡翻入。
- 流程类：节点逐步展开、路径线绘制。
- 工具/代码类：窗口推入、代码高亮、重点区域扫光。
- 观点类：关键词分层出现、强调词扫光。
- 总结类：多个元素收束到一句主张。

动效服务信息层级，不用强弹跳或大旋转掩盖排版问题。

## 6. 预检失败条件

出现以下情况时不要进入渲染：

- `dense` 或 `overload` scene 仍使用 `center-title` / `big-stat`。
- 单 scene 文本超过 110 字。
- 连续 3 个 scene 使用同一 layout 或同一 entrance。
- 装饰元素多于信息元素。
- contact sheet 中有文字裁切、互相覆盖、画面中心过空或边缘过满。
- contact sheet 中连续出现右侧/下方大面积无意图空白。
- 卡片过大但内容很少，造成“空盒子”。

## Subtitle-safe visual QC

- Reserve the lower 18% of the frame for subtitles that may be added later in editing.
- Do not place semantic Chinese text, cards, callouts, summary bars, or lower-thirds in the subtitle band unless the scene is a final CTA approved by the user.
- A real-video scene needs one dominant visual object. Main cards, terminal panels, screenshots, and explainer groups should feel intentionally large, not like small floating widgets.
- Treat `visualDensity < 0.35` and `visualDensity > 0.78` as blocking failures, not stylistic suggestions.
- Text-led scenes use at most 1-2 visible decorative components. More components require a data/process/code/map reason.
