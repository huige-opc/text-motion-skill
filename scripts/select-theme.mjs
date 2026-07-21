#!/usr/bin/env node
/**
 * 主题自动选择脚本
 * 根据 SRT 内容分析，自动匹配合适的主题
 */

import { readFileSync } from 'fs';
import { parseSRT } from './parse-srt.mjs';
import { ALL_THEME_IDS } from './lib/theme-configs.mjs';

// 关键词权重表
const KEYWORD_WEIGHTS = {
  "tech": {
    "high": [
      "AI",
      "人工智能",
      "数字化",
      "代码",
      "数据",
      "算法",
      "模型",
      "科技",
      "未来",
      "智能",
      "数字",
      "网络",
      "技术",
      "软件",
      "硬件"
    ],
    "medium": []
  },
  "business": {
    "high": [
      "增长",
      "业绩",
      "财富",
      "商业",
      "品牌",
      "战略",
      "投资",
      "企业",
      "公司",
      "产品",
      "市场",
      "客户",
      "盈利",
      "收入"
    ],
    "medium": []
  },
  "nature": {
    "high": [],
    "medium": []
  },
  "fashion": {
    "high": [],
    "medium": []
  },
  "warmth": {
    "high": [],
    "medium": []
  },
  "professional": {
    "high": [
      "教育",
      "培训",
      "学习",
      "知识",
      "方法",
      "咨询",
      "专业",
      "技能",
      "经验",
      "方案",
      "解决",
      "课程",
      "教学"
    ],
    "medium": []
  },
  "energy": {
    "high": [],
    "medium": []
  },
  "artistic": {
    "high": [],
    "medium": []
  },
  "cyber-neon": {
    "high": [
      "赛博",
      "霓虹",
      "未来感",
      "酷炫科技",
      "年轻化科技"
    ],
    "medium": [
      "元宇宙"
    ]
  },
  "ai-console": {
    "high": [
      "Agent",
      "Codex",
      "Claude Code",
      "终端",
      "自动执行",
      "任务队列"
    ],
    "medium": [
      "代码执行",
      "工作流"
    ]
  },
  "data-grid": {
    "high": [
      "数据分析",
      "趋势",
      "指标",
      "算法",
      "图表",
      "增长曲线"
    ],
    "medium": [
      "看板",
      "统计"
    ]
  },
  "hologram-ui": {
    "high": [
      "全息",
      "概念产品",
      "未来产品",
      "智能硬件",
      "发布会"
    ],
    "medium": [
      "未来界面"
    ]
  },
  "corporate-clean": {
    "high": [
      "企业",
      "B2B",
      "官网",
      "公司介绍",
      "解决方案",
      "产品方案"
    ],
    "medium": [
      "可信",
      "合作"
    ]
  },
  "premium-dark": {
    "high": [
      "高端",
      "高级",
      "发布会",
      "品牌升级",
      "咨询",
      "高价值"
    ],
    "medium": [
      "精品",
      "高客单"
    ]
  },
  "finance-terminal": {
    "high": [
      "金融",
      "投资",
      "财报",
      "市场数据",
      "行情",
      "收益"
    ],
    "medium": [
      "价格",
      "股票"
    ]
  },
  "pitch-deck": {
    "high": [
      "路演",
      "融资",
      "BP",
      "创业",
      "项目介绍",
      "商业计划"
    ],
    "medium": [
      "里程碑",
      "方案展示"
    ]
  },
  "blueprint": {
    "high": [
      "教程",
      "步骤",
      "手把手",
      "SOP",
      "流程",
      "脚本"
    ],
    "medium": [
      "Skill",
      "制作方法"
    ]
  },
  "minimal-board": {
    "high": [
      "概念",
      "框架",
      "解释",
      "总结",
      "白板",
      "极简"
    ],
    "medium": [
      "知识点",
      "方法论"
    ]
  },
  "academic-paper": {
    "high": [
      "论文",
      "研究",
      "报告",
      "学术",
      "引用",
      "实验"
    ],
    "medium": [
      "结论",
      "严肃科普"
    ]
  },
  "checklist-card": {
    "high": [
      "清单",
      "检查表",
      "步骤",
      "SOP",
      "收藏",
      "方法清单"
    ],
    "medium": [
      "避坑列表",
      "操作指南"
    ]
  },
  "creator-studio": {
    "high": [
      "自媒体",
      "剪辑",
      "脚本",
      "素材",
      "视频制作",
      "剪映"
    ],
    "medium": [
      "创作者",
      "内容生产"
    ]
  },
  "editorial-magazine": {
    "high": [
      "观点",
      "审美",
      "杂志",
      "专题",
      "人物",
      "趋势"
    ],
    "medium": [
      "图文",
      "表达"
    ]
  },
  "news-briefing": {
    "high": [
      "新闻",
      "快讯",
      "盘点",
      "大事件",
      "更新",
      "版本"
    ],
    "medium": [
      "发布",
      "资讯"
    ]
  },
  "tool-review": {
    "high": [
      "测评",
      "对比",
      "哪个好",
      "推荐",
      "优缺点",
      "模型清单"
    ],
    "medium": [
      "插件",
      "工具"
    ]
  },
  "case-study": {
    "high": [
      "案例",
      "复盘",
      "拆解",
      "结果",
      "证据",
      "前后对比"
    ],
    "medium": [
      "项目",
      "实战"
    ]
  },
  "healing-pastel": {
    "high": [
      "治愈",
      "心理",
      "成长",
      "女性向",
      "轻情绪",
      "温柔"
    ],
    "medium": [
      "自我提升",
      "疗愈"
    ]
  },
  "cinematic-story": {
    "high": [
      "故事",
      "叙事",
      "人物",
      "纪录",
      "悬念",
      "经历"
    ],
    "medium": [
      "回顾",
      "深度"
    ]
  },
  "warning-alert": {
    "high": [
      "避坑",
      "风险",
      "错误",
      "不建议",
      "警示",
      "注意"
    ],
    "medium": [
      "别这样",
      "失败"
    ]
  },
  "social-pop": {
    "high": [
      "抖音",
      "小红书",
      "种草",
      "社媒",
      "爆款",
      "互动"
    ],
    "medium": [
      "轻知识",
      "评论"
    ]
  },
  "viral-hook": {
    "high": [
      "钩子",
      "爆款",
      "开头",
      "反差",
      "强观点",
      "转化"
    ],
    "medium": [
      "停留",
      "前三秒"
    ]
  }
};

