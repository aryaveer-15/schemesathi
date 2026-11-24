const express = require('express');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

const schemes = {
  'atal-pension-yojana': {
    sourceUrl: 'https://pfrda.org.in/web/pfrda/w/faqs/atal-pension-yojana',
    criteria: {
      pensionAge: 'yes',
      citizen: 'yes',
      savings: 'yes',
      taxpayer: 'no',
      pensionAccount: 'no',
    },
  },
  'sukanya-samriddhi-yojana': {
    sourceUrl: 'https://www.nsiindia.gov.in/writereaddata/SchemeRules/SukanyaSamriddhiAccountSchemeRule.pdf',
    criteria: {
      guardian: 'yes',
      childAge: 'yes',
      childResident: 'yes',
      childAccount: 'no',
      familyAccounts: 'no',
    },
    reviewCriteria: ['familyAccounts'],
  },
  'pm-kisan': {
    sourceUrl: 'https://pmkisan.gov.in/Documents/RevisedPM-KISANOperationalGuidelines%28English%29.pdf',
    criteria: {
      land: 'yes',
      exclusions: 'no',
      landReview: 'no',
    },
    reviewCriteria: ['landReview'],
  },
  'ayushman-bharat-pmjay': {
    sourceUrl: 'https://beneficiary.nha.gov.in/',
    criteria: {
      beneficiary: 'yes',
    },
    reviewCriteria: ['beneficiary'],
  },
  'pm-ujjwala-yojana': {
    sourceUrl: 'https://www.pmuy.gov.in/Ujjwala2.html',
    criteria: {
      adultWoman: 'yes',
      lpg: 'no',
      deprivation: 'yes',
    },
  },
  'pm-awas-yojana': {
    sourceUrl: 'https://pmay-urban.gov.in/uploads/guidelines/Operational-Guidelines-of-PMAY-U-2.pdf',
    criteria: {
      urban: 'yes',
      house: 'no',
      housingBenefit: 'no',
      housingIncome: 'yes',
    },
  },
  'nsap-pension': {
    sourceUrl: 'https://www.pib.gov.in/PressReleasepage.aspx?PRID=2323264&lang=1&reg=48',
    criteria: {
      poverty: 'yes',
      pensionCategory: 'yes',
    },
    reviewCriteria: ['pensionCategory'],
  },
  'pm-mudra-yojana': {
    sourceUrl: 'https://www.financialservices.gov.in/pradhan-mantri-mudra-yojana-pmmy',
    criteria: {
      business: 'yes',
      loanLimit: 'yes',
    },
  },
};

const supportedAnswers = new Set(['yes', 'no', 'unknown']);
const profileQuestions = new Set(Object.values(schemes).flatMap(({ criteria }) => Object.keys(criteria)));

function validAnswers(answers, questions) {
  return answers && typeof answers === 'object' && !Array.isArray(answers)
    && Object.entries(answers).every(([key, value]) => questions.has(key) && supportedAnswers.has(value));
}

function evaluate(answers, { criteria, sourceUrl, reviewCriteria = [] }) {
  const checks = Object.entries(criteria).map(([key, expected]) => {
    if (!Object.hasOwn(answers, key)) return { key, status: 'unanswered' };
    if (answers[key] === expected) return { key, status: 'matched' };
    if (answers[key] === 'unknown' || reviewCriteria.includes(key)) return { key, status: 'review' };
    return { key, status: 'unmatched' };
  });
  let status = 'matched';
  if (checks.some((check) => check.status !== 'matched')) status = 'review';
  if (checks.some((check) => check.status === 'unmatched')) status = 'unmatched';
  return { status, checks, sourceUrl };
}

router.post('/matches', requireAuth, (req, res) => {
  res.set('Cache-Control', 'no-store');
  const { answers } = req.body ?? {};
  if (!validAnswers(answers, profileQuestions) || Object.keys(answers).length === 0) {
    return res.status(400).json({ error: 'Provide at least one recognized answer' });
  }
  const results = Object.entries(schemes).map(([slug, rule]) => ({ slug, ...evaluate(answers, rule) }));
  res.json({ results });
});

router.get('/:slug', (req, res) => {
  if (!Object.hasOwn(schemes, req.params.slug)) {
    return res.status(404).json({ error: 'Eligibility check unavailable' });
  }
  res.json({ sourceUrl: schemes[req.params.slug].sourceUrl });
});

router.post('/:slug', (req, res) => {
  const { slug } = req.params;
  if (!Object.hasOwn(schemes, slug)) {
    return res.status(404).json({ error: 'Eligibility check unavailable' });
  }

  const { answers } = req.body ?? {};
  const rule = schemes[slug];
  const questions = new Set(Object.keys(rule.criteria));
  if (!validAnswers(answers, questions) || Object.keys(answers).length !== questions.size) {
    return res.status(400).json({ error: 'Provide an answer for each question' });
  }

  res.json(evaluate(answers, rule));
});

module.exports = router;
