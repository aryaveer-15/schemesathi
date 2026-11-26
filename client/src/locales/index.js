import en from './en.js';
import hi from './hi.js';
import kn from './kn.js';
import bn from './bn.js';
import mr from './mr.js';
import te from './te.js';
import ta from './ta.js';
import gu from './gu.js';
import ur from './ur.js';
import or from './or.js';
import ml from './ml.js';

export const additionalTranslations = { bn, mr, te, ta, gu, ur, or, ml };
export const dictionaries = { en, hi, kn, ...additionalTranslations };

export const languages = [
  { code: 'en', label: 'English' },
  { code: 'hi', label: 'हिन्दी' },
  { code: 'bn', label: 'বাংলা' },
  { code: 'mr', label: 'मराठी' },
  { code: 'te', label: 'తెలుగు' },
  { code: 'ta', label: 'தமிழ்' },
  { code: 'gu', label: 'ગુજરાતી' },
  { code: 'ur', label: 'اردو', direction: 'rtl' },
  { code: 'kn', label: 'ಕನ್ನಡ' },
  { code: 'or', label: 'ଓଡ଼ିଆ' },
  { code: 'ml', label: 'മലയാളം' },
];

export function getText(lang, key) {
  const dictionary = Object.hasOwn(dictionaries, lang) ? dictionaries[lang] : en;
  return Object.hasOwn(dictionary, key) ? dictionary[key] : dictionary.labelUnavailable;
}
