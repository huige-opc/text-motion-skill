#!/usr/bin/env node
/**
 * init-project.mjs — 初始化一个新的文字动画视频项目（v2 扁平结构）
 *
 * 做的事：
 *  1. 计算项目名 text-video-{YYYYMMDD}-{NNN}
 *  2. 在 projects/ 下建目录
 *  3. 把 templates/{layout}/ 整个复制到项目根（扁平：index.html 直接在项目根）
 *  4. 复制指定主题的 tokens.css 到 assets/tokens.css
 *  5. 生成初始 theme.json（保留主题元数据）
 *  6. 打印下一步指引
 *
 * 用法：
 *  node scripts/init-project.mjs --theme tech --aspect-ratio 16:9
 *  node scripts/init-project.mjs --theme tech --aspect-ratio 16:9 --project-name my-video
 *  node scripts/init-project.mjs --theme tech --srt-path "path/to/subtitles.srt"
 */

import { existsSync, mkdirSync, readdirSync, statSync, copyFileSync, readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join, resolve, dirname, basename } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const skillRoot = resolve(dirname(__filename), '..');
const projectsRoot = join(skillRoot, 'projects');
let templatesRoot = join(skillRoot, 'templates', 'fullscreen');
const themesRoot = join(skillRoot, 'themes');

// ============================================================
// 参数解析
// ============================================================
const argv = process.argv.slice(2);
function arg(name, dflt) {
  const i = argv.indexOf('--' + name);
  return i >= 0 ? argv[i + 1] : dflt;
}
const themeId = arg('theme', 'tech');
const aspectRatio = arg('aspect-ratio', '16:9');
const explicitName = arg('project-name');
const srtPath = arg('srt-path');
const layout = arg('layout', 'fullscreen');

// 布局选择
const LAYOUT_MAP = {
  'fullscreen': 'fullscreen',
  'portrait-right': 'portrait-right',
  'portrait-center': 'portrait-center',
};
const layoutDir = LAYOUT_MAP[layout];
if (!layoutDir) {
  console.error('✗ unknown layout: ' + layout);
  console.error('  available: ' + Object.keys(LAYOUT_MAP).join(' / '));
  process.exit(1);
}
templatesRoot = join(skillRoot, 'templates', layoutDir);

// ============================================================
// 计算项目名：{YYYYMMDD} 或 {YYYYMMDD}-{序号}
// ============================================================
const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
let projectName = explicitName;
if (!projectName) {
  if (!existsSync(projectsRoot)) mkdirSync(projectsRoot, { recursive: true });
  const todayProjects = readdirSync(projectsRoot).filter(n => new RegExp(`^${today}(-\\d+)?$`).test(n));
  if (todayProjects.length === 0) {
    projectName = today;
  } else {
    const nums = todayProjects.map(n => {
      const m = n.match(/-(\d+)$/);
      return m ? parseInt(m[1], 10) : 0;
    });
    const next = Math.max(...nums) + 1;
    projectName = `${today}-${next}`;
  }
}
const projectRoot = join(projectsRoot, projectName);

if (existsSync(projectRoot)) {
  console.error(`✗ project already exists: ${projectRoot}`);
  process.exit(1);
}

// ============================================================
// 复制模板到项目根（扁平结构）
// ============================================================
console.log('▶ create project:', projectRoot);
mkdirSync(projectRoot, { recursive: true });
copyDir(templatesRoot, projectRoot);

// ============================================================
// 应用主题
// ============================================================
function resolveThemeDir(id) {
  const path = join(themesRoot, id);
  return existsSync(path) ? path : null;
}

const themeDir = resolveThemeDir(themeId);
if (!themeDir) {
  console.error(`✗ theme not found: ${themeId}`);
  const all = readdirSync(themesRoot).filter(n => statSync(join(themesRoot, n)).isDirectory());
  console.error(`  available (${all.length}): ${all.join(' / ')}`);
  process.exit(1);
}

const themeTokens = join(themeDir, 'tokens.css');
const themeJson = join(themeDir, 'theme.json');
if (existsSync(themeTokens)) {
  copyFileSync(themeTokens, join(projectRoot, 'assets', 'tokens.css'));
  console.log('  applied tokens.css from theme:', themeId);
}
if (existsSync(themeJson)) {
  copyFileSync(themeJson, join(projectRoot, 'theme.json'));
  console.log('  copied theme.json');
}

// ============================================================
// 可选：复制用户提供的 SRT 到项目根
// ============================================================
if (srtPath) {
  const abs = resolve(srtPath);
  if (existsSync(abs)) {
    copyFileSync(abs, join(projectRoot, 'audio.srt'));
    console.log('  copied SRT:', basename(abs), '→ audio.srt');
  } else {
    console.warn(`  ⚠ srt not found at ${abs}`);
  }
}

// ============================================================
// 写 project.config.json（记录初始化元数据）
// ============================================================
const config = {
  projectName,
  createdAt: new Date().toISOString(),
  aspectRatio,
  theme: themeId,
  entry: 'index.html',
  audio: 'audio.mp3',
  srt: 'audio.srt',
  sceneTiming: 'scene-timing.json',
  output: 'output.mp4',
  version: 'v3'
};
writeFileSync(join(projectRoot, 'project.config.json'), JSON.stringify(config, null, 2), 'utf-8');

// ============================================================
// 下一步指引
// ============================================================
console.log('');
console.log('✅ project ready');
console.log('');
console.log('  path        :', projectRoot);
console.log('  theme       :', themeId);
console.log('  aspect ratio:', aspectRatio);
console.log('');
console.log('  下一步：');
console.log('    1. 准备 audio.mp3 + audio.srt + scene-timing.json');
console.log('    2. 在项目 scenes/ 下写场景 HTML（从 scenes/_layout.html 复制改名，参考 _type-*.html）');
console.log('    3. 本地预览：');
console.log('       cd', projectRoot);
console.log('       node _serve.js');
console.log('       浏览器打开 http://localhost:3009/');
console.log('    4. 渲染 MP4：');
console.log('       node "' + join(skillRoot, 'scripts', 'render-mp4.mjs') + '" "' + projectRoot + '"');
console.log('');

// ============================================================
// helper: 递归复制
// ============================================================
function copyDir(src, dst) {
  if (!existsSync(dst)) mkdirSync(dst, { recursive: true });
  for (const name of readdirSync(src)) {
    const s = join(src, name);
    const d = join(dst, name);
    const st = statSync(s);
    if (st.isDirectory()) copyDir(s, d);
    else copyFileSync(s, d);
  }
}
