const { randomUUID } = require('node:crypto');
const path = require('node:path');
const express = require('express');
const cors = require('cors');
const { rateLimit } = require('express-rate-limit');
const compression = require('compression');

const hashedAsset = /-[\w-]{8}\.[a-z0-9]+$/i;

function createApp({ origins = [], proxyHops = 0, isReady = () => true, staticDir, logger = console } = {}) {
  const app = express();
  app.disable('x-powered-by');
  app.set('trust proxy', proxyHops);

  app.use((req, res, next) => {
    res.set('X-Request-Id', randomUUID());
    res.set('X-Content-Type-Options', 'nosniff');
    res.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.set('X-Frame-Options', 'DENY');
    res.set('Content-Security-Policy', "frame-ancestors 'none'; object-src 'none'; base-uri 'self'");
    res.on('finish', () => {
      if (res.statusCode < 500 && res.statusCode !== 429) return;
      logger.error(JSON.stringify({
        event: 'http_failure',
        requestId: res.get('X-Request-Id'),
        method: req.method,
        route: req.route?.path,
        status: res.statusCode,
      }));
    });
    next();
  });

  app.use('/api', cors({
    origin: (origin, callback) => callback(null, Boolean(origin && origins.includes(origin))),
  }));
  app.use(compression({
    filter(req, res) {
      return ['GET', 'HEAD'].includes(req.method) && !req.headers.authorization
        && !req.path.startsWith('/api/auth/') && compression.filter(req, res);
    },
  }));
  app.use('/api', express.json({ limit: '16kb' }));
  app.use('/api/auth', (_req, res, next) => {
    res.set('Cache-Control', 'no-store');
    next();
  });
  app.post(['/api/auth/login', '/api/auth/register'], rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 20,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    message: { error: 'Too many attempts. Try again later.' },
  }));
  app.get('/api/health', (_req, res) => {
    res.set('Cache-Control', 'no-store');
    if (!isReady()) return res.status(503).json({ status: 'unavailable' });
    res.json({ status: 'ok' });
  });
  app.use('/api/auth', require('./routes/auth'));
  app.use('/api/schemes', require('./routes/schemes'));
  app.use('/api/eligibility', require('./routes/eligibility'));
  app.use('/api', (_req, res) => res.status(404).json({ error: 'API route not found' }));

  if (staticDir) {
    app.use(express.static(staticDir, {
      index: false,
      setHeaders(res, file) {
        const relative = path.relative(staticDir, file);
        if (relative === 'index.html') res.set('Cache-Control', 'no-cache');
        else if (relative.startsWith(`assets${path.sep}`) && hashedAsset.test(path.basename(file))) {
          res.set('Cache-Control', 'public, max-age=31536000, immutable');
        }
      },
    }));
    app.use('/assets', (_req, res) => res.set('Cache-Control', 'no-store').sendStatus(404));
    app.get('/{*page}', (_req, res) => {
      res.set('Cache-Control', 'no-cache').sendFile(path.join(staticDir, 'index.html'));
    });
  }

  app.use((error, _req, res, next) => {
    if (res.headersSent) return next(error);
    if (error.type === 'entity.parse.failed') return res.status(400).json({ error: 'Invalid JSON' });
    if (error.type === 'entity.too.large') return res.status(413).json({ error: 'Request too large' });
    res.status(500).json({ error: 'Server error', requestId: res.get('X-Request-Id') });
  });

  return app;
}

module.exports = createApp;
