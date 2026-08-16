const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const path = require('path');

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

app.prepare().then(() => {
  const server = createServer((req, res) => {
    try {
      const parsedUrl = parse(req.url, true);
      const pathname = parsedUrl.pathname || '';

      if (pathname === '/api/health' || pathname === '/healthz' || pathname.includes('health')) {
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Cache-Control', 'no-store');
        return res.end(JSON.stringify({ status: 'ok', uptime: process.uptime(), timestamp: new Date().toISOString() }));
      }

      handle(req, res, parsedUrl);
    } catch (err) {
      console.error('[PASSENGER_REQUEST_ERROR]', req.url, err?.message || err);
      if (!res.headersSent) {
        res.statusCode = 500;
        res.end('Internal Server Error');
      }
    }
  });

  const listenTarget = process.env.PORT || 'passenger';
  server.listen(listenTarget);
  console.log(`> AI Institute Server active on ${listenTarget}`);
}).catch((err) => {
  console.error('[PASSENGER_PREPARE_FATAL]', err?.message || err);
});
