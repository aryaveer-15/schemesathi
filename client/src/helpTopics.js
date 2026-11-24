import { schemeQuestions, schemeTitle } from './eligibilityContent.js';
import { languages } from './locales/index.js';

const aliases = {
  'atal-pension-yojana': ['atal pension', 'apy', 'अटल पेंशन'],
  'sukanya-samriddhi-yojana': ['sukanya', 'sukanya samriddhi', 'सुकन्या'],
  'pm-kisan': ['pm kisan', 'pmkisan', 'kisan samman nidhi', 'पीएम किसान'],
  'ayushman-bharat-pmjay': ['ayushman', 'pmjay', 'pm jay', 'ayushman card', 'आयुष्मान'],
  'pm-ujjwala-yojana': ['ujjwala', 'ujwala', 'pmuy', 'उज्ज्वला'],
  'pm-awas-yojana': ['pmay', 'pm awas', 'awas yojana', 'पीएम आवास'],
  'nsap-pension': ['nsap', 'national social assistance programme', 'samajik sahayata'],
  'pm-mudra-yojana': ['mudra', 'pmmy', 'मुद्रा'],
};

function normalize(text) {
  return text.normalize('NFKC').toLowerCase()
    .replace(/[\u200c\u200d]/g, '')
    .replace(/[^\p{L}\p{M}\p{N}]+/gu, ' ').trim();
}

const schemeTerms = Object.keys(schemeQuestions).map((slug) => [
  slug,
  [...aliases[slug], ...languages.map(({ code }) => schemeTitle(code, slug))].map(normalize),
]);

export function helpReply(question, t) {
  const text = ` ${normalize(question)} `;
  const includes = (term) => {
    const phrase = normalize(term);
    return phrase && text.includes(` ${phrase} `);
  };

  const schemes = schemeTerms.filter(([, terms]) => terms.some(includes)).map(([slug]) => slug);
  if (schemes.length) return { schemes };
  if ([t('eligibility'), t('findSchemes'), 'eligible', 'eligibility', 'qualify', 'पात्रता'].some(includes)) {
    return { topic: 'eligibility' };
  }
  if ([t('register'), t('login'), 'account', 'sign up', 'sign in', 'register', 'login'].some(includes)) {
    return { topic: 'account' };
  }
  if ([t('helpApply'), 'apply', 'application', 'official site', 'आवेदन'].some(includes)) {
    return { topic: 'apply' };
  }
  return { topic: 'fallback' };
}
