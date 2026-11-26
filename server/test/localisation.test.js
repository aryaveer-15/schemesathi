const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { test } = require('node:test');
const { questionnaire } = require('../questionnaire');

const { dictionaries, languages, getText } = require('../../client/src/locales/index.js');
const english = dictionaries.en;
const clientSource = path.resolve(__dirname, '../../client/src');

function protectTokens(text) {
  const tokens = text.match(/https?:\/\/[^\s<>()]+|\{[\w.]+\}|[₹%]|\p{Nd}+(?:[.,]\p{Nd}+)*/gu) ?? [];
  return tokens.map((token) => {
    if (/^https?:\/\//.test(token)) return token;
    return token.replace(/\p{Nd}/gu, (digit) => {
      const value = digit.codePointAt(0);
      let zero = value;
      while (/\p{Nd}/u.test(String.fromCodePoint(zero - 1))) zero--;
      return String((value - zero) % 10);
    });
  }).sort();
}

test('every language file exposes the same nonempty keys as the English source', () => {
  for (const { code } of languages) {
    const file = require(`../../client/src/locales/${code}.js`).default;
    assert.equal(file, dictionaries[code]);
    assert.deepEqual(Object.keys(file).sort(), Object.keys(english).sort(), code);
    for (const [key, text] of Object.entries(file)) {
      assert.ok(typeof text === 'string' && text.trim(), `${code} ${key}`);
    }
    if (code !== 'en') assert.notEqual(file.translationUnderReview, english.translationUnderReview, code);
  }
});

test('numbers, currency, official links and placeholders survive locale lookups', () => {
  for (const { code } of languages) {
    for (const [key, text] of Object.entries(dictionaries[code])) {
      assert.deepEqual(protectTokens(text), protectTokens(english[key]), `${code} ${key}`);
    }
  }
  const fixture = 'From age 18, use {officialUrl} or https://example.gov.in/forms/20 for ₹500.';
  for (const candidate of [
    fixture.replace('18', '19'), fixture.replace('{officialUrl}', ''), fixture.replace('forms/20', 'forms/21'),
    fixture.replace('₹500', '500'),
  ]) {
    assert.notDeepEqual(protectTokens(candidate), protectTokens(fixture));
  }
});

test('scheme prompts, limits and critical guidance use the same English source for unreviewed languages', () => {
  const profileKeys = { age: 'profileAge', savings: 'profileSavings', autoDebit: 'profileDebit' };
  const keys = new Set([
    'housingScope', 'healthScope', 'pensionScope', 'disclaimer', 'preliminaryResultNotice', 'possibleMatches',
    'likelyMatches', 'notMatched', 'publicAccessResults', 'publicSchemeAccess', 'documentFallback',
    'familyException', 'expectedAnswer', 'unmetReason', 'ageRequired', 'ageRange', 'ageAtLeast',
    'uncertainReason', 'missingReason', 'authorityReviewReason', 'verifyOfficialList', 'verifyLocally',
    'verifyListAndLocally', 'helpApplyAnswer',
  ]);
  for (const { criteria, group } of questionnaire) {
    for (const [key, rule] of Object.entries(criteria)) {
      if (!rule.question) keys.add((group === 'profile' && profileKeys[key]) || key);
    }
  }
  for (const key of keys) {
    assert.ok(Object.hasOwn(english, key), key);
    for (const { code } of languages) assert.equal(getText(code, key), english[key], `${code} ${key}`);
  }
});

test('all static UI lookups resolve and unknown keys cannot be displayed verbatim', () => {
  for (const file of fs.readdirSync(clientSource, { recursive: true })) {
    if (!file.endsWith('.jsx')) continue;
    const content = fs.readFileSync(path.join(clientSource, file), 'utf8');
    for (const [, key] of content.matchAll(/\b(?:t|local|english)\(['"]([^'"]+)['"]\)/g)) {
      assert.ok(Object.hasOwn(english, key), `${file} uses missing key ${key}`);
    }
  }
  for (const { code } of languages) {
    for (const unknown of ['results.title', 'constructor', '__proto__']) {
      assert.equal(getText(code, unknown), dictionaries[code].labelUnavailable);
    }
  }
});
