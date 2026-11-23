const express = require('express');
const mongoose = require('mongoose');
const Scheme = require('../models/Scheme');
const catalog = new Map(require('../catalog').map((scheme) => [scheme.slug, scheme]));

const router = express.Router();

function escapeRegex(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function publishedScheme(scheme) {
  const entry = catalog.get(scheme.slug);
  if (!entry) return scheme;
  const { title, summary, sourceUrl } = entry;
  return { ...scheme, title, summary, sourceUrl };
}

router.get('/', async (req, res, next) => {
  try {
    const filter = {};
    if (typeof req.query.category === 'string' && req.query.category) {
      filter.category = req.query.category;
    }
    const query = typeof req.query.q === 'string' ? req.query.q.trim() : '';
    const match = new RegExp(escapeRegex(query), 'i');
    const schemes = (await Scheme.find(filter).lean()).map(publishedScheme)
      .filter((scheme) => !query || [scheme.title, scheme.summary].some((field) => (
        Object.values(field ?? {}).some((value) => match.test(value))
      )))
      .sort((a, b) => (a.title?.en ?? '').localeCompare(b.title?.en ?? '', 'en'));
    res.json(schemes);
  } catch (err) {
    next(err);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ error: 'Invalid scheme id' });
    }
    const scheme = await Scheme.findById(req.params.id).lean();
    if (!scheme) return res.status(404).json({ error: 'Scheme not found' });
    res.json(publishedScheme(scheme));
  } catch (err) {
    next(err);
  }
});

module.exports = router;
