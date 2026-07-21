<!-- ════════════════════════════════════════════════════════════════
 ⚠️ 强制执行。以下规则 AI 必须逐条遵守，不得绕过、不得简化。
═══════════════════════════════════════════════════════════════════ -->

═══════════════════════════════════════════════════════════════════ -->


# 语音同步引擎规则（v2 · RAF 咬合齿轮）

SRT 是画面出现时间的事实源。每条字幕代表一个语音信息点，画面文字、卡片、列表项和重点词必须按对应字幕时间逐步出现，不能在 scene 开始时整屏提前出现。

## 核心机制：RAF + revealMap

每个场景的 `<script>` 内跑一个 `requestAnimationFrame` 循环，每帧读 `audio.currentTime`，到点了就给 `#mount` 加上对应的 `reveal-*` class；CSS 里 `#mount.reveal-XX .element { animation: ... }` 命中，动画就跑。

**不依赖 `data-anim` / `data-beat-index` 之类属性**，全部靠 CSS class + JS 触发。

## 1. Beat 模型

每个 scene 的 beats 数组直接来自 SRT：

```js
var beats = [
  [0.0, 1.6, '这一句对应的字幕文字'],  // [localStart, localEnd, text]
  [1.6, 4.2, '下一句字幕文字'],
  [4.2, 8.0, '再下一句']
];
```

- `localStart / localEnd` 是相对场景起点的时间（scene 起始时间在 `scene-timing.json` 里给出）
- 全场景时间 = `SCENE_OFFSET + localStart`
- 视觉领先默认 `visualLead = 0.12s`（画面比语音早 120ms 出）

## 2. revealMap 元素绑定

`revealMap` 定义"哪个 class 触发哪个 beat"：

```js
var revealMap = [
  // [触发的 class 名, 所属 beat 索引, 提前秒数（负=提前）, 描述]
  ['reveal-eb',   0,  0.00, 'eyebrow 装饰标签'],
  ['reveal-t1',   1, -0.12, '主标题（提前 120ms）'],
  ['reveal-sub',  2, -0.15, '副标题（提前 150ms）']
];
```

对应 CSS 触发规则（**必须作用在子元素上**）：

```css
#mount.reveal-eb   .s1-eb    { animation: up-fade .5s ease-out both; }
#mount.reveal-t1   .s1-title { animation: scale-in .7s ease-out both; }
#mount.reveal-sub  .s1-sub   { animation: up-fade .5s ease-out both; }
```

装饰元素不跟语音走的处理方式：
- **不写进 `revealMap`** → 场景切入时立即显示（CSS 里不设 opacity:0 即可）
- 或者显式在 `revealMap` 里绑到 beat 0 且偏移 0（等同"场景开始时"）

## 3. 出现时机

| 元素类型 | 出现时间 |
|---|---|
| 背景、纹理、非语义装饰 | scene 开始 |
| 主标题 | 第一条 beat 的 `startTime - visualLead` |
| 卡片 / 列表项 / 关键词 | 对应 beat 的 `startTime - visualLead` |
| 总结句 | 最后一条 beat 的 `startTime - visualLead` |

**允许画面比语音早 0.08–0.18 秒**，让观众先看到关键词；**不允许提前超过 0.35 秒**。

## 4. 密集字幕策略

- 一个 scene 内 2-3 个 beat：逐条出现并保留在屏幕上
- 超过 3 个 beat：优先拆 scene；如果必须保留，用列表逐项 reveal
- 每个 beat 只承载一个信息点，不把整段字幕复制到每张卡片

## 5. 硬约束

- **元素初始状态**：所有需要动画揭示的元素 CSS 里必须 `opacity: 0`
- **CSS reveal 选择器**：`#mount.reveal-XX .element`，不要写成 `.reveal-XX`
- **beat 时间不能改**：`localStart / localEnd` 来自 SRT，不允许在场景里改写
- **提前不超过 0.35s**：`revealMap` 里第三个字段（提前秒数）绝对值 ≤ 0.35
- **不允许剧透**：第二/第三条 beat 的可见元素不能在第一条 beat 时间前出现

## 6. 完整示例

```html
<style>
  .s1-title { opacity: 0; font-size: 72px; }
  .s1-sub   { opacity: 0; font-size: 24px; }

  @keyframes up-fade { from{transform:translateY(20px);opacity:0} to{transform:translateY(0);opacity:1} }

  #mount.reveal-t1 .s1-title { animation: up-fade .6s ease-out both; }
  #mount.reveal-sub .s1-sub  { animation: up-fade .5s ease-out both; }
</style>

<h1 class="s1-title">主标题</h1>
<p class="s1-sub">副标题</p>

<script>
(function(){
  var SCENE_OFFSET = 0, SCENE_DUR = 5.0;
  var a = document.getElementById('audio-player'); if(!a) return;
  var beats = [[0, 2.5, '主标题'], [2.5, 5.0, '副标题']];
  var revealMap = [
    ['reveal-t1',  0, -0.12, 'title'],
    ['reveal-sub', 1, -0.10, 'sub']
  ];
  var revealed = {};
  function tick(){
    var t = a.currentTime - SCENE_OFFSET;
    if (t > 0 && t < SCENE_DUR) {
      for (var b=0; b<beats.length; b++) {
        var bs = beats[b][0];
        for (var r=0; r<revealMap.length; r++) {
          var item = revealMap[r];
          if (item[1] !== b || revealed[item[0]]) continue;
          if (t >= bs + item[2]) {
            revealed[item[0]] = true;
            document.getElementById('mount').classList.add(item[0]);
          }
        }
      }
    }
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
})();
</script>
```
