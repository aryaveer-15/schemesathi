import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';
import { useLang } from '../useLang';
import { localizedScheme, stateLabel } from '../schemeText';
import { schemeQuestions } from '../eligibilityContent';
import SchemeBanner from '../SchemeBanner';
import TranslationNotice from '../TranslationNotice';
import LoadingState from '../LoadingState';
import { getText } from '../locales';

const pageSize = 24;

export default function Schemes() {
  const { t, lang } = useLang();
  const [schemes, setSchemes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('');
  const [region, setRegion] = useState('');
  const [visibleCount, setVisibleCount] = useState(pageSize);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError('');
      try {
        const data = await api('/api/schemes');
        if (!cancelled) {
          setSchemes(Array.isArray(data) ? data : []);
        }
      } catch (err) {
        if (!cancelled) {
          setSchemes([]);
          setError(err.message);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [attempt]);

  const categories = useMemo(() => {
    return [...new Set(schemes.map((scheme) => scheme.category).filter(Boolean))].sort();
  }, [schemes]);

  const regions = useMemo(() => [...new Set(schemes
    .filter((scheme) => scheme.level === 'state' && scheme.state && scheme.state !== 'All India')
    .map((scheme) => scheme.state))].sort(), [schemes]);

  const filtered = useMemo(() => {
    const q = query.trim().normalize('NFC').toLowerCase();
    return schemes.filter((scheme) => {
      if (category && scheme.category !== category) return false;
      if (region && scheme.level === 'state' && scheme.state !== region) return false;
      if (!q) return true;
      const title = localizedScheme(scheme, 'title', lang);
      const summary = localizedScheme(scheme, 'summary', lang);
      const state = scheme.state || '';
      const cat = scheme.category || '';
      return [title, summary, state, stateLabel(state, t), cat, cat ? t(cat) : '', localizedScheme(scheme, 'title', 'en')]
        .some((text) => text.normalize('NFC').toLowerCase().includes(q));
    });
  }, [schemes, query, category, region, lang, t]);

  return (
    <main className="page catalog-page">
      <h1>{t('schemes')}</h1>

      <div className="toolbar catalog-toolbar">
        <label className="sr-only" htmlFor="scheme-search">
          {t('search')}
        </label>
        <input
          id="scheme-search"
          type="search"
          placeholder={t('search')}
          value={query}
          onChange={(e) => { setQuery(e.target.value); setVisibleCount(pageSize); }}
        />
        <label className="sr-only" htmlFor="scheme-category">
          {t('allCategories')}
        </label>
        <select
          id="scheme-category"
          value={category}
          onChange={(e) => { setCategory(e.target.value); setVisibleCount(pageSize); }}
        >
          <option value="">{t('allCategories')}</option>
          {categories.map((item) => (
            <option key={item} value={item}>
              {t(item)}
            </option>
          ))}
        </select>
        <label className="sr-only" htmlFor="scheme-region">{t('states')}</label>
        <select id="scheme-region" value={region} onChange={(e) => {
          setRegion(e.target.value);
          setVisibleCount(pageSize);
        }}>
          <option value="">{t('allRegions')}</option>
          {regions.map((state) => <option key={state} value={state}>{stateLabel(state, t)}</option>)}
        </select>
      </div>

      {loading ? <LoadingState variant="catalog" /> : null}
      {!loading && error ? <div className="alert feedback" role="alert">
        <p>{t('loadFailed')}</p>
        <button type="button" onClick={() => setAttempt((value) => value + 1)}>{t('retry')}</button>
      </div> : null}
      {!loading && !error && filtered.length === 0 ? (
        <section className="card feedback empty-state">
          <p role="status">{t('noSchemes')}</p>
          {query || category || region ? (
            <button type="button" className="secondary-action" onClick={() => {
              setQuery('');
              setCategory('');
              setRegion('');
              setVisibleCount(pageSize);
            }}>{t('browse')}</button>
          ) : (
            <button type="button" className="secondary-action"
              onClick={() => setAttempt((value) => value + 1)}>{t('retry')}</button>
          )}
        </section>
      ) : null}

      <TranslationNotice />
      {!loading && filtered.length > 0 ? (
        <ul className="scheme-list">
          {filtered.slice(0, visibleCount).map((scheme, index) => (
            <li key={scheme._id} className="scheme-card" data-category={scheme.category}>
              <SchemeBanner slug={scheme.slug} category={scheme.category} priority={index === 0} />
              <div className="scheme-card-copy">
                <p className="meta">
                  <span>{t(scheme.category)}</span>
                  {scheme.state ? <span>{stateLabel(scheme.state, t)}</span> : null}
                </p>
                <h2><Link to={`/schemes/${scheme._id}`}>
                  {localizedScheme(scheme, 'title', lang)} <span className="direction-arrow" aria-hidden="true">→</span>
                </Link></h2>
                <p lang="en" dir="ltr">{localizedScheme(scheme, 'summary', lang)}</p>
                {scheme.eligibilityMode === 'public' && <p className="muted" lang="en" dir="ltr">{getText('en', 'publicSchemeAccess')}</p>}
                {!scheme.eligibilityMode && !Object.hasOwn(schemeQuestions, scheme.slug) && (
                  <p className="muted catalog-coverage">{t('officialCheck')}</p>
                )}
              </div>
            </li>
          ))}
        </ul>
      ) : null}

      {!loading && filtered.length > visibleCount && (
        <p><button type="button" className="secondary-action catalog-more"
          onClick={() => setVisibleCount((value) => value + pageSize)}>{t('moreSchemes')}</button></p>
      )}

      <p className="disclaimer" lang="en" dir="ltr">{getText('en', 'disclaimer')}</p>
    </main>
  );
}
