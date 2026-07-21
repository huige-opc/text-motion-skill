# 眉标（Eyebrow Chip）

带圆点的 pill 形提示标，用于标注当前场景的主题/情绪。

## 适用场景

所有场景的开头部分，在标题之前出现。

## HTML 结构

```html
<div class="eyebrow" id="sx-eb">
  <span class="dot"></span>
  <span class="hl">重点词</span> 次要文字
</div>
```

## CSS（已内建在 components.css）

```css
.eyebrow{
  display:inline-flex;align-items:center;gap:10px;
  padding:10px 24px;
  border:1px solid color-mix(in srgb, var(--hf-text-muted,#6B6862) 15%, transparent);
  background:rgba(255,255,255,0.78);
  border-radius:999px;
  font-size:20px;font-weight:700;         /* v3 硬约束：字号 20px，加粗 700 */
  color:var(--hf-subtitle-color,#6B6862);
  width:max-content;
  opacity:0;transform:translateY(14px);
}
.eyebrow .dot{
  width:9px;height:9px;border-radius:50%;
  background:var(--hf-primary,#C15F3C);
}
.eyebrow .hl{color:var(--hf-primary,#C15F3C);font-weight:700}
```

> **2026-07-21 血训**：早期项目用 `font-weight:500 / font-size:14-15px`，1080p 画布下几乎看不清；提到 700 才有存在感。眉标必须视觉可读、能作为场景主题标签快速传达。

## Reveal 规则

```css
#mount.reveal-eb .eyebrow{
  animation:up-fade var(--dur-normal,0.5s) var(--ease-smooth,cubic-bezier(.2,.7,.2,1)) both;
}
.eyebrow .dot{
  animation:pop-scale var(--dur-fast,0.4s) var(--ease-bounce,cubic-bezier(.34,1.56,.64,1)) 0.3s both;
}
```

## 动画参数

| 属性 | 值 |
|------|-----|
| 曲线 | `cubic-bezier(.2,.7,.2,1)` |
| 时长 | 0.5s |
| 圆点弹入延迟 | 0.3s |
