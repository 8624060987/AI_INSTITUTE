const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const path = require('path');
const fs = require('fs');

// Global Process Failure Protections (Prevents Hostinger Node.js crashes)
process.on('uncaughtException', (err) => {
  console.error('[PASSENGER_UNCAUGHT_EXCEPTION]', err?.message || err);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('[PASSENGER_UNHANDLED_REJECTION]', reason?.message || reason);
});

const dev = false;
const dir = path.resolve(__dirname);
const app = next({ dev, dir });
const handle = app.getRequestHandler();

let appReady = false;
let prepareError = null;

const appPrepared = app.prepare().then(() => {
  appReady = true;
  console.log('> Next.js app prepared successfully');
}).catch((err) => {
  prepareError = err;
  console.error('[PASSENGER_PREPARE_ERROR]', err?.message || err);
});

// Helper: Content-Type MIME map for direct static asset serving
const MIME_TYPES = {
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.json': 'application/json',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
  '.ttf': 'font/ttf',
  '.pdf': 'application/pdf',
};

// Helper: Recursive chunk file finder in .next/static/
function findChunkFile(baseDir, fileName) {
  if (!fs.existsSync(baseDir)) return null;
  try {
    const items = fs.readdirSync(baseDir, { withFileTypes: true });
    for (const item of items) {
      const fullPath = path.join(baseDir, item.name);
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
      const relativeStatic = pathname.replace('/_next/static/', '');
      let staticPath = path.join(dir, '.next', 'static', relativeStatic);

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
      const recursivePath = findChunkFile(path.join(dir, '.next', 'static'), fileName);
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
      } else if (pathname.includes('.css')) {
        res.statusCode = 200;
        res.setHeader('Content-Type', 'text/css; charset=utf-8');
        res.setHeader('Cache-Control', 'no-store');

        // Dynamically find and serve the compiled Tailwind CSS file from .next/static/css/
        const cssDir = path.join(dir, '.next', 'static', 'css');
        let fallbackCssPath = null;
        try {
          if (fs.existsSync(cssDir)) {
            const files = fs.readdirSync(cssDir);
            const cssFile = files.find(f => f.endsWith('.css'));
            if (cssFile) fallbackCssPath = path.join(cssDir, cssFile);
          }
        } catch (e) {}

        if (fallbackCssPath && fs.existsSync(fallbackCssPath)) {
          return fs.createReadStream(fallbackCssPath).pipe(res);
        }

        return res.end('/* CSS Auto Recovery */');
      }
    }

    // 2. Direct Public Folder Asset Resolution (photos, banners, uploads, logos)
    const cleanPublicSubpath = pathname.startsWith('/') ? pathname.slice(1) : pathname;
    const publicPath = path.join(dir, 'public', cleanPublicSubpath);
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
          const mime = MIME_TYPES[altExt] || 'image/webp';
          res.statusCode = 200;
          res.setHeader('Content-Type', mime);
          res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
          return fs.createReadStream(altPath).pipe(res);
        }
      }

      // Default Banner Fallback if specific image file is missing
      const defaultBanner = path.join(dir, 'public', 'banners', 'generative-ai.webp');
      if (fs.existsSync(defaultBanner)) {
        res.statusCode = 200;
        res.setHeader('Content-Type', 'image/webp');
        res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
        return fs.createReadStream(defaultBanner).pipe(res);
      }
    }

    if (prepareError) {
      res.statusCode = 500;
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      return res.end(`<h1>Server Initialization Error</h1><p>${prepareError.message || prepareError}</p>`);
    }

    if (!appReady) {
      let waited = 0;
      while (!appReady && !prepareError && waited < 40) {
        await new Promise((r) => setTimeout(r, 100));
        waited++;
      }
    }

    // Ensure HTML page requests are served with no-store so browser always fetches fresh chunk references
    if (!pathname.includes('.')) {
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    }

    await handle(req, res, parsedUrl);
  } catch (err) {
    console.error('[PASSENGER_REQUEST_ERROR]', req.url, err?.message || err);
    if (!res.headersSent) {
      res.statusCode = 500;
      res.setHeader('Content-Type', 'text/plain');
      res.end('Internal Server Error');
    }
  }
});

const listenTarget = process.env.PORT || 'passenger';
server.listen(listenTarget);
console.log(`> AI Institute Server bound instantly on ${listenTarget}`);
