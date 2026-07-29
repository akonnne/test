/* 数道·万象 —— 本地 / VPS / 容器 运行入口（静态托管 + AI 代理 + 动画生成引擎）
 *
 * 直接 `node server.js` 即可（默认端口 8099，静态目录为同级的 site/）。
 * 部署到 VPS/容器：用环境变量覆盖路径与端口，前面再套 nginx/Caddy 反代 + TLS。
 *   PORT=80 SITE_DIR=/var/www/site DEEPSEEK_KEY=sk-xxx GEN_DIR=/var/data/generated node server.js
 *
 * 说明：Serverless(如 Vercel) 不需要本文件，改用 api/ 下的函数（见 vercel.json）。
 */
const http = require('http');
const fs = require('fs');
const path = require('path');
const lib = require('./server-lib');

// 路径与端口均可由环境变量覆盖，方便容器化部署。
const ROOT = process.env.SITE_DIR || path.join(__dirname, 'site');
const PORT = parseInt(process.env.PORT || '8099', 10);
const HOST = process.env.HOST || '0.0.0.0';

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.json': 'application/json',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2'
};

function serveStatic(req, res) {
  let p = decodeURIComponent(req.url.split('?')[0]);
  if (p === '/') p = '/index.html';
  const fp = path.normalize(path.join(ROOT, p));
  if (!fp.startsWith(path.resolve(ROOT))) { res.writeHead(403); res.end('Forbidden'); return; }
  fs.readFile(fp, (err, data) => {
    if (err) { res.writeHead(404); res.end('Not found'); return; }
    const ext = path.extname(fp).toLowerCase();
    res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
    res.end(data);
  });
}

const server = http.createServer((req, res) => {
  const url = req.url.split('?')[0];
  if (url.startsWith('/api/')) {
    // CORS 预检（跨域场景，如静态与函数不同源）
    if (req.method === 'OPTIONS') { res.writeHead(204, lib.CORS); res.end(); return; }
    if (lib.routeApi(req, res)) return;
  }
  serveStatic(req, res);
});

server.listen(PORT, HOST, () => {
  console.log('数道·万象 服务器已启动: http://' + HOST + ':' + PORT +
    '  (含 /api/tasks 动画生成引擎 + /api/chat 代理；静态目录 ' + ROOT + ')');
});
