const express = require('express');
const Scheme = require('../models/Scheme');
const applicationDirections = require('../applicationDirections');
const { rules } = require('../profileEligibility');
const { verificationKind } = require('../schemeVerification');
const { boundedText, hasOnlyFields } = require('../requestValidation');
const { categories } = require('../catalogFields');
const { verificationFor } = require('../verification');
const { classifySchemeId, findScheme } = require('../schemeLookup');
const catalog = new Map(require('../catalog').map((scheme) => [scheme.slug, scheme]));

const router = express.Router();

function escapeRegex(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function publishedScheme(scheme) {
  const entry = catalog.get(scheme.slug);
  if (!entry) return { ...scheme, ...verificationFor(scheme.slug) };
  const { title, summary, sourceUrl, eligibilityRequirements, eligibilitySourceUrl } = entry;
  const result = {
    ...scheme, title, summary, sourceUrl, eligibilityRequirements, eligibilitySourceUrl,
    ...verificationFor(scheme.slug),
    verificationKind: verificationKind(scheme.slug),
  };
  if (Object.hasOwn(rules, scheme.slug)) {
    result.eligibilityMode = Object.keys(rules[scheme.slug]).length ? 'profile' : 'public';
  }
  return result;
}

router.get('/', async (req, res, next) => {
  try {
    const { category, state, q } = req.query;
    if (!hasOnlyFields(req.query, ['category', 'state', 'q'])
      || (category !== undefined && category !== '' && !categories.includes(category))
      || (state !== undefined && !boundedText(state, 100))
      || (q !== undefined && !boundedText(q, 240))) {
      return res.status(400).json({ error: 'Invalid scheme filters' });
    }
    const filter = {};
    if (category) filter.category = category;
    if (state?.trim()) filter.state = state.trim();
    const query = q?.trim() ?? '';
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
    const kind = classifySchemeId(id);
    if (!kind) {
      return res.status(400).json({ error: 'Invalid scheme id' });
    }
    const scheme = await findScheme(id, kind);
    if (!scheme) return res.status(404).json({ error: 'Scheme not found' });
    const published = publishedScheme(scheme);
    if (Object.hasOwn(applicationDirections, scheme.slug)) published.application = applicationDirections[scheme.slug];
    res.json(published);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
