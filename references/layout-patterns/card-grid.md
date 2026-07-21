<!-- ════════════════════════════════════════════════════════════════
 🚫 这是「排版规划参考」，不是视觉模板。

 本文档教你：这种布局适合什么场景、怎么拆信息块、安全区在哪。
 本文档不教：具体长什么样。字号、间距、颜色、卡片形状、排列
 方向 — 全部由你决定。每个场景必须不一样。照抄 = 偷懒 = 不及格。
═══════════════════════════════════════════════════════════════════ -->


# 布局模式：卡片网格 (Card Grid)

展示多个并行信息点的布局，如功能列表、优势对比等。

## HTML 结构

### 三列卡片

```html
<div class="slide-inner">
  <h2 class="headline">核心价值</h2>
  <div class="card-grid-3">
    <div class="card">
      <div class="card-icon">💰</div>
      <div class="card-title">节省成本</div>
      <div class="card-body">比传统方案节省 50-80% 费用</div>
    </div>
    <div class="card">
      <div class="card-icon">⚡</div>
      <div class="card-title">快速部署</div>
      <div class="card-body">3 分钟完成配置，即刻使用</div>
    </div>
    <div class="card">
      <div class="card-icon">🔒</div>
      <div class="card-title">安全可靠</div>
      <div class="card-body">企业级安全认证，数据加密</div>
    </div>
  </div>
</div>
```

### 两列卡片

```html
<div class="slide-inner">
  <div class="card-grid-2">
    <div class="card card-highlight">
      <span class="card-eyebrow">主要</span>
      <h3 class="card-title">核心功能</h3>
      <p class="card-body">详细描述内容...</p>
    </div>
    <div class="card">
      <h3 class="card-title">辅助功能</h3>
      <p class="card-body">详细描述内容...</p>
    </div>
  </div>
</div>
```

## CSS 样式

```css
/* 需要动画的元素初始 opacity:0 */
.headline,
.card,
.feature-list { opacity: 0; }

/* 三列网格 */
.card-grid-3 {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 40px;
  width: 100%;
  max-width: 1560px;
  margin-top: 32px;
}

/* 两列网格 */
.card-grid-2 {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 40px;
  width: 100%;
}

/* 基础卡片 */
.card {
  padding: 48px;
  background: var(--card-bg, rgba(255,255,255,.04));
  border-radius: 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.card-highlight {
  background: linear-gradient(135deg, var(--accent, #00d4ff) 0%, var(--primary, #a855f7) 100%);
}

.card-icon {
  font-size: 48px;
  margin-bottom: 8px;
}

.card-eyebrow {
  font-size: 14px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--accent, #00d4ff);
}

.card-title {
  font-size: 44px;
  font-weight: 800;
  color: var(--title-color, #fff);
}

.card-body {
  font-size: 28px;
  font-weight: 400;
  color: var(--text-muted, rgba(255,255,255,.7));
  line-height: 1.45;
}
```

## 动画（CSS reveal + stagger 交错入场）

```css
@keyframes up-fade { from{transform:translateY(50px);opacity:0} to{transform:translateY(0);opacity:1} }
@keyframes up-fade-s { from{transform:translateY(30px);opacity:0} to{transform:translateY(0);opacity:1} }

#mount.reveal-title .headline { animation: up-fade-s .5s ease-out both; }

/* 卡片交错入场：给每个卡片单独的 reveal class，或用 nth-child 延迟 */
#mount.reveal-cards .card:nth-child(1) { animation: up-fade .6s ease-out .00s both; }
#mount.reveal-cards .card:nth-child(2) { animation: up-fade .6s ease-out .12s both; }
#mount.reveal-cards .card:nth-child(3) { animation: up-fade .6s ease-out .24s both; }
```

## revealMap 绑定示例

```js
var revealMap = [
  ['reveal-title', 0, -0.12, 'headline'],
  ['reveal-cards', 1, -0.10, '三个卡片交错入场']
];
```

如果每个卡片对应不同 beat（每张卡片一句话）：

```js
var revealMap = [
  ['reveal-title', 0, -0.12, 'headline'],
  ['reveal-card1', 1, -0.10, '卡片 1'],
  ['reveal-card2', 2, -0.10, '卡片 2'],
  ['reveal-card3', 3, -0.10, '卡片 3']
];
```

对应 CSS：
```css
#mount.reveal-card1 .card:nth-child(1) { animation: up-fade .6s ease-out both; }
#mount.reveal-card2 .card:nth-child(2) { animation: up-fade .6s ease-out both; }
#mount.reveal-card3 .card:nth-child(3) { animation: up-fade .6s ease-out both; }
```

## 变体：带图标列表

```html
<div class="feature-list">
  <div class="feature-item">
    <div class="feature-icon">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <path d="M5 12l5 5L20 7" stroke="currentColor" stroke-width="2"/>
      </svg>
    </div>
    <div class="feature-content">
      <span class="feature-title">功能标题</span>
      <span class="feature-desc">功能描述文字</span>
    </div>
  </div>
</div>
```

```css
.feature-list {
  display: flex;
  flex-direction: column;
  gap: 24px;
  width: 100%;
}

.feature-item {
  display: flex;
  align-items: flex-start;
  gap: 20px;
  padding: 24px;
  background: var(--card-bg);
  border-radius: 12px;
}

.feature-icon {
  width: 32px; height: 32px;
  border-radius: 50%;
  background: var(--accent);
  display: flex; align-items: center; justify-content: center;
  color: var(--bg);
  flex-shrink: 0;
}

.feature-content { display: flex; flex-direction: column; gap: 4px; }
.feature-title { font-size: 28px; font-weight: 700; color: var(--title-color); }
.feature-desc  { font-size: 22px; color: var(--text-muted); }
```
