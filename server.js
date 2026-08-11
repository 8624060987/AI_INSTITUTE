const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const path = require('path');
const fs = require('fs');
const http = require('http');
const https = require('https');

// Global Process Failure Protections (Prevents Hostinger Node.js crashes)
process.on('uncaughtException', (err) => {
  console.error('[PASSENGER_UNCAUGHT_EXCEPTION]', err?.message || err);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('[PASSENGER_UNHANDLED_REJECTION]', reason?.message || reason);
});

const dev = false;
const dir = __dirname;
const app = next({ dev, dir });
const handle = app.getRequestHandler();
const listenTarget = process.env.PORT || 'passenger';

// Helper to find any available CSS bundle if a specific chunk hash is missing
function findFallbackCssFile(dirPath) {
  try {
    if (!fs.existsSync(dirPath)) return null;
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });
    for (const entry of entries) {
      const full = path.join(dirPath, entry.name);
      if (entry.isDirectory()) {
        const found = findFallbackCssFile(full);
        if (found) return found;
      } else if (entry.name.endsWith('.css')) {
        return full;
      }
    }
  } catch (e) {
    return null;
  }
  return null;
}

app.prepare().then(() => {
  const server = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true);
      const pathname = parsedUrl.pathname || '';

      // Instant 200 OK Health Check endpoint for Passenger & Uptime monitors
      if (pathname === '/api/health' || pathname === '/healthz') {
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Cache-Control', 'no-store');
        return res.end(JSON.stringify({ status: 'ok', uptime: process.uptime(), timestamp: new Date().toISOString() }));
      }

      // Universal static asset stream handler to prevent 404 unstyled pages on Hostinger
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
          // CSS fallback: serve active CSS bundle if chunk hash differs
          const fallbackCss = findFallbackCssFile(path.join(dir, '.next', 'static'));
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
      console.error('[PASSENGER_REQUEST_ERROR]', req.url, err?.message || err);
      if (!res.headersSent) {
        res.statusCode = 500;
        res.end('Internal Server Error');
      }
    }
  });

  // Keep-Alive and Headers Timeout Settings for High-Traffic Passenger Resilience
  server.keepAliveTimeout = 65000;
  server.headersTimeout = 66000;

  server.listen(listenTarget, (err) => {
    if (err) throw err;
    console.log(`> AI Institute Next.js Server active & 24/7 protected on ${listenTarget}`);

    // Self-Ping Heartbeat (Every 45 seconds) to prevent Passenger Idle Worker Shutdown
    setInterval(() => {
      try {
        https.get('https://aiinstitutesatana.in/api/health', (pingRes) => {
          pingRes.on('data', () => {});
        }).on('error', () => {
          // Internal fallback ping
          http.get('http://127.0.0.1:3000/api/health', (localRes) => {
            localRes.on('data', () => {});
          }).on('error', () => {});
        });
      } catch (e) {}
    }, 45000);
  });
}).catch((err) => {
  console.error('[PASSENGER_PREPARE_ERROR]', err?.message || err);
});
