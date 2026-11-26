import { Link, Navigate, NavLink, Route, Routes, useLocation } from 'react-router-dom';
import { useAuth } from './useAuth';
import { useLang } from './useLang';
import { languages } from './locales';
import Login from './pages/Login';
import Register from './pages/Register';
import Schemes from './pages/Schemes';
import Eligibility from './pages/Eligibility';
import SchemeDetails from './pages/SchemeDetails';
import Home from './pages/Home';
import FindSchemes from './pages/FindSchemes';
import SchemeChat from './pages/SchemeChat';

export default function App() {
  const { t, lang, setLang } = useLang();
  const { user, token, signOut } = useAuth();
  const { search } = useLocation();

  return (
    <div className="app">
      <a className="skip-link" href="#content">{t('skip')}</a>
      <header className="header">
        <Link to="/" className="brand">
          <img className="brand-mark" src="/schemesathi-mark.svg" alt="" width="40" height="40" />
          {t('appName')}
        </Link>
        <nav className="nav">
          <NavLink to="/schemes">{t('schemes')}</NavLink>
          <NavLink to="/eligibility">{t('eligibility')}</NavLink>
          <NavLink to="/my-schemes">{t('findSchemes')}</NavLink>
          <NavLink to="/scheme-chat">{t('schemeChat')}</NavLink>
          {user ? (
            <>
              <span className="greeting">{t('hello')}, <bdi>{user.name}</bdi></span>
              <button type="button" className="linkish" onClick={signOut}>
                {t('logout')}
              </button>
            </>
          ) : (
            <>
              <NavLink to="/login">{t('login')}</NavLink>
              <NavLink to="/register">{t('register')}</NavLink>
            </>
          )}
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
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/schemes" element={<Schemes />} />
        <Route path="/schemes/:id" element={<SchemeDetails />} />
        <Route path="/eligibility" element={<Eligibility />} />
        <Route path="/my-schemes" element={token ? <FindSchemes /> : <Navigate to={{ pathname: '/login', search }} replace />} />
        <Route path="/scheme-chat" element={<SchemeChat />} />
        <Route path="*" element={<main className="page">
          <h1>{t('pageMissing')}</h1>
          <Link to="/">{t('home')}</Link>
        </main>} />
      </Routes>
      </div>
    </div>
  );
}
