import { createContext, useContext, useMemo, useState } from 'react';

const translations = {
  en: {
    appName: 'SchemeSathi',
    schemes: 'Schemes',
    login: 'Log in',
    register: 'Register',
    logout: 'Log out',
    name: 'Name',
    email: 'Email',
    password: 'Password',
    search: 'Search',
    allCategories: 'All categories',
    loading: 'Loading',
    noSchemes: 'No schemes found',
    disclaimer:
      'Information only. Verify on the official portal before applying.',
  },
  hi: {
    appName: 'स्कीमसाथी',
    schemes: 'योजनाएँ',
    login: 'लॉग इन',
    register: 'पंजीकरण',
    logout: 'लॉग आउट',
    name: 'नाम',
    email: 'ईमेल',
    password: 'पासवर्ड',
    search: 'खोजें',
    allCategories: 'सभी श्रेणियाँ',
    loading: 'लोड हो रहा है',
    noSchemes: 'कोई योजना नहीं मिली',
    disclaimer: 'केवल जानकारी। आवेदन करने से पहले आधिकारिक पोर्टल पर सत्यापित करें।',
  },

    kn: {
    appName: 'ಸ್ಕೀಮ್‌ಸಾಥಿ',
    schemes: 'ಯೋಜನೆಗಳು',
    login: 'ಲಾಗ್ ಇನ್',
    register: 'ನೋಂದಣಿ',
    logout: 'ಲಾಗ್ ಔಟ್',
    name: 'ಹೆಸರು',
    email: 'ಇಮೇಲ್',
    password: 'ಪಾಸ್‌ವರ್ಡ್',
    search: 'ಹುಡುಕಿ',
    allCategories: 'ಎಲ್ಲಾ ವರ್ಗಗಳು',
    loading: 'ಲೋಡ್ ಆಗುತ್ತಿದೆ',
    noSchemes: 'ಯಾವುದೇ ಯೋಜನೆ ಕಂಡುಬಂದಿಲ್ಲ',
    disclaimer: 'ಮಾಹಿತಿಗಾಗಿ ಮಾತ್ರ. ಅರ್ಜಿ ಸಲ್ಲಿಸುವ ಮೊದಲು ಅಧಿಕೃತ ಪೋರ್ಟಲ್‌ನಲ್ಲಿ ಪರಿಶೀಲಿಸಿ.',
  },
};

const LangContext = createContext(null);

export function LangProvider({ children }) {
  const [lang, setLang] = useState('en');

  const value = useMemo(() => {
    function t(key) {
      return translations[lang]?.[key] ?? translations.en[key] ?? key;
    }
    return { lang, setLang, t };
  }, [lang]);

  return <LangContext.Provider value={value}>{children}</LangContext.Provider>;
}

export function useLang() {
  const ctx = useContext(LangContext);
  if (!ctx) {
    throw new Error('useLang must be used within LangProvider');
  }
  return ctx;
}
