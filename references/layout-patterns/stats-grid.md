<!-- ════════════════════════════════════════════════════════════════
 🚫 这是「排版规划参考」，不是视觉模板。

 本文档教你：这种布局适合什么场景、怎么拆信息块、安全区在哪。
 本文档不教：具体长什么样。字号、间距、颜色、卡片形状、排列
 方向 — 全部由你决定。每个场景必须不一样。照抄 = 偷懒 = 不及格。
═══════════════════════════════════════════════════════════════════ -->


# 布局模式：数据统计 (Stats Grid)

展示关键数据指标的布局，适合数字驱动的场景。

## HTML 结构

### 单行统计

```html
<div class="slide-inner">
  <div class="stat-row">
    <div class="stat-item">
      <span class="stat-number js-count" data-target="300">0</span>
      <span class="stat-label">百分比</span>
    </div>
    <div class="stat-divider"></div>
    <div class="stat-item">
      <span class="stat-number js-count" data-target="2.1" data-suffix="B" data-decimals="1">0</span>
      <span class="stat-label">美元市场</span>
    </div>
    <div class="stat-divider"></div>
    <div class="stat-item">
      <span class="stat-number js-count" data-target="660" data-suffix="K">0</span>
      <span class="stat-label">用户数</span>
    </div>
  </div>
</div>
```

### 带标签统计

```html
<div class="slide-center">
  <h2 class="headline">核心指标</h2>
  <div class="stat-grid-2">
    <div class="stat-card">
      <span class="stat-number js-count" data-target="300">0</span>
      <span class="stat-label">同比增长 %</span>
    </div>
    <div class="stat-card">
      <span class="stat-number js-count" data-target="2.1" data-suffix="B" data-decimals="1">0</span>
      <span class="stat-label">市场规模</span>
    </div>
  </div>
</div>
```

## CSS 样式

```css
/* 需要动画的元素初始 opacity:0 */
.headline,
.stat-row,
.stat-card,
.math-equation { opacity: 0; }

/* 单行统计 */
.stat-row {
  display: flex;
  align-items: center;
  gap: 60px;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.stat-divider {
  width: 2px;
  height: 80px;
  background: var(--border, rgba(255,255,255,.15));
  border-radius: 2px;
}

.stat-number {
  font-size: 96px;
  font-weight: 900;
  line-height: 1;
  letter-spacing: -0.04em;
  color: var(--accent, #00d4ff);
  font-variant-numeric: tabular-nums;
}

.stat-label {
  font-size: 36px;
  font-weight: 600;
  color: var(--text-muted, rgba(255,255,255,.7));
  margin-top: 8px;
}

/* 卡片式统计 */
.stat-grid-2 {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 48px;
  width: 100%;
  max-width: 1200px;
}

.stat-card {
  padding: 48px;
  background: var(--card-bg, rgba(255,255,255,.04));
  border-radius: 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}
```

## 动画（CSS reveal + JS count-up）

```css
@keyframes up-fade  { from{transform:translateY(30px);opacity:0} to{transform:translateY(0);opacity:1} }
@keyframes stagger  { from{transform:translateY(40px);opacity:0} to{transform:translateY(0);opacity:1} }

#mount.reveal-title .headline  { animation: up-fade .5s ease-out both; }
#mount.reveal-stats .stat-card { animation: stagger .5s ease-out both; }
#mount.reveal-stats .stat-card:nth-child(2) { animation-delay: 0.15s; }
#mount.reveal-stats .stat-card:nth-child(3) { animation-delay: 0.30s; }
#mount.reveal-stats .stat-row  { animation: up-fade .5s ease-out both; }
```

## Count-Up 数字滚动（纯 JS RAF）

在场景的 `<script>` 里加：

```js
// 当 reveal-stats class 出现时启动 count-up
var startedCount = false;
function startCountUps(){
  if (startedCount) return; startedCount = true;
  document.querySelectorAll('#mount .js-count').forEach(function(el){
    var target = parseFloat(el.getAttribute('data-target'));
    var suffix = el.getAttribute('data-suffix') || '';
    var decimals = parseInt(el.getAttribute('data-decimals') || '0', 10);
    var duration = 1200; // ms
    var startTs = null;
    function step(ts){
      if (!startTs) startTs = ts;
      var p = Math.min(1, (ts - startTs) / duration);
      var eased = 1 - Math.pow(1 - p, 3); // ease-out cubic
      var v = target * eased;
      el.textContent = v.toFixed(decimals) + suffix;
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  });
}

// 在主 tick 里检测 reveal-stats 命中后调用 startCountUps()
```

或者更简单：在 revealMap 里绑定后用 `setTimeout` 触发（因为 reveal class 加上时就意味着到点了）：

```js
var revealMap = [
  ['reveal-title', 0, -0.12, 'headline'],
  ['reveal-stats', 1, -0.10, 'stats grid → 触发 count-up']
];

// 在 doReveal 里插入：
function doReveal(cls){
  var m = document.getElementById('mount');
  if (m) m.classList.add(cls);
  if (cls === 'reveal-stats') startCountUps();
}
```

## 变体：数学公式

```html
<div class="math-equation">
  <span class="math-val">560M</span>
  <span class="math-op">budget trips/yr</span>
  <span class="math-op">×</span>
  <span class="math-val">15%</span>
  <span class="math-op">online</span>
  <span class="math-op">=</span>
  <span class="math-result">$2.1B</span>
</div>
```

```css
.math-equation {
  display: flex;
  align-items: center;
  gap: 24px;
  flex-wrap: wrap;
  margin-top: 16px;
}
.math-val { font-size: 64px; font-weight: 800; color: var(--accent); }
.math-op  { font-size: 36px; font-weight: 400; color: var(--text-muted); }
.math-result { font-size: 80px; font-weight: 900; color: var(--highlight, #00ff88); }
```
