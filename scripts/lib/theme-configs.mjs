import { BASE_THEME_CONFIGS, BASE_THEME_BACKGROUND_FILES } from './base-themes.mjs';
import { INSTALLED_EXTENDED_THEME_CONFIGS, INSTALLED_EXTENDED_THEME_BACKGROUND_FILES } from './installed-extended-themes.mjs';

export const THEME_CONFIGS = {
  ...BASE_THEME_CONFIGS,
  ...INSTALLED_EXTENDED_THEME_CONFIGS
};

export const THEME_BACKGROUND_FILES = {
  ...BASE_THEME_BACKGROUND_FILES,
  ...INSTALLED_EXTENDED_THEME_BACKGROUND_FILES
};

// 所有主题统一列表（不再区分基础/扩展）
export const ALL_THEME_IDS = Object.keys(THEME_CONFIGS);

const THEME_GRADIENTS = {
  "tech": "linear-gradient(180deg, #0a0a1a 0%, #0a0a1a 100%)",
  "business": "linear-gradient(180deg, #0f172a 0%, #0f172a 100%)",
  "nature": "linear-gradient(180deg, #0b1f16 0%, #163526 100%)",
  "fashion": "linear-gradient(180deg, #000000 0%, #000000 100%)",
  "warmth": "linear-gradient(180deg, #1a0a05 0%, #1a0a05 100%)",
  "professional": "linear-gradient(180deg, #f8fafc 0%, #f8fafc 100%)",
  "energy": "linear-gradient(180deg, #0f0a0a 0%, #0f0a0a 100%)",
  "artistic": "linear-gradient(180deg, #1a1512 0%, #1a1512 100%)",
  "cyber-neon": "linear-gradient(180deg, #080717 0%, #16072a 100%)",
  "ai-console": "linear-gradient(180deg, #071426 0%, #0b1f3a 100%)",
  "data-grid": "linear-gradient(180deg, #06111f 0%, #0f1f36 100%)",
  "hologram-ui": "linear-gradient(180deg, #061629 0%, #0b2440 100%)",
  "corporate-clean": "linear-gradient(180deg, #ffffff 0%, #eaf3ff 100%)",
  "premium-dark": "linear-gradient(180deg, #090909 0%, #1c1917 100%)",
  "finance-terminal": "linear-gradient(180deg, #081521 0%, #0f2535 100%)",
  "pitch-deck": "linear-gradient(180deg, #ffffff 0%, #edf4ff 100%)",
  "blueprint": "linear-gradient(180deg, #f8fbff 0%, #dbeafe 100%)",
  "minimal-board": "linear-gradient(180deg, #fffdf8 0%, #f3f4f6 100%)",
  "academic-paper": "linear-gradient(180deg, #fbf7ef 0%, #f3efe7 100%)",
  "checklist-card": "linear-gradient(180deg, #ffffff 0%, #ecfeff 100%)",
  "creator-studio": "linear-gradient(180deg, #0b1020 0%, #15162a 100%)",
  "editorial-magazine": "linear-gradient(180deg, #f7f0e6 0%, #eee3d3 100%)",
  "news-briefing": "linear-gradient(180deg, #061b36 0%, #0b2a4f 100%)",
  "tool-review": "linear-gradient(180deg, #ffffff 0%, #eef6ff 100%)",
  "case-study": "linear-gradient(180deg, #102022 0%, #172a2d 100%)",
  "healing-pastel": "linear-gradient(180deg, #fff7ed 0%, #fdf2f8 100%)",
  "cinematic-story": "linear-gradient(180deg, #090909 0%, #1f1b18 100%)",
  "warning-alert": "linear-gradient(180deg, #111111 0%, #1f2937 100%)",
  "social-pop": "linear-gradient(180deg, #ffffff 0%, #fff7ed 100%)",
  "viral-hook": "linear-gradient(180deg, #0a0a0a 0%, #111827 100%)",
  "claude-cream": "none"
};

export function getThemeGradient(themeId) {
  return THEME_GRADIENTS[themeId] || THEME_GRADIENTS.professional;
}

export function isThemeAvailable(themeId) {
  return ALL_THEME_IDS.includes(themeId);
}

// 向后兼容别名
export const THEME_IDS = ALL_THEME_IDS;
export const BASE_THEME_IDS = ALL_THEME_IDS;
export const EXTENDED_THEME_IDS = [];
