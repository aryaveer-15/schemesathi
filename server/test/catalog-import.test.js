const assert = require('node:assert/strict');
const { test } = require('node:test');
const { normalizeImport } = require('../seed/catalogImport');
const Scheme = require('../models/Scheme');

const sourceUrl = 'https://data.gov.in/catalog/example';
const sample = {
  slug: 'state-training-sample',
  title: { en: 'Training programme', bn: 'প্রশিক্ষণ কর্মসূচি' },
  summary: 'Training details from the department.',
  sourceUrl: 'https://www.example.gov.in/scheme',
  category: 'education',
  level: 'state',
  state: 'Odisha',
};

test('catalog import supports a national-size feed and preserves available languages', async () => {
  const schemes = Array.from({ length: 5145 }, (_, index) => ({ ...sample, slug: `scheme-${index}` }));
  const catalog = normalizeImport({ sourceUrl, schemes });
  assert.equal(catalog.length, schemes.length);
  assert.deepEqual(catalog[0].title, sample.title);
  assert.equal(catalog[0].sourceDataset, sourceUrl);
  const scheme = new Scheme(catalog[0]);
  await scheme.validate();
  assert.equal(scheme.title.bn, sample.title.bn);
});

test('catalog import rejects invalid URLs, duplicate or maintained slugs, and unsourced rules', () => {
  const normalize = (...schemes) => normalizeImport({ sourceUrl, schemes });
  assert.throws(() => normalize(sample, sample), /repeated/);
  assert.throws(() => normalize({ ...sample, slug: 'pm-kisan' }), /maintained/);
  assert.throws(() => normalize({ ...sample, sourceUrl: 'javascript:alert(1)' }), /HTTPS/);
  assert.throws(() => normalize({ ...sample, eligibilityRules: {} }), /cannot assign/);
  assert.throws(() => normalize({ ...sample, title: { bn: 'প্রশিক্ষণ' } }), /English text/);
  assert.throws(() => normalize({ ...sample, state: '' }), /missing text/);
});
