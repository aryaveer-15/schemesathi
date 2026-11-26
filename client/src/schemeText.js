import { additionalTranslations } from './locales/index.js';

export function schemePath(scheme) {
  return '/schemes/' + encodeURIComponent(scheme.slug || scheme._id);
}

const catalogKeys = new Map([
  ['atal-pension-yojana', 'atal'],
  ['sukanya-samriddhi-yojana', 'sukanya'],
  ['pm-kisan', 'kisan'],
  ['ayushman-bharat-pmjay', 'pmjay'],
  ['pm-ujjwala-yojana', 'ujjwala'],
  ['pm-awas-yojana', 'awas'],
  ['nsap-pension', 'nsap'],
  ['pm-mudra-yojana', 'mudra'],
]);

export function translatedScheme(slug, lang) {
  const key = catalogKeys.get(slug);
  return key && additionalTranslations[lang]?.[key + 'Title'];
}

export function localizedScheme(scheme, field, lang) {
  const value = scheme[field];
  const english = (typeof value === 'string' ? value : value?.en) ?? '';
  if (field === 'summary') return english;
  const translated = typeof value === 'object' ? value?.[lang] : undefined;
  return translated || translatedScheme(scheme.slug, lang) || english;
}

const stateKeys = {
  'All India': 'allIndia',
  Karnataka: 'stateKarnataka',
  Maharashtra: 'stateMaharashtra',
  Odisha: 'stateOdisha',
  'Tamil Nadu': 'stateTamilNadu',
  'West Bengal': 'stateWestBengal',
};

export function stateLabel(state, t) {
  return Object.hasOwn(stateKeys, state) ? t(stateKeys[state]) : state;
}
