import { getText } from './locales/index.js';
import { translatedScheme } from './schemeText.js';

const legacyChecks = {
  "atal-pension-yojana": {
    title: ["Atal Pension Yojana","अटल पेंशन योजना","ಅಟಲ್ ಪಿಂಚಣಿ ಯೋಜನೆ"],
    keys: ["pensionAge","citizen","savings","taxpayer","pensionAccount"],
  },
  "sukanya-samriddhi-yojana": {
    title: ["Sukanya Samriddhi Yojana","सुकन्या समृद्धि योजना","ಸುಕನ್ಯಾ ಸಮೃದ್ಧಿ ಯೋಜನೆ"],
    keys: ["guardian","childAge","childResident","childAccount","familyAccounts"],
  },
  "pm-kisan": {
    title: ["PM-KISAN","पीएम-किसान","ಪಿಎಂ-ಕಿಸಾನ್"],
    keys: ["land","exclusions","landReview"],
  },
  "ayushman-bharat-pmjay": {
    title: ["Ayushman Bharat PM-JAY","आयुष्मान भारत पीएम-जय","ಆಯುಷ್ಮಾನ್ ಭಾರತ್ ಪಿಎಂ-ಜೇಯ್"],
    keys: ["beneficiary"],
  },
  "pm-ujjwala-yojana": {
    title: ["Pradhan Mantri Ujjwala Yojana","प्रधानमंत्री उज्ज्वला योजना","ಪ್ರಧಾನ ಮಂತ್ರಿ ಉಜ್ವಲ ಯೋಜನೆ"],
    keys: ["adultWoman","lpg","deprivation"],
  },
  "pm-awas-yojana": {
    title: ["Pradhan Mantri Awas Yojana – Urban 2.0","प्रधानमंत्री आवास योजना – शहरी 2.0","ಪ್ರಧಾನ ಮಂತ್ರಿ ಆವಾಸ್ ಯೋಜನೆ – ನಗರ 2.0"],
    keys: ["urban","house","housingBenefit","housingIncome"],
  },
  "nsap-pension": {
    title: ["Pradhan Mantri Samajik Sahayata Yojana – Pensions","प्रधानमंत्री सामाजिक सहायता योजना – पेंशन","ಪ್ರಧಾನ ಮಂತ್ರಿ ಸಾಮಾಜಿಕ ಸಹಾಯತಾ ಯೋಜನೆ – ಪಿಂಚಣಿಗಳು"],
    keys: ["poverty","pensionCategory"],
  },
  "pm-mudra-yojana": {
    title: ["Pradhan Mantri Mudra Yojana","प्रधानमंत्री मुद्रा योजना","ಪ್ರಧಾನ ಮಂತ್ರಿ ಮುದ್ರಾ ಯೋಜನೆ"],
    keys: ["business","loanLimit"],
  },
};

export const schemeQuestions = Object.fromEntries(Object.entries(legacyChecks).map(([slug, { title, keys }]) =>
  [slug, { title, questions: Object.fromEntries(keys.map((key) => [key, [getText('en', key)]])) }]));

const languageIndex = { en: 0, hi: 1, kn: 2 };
const scopeKeys = {
  'pm-awas-yojana': 'housingScope',
  'ayushman-bharat-pmjay': 'healthScope',
  'nsap-pension': 'pensionScope',
};

export function eligibilityText(lang, key) {
  return getText(lang, key);
}

export function schemeTitle(lang, slug) {
  const title = schemeQuestions[slug].title;
  return translatedScheme(slug, lang) ?? title[languageIndex[lang]] ?? title[0];
}

export function schemeScope(slug) {
  const key = scopeKeys[slug];
  return key ? getText('en', key) : '';
}
