/**
 * 测试 VoxCPM TTS API
 * 用法:
 *   node scripts/test-tts.mjs "你的API_KEY" "要合成的文字"
 * 或者:
 *   在 skillRoot/.env.local 设置 VOXCPM_API_KEY=xxx
 *   node scripts/test-tts.mjs "" "要合成的文字"
 */
import './lib/load-env.mjs';
const apiKey = process.argv[2] || process.env.VOXCPM_API_KEY;
if (!apiKey) {
  console.error('错误: 未提供 API Key。请通过命令行参数或环境变量 VOXCPM_API_KEY 传入。');
  process.exit(1);
}
const text = process.argv[3] || '你好，我是辉哥。今天来给大家分享一个做视频的新方法。不用打开任何剪辑软件，就能生成一条带动画的视频。';

const res = await fetch('https://gateway.pixazo.ai/voxcpm/v1/text-to-speech', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Ocp-Apim-Subscription-Key': apiKey
  },
  body: JSON.stringify({ text, cfg_value: 2.0, dit_steps: 10 })
});

const data = await res.json();
console.log('状态:', res.status);
console.log('音频URL:', data.url || data.audio_url || data.output);
console.log('生成耗时:', data.elapsed_s, '秒');

import { execSync } from 'child_process';
const audioUrl = data.url || data.audio_url || data.output;
if (audioUrl) {
  const outPath = 'test-output.wav';
  execSync(`curl.exe -L -o "${outPath}" "${audioUrl}"`, { stdio: 'pipe' });
  console.log(`音频已保存: ${outPath}`);
}
