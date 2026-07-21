# 剪辑轨道（Timeline Track）

模拟视频剪辑软件中的轨道 UI，含标尺、轨道条、播放头。

## 适用场景

展示传统视频剪辑流程、痛点场景中的轨道对比。

## HTML 结构

```html
<div class="timeline-ui">
  <!-- 标尺 -->
  <div class="tl-ruler">
    <span>0s</span><span>1s</span><span>2s</span><span>3s</span>
  </div>
  <!-- 轨道行 -->
  <div class="tl-track">
    <span class="tl-lb">V1</span>
    <div class="tl-body">
      <div class="tl-clip" style="left:4%;width:28%"></div>
      <div class="tl-clip" style="left:38%;width:18%"></div>
    </div>
  </div>
  <div class="tl-track">
    <span class="tl-lb">A1</span>
    <div class="tl-body">
      <div class="tl-clip aud" style="left:10%;width:70%"></div>
    </div>
  </div>
  <!-- 播放头 -->
  <div class="tl-playhead" id="sx-ph"></div>
</div>
```

## CSS

```css
.timeline-ui{position:relative;padding:4px 0}

.tl-ruler{display:flex;padding:0 2px 2px;border-bottom:1px solid rgba(107,104,98,0.05)}
.tl-ruler span{flex:1;font-size:9px;color:rgba(107,104,98,0.18);text-align:center}

.tl-track{display:flex;align-items:center;gap:4px;padding:3px 0;border-bottom:1px solid rgba(107,104,98,0.03)}
.tl-lb{flex:0 0 18px;font-size:10px;font-weight:700;color:rgba(107,104,98,0.25);text-align:center}
.tl-body{flex:1;height:12px;border-radius:3px;position:relative;background:rgba(107,104,98,0.02)}

.tl-clip{position:absolute;top:0;height:100%;border-radius:2px}
.tl-clip{background:rgba(107,104,98,0.14)}
.tl-clip.aud{background:rgba(97,197,84,0.2);height:8px;margin:1px 0}

/* 播放头 */
.tl-playhead{position:absolute;top:0;bottom:12px;width:2px;background:rgba(107,104,98,0.15);z-index:2;pointer-events:none;left:0%}
.tl-playhead::before{content:'';position:absolute;top:-3px;left:50%;transform:translateX(-50%);width:0;height:0;border-left:4px solid transparent;border-right:4px solid transparent;border-top:5px solid rgba(107,104,98,0.15)}
```

## Reveal 规则

```css
#mount.reveal-timeline .tl-ruler{animation:up-fade .4s ease-out both}
#mount.reveal-timeline .tl-track{animation:up-fade .4s ease-out both}
#mount.reveal-timeline .tl-track:nth-child(2){animation-delay:0.1s}
#mount.reveal-timeline .tl-track:nth-child(3){animation-delay:0.2s}
```
