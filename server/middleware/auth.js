const jwt = require('jsonwebtoken');

const sessionName = 'schemesathi_session';
const audience = 'schemesathi-cookie-v1';

function sessionCookies(req) {
  return (req.headers.cookie || '').split(';').map((part) => part.trim())
    .filter((part) => part.startsWith(sessionName + '='));
}

function requireAuth(req, res, next) {
  const cookies = sessionCookies(req);
  if (!cookies.length) return res.status(401).json({ error: 'Missing token' });
  try {
    const token = cookies[0].slice(sessionName.length + 1);
    if (cookies.length !== 1 || token.length > 2048 || !/^[\w-]+\.[\w-]+\.[\w-]+$/.test(token)) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }
    const payload = jwt.verify(token, process.env.JWT_SECRET, { algorithms: ['HS256'], audience });
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

module.exports = { requireAuth, requireRole, sessionName, sessionCookies, audience };
