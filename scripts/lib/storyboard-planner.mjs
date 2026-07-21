import { inferSceneType, readableLength } from './text-analysis.mjs';
import { inferSemanticAction } from './visual-planning.mjs';
export function isStepStart(text) {
  return /^(第[一二三四五六七八九十\d]+|首先|第一|第二|第三|第四|第五|然后|接着|最后|最终|第一步|第二步|第三步|第四步)/.test(text.trim());
}

export function hasSemanticShift(previousText, nextText) {
  if (!previousText) return false;
  const previousType = inferSceneType(previousText);
  const nextType = inferSceneType(nextText);
  const previousAction = inferSemanticAction(previousText, previousType);
  const nextAction = inferSemanticAction(nextText, nextType);
  if (previousType !== nextType && ['data', 'process', 'code', 'comparison'].includes(nextType)) return true;
  if (previousAction !== nextAction && /^(但|但是|不过|而|所以|因此|问题是|关键是|换句话说|举个例子|比如|如果)/.test(nextText.trim())) return true;
  return false;
}

export function makeStoryboardGroup(items, groupIndex, reason) {
  const text = items.map(item => item.text).join('');
  const startTime = items[0]?.startTime || 0;
  const endTime = items[items.length - 1]?.endTime || startTime;
  const sceneType = inferSceneType(text);
  const semanticAction = inferSemanticAction(text, sceneType);
  const duration = endTime - startTime;
  const charCount = readableLength(text);
  const density = charCount > 92 || charCount / Math.max(0.1, duration) > 18
    ? 'overload'
    : charCount > 56 || charCount / Math.max(0.1, duration) > 11
      ? 'dense'
      : charCount < 18 && items.length === 1
        ? 'sparse'
        : 'balanced';
  return {
    id: `story_${String(groupIndex + 1).padStart(3, '0')}`,
    startTime,
    endTime,
    duration,
    sourceSegmentIndexes: items.map(item => item.sourceIndex),
    text,
    charCount,
    sceneType,
    semanticAction,
    density,
    layoutIntent:
      semanticAction === 'process' ? 'steps' :
      semanticAction === 'data-result' ? 'data-focus' :
      semanticAction === 'comparison' ? 'compare' :
      density === 'sparse' ? 'hero-statement' :
      density === 'dense' || density === 'overload' ? 'compressed-card' :
      'balanced-explainer',
    splitReason: reason
  };
}

export function buildStoryboardGroups(subtitles) {
  const groups = [];
  let pending = [];
  const flush = reason => {
    if (!pending.length) return;
    groups.push(makeStoryboardGroup(pending, groups.length, reason));
    pending = [];
  };

  for (const [index, sub] of subtitles.entries()) {
    const item = {
      sourceIndex: index,
      text: sub.text,
      startTime: sub.startTime,
      endTime: sub.endTime,
      duration: sub.duration
    };
    const pendingText = pending.map(s => s.text).join('');
    const pendingStart = pending[0]?.startTime ?? item.startTime;
    const nextText = `${pendingText}${item.text}`;
    const nextDuration = item.endTime - pendingStart;
    const nextChars = readableLength(nextText);
    const semanticShift = hasSemanticShift(pendingText, item.text);
    const forceBefore = pending.length > 0 && (
      isStepStart(item.text) ||
      semanticShift ||
      pending.length >= 3 ||
      nextDuration > 8 ||
      nextChars > 86 ||
      (nextChars > 56 && pending.length >= 2)
    );

    if (forceBefore) flush(isStepStart(item.text) ? 'new-step-or-section' : semanticShift ? 'semantic-shift' : 'density-limit');
    pending.push(item);

    const currentText = pending.map(s => s.text).join('');
    const currentDuration = item.endTime - (pending[0]?.startTime ?? item.startTime);
    if (readableLength(currentText) > 92 || currentDuration > 10) flush('overload-split');
  }

  flush('end');
  return groups;
}
