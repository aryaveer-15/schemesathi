import { getText } from './locales';
import { approvedText } from './locales/reviewedText';
import { useLang } from './useLang';

export default function ReviewText({ as: Element = 'span', reviewKey, alternateKey, source, values, ...props }) {
  const { lang } = useLang();
  const english = source ?? getText('en', reviewKey);
  const translation = approvedText(lang, reviewKey, english)
    ?? (alternateKey ? approvedText(lang, alternateKey, english) : null);
  const text = translation ?? english;
  const rendered = values ? text.replace(/\{([\w.]+)\}/g, (token, key) => values[key] ?? token) : text;
  return <Element {...props} lang={translation ? lang : 'en'} dir={translation && lang === 'ur' ? 'rtl' : 'ltr'}>
    {rendered}
  </Element>;
}
