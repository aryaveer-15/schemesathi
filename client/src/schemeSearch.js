import { languages } from './locales/index.js';
import { localizedScheme, stateLabel, translatedScheme } from './schemeText.js';
import { questionWords, schemeAliases, synonyms } from './searchTerms.js';

export function normalizeSearch(text) {
  return String(text ?? '').normalize('NFKC').toLowerCase()
    .replace(/[\u200c\u200d]/g, '').replace(/[^\p{L}\p{M}\p{N}]+/gu, ' ').trim();
}

const words = (text) => normalizeSearch(text).split(' ').filter(Boolean);
const names = (values) => [...new Set(values.map(normalizeSearch).filter(Boolean))];
const namedPhrase = (text, term) => ` ${text} `.includes(` ${term} `);
const groups = synonyms.map(({ terms, schemes }) => ({
  words: names(terms), schemes: new Set(schemes),
}));
const multiwordSynonyms = groups.flatMap((group) => group.words.filter((term) => term.includes(' ')))
  .sort((a, b) => b.length - a.length);

function oneTypo(a, b) {
  if (!/^[a-z]{4,}$/.test(a) || !/^[a-z]{4,}$/.test(b)
    || Math.max(a.length, b.length) < 5 || Math.abs(a.length - b.length) > 1) return false;
  const [short, long] = a.length <= b.length ? [a, b] : [b, a];
  let index = 0;
  while (index < short.length && short[index] === long[index]) index++;
  if (short.length < long.length) return short.slice(index) === long.slice(index + 1);
  if (index === short.length) return false;
  return short.slice(index + 1) === long.slice(index + 1)
    || (short[index] === long[index + 1] && short[index + 1] === long[index]
      && short.slice(index + 2) === long.slice(index + 2));
}

function queryTerms(query) {
  let remaining = ` ${normalizeSearch(query)} `;
  const phrases = [];
  for (const term of multiwordSynonyms) {
    if (namedPhrase(remaining.trim(), term)) {
      remaining = remaining.replaceAll(` ${term} `, ' ');
      phrases.push(term);
    }
  }
  const terms = [...new Set([...words(remaining).filter((word) => !questionWords.has(word)), ...phrases])];
  return terms.map((term) => ({
    term,
    group: groups.find(({ words: equivalents }) => equivalents.includes(term))
      ?? groups.find(({ words: equivalents }) => equivalents.some((value) => oneTypo(term, value))),
  }));
}

export function createSchemeSearch(schemes, lang, t) {
  const rows = schemes.map((scheme) => {
    const titles = typeof scheme.title === 'string' ? [scheme.title] : Object.values(scheme.title ?? {});
    const formalNames = names([
      ...titles, ...languages.map(({ code }) => translatedScheme(scheme.slug, code)),
      ...(schemeAliases[scheme.slug] ?? []), scheme.slug,
    ]);
    const titleTerms = new Set(formalNames.flatMap(words));
    const descriptiveTerms = new Set([
      ...words(localizedScheme(scheme, 'summary', lang)),
      ...words(scheme.state), ...words(stateLabel(scheme.state, t)),
      ...words(scheme.category), ...(scheme.category ? words(t(scheme.category)) : []),
    ]);
    return { scheme, formalNames, titleTerms, descriptiveTerms };
  });

  function named(query, { allowTypos = true, whole = false } = {}) {
    const text = normalizeSearch(query);
    const tokens = words(text);
    let best = 0;
    const found = [];
    for (const { scheme, formalNames } of rows) {
      const rank = formalNames.reduce((score, term) => {
        if (term === text || (!whole && namedPhrase(text, term))) {
          return Math.max(score, words(term).length * 10 + (term === text ? 1 : 0));
        }
        const pattern = words(term);
        if (!allowTypos || pattern.length < 2 || (whole && tokens.length !== pattern.length)) return score;
        const fuzzy = tokens.some((word, i) => {
          if (word !== pattern[0]) return false;
          const errors = pattern.slice(1).flatMap((part, j) => (
            tokens[i + j + 1] === part ? [] : [[tokens[i + j + 1] ?? '', part]]
          ));
          return errors.length === 1 && oneTypo(...errors[0]);
        });
        return fuzzy ? Math.max(score, pattern.length * 10 - 1) : score;
      }, 0);
      if (!rank || rank < best) continue;
      if (rank > best) {
        found.length = 0;
        best = rank;
      }
      found.push(scheme);
    }
    return found;
  }

  function find(query) {
    if (!String(query).trim()) return schemes;
    const terms = queryTerms(query);
    if (!terms.length) return [];
    const direct = named(query, { whole: true });
    if (direct.length) return direct;
    const exact = named(query);
    const ranked = rows.flatMap((row, index) => {
      const scores = terms.map(({ term, group }) => {
        if (group) return group.schemes.has(row.scheme.slug) ? 3 : 0;
        if (row.titleTerms.has(term)) return 5;
        if (row.descriptiveTerms.has(term) || (/^[a-z]{5,}$/.test(term) && row.descriptiveTerms.has(term + 's'))) return 2;
        if ([...row.titleTerms].some((value) => (term.length >= 3 && value.startsWith(term)) || oneTypo(term, value))) return 1;
        return 0;
      });
      if (exact.includes(row.scheme)) return [{ ...row, index, score: 1000 + scores.reduce((a, b) => a + b, 0) }];
      if (scores.includes(0)) return [];
      return [{ ...row, index, score: scores.reduce((a, b) => a + b, 0) }];
    });
    return ranked.sort((a, b) => b.score - a.score || a.index - b.index).map(({ scheme }) => scheme);
  }

  return { find, named };
}
