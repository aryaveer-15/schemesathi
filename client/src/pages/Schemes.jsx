import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation, useNavigationType, useSearchParams } from 'react-router-dom';
import { api } from '../api';
import { useLang } from '../useLang';
import { localizedScheme, schemePath, stateLabel } from '../schemeText';
import { createSchemeSearch } from '../schemeSearch';
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
  const [params, setParams] = useSearchParams();
  const navigation = useNavigationType();
  const location = useLocation();
  const editingQuery = useRef(false);
  const searchInput = useRef(null);
  const query = (params.get('q') ?? '').slice(0, 240);
  const category = params.get('category') ?? '';
  const region = params.get('state') ?? '';
  const suggested = (params.get('suggested') ?? '').slice(0, 8000);
  const filterKey = JSON.stringify([query, category, region, suggested]);
  const [shown, setShown] = useState({ key: null, count: pageSize });
  const visibleCount = shown.key === filterKey ? shown.count : pageSize;
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (navigation === 'POP') {
      editingQuery.current = false;
      searchInput.current.value = query;
    }
  }, [location.key, navigation, query]);

  function updateFilter(key, value) {
    const next = new URLSearchParams();
    for (const [name, current] of [['q', query], ['category', category], ['state', region], ['suggested', suggested]]) {
      if (name === 'suggested' && key === 'q') continue;
      const updated = name === key ? value : current;
      if (updated) next.set(name, updated);
    }
    setParams(next, { replace: key === 'q' && editingQuery.current, preventScrollReset: true });
    editingQuery.current = key === 'q';
  }

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

  const search = useMemo(() => createSchemeSearch(schemes, lang, t), [schemes, lang, t]);
  const filtered = useMemo(() => {
    const slugs = new Set(suggested.split(','));
    return search.find(query).filter((scheme) => (
      (!suggested || slugs.has(scheme.slug))
      && (!category || scheme.category === category)
      && (!region || scheme.level !== 'state' || scheme.state === region)
    ));
  }, [search, query, category, region, suggested]);

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
          ref={searchInput}
          defaultValue={query}
          maxLength={240}
          onChange={(e) => updateFilter('q', e.target.value)}
          onBlur={() => { editingQuery.current = false; }}
          onKeyDown={(e) => { if (e.key === 'Enter') editingQuery.current = false; }}
        />
        <label className="sr-only" htmlFor="scheme-category">
          {t('allCategories')}
        </label>
        <select
          id="scheme-category"
          value={category}
          onChange={(e) => updateFilter('category', e.target.value)}
        >
          <option value="">{t('allCategories')}</option>
          {categories.map((item) => (
            <option key={item} value={item}>
              {t(item)}
            </option>
          ))}
        </select>
        <label className="sr-only" htmlFor="scheme-region">{t('states')}</label>
        <select id="scheme-region" value={region} onChange={(e) => updateFilter('state', e.target.value)}>
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
          {query || category || region || suggested ? (
            <button type="button" className="secondary-action" onClick={() => {
              editingQuery.current = false;
              searchInput.current.value = '';
              setParams({}, { preventScrollReset: true });
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
                <h2><Link to={schemePath(scheme)}>
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
          onClick={() => setShown({ key: filterKey, count: visibleCount + pageSize })}>{t('moreSchemes')}</button></p>
      )}

      <p className="disclaimer" lang="en" dir="ltr">{getText('en', 'disclaimer')}</p>
    </main>
  );
}
