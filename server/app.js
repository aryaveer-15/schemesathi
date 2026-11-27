const { randomUUID } = require('node:crypto');
const path = require('node:path');
const express = require('express');
const cors = require('cors');
const { rateLimit } = require('express-rate-limit');
const compression = require('compression');
const helmet = require('helmet');
const { createSchemePages } = require('./schemeMetadata');

const catalog = require('./catalog');

const hashedAsset = /-[\w-]{8}\.[a-z0-9]+$/i;

function createApp({ origins = [], proxyHops = 0, isReady = () => true, staticDir, logger = console,
  siteOrigin, production = false, cspReportOnly = true } = {}) {
  const app = express();
  const trustedOrigins = new Set(production ? [siteOrigin].filter(Boolean) : [...origins, siteOrigin].filter(Boolean));
  app.locals.production = production;
  app.disable('x-powered-by');
  app.set('trust proxy', proxyHops);
  app.set('query parser', 'simple');
  app.use(helmet({
    strictTransportSecurity: production ? { maxAge: 31536000, includeSubDomains: false } : false,
    crossOriginResourcePolicy: false,
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
    xFrameOptions: { action: 'deny' },
    contentSecurityPolicy: {
      reportOnly: cspReportOnly,
      directives: {
        baseUri: ["'self'"],
        connectSrc: ["'self'"],
        fontSrc: ["'self'"],
        formAction: ["'self'"],
        frameAncestors: ["'none'"],
        imgSrc: ["'self'", 'data:'],
        styleSrc: ["'self'"],
        upgradeInsecureRequests: null,
      },
    },
  }));

  app.use((req, res, next) => {
    res.set('X-Request-Id', randomUUID());
    if (cspReportOnly) res.set('Content-Security-Policy', "frame-ancestors 'none'; object-src 'none'; base-uri 'self'");
    const started = process.hrtime.bigint();
    res.on('finish', () => {
      const failure = res.statusCode >= 500 || res.statusCode === 429;
      const log = failure ? logger.error : logger.info;
      log?.call(logger, JSON.stringify({
        event: failure ? 'http_failure' : 'http_request',
        requestId: res.get('X-Request-Id'),
        method: req.method,
        route: typeof req.route?.path === 'string' ? req.route.path : 'unmatched',
        status: res.statusCode,
        durationMs: Math.round(Number(process.hrtime.bigint() - started) / 1e6),
      }));
    });
    next();
  });

  app.use('/api', cors({
    origin: (origin, callback) => callback(null, Boolean(origin && origins.includes(origin))),
    methods: ['GET', 'HEAD', 'POST', 'OPTIONS'],
    credentials: !production,
    allowedHeaders: ['X-SchemeSathi-Request', 'Content-Type'],
  }));
  app.use(compression({
    filter(req, res) {
      return ['GET', 'HEAD'].includes(req.method) && !req.headers.cookie && !req.headers.authorization
        && !req.path.startsWith('/api/auth/') && compression.filter(req, res);
    },
  }));
  app.use('/api/auth', (_req, res, next) => {
    res.set('Cache-Control', 'no-store');
    next();
  });
  const limit = (max, windowMs, skip) => rateLimit({
    windowMs,
    limit: max,
    skip,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    message: { error: 'Too many attempts. Try again later.' },
  });
  app.use('/api/auth', limit(20, 15 * 60 * 1000, (req) => ['GET', 'HEAD'].includes(req.method)));
  app.use('/api/auth', limit(120, 15 * 60 * 1000, (req) => !['GET', 'HEAD'].includes(req.method)));
  app.use('/api/eligibility', (req, res, next) => {
    if (!['GET', 'HEAD', 'OPTIONS'].includes(req.method)) res.set('Cache-Control', 'no-store');
    next();
  });
  app.use('/api/eligibility', limit(90, 60 * 1000, (req) => ['GET', 'HEAD', 'OPTIONS'].includes(req.method)));
  app.use('/api', (req, res, next) => {
    if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) return next();
    if (!trustedOrigins.has(req.get('Origin')) || req.get('X-SchemeSathi-Request') !== '1') {
      return res.status(403).json({ error: 'Request origin could not be confirmed' });
    }
    next();
  });
  app.use('/api', express.json({ limit: '16kb', inflate: false }));
  app.get('/api/health/live', (_req, res) => {
    res.set('Cache-Control', 'no-store').json({ status: 'ok' });
  });
  app.get('/api/health', (_req, res) => {
    res.set('Cache-Control', 'no-store');
    if (!isReady()) return res.status(503).json({ status: 'unavailable' });
    res.json({ status: 'ok' });
  });
  app.use('/api/auth', require('./routes/auth'));
  app.use('/api/schemes', require('./routes/schemes'));
  app.use('/api/eligibility', require('./routes/eligibility'));
  app.use('/api', (_req, res) => res.status(404).json({ error: 'API route not found' }));

  const paths = ['/', '/schemes', ...catalog.map(({ slug }) => '/schemes/' + encodeURIComponent(slug))];
  const sitemap = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...paths.map((pathname) => '  <url><loc>' + (siteOrigin + pathname).replaceAll('&', '&amp;') + '</loc></url>'),
    '</urlset>',
  ].join('\n');

  function crawlerFile(type, body) {
    return (_req, res) => {
      res.set('Cache-Control', 'no-cache');
      if (!siteOrigin) return res.status(503).type('text').send('Public site origin is not configured.');
      res.type(type).send(body);
    };
  }
  app.get('/sitemap.xml', crawlerFile('application/xml', sitemap));
  app.get('/robots.txt', crawlerFile('text', 'User-agent: *\nAllow: /\nDisallow: /api\nSitemap: ' + siteOrigin + '/sitemap.xml\n'));

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
    app.get('/schemes/:id', createSchemePages(staticDir, siteOrigin));
    app.get('/{*page}', (_req, res) => {
      res.set('Cache-Control', 'no-cache').sendFile(path.join(staticDir, 'index.html'));
    });
  }

  app.use((error, _req, res, _next) => {
    if (res.headersSent) return res.destroy();
    if (error.type === 'entity.parse.failed') return res.status(400).json({ error: 'Invalid JSON' });
    if (error.type === 'entity.too.large') return res.status(413).json({ error: 'Request too large' });
    if (error.type === 'encoding.unsupported' || error.type === 'charset.unsupported') {
      return res.status(415).json({ error: 'Unsupported request encoding' });
    }
    if (error instanceof URIError && error.status === 400) return res.status(400).json({ error: 'Invalid request path' });
    res.status(500).json({ error: 'Server error', requestId: res.get('X-Request-Id') });
  });

  return app;
}

module.exports = createApp;