// 情感倾向词表
const EMOTION_WORDS = {
  "tech": [],
  "business": [],
  "nature": [],
  "fashion": [],
  "warmth": [],
  "professional": [
    "清晰",
    "简洁",
    "可靠",
    "专业"
  ],
  "energy": [],
  "artistic": [],
  "cyber-neon": [
    "赛博",
    "霓虹",
    "未来感",
    "酷炫科技"
  ],
  "ai-console": [
    "Agent",
    "Codex",
    "Claude Code",
    "终端"
  ],
  "data-grid": [
    "数据分析",
    "趋势",
    "指标",
    "算法"
  ],
  "hologram-ui": [
    "全息",
    "概念产品",
    "未来产品",
    "智能硬件"
  ],
  "corporate-clean": [
    "企业",
    "B2B",
    "官网",
    "公司介绍"
  ],
  "premium-dark": [
    "高端",
    "高级",
    "发布会",
    "品牌升级"
  ],
  "finance-terminal": [
    "金融",
    "投资",
    "财报",
    "市场数据"
  ],
  "pitch-deck": [
    "路演",
    "融资",
    "BP",
    "创业"
  ],
  "blueprint": [
    "教程",
    "步骤",
    "手把手",
    "SOP"
  ],
  "minimal-board": [
    "概念",
    "框架",
    "解释",
    "总结"
  ],
  "academic-paper": [
    "论文",
    "研究",
    "报告",
    "学术"
  ],
  "checklist-card": [
    "清单",
    "检查表",
    "步骤",
    "SOP"
  ],
  "creator-studio": [
    "自媒体",
    "剪辑",
    "脚本",
    "素材"
  ],
  "editorial-magazine": [
    "观点",
    "审美",
    "杂志",
    "专题"
  ],
  "news-briefing": [
    "新闻",
    "快讯",
    "盘点",
    "大事件"
  ],
  "tool-review": [
    "测评",
    "对比",
    "哪个好",
    "推荐"
  ],
  "case-study": [
    "案例",
    "复盘",
    "拆解",
    "结果"
  ],
  "healing-pastel": [
    "治愈",
    "心理",
    "成长",
    "女性向"
  ],
  "cinematic-story": [
    "故事",
    "叙事",
    "人物",
    "纪录"
  ],
  "warning-alert": [
    "避坑",
    "风险",
    "错误",
    "不建议"
  ],
  "social-pop": [
    "抖音",
    "小红书",
    "种草",
    "社媒"
  ],
  "viral-hook": [
    "钩子",
    "爆款",
    "开头",
    "反差"
  ]
};

