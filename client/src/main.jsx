import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './AuthContext';
import { LangProvider } from './i18n';
import App from './App.jsx';
import './index.css';

function removeLegacySignIn() {
  try {
    const present = localStorage.getItem('schemesathi.auth') !== null;
    localStorage.removeItem('schemesathi.auth');
    return present;
  } catch {
    return false;
  }
}

const migrated = removeLegacySignIn();
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <LangProvider>
        <AuthProvider migrated={migrated}>
          <App />
        </AuthProvider>
      </LangProvider>
    </BrowserRouter>
  </StrictMode>,
);
