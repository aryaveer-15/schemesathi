const express = require('express');
const mongoose = require('mongoose');
const Scheme = require('../models/Scheme');
const applicationDirections = require('../applicationDirections');
const { rules } = require('../profileEligibility');
const { verificationKind } = require('../schemeVerification');
const catalog = new Map(require('../catalog').map((scheme) => [scheme.slug, scheme]));

const router = express.Router();

function escapeRegex(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function publishedScheme(scheme) {
  const entry = catalog.get(scheme.slug);
  if (!entry) return scheme;
  const { title, summary, sourceUrl, eligibilityRequirements, eligibilitySourceUrl } = entry;
  const result = {
    ...scheme, title, summary, sourceUrl, eligibilityRequirements, eligibilitySourceUrl,
    lastVerifiedAt: scheme.lastVerifiedAt ?? null,
    verificationKind: verificationKind(scheme.slug),
  };
  if (Object.hasOwn(rules, scheme.slug)) {
    result.eligibilityMode = Object.keys(rules[scheme.slug]).length ? 'profile' : 'public';
  }
  return result;
}

router.get('/', async (req, res, next) => {
  try {
    const filter = {};
    if (typeof req.query.category === 'string' && req.query.category) {
      filter.category = req.query.category;
    }
    if (typeof req.query.state === 'string' && req.query.state) filter.state = req.query.state;
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
    const { id } = req.params;
    const objectId = mongoose.isValidObjectId(id);
    const validSlug = id.length <= 150 && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(id);
    if (!objectId && !validSlug) {
      return res.status(400).json({ error: 'Invalid scheme id' });
    }
    const legacy = objectId ? await Scheme.findById(id).lean() : null;
    const scheme = legacy ?? (validSlug ? await Scheme.findOne({ slug: id }).lean() : null);
    if (!scheme) return res.status(404).json({ error: 'Scheme not found' });
    const published = publishedScheme(scheme);
    if (Object.hasOwn(applicationDirections, scheme.slug)) published.application = applicationDirections[scheme.slug];
    res.json(published);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