/**
 * 计算主题得分
 */
function calculateScores(text, themeIds = Object.keys(KEYWORD_WEIGHTS)) {
  const scores = Object.fromEntries(themeIds.map(theme => [theme, 0]));

  const textLower = text.toLowerCase();

  for (const theme of themeIds) {
    const weights = KEYWORD_WEIGHTS[theme] || { high: [], medium: [] };
    // 高权重词命中
    for (const keyword of weights.high) {
      if (textLower.includes(keyword.toLowerCase())) {
        scores[theme] += 3;
      }
    }
    // 中权重词命中
    for (const keyword of weights.medium) {
      if (textLower.includes(keyword.toLowerCase())) {
        scores[theme] += 1;
      }
    }
  }

  // 情感词辅助判断
  for (const theme of themeIds) {
    const words = EMOTION_WORDS[theme] || [];
    for (const word of words) {
      if (textLower.includes(word.toLowerCase())) {
        scores[theme] += 0.5;
      }
    }
  }

  return scores;
}

function getMatchedKeywords(themeId, text) {
  const matchedKeywords = [];
  const themeKeywords = [
    ...(KEYWORD_WEIGHTS[themeId]?.high || []),
    ...(KEYWORD_WEIGHTS[themeId]?.medium || [])
  ];
  const textLower = text.toLowerCase();
  for (const keyword of themeKeywords) {
    if (textLower.includes(keyword.toLowerCase())) matchedKeywords.push(keyword);
  }
  return matchedKeywords;
}

function sortScores(scores) {
  return Object.entries(scores)
    .sort((a, b) => b[1] - a[1])
    .filter(([_, score]) => score > 0);
}

/**
 * 选择最佳主题
 */
function selectTheme(srtPath, options = {}) {
  const { requestedTheme = null } = options;

  const content = readFileSync(srtPath, 'utf-8');
  const subtitles = parseSRT(content);
  const fullText = subtitles.map(item => item.text).join(' ');

  const allThemeIds = Object.keys(KEYWORD_WEIGHTS);

  if (requestedTheme) {
    if (!allThemeIds.includes(requestedTheme)) {
      throw new Error(`Unknown theme "${requestedTheme}".`);
    }
    return {
      primaryTheme: {
        id: requestedTheme,
        confidence: 1,
        matchedKeywords: getMatchedKeywords(requestedTheme, fullText),
        emotionScore: calculateScores(fullText, [requestedTheme])
      },
      alternatives: [],
      emotion: requestedTheme,
      matchedCount: subtitles.length,
      textLength: fullText.length,
      selectionScope: 'explicit',
      note: '用户显式指定主题'
    };
  }

  // 在所有 31 个主题中评分选最优
  const scores = calculateScores(fullText, allThemeIds);
  const sorted = sortScores(scores);

  if (sorted.length === 0) {
    return {
      primaryTheme: { id: 'professional', confidence: 0.5, matchedKeywords: [], emotionScore: scores },
      alternatives: [],
      emotion: 'professional',
      matchedCount: subtitles.length,
      textLength: fullText.length,
      selectionScope: 'fallback',
      note: '未匹配到明确关键词，默认使用 professional'
    };
  }

  const totalScore = sorted.reduce((sum, [_, score]) => sum + score, 0);
  const primary = sorted[0];

  return {
    primaryTheme: {
      id: primary[0],
      confidence: primary[1] / totalScore,
      matchedKeywords: getMatchedKeywords(primary[0], fullText),
      emotionScore: scores
    },
    alternatives: sorted.slice(1, 3).map(([id, score]) => ({
      id, confidence: score / totalScore
    })),
    emotion: primary[0],
    matchedCount: subtitles.length,
    textLength: fullText.length,
    selectionScope: 'all-themes'
  };
}

// CLI 入口
const srtPath = process.argv[2];
if (!srtPath) {
  console.error('Usage: node select-theme.mjs <srt-path> [--theme <themeId>]');
  process.exit(1);
}

try {
  const args = process.argv.slice(3);
  const themeFlagIndex = args.findIndex(arg => arg === '--theme' || arg === '--theme-id');
  const requestedTheme = themeFlagIndex >= 0 ? args[themeFlagIndex + 1] : null;
  const result = selectTheme(srtPath, { requestedTheme });
  console.log(JSON.stringify(result, null, 2));
} catch (error) {
  console.error('Error:', error.message);
  process.exit(1);
}
