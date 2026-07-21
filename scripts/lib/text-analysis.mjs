import { basename } from 'path';
export function inferSceneType(text) {
  if (/\d+(?:\.\d+)?%|增长|下降|数据|统计|排名|倍/.test(text)) return 'data';
  if (/步骤|流程|首先|然后|接下来|第一|第二|第三|怎么做|方法/.test(text)) return 'process';
  if (/代码|开发|程序|脚本|Agent|agent|Skill|skill|模型|AI/.test(text)) return 'code';
  if (/小红书|抖音|推特|Twitter|X平台|Reddit|社交|帖子/.test(text)) return 'social';
  if (/全球|国家|城市|地图|美国|中国|欧洲|地区/.test(text)) return 'map';
  if (/为什么|核心|关键|重点|结论|注意/.test(text) || text.length < 24) return 'statement';
  return 'concept';
}

export function readableLength(text) {
  return String(text || '')
    .replace(/\s+/g, '')
    .replace(/[，。！？、,.!?;；:："'“”‘’（）()\[\]【】]/g, '')
    .length;
}

export function deriveTitle(subtitles, srtPath) {
  const first = subtitles.map(item => item.text.replace(/[。！？!?].*$/, '').trim()).find(text => text.length >= 4);
  if (first) return first.slice(0, 28);
  return basename(srtPath).replace(/\.srt$/i, '');
}

