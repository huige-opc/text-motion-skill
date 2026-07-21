export function parseSRT(content) {
  const text = String(content || '')
    .replace(/^\uFEFF/, '')
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .trim();

  if (!text) return [];

  const blocks = text.split(/\n{2,}/);
  const rows = [];

  for (const block of blocks) {
    const lines = block.split('\n').map(line => line.trim()).filter(Boolean);
    if (!lines.length) continue;

    const timeLineIndex = lines.findIndex(line => line.includes('-->'));
    if (timeLineIndex < 0) continue;

    const [rawStart, rawEnd] = lines[timeLineIndex].split('-->').map(value => value.trim());
    const startTime = parseSrtTime(rawStart);
    const endTime = parseSrtTime(rawEnd);
    if (!Number.isFinite(startTime) || !Number.isFinite(endTime) || endTime <= startTime) continue;

    const captionLines = lines.slice(timeLineIndex + 1);
    const caption = captionLines
      .join(' ')
      .replace(/<[^>]+>/g, '')
      .replace(/\s+/g, ' ')
      .trim();
    if (!caption) continue;

    rows.push({
      index: rows.length + 1,
      startTime,
      endTime,
      duration: Number((endTime - startTime).toFixed(3)),
      text: caption
    });
  }

  return rows;
}

export function parseSrtTime(value) {
  const match = String(value || '').match(/(\d{1,2}):(\d{2}):(\d{2})[,.](\d{1,3})/);
  if (!match) return NaN;
  const [, hours, minutes, seconds, millis] = match;
  return Number(hours) * 3600
    + Number(minutes) * 60
    + Number(seconds)
    + Number(millis.padEnd(3, '0')) / 1000;
}
