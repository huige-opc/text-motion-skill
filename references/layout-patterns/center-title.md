<!-- ════════════════════════════════════════════════════════════════
 🚫 这是「排版规划参考」，不是视觉模板。

 本文档教你：这种布局适合什么场景、怎么拆信息块、安全区在哪。
 本文档不教：具体长什么样。字号、间距、颜色、卡片形状、排列
 方向 — 全部由你决定。每个场景必须不一样。照抄 = 偷懒 = 不及格。
═══════════════════════════════════════════════════════════════════ -->


# 布局模式：居中标题 (Center Title)

最基础的场景布局，主标题和副标题居中显示。

## HTML 结构

```html
<div class="slide-center">
  <h1 class="headline">主标题文字</h1>
  <p class="subhead-center">副标题说明文字</p>
</div>
```

或带装饰元素：

```html
<div class="slide-center">
  <div class="accent-bar"></div>
  <h1 class="headline-lg">大标题</h1>
  <p class="subhead-center">副标题说明</p>
  <div class="year-badge">2024</div>
</div>
```

## CSS 样式

```css
.slide-center {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 32px;
  padding: 80px 200px;
  text-align: center;
}

/* 需要动画的元素必须初始 opacity:0 */
.headline,
.headline-lg,
.headline-xl,
.subhead-center,
.accent-bar,
.year-badge { opacity: 0; }

.headline {
  font-size: 80px;
  font-weight: 800;
  line-height: 1.05;
  letter-spacing: -0.025em;
  color: var(--title-color, #fff);
  max-width: 1300px;
}

.headline-lg {
  font-size: 88px;
  font-weight: 900;
  line-height: 1;
  letter-spacing: -0.03em;
}

.headline-xl {
  font-size: 120px;
  font-weight: 900;
  line-height: 1;
  letter-spacing: -0.04em;
}

.subhead-center {
  font-size: 44px;
  font-weight: 400;
  line-height: 1.4;
  color: var(--subtitle-color, rgba(255,255,255,.7));
  max-width: 1100px;
}

.accent-bar {
  width: 80px;
  height: 6px;
  border-radius: 3px;
  background: var(--accent, #00d4ff);
}

.year-badge {
  font-size: 28px;
  font-weight: 700;
  color: var(--accent, #00d4ff);
  letter-spacing: 0.12em;
  text-transform: uppercase;
  margin-top: 16px;
}
```

## 动画（纯 CSS keyframes + reveal class）

```css
@keyframes up-fade   { from{transform:translateY(50px);opacity:0} to{transform:translateY(0);opacity:1} }
@keyframes up-fade-s { from{transform:translateY(30px);opacity:0} to{transform:translateY(0);opacity:1} }
@keyframes scale-x   { from{transform:scaleX(0);opacity:0}         to{transform:scaleX(1);opacity:1} }

#mount.reveal-title    .headline       { animation: up-fade   .6s ease-out both; }
#mount.reveal-title    .headline-lg    { animation: up-fade   .6s ease-out both; }
#mount.reveal-subtitle .subhead-center { animation: up-fade-s .5s ease-out both; }
#mount.reveal-bar      .accent-bar     { animation: scale-x   .4s ease-out both; transform-origin: left; }
#mount.reveal-badge    .year-badge     { animation: up-fade-s .4s ease-out both; }
```

## revealMap 绑定示例

```js
var revealMap = [
  ['reveal-bar',      0,  0.00, 'accent bar 装饰'],
  ['reveal-title',    0, -0.12, '主标题'],
  ['reveal-subtitle', 1, -0.10, '副标题'],
  ['reveal-badge',    1,  0.20, '年份角标'],
];
```

## 变体：带背景装饰

```html
<div class="slide-center">
  <div class="bg-decoration">
    <div class="circle-1"></div>
    <div class="circle-2"></div>
  </div>
  <h1 class="headline">标题</h1>
</div>
```

```css
.bg-decoration {
  position: absolute;
  inset: 0;
  overflow: hidden;
  pointer-events: none;
  z-index: 0;
}

.circle-1 {
  position: absolute;
  width: 600px; height: 600px;
  border-radius: 50%;
  background: radial-gradient(circle, var(--accent) 0%, transparent 70%);
  opacity: 0.1;
  top: -200px; right: -200px;
}

.circle-2 {
  position: absolute;
  width: 400px; height: 400px;
  border-radius: 50%;
  background: radial-gradient(circle, var(--primary) 0%, transparent 70%);
  opacity: 0.08;
  bottom: -100px; left: -100px;
}
```
