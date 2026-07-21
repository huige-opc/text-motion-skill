# 连接线绘制（Connector Line）

元素之间的连接线，从起点水平展开到终点。

## 适用场景

流程图、步骤连接、元素关系示意。

## HTML 结构

```html
<div class="connector" id="sx-cl1" style="left:33%;top:50%;width:30px"></div>
```

## CSS

```css
.connector{
  position:absolute;height:2px;
  background:rgba(193,95,60,0.12);
  transform:scaleX(0);transform-origin:left;
  z-index:0;pointer-events:none;
}
```

## Reveal 规则

```css
#mount.reveal-conn .connector{
  animation:scale-x var(--dur-normal,0.4s) ease-in-out both;
}
```

## 参数

| 属性 | 建议值 |
|------|--------|
| 高度 | 2px |
| 颜色 | `rgba(193,95,60,0.12)` |
| 时长 | 0.4s |
