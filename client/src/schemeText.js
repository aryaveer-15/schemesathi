import { additionalText } from './locales/index.js';

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

export function translatedScheme(slug, field, lang) {
  const key = catalogKeys.get(slug);
  return key && additionalText(lang, key + (field === 'title' ? 'Title' : 'Summary'));
}

export function localizedScheme(scheme, field, lang) {
  const value = scheme[field];
  const translated = typeof value === 'object' ? value?.[lang] : undefined;
  return translated || translatedScheme(scheme.slug, field, lang)
    || (typeof value === 'string' ? value : value?.en) || '';
}
