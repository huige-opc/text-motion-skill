<!-- ════════════════════════════════════════════════════════════════
 ⚠️ 强制执行。以下规则 AI 必须逐条遵守，不得绕过、不得简化。
═══════════════════════════════════════════════════════════════════ -->

═══════════════════════════════════════════════════════════════════ -->


# 动画规范

## 通用动画曲线

| 用途 | cubic-bezier | CSS 变量 |
|------|-------------|----------|
| 弹性弹入（卡片/徽章） | `cubic-bezier(.2,1.3,.4,1)` | `var(--ease-elastic)` |
| 强弹入（星星/旋转） | `cubic-bezier(.34,1.56,.64,1)` | `var(--ease-bounce)` |
| 平滑入场（文本） | `cubic-bezier(.2,.7,.2,1)` | `var(--ease-smooth)` |
| 标准淡入 | `ease-out` | `var(--ease-standard)` |

## 通用时长

- `--dur-fast`: 0.35s
- `--dur-normal`: 0.5s
- `--dur-slow`: 0.7s

## 标准 @keyframes（已在 components.css 中定义）

| keyframes | 作用 | CSS 变量 |
|-----------|------|----------|
| `up-fade` | 淡入上浮 | `--uf-y`（默认 16px） |
| `elastic-in` | 弹性弹入 | `--ei-y`（默认 24px）, `--ei-scale`（默认 0.92） |
| `pop-rotate` | 旋转弹入 | `--pr-deg`（默认 -25deg） |
| `pop-scale` | 缩放弹入 | 无 |
| `pop-scale-rotate` | 旋转缩放弹入 | `--psr-deg`（默认 -25deg） |
| `scale-x` | 水平展开 | 无 |
| `scale-y` | 垂直展开 | 无 |
| `fade-only` | 纯淡入 | `--fo-opacity`（默认 0.12） |
| `draw-in` | SVG stroke 绘制 | `--di-offset`（默认 1000） |
| `grid-drift` | 网格背景流动 | `--gd-x`, `--gd-y`（默认 48px） |

## 动画原则

- 所有动画必须有叙事目的（入场或退场）
- 禁止 idle/breathe/float/drift 等无限循环的装饰动画
- 允许的特殊无限动画：grid-drift（网格流动）、pipe-flow（管道流动）、energy-rings（能量环）
- 同一时刻不超过 2 个元素在运动
- 入场动画 0.35s–0.7s
