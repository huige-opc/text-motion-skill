// Layout, transition, and sync constants for scene planning.
// 布局类型
export const LAYOUT_PATTERNS = {
  'center-title': { name: '居中标题', elements: ['accent-bar', 'headline', 'subhead'] },
  'stats-grid': { name: '数据统计', elements: ['stat-row', 'stat-number', 'stat-label'] },
  'card-grid': { name: '卡片网格', elements: ['card-grid-2', 'card', 'card-title'] },
  'center-card': { name: '居中卡片', elements: ['content-panel', 'headline', 'subhead'] },
  'list-items': { name: '列表项', elements: ['list-container', 'list-item', 'bullet'] },
  'big-stat': { name: '大数字', elements: ['big-number', 'big-label'] },
  'split-focus': { name: '左右焦点', elements: ['left-stack', 'right-panel', 'balance-rail'] },
  'timeline-rail': { name: '时间轴导轨', elements: ['timeline-rail', 'timeline-node', 'detail-panel'] }
};

export const LAYOUT_CAPS = {
  'center-title': { maxChars: 56, maxLines: 2, density: ['sparse', 'balanced'] },
  'big-stat': { maxChars: 26, maxLines: 1, density: ['sparse'] },
  'stats-grid': { maxChars: 64, maxLines: 2, density: ['sparse', 'balanced'] },
  'card-grid': { maxChars: 86, maxLines: 3, density: ['balanced', 'dense'] },
  'center-card': { maxChars: 92, maxLines: 3, density: ['sparse', 'balanced', 'dense'] },
  'list-items': { maxChars: 108, maxLines: 4, density: ['balanced', 'dense', 'overload'] },
  'split-focus': { maxChars: 94, maxLines: 3, density: ['balanced', 'dense'] },
  'timeline-rail': { maxChars: 104, maxLines: 4, density: ['balanced', 'dense', 'overload'] }
};

// 转场特效
// 2026-07 用户反馈：所有主题默认不要转场（直接 hard-cut）。
// 即不输出 chromatic-split、flash-through-white、smooth-slide 等有色差 / 滑动 / 散景效果的 scene-to-scene 过渡。
// 转场是用户明确禁用项，不保留环境变量绕过口。
export const TRANSITIONS = { none: { duration: 0 } };

export const SYNC_CONFIG = {
  strategy: 'srt-beat-reveal',
  visualLead: 0.12,
  maxLead: 0.35,
  minRevealGap: 0.18
};


