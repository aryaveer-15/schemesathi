const express = require('express');
const { requireAuth } = require('../middleware/auth');
const catalog = require('../catalog');
const applicationDirections = require('../applicationDirections');
const remainingEligibility = require('../remainingEligibility');
const { rules, validProfile } = require('../profileEligibility');
const { effectiveInputs, evaluateLegacy, evaluateProfile } = require('../../client/src/eligibilityMatcher.mjs');
const { questionnaire, documentChecklists, resultDirections } = require('../questionnaire');

const router = express.Router();

const schemes = require('../legacyEligibilityChecks');

const supportedAnswers = new Set(['yes', 'no', 'unknown']);
const profileQuestions = new Set(Object.values(schemes).flatMap(({ criteria }) => Object.keys(criteria)));
const profileSchemes = catalog.filter(({ slug }) => Object.hasOwn(rules, slug));
const additionalSections = profileSchemes
  .filter(({ slug }) => Object.hasOwn(remainingEligibility, slug))
  .map(({ slug, title, sourceUrl }) => ({
    slug, title, sourceUrl: remainingEligibility[slug].sourceUrl ?? sourceUrl,
    questions: Object.entries(remainingEligibility[slug].criteria)
      .map(([key, rule]) => ({ key, text: rule.question })),
  }));

function validAnswers(answers, questions) {
  return answers && typeof answers === 'object' && !Array.isArray(answers)
    && Object.entries(answers).every(([key, value]) => questions.has(key) && supportedAnswers.has(value));
}

function evaluate(answers, rule) {
  return { ...evaluateLegacy(answers, rule), sourceUrl: rule.sourceUrl };
}

function withNextSteps(slug, result) {
  const application = applicationDirections[slug];
  const documents = documentChecklists[slug];
  if (result.status === 'matched') {
    return { ...result, application, nextSteps: resultDirections(slug), documents };
  }
  if (result.status === 'review') {
    const verification = result.checks.some((check) => check.status !== 'unanswered') ? application?.verification : undefined;
    return { ...result, verification, documents };
  }
  return result;
}

router.post('/matches', requireAuth, (req, res) => {
  res.set('Cache-Control', 'no-store');
  const { answers = {}, profile = {} } = req.body ?? {};
  if (!validAnswers(answers, profileQuestions) || !validProfile(profile)
    || (Object.keys(answers).length === 0 && Object.keys(profile).length === 0)) {
    return res.status(400).json({ error: 'Provide at least one recognized answer' });
  }
  const { effectiveAnswers, effectiveProfile } = effectiveInputs(answers, profile);
  const results = Object.entries(schemes).map(([slug, rule]) => ({
    slug, ...withNextSteps(slug, evaluate(effectiveAnswers, rule)),
  }));
  for (const { slug, title, sourceUrl } of profileSchemes) {
    results.push({
      slug, title, sourceUrl: remainingEligibility[slug]?.sourceUrl ?? sourceUrl,
      ...withNextSteps(slug, evaluateProfile(effectiveProfile, rules[slug])),
    });
  }
  res.json({ results, effectiveAnswers });
});

router.get('/profile-checks', (_req, res) => {
  res.json(additionalSections);
});

router.get('/questionnaire', (_req, res) => res.json(questionnaire));

router.get('/:slug', (req, res) => {
  if (!Object.hasOwn(schemes, req.params.slug)) {
    return res.status(404).json({ error: 'Eligibility check unavailable' });
  }
  const { criteria, reviewCriteria, sourceUrl } = schemes[req.params.slug];
  res.json({ criteria, reviewCriteria, sourceUrl });
});

router.post('/:slug', (req, res) => {
  res.set('Cache-Control', 'no-store');
  const { slug } = req.params;
  if (!Object.hasOwn(schemes, slug)) {
    return res.status(404).json({ error: 'Eligibility check unavailable' });
  }

  const { answers, partial } = req.body ?? {};
  const rule = schemes[slug];
  const questions = new Set(Object.keys(rule.criteria));
  if (!validAnswers(answers, questions) || Object.keys(answers).length === 0
    || (partial !== true && Object.keys(answers).length !== questions.size)) {
    return res.status(400).json({ error: 'Provide an answer for each question' });
  }

  res.json(withNextSteps(slug, evaluate(answers, rule)));
});

module.exports = router;
