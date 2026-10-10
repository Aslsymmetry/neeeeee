import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

// Only public application assets are exposed; Git metadata stays private.
const assets = new Map([
  ['/index.html', ['index.html', 'text/html; charset=utf-8']],
  ['/styles.css', ['styles.css', 'text/css; charset=utf-8']],
  ['/app.js', ['app.js', 'text/javascript; charset=utf-8']],
]);
const server = http.createServer(async (req, res) => {
  if (!['GET', 'HEAD'].includes(req.method)) {
    res.writeHead(405, { Allow: 'GET, HEAD' }); res.end(); return;
  }
  const path = new URL(req.url, 'http://127.0.0.1').pathname;
  const asset = assets.get(path === '/' ? '/index.html' : path);
  if (!asset) { res.writeHead(404); res.end('Not found'); return; }
  try {
    const data = await readFile(fileURLToPath(new URL(asset[0], import.meta.url)));
    res.writeHead(200, { 'Content-Type': asset[1], 'Cache-Control': 'no-store' });
    res.end(req.method === 'HEAD' ? undefined : data);
  } catch { res.writeHead(500); res.end('Unable to read asset'); }
});
server.on('error', error => { console.error('서버 실행 실패:', error.message); process.exitCode = 1; });
const port = Number(process.env.PORT || 3000);
server.listen(port, '127.0.0.1', () => console.log(`할 일 앱: http://127.0.0.1:${port}/index.html`));
