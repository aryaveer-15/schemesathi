import { Component, lazy, Suspense, useEffect, useRef } from 'react';
import { Link, Navigate, NavLink, Route, Routes, useLocation } from 'react-router-dom';
import { useAuth } from './useAuth';
import { useLang } from './useLang';
import { languages } from './locales';
import Home from './pages/Home';
import FindSchemesLink from './FindSchemesLink';
import LoadingState from './LoadingState';

const Schemes = lazy(() => import('./pages/Schemes.jsx'));
const SchemeDetails = lazy(() => import('./pages/SchemeDetails.jsx'));
const Eligibility = lazy(() => import('./pages/Eligibility.jsx'));
const FindSchemes = lazy(() => import('./pages/FindSchemes.jsx'));
const SchemeChat = lazy(() => import('./pages/SchemeChat.jsx'));
const Login = lazy(() => import('./pages/Login.jsx'));
const Register = lazy(() => import('./pages/Register.jsx'));

class RouteBoundary extends Component {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}

function RouteFailure() {
  const { t } = useLang();
  const heading = useRef(null);
  useEffect(() => heading.current?.focus(), []);

  return (
    <main className="page">
      <h1 ref={heading} tabIndex={-1}>{t('labelUnavailable')}</h1>
      <div className="alert feedback">
        <p>{t('loadFailed')}</p>
        <button type="button" onClick={() => window.location.reload()}>{t('retry')}</button>
      </div>
    </main>
  );
}

function RouteFocus({ pathname, lastPathRef, children }) {
  useEffect(() => {
    if (lastPathRef.current === pathname) return;
    lastPathRef.current = pathname;
    const content = document.getElementById('content');
    function moveFocus() {
      if (document.activeElement?.closest('#content main')) return true;
      const heading = content.querySelector('main h1, main [role="alert"]');
      if (!heading) return false;
      heading.tabIndex = -1;
      heading.focus();
      return true;
    }
    if (!moveFocus()) {
      const observer = new MutationObserver(() => {
        if (moveFocus()) observer.disconnect();
      });
      observer.observe(content, { childList: true, subtree: true });
      return () => observer.disconnect();
    }
  }, [lastPathRef, pathname]);
  return children;
}

export default function App() {
  const { t, lang, setLang } = useLang();
  const { user, status, notice, refresh, signOut } = useAuth();
  const { pathname, search } = useLocation();
  const lastPathRef = useRef(pathname);

  return (
    <div className="app">
      <a className="skip-link" href="#content">{t('skip')}</a>
      <header className="header">
        <Link to="/" className="brand" aria-label={t('appName')}>
          <img src="/schemesathi-logo.jpeg" alt="" width="1280" height="720" />
        </Link>
        <nav className="nav">
          <NavLink to="/schemes">{t('schemes')}</NavLink>
          <NavLink to="/eligibility">{t('eligibility')}</NavLink>
          <FindSchemesLink navigation>{t('findSchemes')}</FindSchemesLink>
          <NavLink to="/scheme-chat">{t('schemeChat')}</NavLink>
          <span className="account-identity">
            <span className="account-measure" aria-hidden="true">{t('login')}</span>
            {user ? <span className="greeting" title={user.name}>{t('hello')}, <bdi>{user.name}</bdi></span>
              : <NavLink to="/login">{t('login')}</NavLink>}
          </span>
          <span className="account-action">
            <span className="account-measure" aria-hidden="true">{t('register')}</span>
            <span className="account-measure" aria-hidden="true">{t('logout')}</span>
            {user ? <button type="button" className="linkish" onClick={signOut}>{t('logout')}</button>
              : <NavLink to="/register">{t('register')}</NavLink>}
          </span>
        </nav>
        <label className="lang">
          <span className="sr-only">{t('language')}</span>
          <select value={lang} onChange={(e) => setLang(e.target.value)}>
            {languages.map(({ code, label, direction }) => (
              <option key={code} value={code} lang={code} dir={direction ?? 'ltr'}>{label}</option>
            ))}
          </select>
        </label>
      </header>

      <div id="content" tabIndex={-1}>
        {notice && <p role="status" lang="en">{notice}</p>}
        <RouteBoundary key={pathname} fallback={<RouteFailure />}>
          <Suspense fallback={<main className="page"><p role="status">{t('loading')}…</p></main>}>
            <RouteFocus pathname={pathname} lastPathRef={lastPathRef}>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/schemes" element={<Schemes />} />
                <Route path="/schemes/:id" element={<SchemeDetails />} />
                <Route path="/eligibility" element={<Eligibility />} />
                <Route path="/my-schemes" element={
                  user || status === 'loading' ? <main className="page questionnaire-page">
                    <h1>{t('findSchemes')}</h1>
                    <p>{t('guidedMatchIntro')}</p>
                    <Suspense fallback={<LoadingState variant="questionnaire" />}>
                      <FindSchemes authenticated={Boolean(user)} />
                    </Suspense>
                  </main> : status === 'unavailable' ? <main className="page">
                    <h1>{t('loadFailed')}</h1><button onClick={refresh}>{t('retry')}</button>
                  </main> : <Navigate to={{ pathname: '/login', search }} replace />
                } />
                <Route path="/scheme-chat" element={<SchemeChat />} />
                <Route path="*" element={<main className="page">
                <h1>{t('pageMissing')}</h1>
                <Link to="/">{t('home')}</Link>
                </main>} />
              </Routes>
            </RouteFocus>
          </Suspense>
        </RouteBoundary>
      </div>
    </div>
  );
}
