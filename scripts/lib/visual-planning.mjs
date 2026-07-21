export function inferSemanticAction(text, sceneType) {
  if (sceneType === 'data') return 'data-result';
  if (sceneType === 'process') return 'process';
  if (sceneType === 'code') return /步骤|操作|命令|流程|首先|然后/.test(text) ? 'process' : 'mechanism';
  if (/错误|失败|问题|修复|解决|避坑|风险/.test(text)) return 'error-fix';
  if (/如果|否则|条件|选择|判断|标准|阈值|筛选/.test(text)) return 'decision';
  if (/不是|而是|对比|相比|之前|之后|优点|缺点|取舍/.test(text)) return 'comparison';
  if (/定义|意思|本质|是什么|不是什么/.test(text)) return 'definition';
  if (/案例|证据|截图|文件|结果|证明|来源/.test(text)) return 'evidence';
  if (/公式|组成|输入|输出|组合|变量|因素/.test(text)) return 'formula';
  if (/章节|阶段|进度|当前|下一步/.test(text)) return 'chapter';
  if (/为什么|机制|原理|原因|导致|因为/.test(text)) return 'mechanism';
  return 'claim';
}

export function inferPrimaryVisualFamily(text, sceneType, semanticAction) {
  if (semanticAction === 'error-fix') return 'error';
  if (semanticAction === 'decision') return 'decision';
  if (semanticAction === 'comparison') return 'compare';
  if (semanticAction === 'definition') return 'definition';
  if (semanticAction === 'evidence') return 'evidence';
  if (semanticAction === 'formula') return 'formula';
  if (semanticAction === 'chapter') return 'chapter';
  if (semanticAction === 'data-result') return /趋势|变化|增长|下降|曲线|区间|波动/.test(text) ? 'chart' : 'data';
  if (semanticAction === 'process') return sceneType === 'code' ? 'sequence' : 'process';
  if (semanticAction === 'mechanism') return /转化|变成|从.*到/.test(text) ? 'transform' : 'concept';
  if (sceneType === 'social') return 'evidence';
  if (sceneType === 'map') return 'evidence';
  if (/清单|几个|三点|分类|类型/.test(text)) return 'list';
  return 'statement';
}

export function chooseLayoutVariant(family, sceneIndex) {
  const variants = {
    statement: ['cover-left-anchor', 'center-quote-lockup', 'cropped-keyword'],
    data: ['center-stat', 'left-stat-right-proof', 'bottom-metric-deck'],
    chart: ['right-chart-left-claim', 'full-bleed-chart', 'cropped-curve-marker'],
    process: ['horizontal-spine', 'stepped-rail', 'endpoint-emphasis'],
    timeline: ['alternating-axis', 'turning-point-focus', 'compressed-milestones'],
    list: ['ranked-column', 'hero-first-stack', 'editorial-feature-grid'],
    compare: ['vertical-split', 'asymmetric-35-65', 'winner-highlight'],
    concept: ['left-copy-orbit', 'center-orbit', 'layered-rings'],
    definition: ['term-left-breakdown', 'replacement-lockup', 'keyword-cutaway'],
    evidence: ['hero-file-proof', 'document-annotation', 'side-proof-board'],
    transform: ['scattered-to-block', 'split-before-after', 'funnel-compress'],
    rule: ['threshold-line', 'wrong-right-split', 'rule-lockup'],
    decision: ['forked-path', 'decision-diamond', 'funnel-shortlist'],
    error: ['symptom-scan', 'root-cause-lock', 'three-stage-fix'],
    formula: ['ingredient-grid-output', 'equation-rail', 'variable-spotlight'],
    sequence: ['command-rail', 'current-step-zoom', 'stacked-actions'],
    chapter: ['progress-rail', 'chapter-stack', 'current-island']
  };
  const list = variants[family] || variants.statement;
  return list[sceneIndex % list.length];
}

export function extractDominantObject(text, sceneType, family, visibleContent = []) {
  const compact = String(text || '').replace(/\s+/g, '').trim();
  const number = compact.match(/\d+(?:\.\d+)?%?|\d+倍/);
  if (number && ['data', 'chart'].includes(family)) return number[0];
  const step = compact.match(/(?:第一|第二|第三|首先|然后|接下来|最后)[^，。！？!?]{0,16}/);
  if (step && ['process', 'sequence'].includes(family)) return step[0];
  const keyword = compact.match(/(?:AI|Agent|Skill|模型|代码|流程|数据|增长|问题|方法|关键|结论)[^，。！？!?]{0,10}/i);
  if (keyword) return keyword[0];
  const firstVisible = visibleContent[0]?.text?.replace(/\s+/g, '').trim();
  if (firstVisible && ['statement', 'definition', 'evidence', 'concept', 'compare'].includes(family)) {
    return firstVisible.slice(0, Math.min(18, firstVisible.length));
  }
  return compact.slice(0, Math.min(18, compact.length));
}

export function buildVisualPlan(text, sceneType, sceneIndex, visibleContent) {
  const semanticAction = inferSemanticAction(text, sceneType);
  const primaryVisualFamily = inferPrimaryVisualFamily(text, sceneType, semanticAction);
  const layoutVariant = chooseLayoutVariant(primaryVisualFamily, sceneIndex);
  const dominantObject = extractDominantObject(text, sceneType, primaryVisualFamily, visibleContent);
  const supportingObjects = visibleContent
    .slice(1, 3)
    .map(item => item.text.replace(/\s+/g, '').slice(0, 18))
    .filter(Boolean);
  return {
    semanticAction,
    primaryVisualFamily,
    layoutVariant,
    dominantObject,
    supportingObjects,
    visualIntent: `${semanticAction} -> ${primaryVisualFamily}/${layoutVariant}; dominant=${dominantObject}`,
    qualityContract: {
      dominantObjectRequired: true,
      maxSupportingObjects: 2,
      semanticTextInSmallMeta: false,
      graphicMayBeUsed: !['statement', 'definition'].includes(primaryVisualFamily)
    }
  };
}

