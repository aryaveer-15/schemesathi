import { Link, Navigate, NavLink, Route, Routes } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { useLang } from './i18n';
import Login from './pages/Login';
import Register from './pages/Register';
import Schemes from './pages/Schemes';

export default function App() {
  const { t, lang, setLang } = useLang();
  const { user, signOut } = useAuth();

  return (
    <div className="app">
      <header className="header">
        <Link to="/schemes" className="brand">
          {t('appName')}
        </Link>
        <nav className="nav">
          <NavLink to="/schemes">{t('schemes')}</NavLink>
          {user ? (
            <>
              <span className="greeting">Hello, {user.name}</span>
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
            <span className="sr-only">Language</span>
            <select value={lang} onChange={(e) => setLang(e.target.value)}>
              <option value="en">English</option>
              <option value="hi">हिन्दी</option>
            </select>
          </label>
        </nav>
      </header>

      <Routes>
        <Route path="/" element={<Navigate to="/schemes" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/schemes" element={<Schemes />} />
      </Routes>
    </div>
  );
}
