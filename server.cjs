const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 5173;
const DIST = path.resolve(__dirname, 'dist');

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
  const pathname = new URL(req.url, 'http://localhost').pathname;
  const decoded = decodeURIComponent(pathname || '');

  // Resolve requested path relative to the dist folder. Prepending '.' prevents
  // absolute request paths (like '/login') from escaping the `DIST` root.
  const distResolved = DIST;
  let filePath = path.resolve(distResolved, '.' + decoded);

  // If the resolved path is outside the dist folder, or the file doesn't exist
  // (including requests for SPA routes like /login), fall back to index.html.
  if (filePath === distResolved || filePath.startsWith(distResolved + path.sep)) {
    if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
      filePath = path.join(distResolved, 'index.html');
    }
  } else {
    filePath = path.join(distResolved, 'index.html');
  }

  const ext = path.extname(filePath);
  res.setHeader('Content-Type', mime[ext] || 'application/octet-stream');
  fs.createReadStream(filePath).pipe(res);
}).listen(PORT, '0.0.0.0', () => {
  console.log(`Serving dist on http://0.0.0.0:${PORT}`);
});
