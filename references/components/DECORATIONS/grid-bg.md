# 网格背景（Grid Background�?
带流动动画的网格线背景，可叠加径向渐变光晕�?
## 适用场景

所有场景的通用背景层�?
## HTML 结构

```html
<div class="grid-bg" id="sx-bg"></div>
```

## CSS

```css
/* 网格背景 */
.grid-bg{
  position:absolute;inset:0;
  background-image:
    linear-gradient(color-mix(in srgb, var(--hf-text-muted,#6B6862) 12%, transparent)) 1px, transparent 1px),
    linear-gradient(90deg, color-mix(in srgb, var(--hf-text-muted,#6B6862) 12%, transparent)) 1px, transparent 1px);
  background-size:56px 56px;
  pointer-events:none;z-index:0;
}

/* 光晕叠加（可选） */
.grid-bg::after{
  content:'';position:absolute;inset:0;
  background:radial-gradient(ellipse 70% 60% at 50% 45%, rgba(193,95,60,0.05), transparent 70%);
}

/* 流动动画 */
@keyframes grid-drift{to{background-position:var(--gd-x,56px) var(--gd-y,56px)}}
#sx-bg{animation:grid-drift 16s linear infinite}
```

## 参数

| 属�?| 建议�?|
|------|--------|
| grid 尺寸 | 48px�?4px（CSS 变量 `--gd-x`, `--gd-y`）|
| 流动速度 | 16s�?0s |
| 光晕位置 | 随场景内容区域调整（ellipse 参数）|
