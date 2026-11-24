import { useEffect, useMemo, useState } from 'react';
import { LangContext } from './useLang';
import { additionalText, languages } from './locales';

const translations = {
  en: {
    appName: 'SchemeSathi',
    schemes: 'Schemes',
    eligibility: 'Check eligibility',
    home: "Home",
    homeTitle: "Find government schemes",
    homeIntro: "Browse schemes by category or answer a few questions before visiting the official application portal.",
    browse: "Browse schemes",
    skip: "Skip to content",
    retry: "Try again",
    pageMissing: "Page not found",
    rateLimited: "Too many attempts. Wait a few minutes and try again.",
    hello: "Hello",
    language: "Language",
    allIndia: "All India",
    agriculture: "Agriculture",
    health: "Health",
    housing: "Housing",
    women: "Women",
    employment: "Employment",
    "social-security": "Social security",
    backToSchemes: "Back to schemes",
    officialScheme: "Visit the official scheme website",
    schemeMissing: "Scheme not found",
    loadFailed: "Could not load the schemes. Try again.",
    loginFailed: "Could not log in. Try again.",
    invalidLogin: "Check your email and password.",
    registerFailed: "Could not register. Check your details and try again.",
    emailInUse: "This email is already registered.",
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
    eligibility: 'पात्रता जाँचें',
    home: "होम",
    homeTitle: "सरकारी योजनाएँ खोजें",
    homeIntro: "श्रेणी के अनुसार योजनाएँ देखें या आधिकारिक आवेदन पोर्टल पर जाने से पहले कुछ सवालों के जवाब दें।",
    browse: "योजनाएँ देखें",
    skip: "सामग्री पर जाएँ",
    retry: "फिर से प्रयास करें",
    pageMissing: "पेज नहीं मिला",
    rateLimited: "बहुत अधिक प्रयास हुए हैं। कुछ मिनट बाद फिर कोशिश करें।",
    hello: "नमस्ते",
    language: "भाषा",
    allIndia: "पूरे भारत में",
    agriculture: "कृषि",
    health: "स्वास्थ्य",
    housing: "आवास",
    women: "महिलाएँ",
    employment: "रोज़गार",
    "social-security": "सामाजिक सुरक्षा",
    backToSchemes: "योजनाओं पर वापस जाएँ",
    officialScheme: "योजना की आधिकारिक वेबसाइट देखें",
    schemeMissing: "योजना नहीं मिली",
    loadFailed: "योजनाएँ लोड नहीं हो सकीं। फिर से प्रयास करें।",
    loginFailed: "लॉग इन नहीं हो सका। फिर से प्रयास करें।",
    invalidLogin: "अपना ईमेल और पासवर्ड जाँचें।",
    registerFailed: "पंजीकरण नहीं हो सका। अपनी जानकारी जाँचें और फिर से प्रयास करें।",
    emailInUse: "इस ईमेल से पहले ही पंजीकरण हो चुका है।",
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
    eligibility: 'ಅರ್ಹತೆ ಪರಿಶೀಲಿಸಿ',
    home: "ಮುಖಪುಟ",
    homeTitle: "ಸರ್ಕಾರಿ ಯೋಜನೆಗಳನ್ನು ಹುಡುಕಿ",
    homeIntro: "ವರ್ಗದ ಪ್ರಕಾರ ಯೋಜನೆಗಳನ್ನು ನೋಡಿ ಅಥವಾ ಅಧಿಕೃತ ಅರ್ಜಿ ಜಾಲತಾಣಕ್ಕೆ ಹೋಗುವ ಮೊದಲು ಕೆಲವು ಪ್ರಶ್ನೆಗಳಿಗೆ ಉತ್ತರಿಸಿ.",
    browse: "ಯೋಜನೆಗಳನ್ನು ನೋಡಿ",
    skip: "ವಿಷಯಕ್ಕೆ ಹೋಗಿ",
    retry: "ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ",
    pageMissing: "ಪುಟ ಕಂಡುಬಂದಿಲ್ಲ",
    rateLimited: "ಹಲವು ಬಾರಿ ಪ್ರಯತ್ನಿಸಲಾಗಿದೆ. ಕೆಲವು ನಿಮಿಷಗಳ ನಂತರ ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ.",
    hello: "ನಮಸ್ಕಾರ",
    language: "ಭಾಷೆ",
    allIndia: "ಭಾರತದಾದ್ಯಂತ",
    agriculture: "ಕೃಷಿ",
    health: "ಆರೋಗ್ಯ",
    housing: "ವಸತಿ",
    women: "ಮಹಿಳೆಯರು",
    employment: "ಉದ್ಯೋಗ",
    "social-security": "ಸಾಮಾಜಿಕ ಭದ್ರತೆ",
    backToSchemes: "ಯೋಜನೆಗಳಿಗೆ ಹಿಂತಿರುಗಿ",
    officialScheme: "ಯೋಜನೆಯ ಅಧಿಕೃತ ಜಾಲತಾಣಕ್ಕೆ ಭೇಟಿ ನೀಡಿ",
    schemeMissing: "ಯೋಜನೆ ಕಂಡುಬಂದಿಲ್ಲ",
    loadFailed: "ಯೋಜನೆಗಳನ್ನು ಲೋಡ್ ಮಾಡಲು ಸಾಧ್ಯವಾಗಲಿಲ್ಲ. ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ.",
    loginFailed: "ಲಾಗ್ ಇನ್ ಮಾಡಲು ಸಾಧ್ಯವಾಗಲಿಲ್ಲ. ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ.",
    invalidLogin: "ನಿಮ್ಮ ಇಮೇಲ್ ಮತ್ತು ಪಾಸ್‌ವರ್ಡ್ ಪರಿಶೀಲಿಸಿ.",
    registerFailed: "ನೋಂದಣಿ ಸಾಧ್ಯವಾಗಲಿಲ್ಲ. ನಿಮ್ಮ ವಿವರಗಳನ್ನು ಪರಿಶೀಲಿಸಿ.",
    emailInUse: "ಈ ಇಮೇಲ್ ಈಗಾಗಲೇ ನೋಂದಾಯಿಸಲಾಗಿದೆ.",
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

const LANGUAGE_KEY = 'schemesathi.language';

function loadLanguage() {
  try {
    const saved = localStorage.getItem(LANGUAGE_KEY);
    if (languages.some(({ code }) => code === saved)) return saved;
  } catch {
    // Storage is optional.
  }
  return 'en';
}

export function LangProvider({ children }) {
  const [lang, setLang] = useState(loadLanguage);

  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = languages.find(({ code }) => code === lang)?.direction ?? 'ltr';
    try {
      localStorage.setItem(LANGUAGE_KEY, lang);
    } catch {
      // Storage is optional.
    }
  }, [lang]);

  const value = useMemo(() => {
    function t(key) {
      return additionalText(lang, key) ?? translations[lang]?.[key] ?? translations.en[key] ?? key;
    }
    return { lang, setLang, t };
  }, [lang]);

  return <LangContext.Provider value={value}>{children}</LangContext.Provider>;
}
