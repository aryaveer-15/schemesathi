const catalog = require('../catalog');
const applications = require('../applicationDirections');
const { questionnaire, documentChecklists, resultDirections } = require('../questionnaire');
const { dictionaries } = require('../../client/src/locales/index.js');
const { criticalKeys } = require('../../client/src/locales/criticalKeys.js');

const critical = new Map(Object.entries(dictionaries.en).filter(([key]) => criticalKeys.has(key)));
const interfaceText = new Map(Object.entries(dictionaries.en).filter(([key]) => !criticalKeys.has(key)));

function add(key, source) {
  if (source) critical.set(key, source);
}
for (const { slug, summary, eligibilityRequirements } of catalog) {
  add('summary.' + slug, summary.en);
  eligibilityRequirements?.forEach(({ en }, index) => add('criterion.' + slug + '.' + index, en));
  for (const [key, rule] of Object.entries(questionnaire.find((entry) => entry.slug === slug).criteria)) {
    add('question.' + slug + '.' + key, rule.question);
  }
  for (const field of ['online', 'visit', 'verification']) {
    const original = applications[slug]?.[field];
    add('application.' + slug + '.' + field, original);
    const result = resultDirections(slug)[field];
    if (field !== 'verification' && result && result !== original) add('result.' + slug + '.' + field, result);
  }
  const documents = documentChecklists[slug];
  add('document.' + slug + '.scope', documents?.scope);
  documents?.items.forEach((item, index) => add('document.' + slug + '.' + index, item));
}

module.exports = { critical, interfaceText, sources: new Map([...critical, ...interfaceText]) };
