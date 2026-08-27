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

// Create & bind server IMMEDIATELY on startup so Phusion Passenger connects in 0ms!
const server = createServer(async (req, res) => {
  try {
    const parsedUrl = parse(req.url, true);
    const pathname = parsedUrl.pathname || '';

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
      const staticPath = path.join(dir, '.next', 'static', relativeStatic);
      if (fs.existsSync(staticPath) && fs.statSync(staticPath).isFile()) {
        const ext = path.extname(staticPath).toLowerCase();
        const mime = MIME_TYPES[ext] || 'application/octet-stream';
        res.statusCode = 200;
        res.setHeader('Content-Type', mime);
        res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
        return fs.createReadStream(staticPath).pipe(res);
      } else if (pathname.endsWith('.js')) {
        // Auto-Recovery for stale browser chunk requests to prevent fatal client JS crashes
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
        res.setHeader('Cache-Control', 'no-store');
        return res.end('/* Chunk Auto Recovery */');
      } else if (pathname.endsWith('.css')) {
        res.statusCode = 200;
        res.setHeader('Content-Type', 'text/css; charset=utf-8');
        res.setHeader('Cache-Control', 'no-store');
        return res.end('/* CSS Auto Recovery */');
      }
    }

    // 2. Direct Public Folder Asset Resolution (photos, banners, uploads, logos)
    const publicPath = path.join(dir, 'public', pathname.startsWith('/') ? pathname.slice(1) : pathname);
    if (pathname !== '/' && fs.existsSync(publicPath) && fs.statSync(publicPath).isFile()) {
      const ext = path.extname(publicPath).toLowerCase();
      const mime = MIME_TYPES[ext] || 'application/octet-stream';
      res.statusCode = 200;
      res.setHeader('Content-Type', mime);
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      return fs.createReadStream(publicPath).pipe(res);
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
