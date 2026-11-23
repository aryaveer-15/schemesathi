import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';
import { useLang } from '../useLang';
import { localized } from '../schemeText';

export default function Schemes() {
  const { t, lang } = useLang();
  const [schemes, setSchemes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('');
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

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return schemes.filter((scheme) => {
      if (category && scheme.category !== category) return false;
      if (!q) return true;
      const title = localized(scheme.title, lang).toLowerCase();
      const summary = localized(scheme.summary, lang).toLowerCase();
      const state = scheme.state === 'All India' ? t('allIndia') : scheme.state || '';
      const cat = scheme.category || '';
      return [title, summary, state, cat, t(cat)].some((text) => text.toLowerCase().includes(q));
    });
  }, [schemes, query, category, lang, t]);

  return (
    <main className="page">
      <h1>{t('schemes')}</h1>

      <div className="toolbar">
        <label className="sr-only" htmlFor="scheme-search">
          {t('search')}
        </label>
        <input
          id="scheme-search"
          type="search"
          placeholder={t('search')}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <label className="sr-only" htmlFor="scheme-category">
          {t('allCategories')}
        </label>
        <select
          id="scheme-category"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        >
          <option value="">{t('allCategories')}</option>
          {categories.map((item) => (
            <option key={item} value={item}>
              {t(item)}
            </option>
          ))}
        </select>
      </div>

      {loading ? <p className="status">{t('loading')}…</p> : null}
      {!loading && error ? <p className="alert" role="alert">
        {t('loadFailed')}
        <button type="button" onClick={() => setAttempt((value) => value + 1)}>{t('retry')}</button>
      </p> : null}
      {!loading && !error && filtered.length === 0 ? (
        <p className="status">{t('noSchemes')}</p>
      ) : null}

      {!loading && filtered.length > 0 ? (
        <ul className="grid">
          {filtered.map((scheme) => (
            <li key={scheme._id} className="card scheme-card">
              <h2><Link to={`/schemes/${scheme._id}`}>{localized(scheme.title, lang)}</Link></h2>
              <p className="meta">
                <span>{t(scheme.category)}</span>
                {scheme.state ? <span>{scheme.state === 'All India' ? t('allIndia') : scheme.state}</span> : null}
              </p>
              <p>{localized(scheme.summary, lang)}</p>
            </li>
          ))}
        </ul>
      ) : null}

      <p className="disclaimer">{t('disclaimer')}</p>
    </main>
  );
}
