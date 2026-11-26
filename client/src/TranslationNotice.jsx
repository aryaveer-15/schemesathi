import { useLang } from './useLang';

export default function TranslationNotice() {
  const { lang, t } = useLang();
  if (lang === 'en') return null;
  return <small className="translation-note" lang={lang}>{t('translationUnderReview')}</small>;
}
