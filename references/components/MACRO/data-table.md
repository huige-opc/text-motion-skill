# 数据表动效（Data Table�?
带行逐出、列高亮、数字滚动、内嵌进度条的数据表格�?
## 适用场景

展示对比数据、指标列表、排名、功能对照表�?
## HTML 结构

```html
<table class="dtable">
  <thead>
    <tr>
      <th>指标</th>
      <th class="hl">传统方式</th>
      <th class="hl">AI 方式</th>
    </tr>
  </thead>
  <tbody>
    <tr class="dtr">
      <td class="dth">耗时</td>
      <td>2 小时</td>
      <td class="accel">15 分钟 <span class="dt-arrow">�?/span></td>
    </tr>
    <tr class="dtr">
      <td class="dth">成本</td>
      <td>$500</td>
      <td class="accel">$50 <span class="dt-arrow">�?/span></td>
    </tr>
    <tr class="dtr">
      <td class="dth">质量</td>
      <td>⭐⭐</td>
      <td class="accel">⭐⭐⭐⭐�?<span class="dt-arrow">�?/span></td>
    </tr>
  </tbody>
</table>
```

## CSS

```css
.dtable{width:100%;border-collapse:collapse;font-size:20px}
.dtable th{padding:14px 20px;text-align:left;font-weight:700;color:var(--hf-title-color);border-bottom:2px solid color-mix(in srgb, var(--hf-text-muted,#6B6862) 12%, transparent);background:rgba(255,255,255,0.5)}
.dtable th.hl{color:var(--hf-primary);border-bottom-color:var(--hf-primary)}
.dtable td{padding:12px 20px;border-bottom:1px solid color-mix(in srgb, var(--hf-text-muted,#6B6862) 12%, transparent);color:var(--hf-subtitle-color)}
.dtable .dth{font-weight:600;color:var(--hf-title-color);white-space:nowrap}

/* 高亮�?*/
.dtable .accel{color:var(--hf-primary);font-weight:700}
.dt-arrow{display:inline-block;margin-left:4px;font-size:14px}

/* 高亮行上下交�?*/
.dtable tr.highlight{background:rgba(193,95,60,0.04)}
.dtable tr.highlight td{color:var(--hf-title-color);font-weight:600}
```

## Reveal 规则

### 逐行入场（stagger�?
```css
/* 表头先出�?*/
#mount.reveal-th th{animation:up-fade 0.3s var(--ease-smooth) both}
#mount.reveal-th th:nth-child(2){animation-delay:0.08s}
#mount.reveal-th th:nth-child(3){animation-delay:0.16s}

/* 数据行逐行弹入 */
#mount.reveal-tr .dtr{animation:up-fade 0.4s var(--ease-smooth) both}
#mount.reveal-tr .dtr:nth-child(1){animation-delay:0s}
#mount.reveal-tr .dtr:nth-child(2){animation-delay:0.12s}
#mount.reveal-tr .dtr:nth-child(3){animation-delay:0.24s}
```

### 列高亮（从左到右�?
```css
@keyframes col-sweep{
  from{background-position:0 0}
  to{background-position:var(--cs-x, 200px) 0}
}

#mount.reveal-col .dtable td:nth-child(2){
  background:linear-gradient(90deg, rgba(193,95,60,0.04), transparent) no-repeat;
  background-size:var(--cs-x,200px) 100%;
  animation:col-sweep 0.6s ease-out both;
}
#mount.reveal-col .dtable td:nth-child(3){
  background:linear-gradient(90deg, rgba(193,95,60,0.06), transparent) no-repeat;
  background-size:200px 100%;
  animation:col-sweep 0.6s ease-out 0.2s both;
}
```

### 内嵌进度�?
```html
<td><div class="dt-bar"><div class="dt-fill" style="width:85%"></div></div></td>
```

```css
.dt-bar{width:100%;height:8px;background:rgba(107,104,98,0.06);border-radius:4px;overflow:hidden}
.dt-fill{height:100%;background:linear-gradient(90deg,var(--hf-primary),var(--hf-secondary));border-radius:4px;transform:scaleX(0);transform-origin:left;width:var(--dt-w,100%)}

#mount.reveal-dtbar .dt-fill{
  animation:scale-x 0.5s ease-in-out both;
}
```

## 参数

| 属�?| 建议�?|
|------|--------|
| 行入�?| 0.4s, 错开 0.12s |
| 列高�?| 0.6s |
| 进度�?| 0.5s ease-in-out |
