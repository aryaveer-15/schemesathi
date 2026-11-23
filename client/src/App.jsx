import { Link, NavLink, Route, Routes } from 'react-router-dom';
import { useAuth } from './useAuth';
import { useLang } from './useLang';
import Login from './pages/Login';
import Register from './pages/Register';
import Schemes from './pages/Schemes';
import Eligibility from './pages/Eligibility';
import SchemeDetails from './pages/SchemeDetails';
import Home from './pages/Home';

export default function App() {
  const { t, lang, setLang } = useLang();
  const { user, signOut } = useAuth();

  return (
    <div className="app">
      <a className="skip-link" href="#content">{t('skip')}</a>
      <header className="header">
        <Link to="/" className="brand">
          {t('appName')}
        </Link>
        <nav className="nav">
          <NavLink to="/schemes">{t('schemes')}</NavLink>
          <NavLink to="/eligibility">{t('eligibility')}</NavLink>
          {user ? (
            <>
              <span className="greeting">{t('hello')}, {user.name}</span>
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
          <label className="lang">
            <span className="sr-only">{t('language')}</span>
            <select value={lang} onChange={(e) => setLang(e.target.value)}>
              <option value="en">English</option>
              <option value="hi">हिन्दी</option>
              <option value="kn">ಕನ್ನಡ</option>
            </select>
          </label>
        </nav>
      </header>

      <div id="content" tabIndex={-1}>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/schemes" element={<Schemes />} />
        <Route path="/schemes/:id" element={<SchemeDetails />} />
        <Route path="/eligibility" element={<Eligibility />} />
        <Route path="*" element={<main className="page">
          <h1>{t('pageMissing')}</h1>
          <Link to="/">{t('home')}</Link>
        </main>} />
      </Routes>
      </div>
    </div>
  );
}
