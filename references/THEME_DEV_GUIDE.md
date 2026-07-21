# 自定义主题开发指南

三步添加一个新主题到技能库。

## 1. 创建主题文件

在 `themes/` 下建目录，放两个文件：

```
themes/{theme-id}/
├── theme.json    # 元数据
└── tokens.css    # CSS 变量
```

### theme.json

```json
{
  "id": "claude-cream",
  "nameZh": "Claude 奶油",
  "nameEn": "Claude Cream",
  "mood": "温暖、亲和、干净、工具感",
  "keywords": ["奶油", "淡暖米", "陶土橙"],
  "colors": {
    "primary": "#C15F3C",
    "secondary": "#E8A96A",
    "accent": "#8B6E48",
    "background": "#FAF9F5",
    "backgroundGradient": "none",
    "text": "#1F1E1D",
    "textMuted": "#6B6862"
  },
  "background": ""
}
```

`background` 指向 `assets/theme-backgrounds/` 下的图片。如果主题是纯 CSS 背景，留空字符串。

### tokens.css

使用 `--hf-*` 前缀的 CSS 变量，可参考已有主题。

## 2. 注册主题

编辑 `scripts/lib/installed-extended-themes.mjs`，在 `INSTALLED_EXTENDED_THEME_CONFIGS` 中添加：

```js
"claude-cream": {
  "name": "Claude Cream",
  "colors": {
    "primary": "#C15F3C",
    "secondary": "#E8A96A",
    "accent": "#8B6E48",
    "bg": "#FAF9F5"
  },
  "font": "暖调无衬线 + 陶土橙点缀 + 米色底纹",
  "easing": "ease-out-cubic",
  "entrance": "float-up",
  "ambient": "cream-grid-drift",
  "transitions": ["none"],
  "layouts": ["center-title","stats-grid","card-grid","split-focus","timeline-rail"]
}
```

## 3. 添加渐变配置（可选）

编辑 `scripts/lib/theme-configs.mjs`，在 `THEME_GRADIENTS` 中添加：

```js
"claude-cream": "none"
```

如果主题无背景图片（纯 CSS 背景），还需修改 `init-project.mjs` 中背景图复制逻辑，跳过 `bgFileName` 为空的情况（v4.0.490+ 已处理）。

## 4. 验证

```powershell
node scripts/init-project.mjs --srt-path "测试.srt" --theme "{theme-id}" --aspect-ratio "16:9"
```

初始化成功即注册生效。
