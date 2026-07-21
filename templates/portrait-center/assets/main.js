/* =============================================================
 * Huige AI · Player Main (模板版 v3) — portrait-center
 * 音频驱动场景切换 + 键盘导航 + 共享 RAF 动画助手
 * ============================================================= */
(async function(){
  const timingResp = await fetch('scene-timing.json');
  const SCENES = await timingResp.json();
  const total = SCENES.length;
  const audio = document.getElementById('audio-player');
  let idx = 0, lastIdx = -1, raf;
  const cache = new Map();
  let mount = document.getElementById('mount');
  const viewport = document.getElementById('viewport');
  let seeking = false;

  const AX = {
    ease: p => 1 - Math.pow(1 - p, 3),
    easeOutBack: p => { const c1=1.70158,c3=c1+1; return 1+c3*Math.pow(p-1,3)+c1*Math.pow(p-1,2); },
    fadeUp(el, dur, offY){
      if(!el) return;
      dur = dur||500; offY = offY==null?14:offY;
      const t0 = performance.now();
      function step(t){
        const p = Math.min(1,(t-t0)/dur), e = AX.ease(p);
        el.style.opacity = e;
        el.style.transform = 'translateY(' + (offY*(1-e)) + 'px)';
        if(p<1) requestAnimationFrame(step);
      }
      requestAnimationFrame(step);
    },
    pop(el, dur){
      if(!el) return;
      dur = dur||500;
      const t0 = performance.now();
      function step(t){
        const p = Math.min(1,(t-t0)/dur), e = AX.easeOutBack(p);
        el.style.opacity = Math.min(1,p*1.5);
        el.style.transform = 'scale(' + (0.85 + 0.15*e) + ')';
        if(p<1) requestAnimationFrame(step);
      }
      requestAnimationFrame(step);
    },
    scaleX(el, dur){
      if(!el) return;
      dur = dur||550;
      const t0 = performance.now();
      function step(t){
        const p = Math.min(1,(t-t0)/dur), e = AX.ease(p);
        el.style.transform = 'scaleX(' + e + ')';
        if(p<1) requestAnimationFrame(step);
      }
      requestAnimationFrame(step);
    },
    countUp(el, to, dur, suffix){
      if(!el) return;
      dur = dur||900; suffix = suffix||'';
      const t0 = performance.now();
      function step(t){
        const p = Math.min(1,(t-t0)/dur), e = AX.ease(p);
        const v = to % 1 !== 0 ? (to*e).toFixed(1) : Math.floor(to*e);
        el.textContent = v + suffix;
        if(p<1) requestAnimationFrame(step);
        else el.textContent = to + suffix;
      }
      requestAnimationFrame(step);
    },
    stagger(nodeList, gap, fn){
      gap = gap||120;
      nodeList.forEach((el,i)=> setTimeout(()=>fn(el), i*gap));
    }
  };
  window.AX = AX;

  async function loadScene(i){
    const file = SCENES[i]?.scene;
    if(!file) return;
    const key = file + '.html';
    if(cache.has(key)) return cache.get(key);
    try {
      const res = await fetch('scenes/' + key, {cache:'no-store'});
      if(!res.ok) return;
      const html = await res.text();
      cache.set(key, html);
      return html;
    } catch(e){}
  }

  async function show(i){
    if(i < 0 || i >= total) return;
    idx = i;
    const html = await loadScene(i);
    if(html) mount.innerHTML = html;
    mount.className = 'scene active grid-bg';
    const scripts = mount.querySelectorAll('script');
    scripts.forEach(old => {
      const s = document.createElement('script');
      if(old.src) s.src = old.src;
      else s.textContent = old.textContent;
      old.parentNode.replaceChild(s, old);
    });
  }

  function getIdx(t){
    for(let i = total - 1; i >= 0; i--) if(t >= SCENES[i].start) return i;
    return 0;
  }

  function tick(){
    if(!seeking && audio && !audio.paused){
      const t = audio.currentTime;
      const ci = getIdx(t);
      if(ci !== lastIdx){ lastIdx = ci; show(ci); }
      if(t >= SCENES[total-1].end) audio.pause();
    }
    raf = requestAnimationFrame(tick);
  }

  document.addEventListener('keydown', e => {
    if(e.key === ' '){
      e.preventDefault();
      if(audio.paused){
        if(audio.ended || audio.currentTime >= SCENES[total-1].end){
          audio.currentTime = 0; lastIdx = -1;
        }
        audio.play();
      } else audio.pause();
    }
    else if(e.key === 'ArrowRight' || e.key === 'PageDown' || e.key === 'n' || e.key === 'N'){
      e.preventDefault();
      const seeking = true;
      const wasPlaying = !audio.paused;
      if(wasPlaying) audio.pause();
      audio.currentTime = SCENES[Math.min(idx+1,total-1)].start;
      lastIdx = idx+1; if(idx+1 < total) show(idx+1);
      if(wasPlaying) audio.play().catch(()=>{});
    }
    else if(e.key === 'ArrowLeft' || e.key === 'PageUp' || e.key === 'p' || e.key === 'P'){
      e.preventDefault();
      const seeking = true;
      const wasPlaying = !audio.paused;
      if(wasPlaying) audio.pause();
      audio.currentTime = SCENES[Math.max(idx-1,0)].start;
      lastIdx = idx-1; if(idx-1 >= 0) show(idx-1);
      if(wasPlaying) audio.play().catch(()=>{});
    }
    else if(e.key === 'Home' || e.key === 'r' || e.key === 'R'){
      e.preventDefault();
      audio.currentTime = 0; lastIdx = -1;
      show(0);
    }
  });

  await show(0);
  for(let i = 0; i < total; i++){ loadScene(i); }

  if(viewport){
    viewport.addEventListener('click', () => {
      if(audio.paused){
        audio.currentTime = 0;
        idx = 0; lastIdx = 0;
        show(0).then(() => audio.play().catch(()=>{}));
      } else audio.pause();
    });
  }

  window.addEventListener('load', () => { window.focus(); });
  document.body.tabIndex = -1;
  document.body.focus();
  raf = requestAnimationFrame(tick);
})();
