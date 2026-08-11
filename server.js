const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');

// Prevent unexpected process crashes
process.on('uncaughtException', (err) => {
  console.error('[PASSENGER_UNCAUGHT_EXCEPTION]', err);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('[PASSENGER_UNHANDLED_REJECTION]', reason);
});

const dev = false;
const app = next({ dev });
const handle = app.getRequestHandler();
const listenTarget = process.env.PORT || 'passenger';

app.prepare().then(() => {
  createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true);
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
