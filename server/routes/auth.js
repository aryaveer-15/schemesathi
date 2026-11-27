const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { requireAuth, sessionName, sessionCookies, audience } = require('../middleware/auth');
const { boundedText, hasOnlyFields } = require('../requestValidation');

const router = express.Router();
const emailFormat = /^[^\s@]+@[^\s@]+\.[^\s@]+$/u;
const dummyHash = bcrypt.hashSync('invalid login timing equalizer', 10);
const preferredLanguages = ['en', 'hi', 'kn'];

function readEmail(value) {
  if (!boundedText(value, 254)) return null;
  const email = value.trim().toLowerCase();
  return email.length <= 254 && emailFormat.test(email) ? email : null;
}

const lifetime = 7 * 24 * 60 * 60;

function cookieOptions(req) {
  return { httpOnly: true, secure: req.app.locals.production, sameSite: 'lax', path: '/api' };
}

function signToken(user) {
  return jwt.sign({ id: String(user._id), role: user.role }, process.env.JWT_SECRET, { algorithm: 'HS256', expiresIn: lifetime, audience });
}

function publicUser(user) {
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    preferredLanguage: user.preferredLanguage,
  };
}

router.post('/register', async (req, res, next) => {
  try {
    if (!hasOnlyFields(req.body, ['name', 'email', 'password', 'preferredLanguage'])) {
      return res.status(400).json({ error: 'Invalid registration details' });
    }
    const { name, password, preferredLanguage } = req.body;
    const email = readEmail(req.body.email);
    if (!boundedText(name, 120) || !name.trim() || !email || typeof password !== 'string'
      || (preferredLanguage !== undefined && !preferredLanguages.includes(preferredLanguage))) {
      return res.status(400).json({ error: 'Enter a valid name, email and password' });
    }
    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }
    if (bcrypt.truncates(password)) {
      return res.status(400).json({ error: 'Password must be 72 UTF-8 bytes or fewer' });
    }
    const exists = await User.findOne({ email }).select('_id').lean();
    if (exists) return res.status(409).json({ error: 'Email already registered' });

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({
      name: name.trim(),
      email,
      passwordHash,
      preferredLanguage: preferredLanguage ?? 'en',
    });
    res.status(201).cookie(sessionName, signToken(user), { ...cookieOptions(req), maxAge: lifetime * 1000 })
      .json({ user: publicUser(user) });
  } catch (err) {
    if (err.code === 11000) return res.status(409).json({ error: 'Email already registered' });
    next(err);
  }
});

router.post('/login', async (req, res, next) => {
  try {
    if (!hasOnlyFields(req.body, ['email', 'password'])) {
      return res.status(400).json({ error: 'Enter a valid email and password' });
    }
    const email = readEmail(req.body.email);
    const { password } = req.body;
    // Retain bcrypt's existing comparison for accounts created before signup validation.
    if (!email || typeof password !== 'string' || !password || password.length > 16384) {
      return res.status(400).json({ error: 'Enter a valid email and password' });
    }
    const user = await User.findOne({ email });
    const ok = await bcrypt.compare(password, user?.passwordHash ?? dummyHash);
    if (!user || !ok) return res.status(401).json({ error: 'Invalid email or password' });
    res.cookie(sessionName, signToken(user), { ...cookieOptions(req), maxAge: lifetime * 1000 })
      .json({ user: publicUser(user) });
  } catch (err) {
    next(err);
  }
});

router.post('/logout', (req, res) => {
  res.clearCookie(sessionName, cookieOptions(req)).status(204).end();
});

// Anonymous visitors can restore the navbar without generating a failed request.
router.get('/session', (req, res, next) => {
  if (!sessionCookies(req).length) {
    return res.json({ user: null });
  }
  next();
});
router.get(['/session', '/me'], requireAuth, async (req, res) => {
  const user = await User.findById(req.user.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json({ user: publicUser(user) });
});

module.exports = router;
