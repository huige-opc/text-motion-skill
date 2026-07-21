import { THEME_CONFIGS } from './theme-configs.mjs';
import { LAYOUT_PATTERNS, LAYOUT_CAPS } from './layout-configs.mjs';
import { readableLength } from './text-analysis.mjs';
export function measureLayoutHealth(text, segments, duration) {
  const charCount = readableLength(text);
  const segmentCount = segments.length;
  const charsPerSecond = duration > 0 ? charCount / duration : charCount;
  let density = 'balanced';
  if (charCount < 18 && duration >= 3) density = 'sparse';
  if (charCount > 56 || segmentCount >= 3 || charsPerSecond > 13) density = 'dense';
  if (charCount > 92 || charsPerSecond > 16) density = 'overload';

  const visualDensity = Math.max(0.38, Math.min(0.92, (charCount / 120) + (segmentCount * 0.055)));
  const maxLines = density === 'sparse' ? 2 : density === 'balanced' ? 3 : 4;
  const maxTextWidth = density === 'sparse' ? 0.72 : density === 'balanced' ? 0.78 : 0.84;
  const safePadding = density === 'dense' || density === 'overload'
    ? { x: 144, y: 84 }
    : { x: 176, y: 96 };

  return {
    charCount,
    segmentCount,
    charsPerSecond: Number(charsPerSecond.toFixed(2)),
    density,
    visualDensity: Number(visualDensity.toFixed(2)),
    maxLines,
    maxTextWidth,
    safePadding,
    needsSplit: charCount > 110 || charsPerSecond > 18,
    needsCompression: charCount > 72 || segmentCount >= 3,
    balance: {
      targetContentWidth: density === 'sparse' ? [0.36, 0.58] : [0.48, 0.72],
      targetContentHeight: density === 'sparse' ? [0.24, 0.44] : [0.34, 0.62],
      targetCenterX: [0.43, 0.58],
      targetCenterY: [0.38, 0.58],
      avoidDeadRight: true,
      avoidTopHeavy: true
    },
    notes: [
      visualDensity < 0.35 ? 'add-light-structure' : null,
      visualDensity > 0.78 ? 'reduce-decoration' : null,
      charCount > 56 ? 'avoid-center-title' : null,
      charCount > 92 ? 'prefer-list-or-split' : null,
      segmentCount >= 3 ? 'balance-left-right-zones' : null
    ].filter(Boolean)
  };
}

export function layoutAllowed(layout, health) {
  const caps = LAYOUT_CAPS[layout];
  if (!caps) return true;
  if (!caps.density.includes(health.density)) return false;
  return health.charCount <= caps.maxChars || layout === 'list-items';
}

export function chooseAllowedLayout(preferred, candidates, previousLayout, health) {
  const ordered = [preferred, ...candidates, 'center-card', 'list-items']
    .filter(Boolean)
    .filter((value, index, list) => list.indexOf(value) === index)
    .filter(layout => layout !== previousLayout);
  return ordered.find(layout => layoutAllowed(layout, health))
    || ordered.find(layout => layout !== previousLayout)
    || preferred;
}

export function inferLayout(text, themeId, sceneIndex, previousLayout, health) {
  const config = THEME_CONFIGS[themeId] || THEME_CONFIGS.professional;
  const layouts = [...config.layouts, 'center-card', 'list-items'].filter((value, index, list) => list.indexOf(value) === index);

  const hasNumber = /\d+/.test(text);
  const isLongText = text.length > 40;
  const isList = /[1-9]、|第一|其次|首先|然后/.test(text);

  const choose = preferred => chooseAllowedLayout(preferred, layouts, previousLayout, health);

  if ((health.density === 'dense' || health.density === 'overload') && !isList && !hasNumber) {
    const denseCycle = ['split-focus', 'timeline-rail', 'list-items', 'card-grid', 'center-card'];
    const preferred = health.charCount > 86 ? denseCycle[(sceneIndex + 1) % denseCycle.length] : denseCycle[sceneIndex % denseCycle.length];
    const layout = choose(preferred);
    return { layout, elements: LAYOUT_PATTERNS[layout].elements };
  }
  if (hasNumber && text.length < 50 && health.density !== 'overload') {
    const layout = choose(text.length < 15 ? 'big-stat' : 'stats-grid');
    return { layout, elements: LAYOUT_PATTERNS[layout].elements };
  }
  if (isList) {
    const layout = choose('list-items');
    return { layout, elements: LAYOUT_PATTERNS[layout].elements };
  }
  if (isLongText && text.length < 100) {
    const layout = choose('card-grid');
    return { layout, elements: LAYOUT_PATTERNS[layout].elements };
  }
  const candidates = layouts.filter(layout => layout !== previousLayout && layoutAllowed(layout, health));
  const layout = candidates[sceneIndex % candidates.length] || layouts[0];
  return { layout, elements: LAYOUT_PATTERNS[layout].elements };
}
