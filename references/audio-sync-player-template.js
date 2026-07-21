/**
 * 音频驱动场景切换播放器模板
 *
 * 用法:
 *   1. 用 scripts/build-timing-from-srt.mjs 生成 scene-timing.json
 *   2. 将本文件放在项目 assets/ 目录下
 *   3. 参考 index.html 模板（下方注释）引用
 *   4. 音频会自动播放，被拦截后点击页面任意位置激活
 *
 * 依赖: 无（纯原生 JS，无需第三方库）
 */

(async function(){
  /* ========== 配置 ========== */
  const TIMING_URL = 'scene-timing.json';       // 场景时间轴
  const SCENE_DIR = 'scenes/';                   // 场景 HTML 目录
  const SCENE_EXT = '.html';                     // 场景文件扩展名

  /* ========== 核心逻辑 ========== */
  const timingResp = await fetch(TIMING_URL);
  const SCENES = await timingResp.json();
  const total = SCENES.length;
  const audio = document.getElementById('audio-player');
  let idx = 0, lastIdx = -1, raf;
  const cache = new Map();

  // 预加载场景 HTML
  async function loadScene(i){
    const file = SCENES[i]?.scene;
    if(!file) return;
    const key = file + SCENE_EXT;
    if(cache.has(key)) return cache.get(key);
    try {
      const res = await fetch(SCENE_DIR + key);
      if(!res.ok) return;
      const html = await res.text();
      cache.set(key, html);
      return html;
    } catch(e){}
  }

  // 显示指定场景
  async function show(i){
    if(i < 0 || i >= total) return;
    idx = i;
    const mount = document.getElementById('mount');
    if(!mount) return;
    const html = await loadScene(i);
    if(html) mount.innerHTML = html;
    mount.className = mount.className || 'scene active';
    // 重新执行场景内脚本
    const scripts = mount.querySelectorAll('script');
    scripts.forEach(old => {
      const s = document.createElement('script');
      if(old.src) s.src = old.src;
      else s.textContent = old.textContent;
      old.parentNode.replaceChild(s, old);
    });
  }

  // 根据音频时间找当前场景
  function getSceneIndex(timeSec){
    for(let i = total - 1; i >= 0; i--){
      if(timeSec >= SCENES[i].start) return i;
    }
    return 0;
  }

  // 每帧检测
  function tick(){
    if(audio && !audio.paused){
      const t = audio.currentTime;
      const ci = getSceneIndex(t);
      if(ci !== lastIdx){ lastIdx = ci; show(ci); }
      if(t >= SCENES[total-1].end) audio.pause();
    }
    raf = requestAnimationFrame(tick);
  }

  // 跳转到指定场景
  function goTo(i){
    if(i < 0 || i >= total) return;
    show(i); lastIdx = i;
    audio.currentTime = SCENES[i].start;
  }

  // 键盘导航
  document.addEventListener('keydown', e => {
    if(e.key === ' '){
      e.preventDefault();
      if(audio.paused){
        if(audio.ended || audio.currentTime >= SCENES[total-1].end){
          audio.currentTime = 0;
          lastIdx = -1;
        }
        audio.play();
      } else {
        audio.pause();
      }
    }
    else if(e.key === 'ArrowRight' || e.key === 'PageDown'){
      e.preventDefault(); goTo(idx + 1);
    }
    else if(e.key === 'ArrowLeft' || e.key === 'PageUp'){
      e.preventDefault(); goTo(idx - 1);
    }
    else if(e.key === 'Home' || e.key === 'r' || e.key === 'R'){
      e.preventDefault();
      audio.currentTime = 0;
      lastIdx = -1;
      show(0);
    }
  });

  // 初始化
  const mount = document.getElementById('mount');
  if(mount && !mount.querySelector(':scope > *')) await show(0);

  // 自动播放（被拦截则点击页面激活）
  const tryPlay = () => {
    audio.currentTime = 0;
    lastIdx = -1;
    audio.play().catch(() => {
      const handler = () => {
        audio.play();
        document.removeEventListener('click', handler);
      };
      document.addEventListener('click', handler);
    });
  };
  tryPlay();

  // 启动检测循环
  raf = requestAnimationFrame(tick);
})();


/**
 * index.html 模板（参考）
 *
 * <!DOCTYPE html>
 * <html lang="zh-CN">
 * <head>
 *   <meta charset="UTF-8">
 *   <title>音画同步预览</title>
 *   <style>
 *     * { margin: 0; padding: 0; box-sizing: border-box; }
 *     html, body { width: 100%; height: 100%; overflow: hidden; background: #000; }
 *     .viewport { width: 100%; height: 100%; position: relative; }
 *     .scene { width: 100%; height: 100%; }
 *   </style>
 * </head>
 * <body>
 *   <div class="viewport">
 *     <div id="mount" class="scene"></div>
 *     <audio id="audio-player" preload="auto" autoplay>
 *       <source src="audio.mp3" type="audio/mpeg">
 *     </audio>
 *   </div>
 *   <script src="assets/audio-sync-player-template.js"></script>
 * </body>
 * </html>
 */
