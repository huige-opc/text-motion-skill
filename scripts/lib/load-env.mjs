/**
 * 极简 .env 加载器 - 无需依赖
 *
 * 优先级：已有 process.env > .env.local > .env
 * 只加载 skillRoot（scripts/../）下的 .env 文件
 */
import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const skillRoot = dirname(dirname(dirname(__filename))); // scripts/lib/ -> scripts/ -> skillRoot

function parseEnvFile(filepath) {
  if (!existsSync(filepath)) return {};
  const content = readFileSync(filepath, 'utf-8');
  const result = {};
  for (const raw of content.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith('#')) continue;
    const eq = line.indexOf('=');
    if (eq === -1) continue;
    const key = line.slice(0, eq).trim();
    let val = line.slice(eq + 1).trim();
    // 去除首尾引号
    if ((val.startsWith('"') && val.endsWith('"')) ||
        (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    result[key] = val;
  }
  return result;
}

// 加载优先级低的 .env，再叠加 .env.local
const envFiles = [
  join(skillRoot, '.env'),
  join(skillRoot, '.env.local'),
];

for (const file of envFiles) {
  const vars = parseEnvFile(file);
  for (const [k, v] of Object.entries(vars)) {
    // 已存在的环境变量不覆盖（真实 shell 环境优先）
    if (process.env[k] === undefined) {
      process.env[k] = v;
    }
  }
}

export { skillRoot };
