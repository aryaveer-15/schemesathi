/* global __SCHEMESATHI_REVIEWS__ */
const published = typeof __SCHEMESATHI_REVIEWS__ === 'undefined' ? {} : __SCHEMESATHI_REVIEWS__;

export function hasApproval(lang, key, entries = published) {
  return Object.hasOwn(entries, lang) && Object.hasOwn(entries[lang], key);
}

export function approvedText(lang, key, english, entries = published) {
  if (lang === 'en' || !hasApproval(lang, key, entries)) return null;
  const row = entries[lang][key];
  return row.english === english ? row.text : null;
}
