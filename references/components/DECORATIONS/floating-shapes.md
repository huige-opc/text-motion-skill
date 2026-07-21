# 浮动形状（Floating Shapes）

在背景散布的几何形状装饰（圆形、菱形、方形等）。

## 适用场景

需要丰富背景层次但不使用圆点的场景。

## HTML 结构

```html
<div class="fs" style="top:10%;left:6%;--sz:28px;--br:50%"></div>
<div class="fs" style="top:68%;left:2%;--sz:44px;--br:50%"></div>
```

## CSS

```css
.fs{
  position:absolute;pointer-events:none;z-index:0;
  width:var(--sz,40px);height:var(--sz,40px);
  border:2px solid rgba(193,95,60,0.1);
  border-radius:var(--br,8px);
  opacity:0;
}

/* 菱形（旋转 45°） */
.fs.diamond{transform:rotate(45deg) scale(0);border-radius:2px}

/* 实心圆点 */
.fs.solid{border:none;background:rgba(193,95,60,0.05);border-radius:50%}
```

## Reveal 规则

```css
/* 形状淡入 */
@keyframes fs-in{to{opacity:0.12;transform:rotate(45deg) scale(1)}}
@keyframes fs-circle-in{to{opacity:0.15}}

#mount.reveal-shape .fs{animation:fs-in 0.5s var(--ease-bounce) both}
#mount.reveal-shape .fs.solid{animation:fs-circle-in 0.6s ease-out both}
```

## 参数

| 属性 | 建议值 |
|------|--------|
| 大小 | 12px–44px |
| 透明度 | 0.05–0.15 |
| 边框色 | `rgba(193,95,60,0.05–0.10)` |
