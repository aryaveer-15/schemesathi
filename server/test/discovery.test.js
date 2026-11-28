const assert = require('node:assert/strict');
const test = require('node:test');
const catalog = require('../catalog');
const { createSchemeSearch } = require('../../client/src/schemeSearch.js');
const { helpReply } = require('../../client/src/helpTopics.js');
const { getText } = require('../../client/src/locales/index.js');
const { localizedScheme } = require('../../client/src/schemeText.js');

const t = (key) => getText('en', key);
const search = createSchemeSearch(catalog, 'en', t);
const results = (query) => search.find(query).map(({ slug }) => slug).sort();
const groups = [
  [['farmer', 'kisan', 'agriculture', 'किसान', 'kisan ke liye kya scheme hai'],
    ['pm-kisan', 'pm-kisan-maandhan', 'pm-fasal-bima', 'odisha-cm-kisan', 'wb-krishak-bandhu', 'kisan-credit-card', 'soil-health-card']],
  [['pension', 'old age', 'retirement', 'पेंशन'],
    ['atal-pension-yojana', 'nsap-pension', 'pm-shram-yogi-maandhan', 'pm-kisan-maandhan', 'nps-traders']],
  [['scholarship', 'student', 'education', 'छात्रवृत्ति', 'scholrship'],
    ['national-means-merit-scholarship', 'pm-usp-college-scholarship', 'aicte-pragati', 'aicte-saksham',
      'aicte-swanath', 'wb-svmcm', 'wb-kanyashree', 'tn-pudhumai-penn']],
  [['girl', 'beti', 'daughter', 'बेटी'], ['sukanya-samriddhi-yojana', 'aicte-pragati', 'wb-kanyashree', 'tn-pudhumai-penn']],
  [['house', 'awas', 'housing', 'घर'], ['pm-awas-yojana', 'pm-awas-gramin']],
];

for (const [queries, slugs] of groups) {
  test(`catalogue synonyms for ${queries[0]} only match the intended schemes`, () => {
    for (const query of queries) assert.deepEqual(results(query), slugs.slice().sort(), query);
  });
}

test('search uses titles already available in Hindi, Tamil and Urdu', () => {
  const scheme = catalog.find(({ slug }) => slug === 'pm-ujjwala-yojana');
  for (const lang of ['hi', 'ta', 'ur']) {
    const title = localizedScheme(scheme, 'title', lang);
    assert.notEqual(title, scheme.title.en);
    assert.deepEqual(results(title), [scheme.slug]);
  }
});

test('a typed typo can identify a specific scheme in search', () => {
  assert.deepEqual(results('pm ksan'), ['pm-kisan']);
  assert.deepEqual(results('beti ke liye saving scheme'), ['sukanya-samriddhi-yojana']);
  assert.deepEqual(results('scholarship for students with disabilities'), ['aicte-saksham']);
});

test('chat returns only matching catalogue entries for named factual questions', () => {
  for (const [question, expected] of [
    ['When is the AICTE Pragati deadline?', ['aicte-pragati']],
    ['Am I eligible for PM Kisan if I rent land?', ['pm-kisan']],
    ['What do I need for NPS Vatsalya?', ['nps-vatsalya']],
    ['What is the income limit for PM Awas Yojana?', ['pm-awas-gramin', 'pm-awas-yojana']],
  ]) {
    const reply = helpReply(question, t, search);
    assert.deepEqual(Object.keys(reply).sort(), ['named', 'schemes']);
    assert.deepEqual(reply.schemes.map(({ slug }) => slug).sort(), expected);
    reply.schemes.forEach((scheme) => assert.ok(catalog.includes(scheme)));
  }
});

test('chat gives approved navigation, bounded discovery, or an unknown answer', () => {
  assert.deepEqual(helpReply('How do I apply?', t, search), { topic: 'apply' });
  assert.deepEqual(helpReply('How do I register for an account?', t, search), { topic: 'account' });
  assert.deepEqual(helpReply('How do I check eligibility?', t, search), { topic: 'eligibility' });
  for (const query of ['kisan ke liye kya scheme hai', 'किसान के लिए कौन सी योजना है?', 'scholrship']) {
    const reply = helpReply(query, t, search);
    assert.equal(reply.schemes.length, 4, query);
    assert.equal(reply.named, undefined, query);
  }
  for (const query of ['Can you check my Aadhaar status?', 'How do I apply for an unknown scheme?']) {
    assert.deepEqual(helpReply(query, t, search), { topic: 'fallback' }, query);
  }
  const empty = createSchemeSearch([], 'en', t);
  assert.deepEqual(helpReply('When is the AICTE Pragati deadline?', t, empty), { topic: 'fallback' });
});

test('unanswered chat prompts preserve uncertainty and pass catalogue slugs only', () => {
  const reply = helpReply('PM ksan deadline 8675309', t, search);
  assert.equal(reply.unsure, true);
  assert.deepEqual(reply.suggested, ['pm-kisan']);
  assert.deepEqual(reply.schemes.map(({ slug }) => slug), ['pm-kisan']);
  assert.deepEqual(helpReply('?!', t, search), { topic: 'fallback' });
});

test('longer names disambiguate shared aliases without swallowing a separately mentioned scheme', () => {
  assert.deepEqual(results('pmay'), ['pm-awas-gramin', 'pm-awas-yojana']);
  assert.deepEqual(results('pmay gramin income limit'), ['pm-awas-gramin']);
  assert.deepEqual(results('PM Kisan and PM Kisan Maandhan'), ['pm-kisan', 'pm-kisan-maandhan']);
  assert.deepEqual(results('kisan credit crad'), ['kisan-credit-card']);
});

test('discovery respects named states and keeps the relevant subgroup when stripping question qualifiers', () => {
  for (const [query, slugs] of [
    ['ladki ki padhai ke liye paisa', ['aicte-pragati', 'tn-pudhumai-penn', 'wb-kanyashree']],
    ['scholarship for girls in Tamil Nadu', ['aicte-pragati', 'tn-pudhumai-penn']],
    ['pension scheme for retired farmers', ['pm-kisan-maandhan']],
  ]) assert.deepEqual(results(query), slugs, query);
  assert.ok(results('farmer schemes in Odisha').includes('odisha-cm-kisan'));
  assert.ok(!results('farmer schemes in Odisha').includes('wb-krishak-bandhu'));
  assert.deepEqual(helpReply('Karnataka Shakti in Odisha', t, search), { topic: 'fallback' });
  assert.deepEqual(results('tractor chahiye kisan ko'), []);
});
