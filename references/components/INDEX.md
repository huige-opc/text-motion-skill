# 组件库总目录

本目录定义了 text-motion-skill 所有可复用的视觉组件和场景骨架。
生成场景时优先使用组件库，确保效果一致、质量稳定。

## 分类

```
components/
├── LAYOUTS/        ← 场景骨架（定义每种场景的搭建方案）
├── DECORATIONS/    ← 背景装饰层（可叠加到任意场景）
├── MICRO/          ← 微组件（跨场景复用的小元素）
└── MACRO/          ← 宏组件（场景级复杂结构）
```

## 使用流程

1. 根据 scene-plan 确定场景类型 → 选 LAYOUTS 中的场景骨架
2. 根据 Pure-Graphic / Talking-Head 模式选对应的布局变体
3. 场景骨架中标注了需要哪些组件 → 到 MICRO/MACRO 查看具体实现
4. 组装时引用 `components.css` 中的类名和 @keyframes

## 动画曲线速查

| 用途 | cubic-bezier | CSS 变量 |
|------|-------------|----------|
| 弹性弹入（卡片/徽章） | `cubic-bezier(.2,1.3,.4,1)` | `var(--ease-elastic)` |
| 强弹入（星星/旋转） | `cubic-bezier(.34,1.56,.64,1)` | `var(--ease-bounce)` |
| 平滑入场（文本） | `cubic-bezier(.2,.7,.2,1)` | `var(--ease-smooth)` |
| 标准淡入 | `ease-out` | `var(--ease-standard)` |

## 目录索引

### LAYOUTS（场景骨架）

| 骨架 | 用途 | 适合场景 |
|------|------|---------|
| [scene-hook](./LAYOUTS/scene-hook.md) | 痛点/问题开场 | 视频开头 1-2 帧 |
| [scene-stats](./LAYOUTS/scene-stats.md) | 数据证明 | 展示数字/指标 |
| [scene-solution](./LAYOUTS/scene-solution.md) | 方案对比 | Before vs After |
| [scene-finale](./LAYOUTS/scene-finale.md) | 金句收尾 | 视频最后一帧 |
| [scene-two-column](./LAYOUTS/scene-two-column.md) | 两栏通用 | 内容并列展示 |
| [scene-demo](./LAYOUTS/scene-demo.md) | 流程演示 | 多步骤工作流 |

### DECORATIONS（背景装饰）

| 组件 | 效果 | 使用场景 |
|------|------|---------|
| [grid-bg](./DECORATIONS/grid-bg.md) | 网格背景 + 流动光晕 | 通用背景 |
| [floating-dots](./DECORATIONS/floating-dots.md) | 装饰圆点（pop-in 入场） | 增加画面层次 |
| [floating-shapes](./DECORATIONS/floating-shapes.md) | 几何形状装饰 | 丰富背景纹理 |
| [vs-badge](./DECORATIONS/vs-badge.md) | VS 对比徽标 | 对比场景中央 |
| [shimmer-sweep](./DECORATIONS/shimmer-sweep.md) | 微光扫描过表面 | 强调标题/卡片 |
| [connector-line](./DECORATIONS/connector-line.md) | 连接线（水平展开） | 元素之间关系 |
| [energy-rings](./DECORATIONS/energy-rings.md) | 同心能量环扩散 | AI/雷达/脉冲效果 |

### MICRO（微组件）

| 组件 | 效果 | 复用 |
|------|------|------|
| [eyebrow-chip](./MICRO/eyebrow-chip.md) | 眉标（圆点 + 文本 pill） | 高频 |
| [badge](./MICRO/badge.md) | 数字角标 01/02/03 | 中频 |
| [tag](./MICRO/tag.md) | 标签 pill（圆角 + 边框） | 中频 |
| [underline](./MICRO/underline.md) | 关键词下划线（scaleX） | 高频 |
| [progress-bar](./MICRO/progress-bar.md) | 进度条（轨道 + fill） | 中频 |
| [bottom-bar](./MICRO/bottom-bar.md) | 底条进度指示器 | 中频 |
| [count-up](./MICRO/count-up.md) | 数字滚动（RAF 驱动） | 中频 |
| [decor-corner](./MICRO/decor-corner.md) | 四角装饰标 | 低频 |
| [typewriter](./MICRO/typewriter.md) | 打字机效果（逐字出现） | 特效 |
| [pipe-flow](./MICRO/pipe-flow.md) | 管道流动效果（条纹进度） | 特效 |
| [random-tag](./MICRO/random-tag.md) | 随机旋转标签组 | 中频 |

### MACRO（宏组件）

| 组件 | 效果 | 复杂度 |
|------|------|--------|
| [hook-list](./MACRO/hook-list.md) | 问题行列表（编号+文本+问号+标签） | 高 |
| [stats-card](./MACRO/stats-card.md) | 数据卡片组（弹性弹入+环+星+进度条） | 高 |
| [split-panel](./MACRO/split-panel.md) | 左右对比面板 | 中 |
| [mac-window](./MACRO/mac-window.md) | macOS 窗口模拟 | 中 |
| [timeline-track](./MACRO/timeline-track.md) | 剪辑轨道 UI | 高 |
| [step-indicator](./MACRO/step-indicator.md) | 步骤指示器芯片 | 低 |
| [persona-card](./MACRO/persona-card.md) | 人物画像卡片（色条+图标+列表） | 中 |
| [bar-chart](./MACRO/bar-chart.md) | 柱状图（生长动画） | 中 |
| [waveform](./MACRO/waveform.md) | 波形可视化（JS 驱动） | 中 |
| [vu-meter](./MACRO/vu-meter.md) | VU 电平表（分段点亮） | 低 |
| [flow-row](./MACRO/flow-row.md) | 步骤流横条（箭头连接） | 低 |
| [data-table](./MACRO/data-table.md) | 数据表（逐行+列高亮+内嵌条） | 中 |
