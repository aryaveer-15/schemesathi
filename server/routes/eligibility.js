const express = require('express');

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
  const { criteria, sourceUrl, reviewCriteria = [] } = schemes[slug];
  const entries = Object.entries(criteria);
  if (!answers || typeof answers !== 'object' || Array.isArray(answers)
    || Object.keys(answers).length !== entries.length
    || entries.some(([key]) => !Object.hasOwn(answers, key)
      || !['yes', 'no', 'unknown'].includes(answers[key]))) {
    return res.status(400).json({ error: 'Provide an answer for each question' });
  }

  const checks = entries.map(([key, expected]) => {
    if (answers[key] === expected) return { key, status: 'matched' };
    if (answers[key] === 'unknown' || reviewCriteria.includes(key)) {
      return { key, status: 'review' };
    }
    return { key, status: 'unmatched' };
  });
  let status = 'matched';
  if (checks.some((check) => check.status === 'review')) status = 'review';
  if (checks.some((check) => check.status === 'unmatched')) status = 'unmatched';

  res.json({ status, checks, sourceUrl });
});

module.exports = router;
