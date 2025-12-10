const http = require('http');
const path = require('path');
const fs = require('fs');
const url = require('url');
const port = process.env.PORT || 5000;
const root = path.join(__dirname, '..', 'build');

const mime = new Map([
  ['.html', 'text/html'],
  ['.js', 'application/javascript'],
  ['.css', 'text/css'],
  ['.json', 'application/json'],
  ['.png', 'image/png'],
  ['.jpg', 'image/jpeg'],
  ['.jpeg', 'image/jpeg'],
  ['.svg', 'image/svg+xml'],
  ['.webp', 'image/webp'],
  ['.woff2', 'font/woff2'],
  ['.woff', 'font/woff'],
  ['.ttf', 'font/ttf'],
  ['.ico', 'image/x-icon']
]);

const server = http.createServer((req, res) => {
  try {
    const parsed = url.parse(req.url);
    let pathname = decodeURIComponent(parsed.pathname);
    // Serve SPA: treat routes as index.html
    let filePath = path.join(root, pathname);
    if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
      filePath = path.join(filePath, 'index.html');
    }
    if (!fs.existsSync(filePath)) {
      // fallback to index.html for SPA routes
      filePath = path.join(root, 'index.html');
    }
    const ext = path.extname(filePath).toLowerCase();
    const contentType = mime.get(ext) || 'application/octet-stream';
    const stream = fs.createReadStream(filePath);
    res.writeHead(200, { 'Content-Type': contentType, 'Cache-Control': 'no-cache' });
    stream.pipe(res);
    stream.on('error', () => {
      res.writeHead(500);
      res.end('Server error');
    });
  } catch (err) {
    res.writeHead(500);
    res.end('Server error');
  }
});

server.listen(port, () => {
  console.log(`Simple static server running on http://localhost:${port}`);
});

process.on('SIGTERM', () => server.close());
process.on('SIGINT', () => server.close());
