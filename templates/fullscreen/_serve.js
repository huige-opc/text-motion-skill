// 支持 HTTP Range 请求的静态服务器（audio/video seek 必需）
// 用法：node _serve.js [port]  默认端口 3009
const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = process.argv[2] ? +process.argv[2] : 3009;
const ROOT = __dirname;

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js':   'application/javascript; charset=utf-8',
  '.css':  'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.mp3':  'audio/mpeg',
  '.mp4':  'video/mp4',
  '.srt':  'text/plain; charset=utf-8',
  '.svg':  'image/svg+xml',
  '.png':  'image/png',
  '.jpg':  'image/jpeg',
  '.ico':  'image/x-icon',
  '.woff2':'font/woff2',
};

http.createServer((req, res) => {
  let p = decodeURIComponent(url.parse(req.url).pathname);
  if(p === '/') p = '/index.html';
  const filePath = path.join(ROOT, p);
  if(!filePath.startsWith(ROOT)) { res.writeHead(403); return res.end(); }

  fs.stat(filePath, (err, stat) => {
    if(err || !stat.isFile()){ res.writeHead(404); return res.end('Not found'); }

    const ext = path.extname(filePath).toLowerCase();
    const mime = MIME[ext] || 'application/octet-stream';
    const size = stat.size;
    const range = req.headers.range;

    // 支持 Range 请求 —— audio/video seek 必需
    // ⚠️ 禁止用 python -m http.server：不支持 Range，audio 无法 seek
    if(range){
      const m = range.match(/bytes=(\d*)-(\d*)/);
      let s = m[1] ? +m[1] : 0;
      let e = m[2] ? +m[2] : size - 1;
      if(s >= size) s = 0;
      if(e >= size) e = size - 1;
      res.writeHead(206, {
        'Content-Type': mime,
        'Content-Length': e - s + 1,
        'Content-Range': `bytes ${s}-${e}/${size}`,
        'Accept-Ranges': 'bytes',
        'Cache-Control': 'no-store',
      });
      fs.createReadStream(filePath, { start: s, end: e }).pipe(res);
    } else {
      res.writeHead(200, {
        'Content-Type': mime,
        'Content-Length': size,
        'Accept-Ranges': 'bytes',
        'Cache-Control': 'no-store',
      });
      fs.createReadStream(filePath).pipe(res);
    }
  });
}).listen(PORT, () => console.log('static+range server on http://localhost:' + PORT));
