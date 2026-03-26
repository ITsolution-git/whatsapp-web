const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 5173;
const DIST = path.join(__dirname, 'dist');

const mime = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
};

http.createServer((req, res) => {
  let filePath = path.join(DIST, req.url === '/' ? '/index.html' : req.url);

  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    filePath = path.join(DIST, 'index.html');
  }

  const ext = path.extname(filePath);
  res.setHeader('Content-Type', mime[ext] || 'application/octet-stream');
  fs.createReadStream(filePath).pipe(res);
}).listen(PORT, '0.0.0.0', () => {
  console.log(`Serving dist on http://0.0.0.0:${PORT}`);
});
