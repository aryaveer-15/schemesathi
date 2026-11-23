export function localized(value, lang) {
  if (!value) return '';
  if (typeof value === 'string') return value;
  return value[lang] || value.en || '';
}
