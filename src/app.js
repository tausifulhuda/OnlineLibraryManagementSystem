const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const { createRoutes } = require('./controllers/api');
const { AppError } = require('./errors');

// Which kinds of files the server is allowed to send from the "public" folder.
const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
};

function readBody(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', chunk => { data += chunk; });
    req.on('end', () => {
      try { resolve(data ? JSON.parse(data) : {}); }
      catch { reject(new AppError('Request body must be valid JSON', 400)); }
    });
  });
}

function createApp(library) {
  const routes = createRoutes(library);
  const publicDir = path.join(__dirname, '..', 'public');

  /** Finds the file inside "public" for a URL, or returns null if there is none. */
  function findPublicFile(pathname) {
    let relative;
    try { relative = decodeURIComponent(pathname); } catch { return null; }
    if (relative === '/') relative = '/index.html';

    const fullPath = path.join(publicDir, relative);
    const insidePublic = fullPath.startsWith(publicDir + path.sep);   // blocks "../" tricks
    const allowedType = MIME_TYPES[path.extname(fullPath).toLowerCase()];

    if (!insidePublic || !allowedType) return null;
    if (!fs.existsSync(fullPath) || !fs.statSync(fullPath).isFile()) return null;
    return { fullPath, type: allowedType };
  }

  return http.createServer(async (req, res) => {
    const url = new URL(req.url, 'http://localhost');
    const send = (status, payload) => {
      res.writeHead(status, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(payload));
    };

    // 1. Pages, styles, scripts and images from the "public" folder
    if (req.method === 'GET' && !url.pathname.startsWith('/api/')) {
      const file = findPublicFile(url.pathname);
      if (file) {
        res.writeHead(200, { 'Content-Type': file.type });
        return res.end(fs.readFileSync(file.fullPath));   // raw bytes, so images stay intact
      }
    }

    // 2. API routes
    for (const [method, pattern, handler] of routes) {
      const match = url.pathname.match(pattern);
      if (req.method !== method || !match) continue;
      try {
        const body = method === 'POST' ? await readBody(req) : {};
        const result = handler({ params: match.slice(1), query: url.searchParams, body });
        return send(method === 'POST' ? 201 : 200, result);
      } catch (err) {
        if (err instanceof AppError) return send(err.status, { error: err.message });
        console.error(err);
        return send(500, { error: 'Something went wrong on the server' });
      }
    }

    send(404, { error: 'Not found' });
  });
}

module.exports = { createApp };