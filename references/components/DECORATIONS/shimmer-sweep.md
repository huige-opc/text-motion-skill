# 微光扫描（Shimmer Sweep）

一道高光从元素表面扫过的效果。

## 适用场景

强调标题、卡片高亮、功能点突出。

## HTML 结构

放在有背景色的容器上：

```html
<div class="shimmer-wrap">
  <div class="shimmer"></div>
  <span>被强调的文字</span>
</div>
```

## CSS

```css
.shimmer-wrap{position:relative;overflow:hidden}
.shimmer{
  position:absolute;inset:0;pointer-events:none;
  background:linear-gradient(
    90deg, transparent 0%, 
    rgba(255,255,255,0.15) 50%,
    transparent 100%
  );
  transform:translateX(-100%);
}
```

## Reveal 规则

```css
@keyframes shimmer-sweep{
  from{transform:translateX(-100%)}
  to{transform:translateX(200%)}
}

#mount.reveal-shimmer .shimmer{
  animation:shimmer-sweep 1.2s ease-in-out 0.3s both;
}
```
