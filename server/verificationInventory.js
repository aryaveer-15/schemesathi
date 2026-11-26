const { createHash } = require('node:crypto');
const { readFileSync } = require('node:fs');
const catalog = require('./catalog');
const applications = require('./applicationDirections');
const { questionnaire, documentChecklists, resultDirections } = require('./questionnaire');
const { fromProfile, effectiveInputs } = require('../client/src/eligibilityMatcher.mjs');
const { schemeScope } = require('../client/src/eligibilityContent.js');
const { questionLabel } = require('../client/src/questionnaire.js');
const { schemeQuestionSources } = require('../client/src/schemeQuestionSources.js');

const ageOrIncome = /\b(?:age|aged|income|turnover|years? old|birthday|loan limit)\b|₹|\b(?:rupees?|lakh|crore|INR)\b/i;
const money = /₹|\b(?:rs\.?\s*\d|inr|rupees?|lakhs?|crores?|amount|stipend|premium|subsidy|instalments?)\b/i;
const deadlines = /\b(?:deadline|window|closing date|last date|apply by|intake|cutoff|cut-off|notification|registration period)\b/i;
const matcher = readFileSync(require.resolve('../client/src/eligibilityMatcher.mjs'), 'utf8').replace(/\r\n/g, '\n');
const checks = new Map(questionnaire.map((entry) => [entry.slug, entry]));

function publishedText(scheme, criteria) {
  const lines = [
    ['Catalogue summary', scheme.summary.en],
    ['Questionnaire scope', schemeScope(scheme.slug)],
    ...criteria.map(({ key, question }) => [`Question · ${key}`, question]),
    ...(scheme.eligibilityRequirements ?? []).map(({ en }, index) => [`Catalogue criterion ${index + 1}`, en]),
  ];
  for (const [name, directions] of [['Scheme page', applications[scheme.slug]], ['Results', resultDirections(scheme.slug)]]) {
    for (const [key, text] of Object.entries(directions ?? {})) {
      if (key !== 'url' && typeof text === 'string') lines.push([`${name} · ${key}`, text]);
    }
  }
  return lines.filter(([, text], index) => text && lines.findIndex(([, other]) => other === text) === index);
}

const inventory = catalog.map((scheme) => {
  const check = checks.get(scheme.slug);
  const criteria = Object.entries(check?.criteria ?? {}).map(([key, rule]) => {
    const { question, ...values } = typeof rule === 'string' ? { equals: rule } : rule;
    return { key, question: questionLabel(check, key, question), values, reviewOnMismatch: check.reviewCriteria?.includes(key) ?? false };
  });
  const profileInferences = [fromProfile, effectiveInputs].map(String).join('\n').split('\n').map((line) => line.trim()).filter((line) =>
    criteria.some(({ key }) => line.includes(`answers.${key} `) || line.startsWith(`${key}:`)));
  const copy = publishedText(scheme, criteria);
  const evidence = {
    scheme, criteria, copy, profileInferences, matcher, documents: documentChecklists[scheme.slug],
    checkSource: check?.sourceUrl, applicationUrl: applications[scheme.slug]?.url, publicAccess: check?.publicAccess,
    questionnaireSource: schemeQuestionSources[scheme.slug],
  };
  return {
    ...evidence,
    fingerprint: createHash('sha256').update(JSON.stringify(evidence)).digest('hex'),
    risk: criteria.some(({ key, values }) => /^(age|minorAge)$/.test(key) || Object.hasOwn(values, 'min'))
      || copy.some(([, value]) => ageOrIncome.test(value) || money.test(value)) ? 1
      : copy.some(([, value]) => deadlines.test(value)) ? 2 : 3,
  };
});

module.exports = { inventory, money, deadlines };
