# 手动录屏兜底方案（OBS + FFmpeg）

当 `scripts/render-mp4.mjs`（CDP 自动化）在你机器上跑不通时，用这个手动流程兜底。

## 方案 A：OBS Studio 录窗口（推荐兜底）

### 一次性准备

1. 装 OBS Studio（免费）：https://obsproject.com/
2. 首次启动跑一遍自动配置向导，选"仅录制"
3. 设置 → 输出：格式 mkv、编码器 x264、码率控制 CQP、CQ 值 20
4. 设置 → 视频：基础/输出分辨率都设为 `1920x1080`，帧率 30

### 录制步骤

```powershell
# 1. 起本地服务
cd "d:\AI_bian_cheng\trae\projects\text-video-20260720-001"
python -m http.server 3009
```

2. 用 Chrome 打开 `http://localhost:3009/`
3. **F11 全屏**（让画面撑满，避免录到浏览器 UI）
4. OBS 里"来源"添加"窗口捕获"→ 选 Chrome
5. OBS 里"来源"添加"音频输出捕获"→ 选默认设备（录浏览器声音）
6. 点 OBS 的"开始录制"
7. 网页里点播放按钮
8. 播完自动结束，点 OBS 的"停止录制"
9. 录得 `output.mkv`（在 OBS 默认输出目录，通常是 `%USERPROFILE%\Videos\`）

### 后期转封装成 MP4

```powershell
# 只转封装不转码，秒完成，无损
ffmpeg -i output.mkv -c copy output.mp4

# 或者裁头尾（比如去掉开头 1 秒和结尾 0.5 秒）
ffmpeg -ss 1.0 -to <总时长-0.5> -i output.mkv -c copy output.mp4
```

---

## 方案 B：FFmpeg gdigrab 前台录（无需装 OBS）

Windows 自带 gdigrab，直接一行命令录当前屏幕。

### 准备

```powershell
# 1. 起服务
cd "d:\AI_bian_cheng\trae\projects\text-video-20260720-001"
python -m http.server 3009
```

2. Chrome 打开 `http://localhost:3009/`，**F11 全屏**
3. 立刻切回 PowerShell（不要点其他窗口，保持 Chrome 在前台）

### 录制命令

```powershell
# 参数：
#   -t <秒>       总时长（从 scene-timing.json 最后一个 endTime 读）
#   -framerate 30 帧率
#   -offset_x/y   录制起点（0,0 = 屏幕左上）
#   -video_size   录制分辨率
$duration = 60  # 从 scene-timing.json 手动填
ffmpeg `
  -f gdigrab -framerate 30 -offset_x 0 -offset_y 0 -video_size 1920x1080 -i desktop `
  -f dshow -i audio="立体声混音 (Realtek Audio)" `
  -c:v libx264 -pix_fmt yuv420p -preset medium -crf 20 `
  -c:a aac -b:a 192k `
  -t $duration `
  output.mp4
```

### 找音频设备名

```powershell
ffmpeg -list_devices true -f dshow -i dummy
```

从输出里找 audio devices，把设备名填到 `audio="..."` 里。如果没启用"立体声混音"，去 Win 系统设置 → 声音 → 录制设备里启用它。

### 手动触发播放的时机

因为 gdigrab 是"命令启动 → 立刻开录"的，需要你**同时**：
- 敲回车启动 ffmpeg
- 立刻切到 Chrome 点播放

如果对齐不精准，可以：
```powershell
# 加 3 秒黑场缓冲，后期用 -ss 3 剪掉开头
ffmpeg -ss 3 -i output.mp4 -c copy final.mp4
```

---

## 方案 A vs 方案 B

| | 方案 A (OBS) | 方案 B (gdigrab) |
|---|---|---|
| 装依赖 | 装 OBS | 只要 FFmpeg |
| 精准度 | 可视化开始/停止，容易 | 依赖手速切窗口 |
| 音频对齐 | OBS 直接抓 Chrome 音频 | 需要立体声混音 |
| 推荐场景 | 常规交付 | 快速一次性录 |

---

## 什么时候用这个兜底

- Chrome 版本太老，CDP 不兼容
- Windows 系统装不了 `chrome-remote-interface`（npm 网络问题）
- headless 里字体渲染跟前台不一致（比如中文字体路径问题）
- Chrome headless 出的画面 CSS 支持有异常
- 想要"所见即所得"式的录制（前台可见 = 录到什么）

---

## 排障

**Q：录出来没声音？**
- OBS：确认"音频输出捕获"选的是浏览器所在的设备，且不是静音的
- FFmpeg gdigrab：确认"立体声混音"已启用，dshow 设备名对得上

**Q：录出来画面卡顿？**
- OBS：设置 → 输出 → 编码器改 NVENC (h264) 走显卡编码
- FFmpeg：把 `-preset medium` 改成 `-preset veryfast`

**Q：想录 4K/60fps？**
- 都支持，改 `-video_size` 和 `-framerate` 参数即可
- 注意磁盘占用和 CPU/GPU 负载会显著上升
