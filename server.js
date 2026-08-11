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

app.prepare().then(() => {
  createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true);
      const pathname = parsedUrl.pathname || '';

      // Direct fallback handler for .next/static files to prevent 404/403 unstyled pages
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
