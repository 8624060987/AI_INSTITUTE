const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');

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

let appReady = false;
const appPrepared = app.prepare().then(() => {
  appReady = true;
  console.log('> Next.js app prepared successfully');
}).catch((err) => {
  console.error('[PASSENGER_PREPARE_ERROR]', err?.message || err);
});

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
      return res.end(JSON.stringify({ status: 'ok', uptime: process.uptime(), timestamp: new Date().toISOString() }));
    }

    if (!appReady) {
      await appPrepared;
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

const listenTarget = process.env.PORT || 'passenger';
server.listen(listenTarget);
console.log(`> AI Institute Server bound instantly on ${listenTarget}`);
