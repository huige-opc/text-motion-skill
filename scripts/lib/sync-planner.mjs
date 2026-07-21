import { SYNC_CONFIG } from './layout-configs.mjs';
export function inferBeatRole(index, count, text) {
  if (count === 1) return 'headline';
  if (index === 0) return 'headline';
  if (index === count - 1 && /最后|总结|所以|因此|结论|关键/.test(text)) return 'summary';
  if (/^\s*(?:[1-9][、.．]|第[一二三四五六七八九十]|首先|然后|其次|接下来|最后)/.test(text)) return 'step';
  if (/\d+(?:\.\d+)?%|\d+倍|\d+/.test(text)) return 'metric';
  return 'detail';
}

export function buildSyncBeats(sceneSubtitles, sceneStartTime, sceneEndTime) {
  let previousReveal = sceneStartTime;
  return sceneSubtitles.map((segment, index) => {
    const rawReveal = Math.max(sceneStartTime, segment.startTime - SYNC_CONFIG.visualLead);
    const revealTime = index === 0
      ? rawReveal
      : Math.max(rawReveal, previousReveal + SYNC_CONFIG.minRevealGap);
    previousReveal = Math.min(revealTime, Math.max(sceneStartTime, sceneEndTime - 0.05));
    return {
      id: `beat_${String(index + 1).padStart(3, '0')}`,
      text: segment.text,
      startTime: segment.startTime,
      endTime: segment.endTime,
      duration: segment.duration,
      revealTime: Number(previousReveal.toFixed(3)),
      localStart: Number((segment.startTime - sceneStartTime).toFixed(3)),
      localEnd: Number((segment.endTime - sceneStartTime).toFixed(3)),
      localReveal: Number((previousReveal - sceneStartTime).toFixed(3)),
      role: inferBeatRole(index, sceneSubtitles.length, segment.text)
    };
  });
}

export function buildVisibleContent(sceneSubtitles) {
  return sceneSubtitles.map((segment, index) => ({
    text: segment.text,
    sourceSegments: [index],
    role: index === 0 ? 'headline' : 'support'
  }));
}

export function buildFocusPlan(sceneSubtitles) {
  return sceneSubtitles.map((segment, index) => ({
    segments: [index],
    target: index === 0 ? 'primary-visual' : `beat-${String(index + 1).padStart(2, '0')}`,
    action: index === 0 ? 'establish' : 'reveal-support'
  }));
}

