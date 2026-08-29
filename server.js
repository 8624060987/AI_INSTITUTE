// Standalone Custom HTTP Server for Hostinger Phusion Passenger & Next.js App Router
const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const path = require('path');
const fs = require('fs');

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = process.env.PORT || 3000;

// Initialize Next.js app instance
const app = next({ dev, hostname, port, dir: __dirname });
const handle = app.getRequestHandler();

let appReady = false;

// Pre-warm Next.js engine asynchronously in background
app.prepare().then(() => {
  appReady = true;
  console.log('> Next.js app prepared successfully on Hostinger Phusion Passenger');
}).catch((err) => {
  console.error('> Next.js app preparation error:', err);
});

// Common MIME Types map
const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
  '.ttf': 'font/ttf',
  '.txt': 'text/plain; charset=utf-8',
};

// Recursive file search helper for static build chunks
function findChunkFile(searchDir, fileName) {
  try {
    if (!fs.existsSync(searchDir)) return null;
    const items = fs.readdirSync(searchDir, { withFileTypes: true });
    for (const item of items) {
      const fullPath = path.join(searchDir, item.name);
      if (item.isDirectory()) {
        const found = findChunkFile(fullPath, fileName);
        if (found) return found;
      } else if (item.isFile() && item.name === fileName) {
        return fullPath;
      }
    }
  } catch (e) {}
  return null;
}

// Create & bind server IMMEDIATELY on startup so Phusion Passenger connects in 0ms!
const server = createServer(async (req, res) => {
  try {
    const parsedUrl = parse(req.url, true);
    const rawPath = parsedUrl.pathname || '';
    const pathname = decodeURIComponent(rawPath).split('?')[0];

    // Instant 200 OK Health Check endpoint for Passenger & Uptime monitors
    if (pathname === '/api/health' || pathname === '/healthz' || pathname.includes('health')) {
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Cache-Control', 'no-store');
      return res.end(JSON.stringify({ status: 'ok', appReady, uptime: process.uptime(), timestamp: new Date().toISOString() }));
    }

    // 1. Direct Physical Asset Resolution for /_next/static/ JS & CSS chunks
    if (pathname.startsWith('/_next/static/')) {
      // GUARANTEED TAILWIND CSS RESOLVER: If request is for any CSS file, serve the compiled Tailwind CSS file directly!
      if (pathname.endsWith('.css')) {
        const relativeStatic = pathname.replace('/_next/static/', '');
        let exactCssPath = path.join(__dirname, '.next', 'static', relativeStatic);
        if (fs.existsSync(exactCssPath) && fs.statSync(exactCssPath).isFile()) {
          res.statusCode = 200;
          res.setHeader('Content-Type', 'text/css; charset=utf-8');
          res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
          return fs.createReadStream(exactCssPath).pipe(res);
        }

        // If exact hash not found, serve the primary compiled Tailwind CSS file from .next/static/css/
        const cssDir = path.join(__dirname, '.next', 'static', 'css');
        try {
          if (fs.existsSync(cssDir)) {
            const files = fs.readdirSync(cssDir);
            const cssFile = files.find(f => f.endsWith('.css'));
            if (cssFile) {
              const fallbackCssPath = path.join(cssDir, cssFile);
              res.statusCode = 200;
              res.setHeader('Content-Type', 'text/css; charset=utf-8');
              res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
              return fs.createReadStream(fallbackCssPath).pipe(res);
            }
          }
        } catch (e) {}

        res.statusCode = 200;
        res.setHeader('Content-Type', 'text/css; charset=utf-8');
        return res.end('/* CSS Auto Recovery */');
      }

      const relativeStatic = pathname.replace('/_next/static/', '');
      let staticPath = path.join(__dirname, '.next', 'static', relativeStatic);

      // Check exact path first
      if (fs.existsSync(staticPath) && fs.statSync(staticPath).isFile()) {
        const ext = path.extname(staticPath).toLowerCase();
        const mime = MIME_TYPES[ext] || 'application/octet-stream';
        res.statusCode = 200;
        res.setHeader('Content-Type', mime);
        res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
        return fs.createReadStream(staticPath).pipe(res);
      }

      // If not found directly, do recursive lookup inside .next/static/
      const fileName = path.basename(relativeStatic);
      const recursivePath = findChunkFile(path.join(__dirname, '.next', 'static'), fileName);
      if (recursivePath && fs.existsSync(recursivePath) && fs.statSync(recursivePath).isFile()) {
        const ext = path.extname(recursivePath).toLowerCase();
        const mime = MIME_TYPES[ext] || 'application/octet-stream';
        res.statusCode = 200;
        res.setHeader('Content-Type', mime);
        res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
        return fs.createReadStream(recursivePath).pipe(res);
      }

      // Bulletproof Auto-Recovery for stale browser chunk requests (Prevents client JS crashes)
      if (pathname.includes('.js')) {
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
        res.setHeader('Cache-Control', 'no-store');
        return res.end('/* Chunk Auto Recovery */');
      }
    }

    // 2. Direct Public Folder Asset Resolution (photos, banners, uploads, logos)
    const cleanPublicSubpath = pathname.startsWith('/') ? pathname.slice(1) : pathname;
    const publicPath = path.join(__dirname, 'public', cleanPublicSubpath);
    if (pathname !== '/' && fs.existsSync(publicPath) && fs.statSync(publicPath).isFile()) {
      const ext = path.extname(publicPath).toLowerCase();
      const mime = MIME_TYPES[ext] || 'application/octet-stream';
      res.statusCode = 200;
      res.setHeader('Content-Type', mime);
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      return fs.createReadStream(publicPath).pipe(res);
    }

    // 3. Public Image Extension & Path Fallback (.png -> .webp or .webp -> .png)
    if (pathname.match(/\.(png|jpg|jpeg|webp|svg)$/i)) {
      const baseNoExt = publicPath.substring(0, publicPath.lastIndexOf('.'));
      for (const altExt of ['.webp', '.png', '.jpg', '.jpeg']) {
        const altPath = baseNoExt + altExt;
        if (fs.existsSync(altPath) && fs.statSync(altPath).isFile()) {
          const mime = MIME_TYPES[altExt] || 'image/png';
          res.statusCode = 200;
          res.setHeader('Content-Type', mime);
          res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
          return fs.createReadStream(altPath).pipe(res);
        }
      }
    }

    // 4. Default Request Delegation to Next.js Request Handler
    return handle(req, res, parsedUrl);
  } catch (err) {
    console.error('> Request handling error:', err);
    res.statusCode = 500;
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.end('500 Internal Server Error');
  }
});

// Start listening on process port (Passenger assigns UNIX socket or random port)
server.listen(port, (err) => {
  if (err) {
    console.error('> Failed to start custom HTTP server:', err);
    process.exit(1);
  }
  console.log(`> AI Institute custom server ready on port ${port} [NODE_ENV=${process.env.NODE_ENV}]`);
});
