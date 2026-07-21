# 数字滚动（Count-up）

RAF 驱动的数字计数动画，配合弹性缓动函数。

## 适用场景

数据展示场景中的大数字（9套、5类、6步等）。

## HTML 结构

```html
<div class="n" data-target="9">0</div>
```

## CSS

```css
.n{font-variant-numeric:tabular-nums;line-height:1;letter-spacing:-.03em}
```

## JavaScript（在场景 script 内实现）

```javascript
// revealMap 中定义
['reveal-c1', 1, -0.12, 'card 1'],

// count-up 数组
var countups = [
  ['#c1 .n', 1, 0.92],   // [selector, beatIndex, offsetSec]
  ['#c2 .n', 2, 0.94],
];

var cuStarted = {};

// 在 tick() 中调用
function doCountup(idx){
  if(cuStarted[idx]) return;
  cuStarted[idx] = true;
  var cu = countups[idx];
  var el = document.querySelector(cu[0]);
  if(!el) return;
  var tgt = parseInt(el.dataset.target || '0', 10);
  var t0 = performance.now(), dur = 800;
  (function step(now){
    var p = Math.min(1, (now - t0) / dur);
    el.textContent = Math.round((1 - Math.pow(1-p, 3)) * tgt);
    if(p < 1) requestAnimationFrame(step);
  })(t0);
}
```

## 参数

| 属性 | 值 |
|------|-----|
| 缓动 | `1 - (1-p)³`（cubic ease-out）|
| 时长 | 800ms |
| 触发方式 | RAF，与 SRT beat 同步 |
