const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const path = require('path');
const fs = require('fs');

// Global Process Failure Protections (Prevents Hostinger Node.js crashes)
process.on('uncaughtException', (err) => {
  console.error('[PASSENGER_UNCAUGHT_EXCEPTION]', err);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('[PASSENGER_UNHANDLED_REJECTION]', reason);
});

const dev = false;
const dir = __dirname;
const app = next({ dev, dir });
const handle = app.getRequestHandler();
const listenTarget = process.env.PORT || 'passenger';

function findFallbackCssFile(dirPath) {
  try {
    if (!fs.existsSync(dirPath)) return null;
    const files = fs.readdirSync(dirPath);
    const cssFile = files.find(f => f.endsWith('.css'));
    return cssFile ? path.join(dirPath, cssFile) : null;
  } catch (e) {
    return null;
  }
}

app.prepare().then(() => {
  createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true);
      const pathname = parsedUrl.pathname || '';

      // Direct static asset stream handler for .next/static files to prevent 404 unstyled pages on Hostinger
      if (pathname.startsWith('/_next/static/')) {
        const relativePath = pathname.replace('/_next/static/', '');
        const filePath = path.join(dir, '.next', 'static', relativePath);

        if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
          if (pathname.endsWith('.css')) {
            res.setHeader('Content-Type', 'text/css; charset=utf-8');
          } else if (pathname.endsWith('.js')) {
            res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
          } else if (pathname.endsWith('.woff2')) {
            res.setHeader('Content-Type', 'font/woff2');
          }
          res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
          res.setHeader('Access-Control-Allow-Origin', '*');
          return fs.createReadStream(filePath).pipe(res);
        } else if (pathname.endsWith('.css')) {
          // If a specific CSS chunk hash was updated during deploy, serve active CSS bundle fallback
          const chunksDir = path.join(dir, '.next', 'static', 'chunks');
          const fallbackCss = findFallbackCssFile(chunksDir);
          if (fallbackCss && fs.existsSync(fallbackCss)) {
            res.setHeader('Content-Type', 'text/css; charset=utf-8');
            res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
            res.setHeader('Access-Control-Allow-Origin', '*');
            return fs.createReadStream(fallbackCss).pipe(res);
          }
        }
      }

      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error('[PASSENGER_REQUEST_ERROR]', req.url, err);
      if (!res.headersSent) {
        res.statusCode = 500;
        res.end('Internal Server Error');
      }
    }
  }).listen(listenTarget, (err) => {
    if (err) throw err;
    console.log(`> AI Institute Next.js Server active on ${listenTarget}`);
  });
}).catch((err) => {
  console.error('[PASSENGER_PREPARE_ERROR]', err);
});
