import { useEffect, useMemo, useState } from 'react';
import { LangContext } from './useLang';
import { getText, languages } from './locales';

const LANGUAGE_KEY = 'schemesathi.language';

function loadLanguage() {
  try {
    const saved = localStorage.getItem(LANGUAGE_KEY);
    if (languages.some(({ code }) => code === saved)) return saved;
  } catch {
    // Storage is optional.
  }
  return 'en';
}

export function LangProvider({ children }) {
  const [lang, setLang] = useState(loadLanguage);

  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = languages.find(({ code }) => code === lang)?.direction ?? 'ltr';
    document.title = getText(lang, 'appName');
    try {
      localStorage.setItem(LANGUAGE_KEY, lang);
    } catch {
      // Storage is optional.
    }
  }, [lang]);

  const value = useMemo(() => ({ lang, setLang, t: (key) => getText(lang, key) }), [lang]);
  return <LangContext.Provider value={value}>{children}</LangContext.Provider>;
}
