# text-motion-skill

> 给一个主题（或一段 SRT 字幕），产出一个能在浏览器里播放的"网页版视频"：AI 写稿 + AI 配音 + AI 编排画面，最终可选导出 MP4。

一个用于 Trae / Claude 系 AI 编程助手的 **Skill**（技能包）。核心机制是 **RAF 咬合齿轮**——每一帧读 `audio.currentTime`，画面元素跟着口播节奏自动出场，不依赖任何外部动画引擎。

---

## ✨ 特性

- 🎬 **网页版视频** — 打开 `index.html` 就能播，无需剪辑软件
- 🗣️ **AI 配音** — 百度声音克隆，一句命令生成整段音频 + SRT + 场景时间轴
- 🎨 **31 套主题** — tech / business / cinematic / pitch-deck / cyber-neon…
- 🖼️ **3 种布局** — 全屏 / 人像居右 / 人像居中
- 📦 **组件库** — MICRO / MACRO / LAYOUTS / DECORATIONS 四类可复用组件
- 🎞️ **可选导出 MP4** — headless Chrome + CDP + FFmpeg（管道流 / 写文件 / gdigrab 三档兜底）

---

## 📁 目录结构

```
text-motion-skill/
├── SKILL.md               ← 完整技能协议（AI 读取入口）
├── 使用说明.md            ← 面向用户的快速使用说明
├── agents/openai.yaml     ← Skill 触发配置
├── scripts/               ← 12 个内置脚本（初始化、TTS、SRT 匹配、MP4 渲染、项目检查）
├── templates/             ← 3 套布局模板
├── themes/                ← 31 套风格主题
├── references/            ← 场景规范、口播稿规则、审美守则、组件库
└── projects/              ← 由技能生成的项目（本仓库已 gitignore）
```

---

## 🚀 快速开始

### 1. 环境依赖

- Node.js ≥ 22
- FFmpeg（加入 PATH）
- Chrome / Chromium（导出 MP4 时需要）

### 2. 安装

```bash
git clone https://github.com/<your-name>/text-motion-skill.git
cd text-motion-skill
npm install
```

### 3. 配置密钥

复制模板并填入你自己的 API Key：

```powershell
Copy-Item .env.local.example .env.local
notepad .env.local
```

`.env.local` 内容：

```env
# 百度语音合成（用于 AI 配音）
# 申请地址：https://console.bce.baidu.com/ai/#/ai/speech/app/list
BAIDU_API_KEY=your_baidu_api_key_here
BAIDU_SECRET=your_baidu_secret_here

# 百度克隆音色 ID（可选，缺省 114086）
VOICE_ID=114086

# pixazo VoxCPM（可选，用于 test-tts.mjs）
VOXCPM_API_KEY=your_voxcpm_key_here
```

> `.env.local` 已被 `.gitignore` 排除，不会上传到 GitHub。

### 4. 在 Trae 里挂载 Skill

把整个 `text-motion-skill/` 目录放到 Trae 的技能目录，或用 IDE 里的技能管理功能引用即可。

### 5. 触发使用

在 AI 对话里输入：

```
使用 text-motion-skill，
帮我做一个全屏模式的视频，
主题：AI 编程的三个陷阱，
风格：tech。
```

技能会引导你走完：**选布局 → 选主题 → 生成口播稿 → AI 配音 → 生成场景 → 预览 → 导出 MP4**。

---

## 🎛️ 三种布局

| 布局 | 适用 | 用户素材 | 预览端口 |
|---|---|---|---|
| `fullscreen` | 纯 AI 生成，无真人出镜 | 无 | 3009 |
| `portrait-right` | 用户口播，人像在右 | `portrait.mp4` | 3010 |
| `portrait-center` | 用户口播，人像居中全屏 | `background.mp4` | 3011 |

---

## 🎨 主题一览（31 套）

`academic-paper` · `ai-console` · `artistic` · `blueprint` · `business` · `case-study` · `checklist-card` · `cinematic-story` · `claude-cream` · `corporate-clean` · `creator-studio` · `cyber-neon` · `data-grid` · `editorial-magazine` · `energy` · `fashion` · `finance-terminal` · `healing-pastel` · `hologram-ui` · `minimal-board` · `nature` · `news-briefing` · `pitch-deck` · `premium-dark` · `professional` · `social-pop` · `tech` · `tool-review` · `viral-hook` · `warmth` · `warning-alert`

---

## 🔧 常用命令

```powershell
# 初始化项目
node scripts/init-project.mjs --theme tech --layout fullscreen

# 一站式 AI 配音（TTS + SRT + 场景时间轴）
node scripts/generate-full-audio.mjs --script "<projectRoot>/script-compressed.json"

# 只做 TTS
node scripts/generate-tts-audio.mjs --script "<projectRoot>/script-compressed.json"

# 从已有 SRT 生成场景时间轴
node scripts/build-timing-from-srt.mjs "<projectRoot>"

# 项目自检
node scripts/check-project.mjs "<projectRoot>"

# 导出 MP4（推荐 pipe 方案）
node scripts/render-mp4-pipe.mjs "<projectRoot>"
```

---

## 🔒 安全说明

- 所有脚本**不再硬编码任何 API Key**，统一从 `.env.local` 或环境变量读取
- `.env.local`、`node_modules/`、`projects/`、大文件（`*.mp4` / `*.mp3` / `*.wav`）均已在 `.gitignore` 排除
- 提交前请 `git status` 复查一次，防止误传敏感文件

---

## 📖 深入阅读

- [`SKILL.md`](./SKILL.md) — 完整技能协议
- [`references/scene-creator.md`](./references/scene-creator.md) — 写场景 HTML 的核心指引
- [`references/AESTHETIC_GUARDRAILS.md`](./references/AESTHETIC_GUARDRAILS.md) — 审美硬禁用清单
- [`references/SYNC_ENGINE.md`](./references/SYNC_ENGINE.md) — RAF 揭示原理和 beat 时间控制
- [`references/components/INDEX.md`](./references/components/INDEX.md) — 组件库索引

---

## � 联系

有任何问题或建议，欢迎联系：

- 微信：HgAiAgent（扫码添加，拉你进交流群）
- 邮箱：[szlihui801@gmail.com](mailto:szlihui801@gmail.com)

<img src="docs/wechat.png" width="200" alt="微信：HgAiAgent">

---

##  License

本项目采用 **[CC BY-NC 4.0](https://creativecommons.org/licenses/by-nc/4.0/deed.zh-hans)**（署名 - 非商业性使用 4.0 国际）协议开源。

- ✅ **允许**：自由使用、修改、分享、二次创作
- ✅ **要求**：署名原作者（huige-opc），并注明来源
- ❌ **禁止**：任何商业用途（含商业培训、付费课程、商业产品集成等）

如需商业授权，请通过上方联系方式与作者协商。

完整协议见 [LICENSE](./LICENSE)。
