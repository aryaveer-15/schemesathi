const jwt = require('jsonwebtoken');

function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  if (!header) return res.status(401).json({ error: 'Missing token' });
  try {
    if (header.length > 2048 || !/^Bearer [\w-]+\.[\w-]+\.[\w-]+$/.test(header)) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }
    const payload = jwt.verify(header.slice(7), process.env.JWT_SECRET, { algorithms: ['HS256'] });
    if (typeof payload.id !== 'string' || !/^[0-9a-f]{24}$/i.test(payload.id)
      || !['user', 'editor', 'admin'].includes(payload.role) || !Number.isSafeInteger(payload.exp)) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }
    req.user = { id: payload.id, role: payload.role };
    next();
  } catch (err) {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    next();
  };
}

module.exports = { requireAuth, requireRole };
