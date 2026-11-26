import { normalizeSearch } from './schemeSearch.js';

// Existing FAQ answers and navigation labels. Free-form text never becomes an answer.
export const helpTopics = {
  eligibility: {
    label: 'eligibility', text: 'helpEligibilityAnswer',
    links: [['/my-schemes', 'findSchemes'], ['/eligibility', 'eligibility']],
    queries: ['check eligibility', 'how do i check eligibility', 'where can i check eligibility'],
  },
  apply: {
    label: 'helpApply', text: 'helpApplyAnswer', links: [['/schemes', 'browse']],
    queries: ['how do i apply', 'how to apply', 'आवेदन कैसे करें'],
  },
  account: {
    label: 'register', text: 'helpAccountAnswer', links: [['/register', 'register'], ['/login', 'login']],
    queries: ['account', 'login', 'sign in', 'register', 'sign up', 'how do i register for an account', 'how do i create an account'],
  },
};

export const unknownAnswer = 'I don’t know the answer to that. Open the scheme list and follow the official link for the scheme you want to check.';

// Restrict suggestions to discovery phrases. A free-form question containing a
// generic word such as "pension" must not be treated as a factual match.
const discovery = /^(?:(?:which|what) (?:schemes?|scholarships?) (?:are there )?for |(?:find|show me|looking for) )?([\p{L}\p{M}\p{N}]+(?: [\p{L}\p{M}\p{N}]+){0,2})(?: ke liye kya scheme hai| के लिए कौन सी योजना है)?$/u;
const factual = /(?:^| )(?:eligible|eligibility|qualify|amount|income|age|deadline|last date|documents?|status|aadhaar|paisa|aay|umar|patra|आय|उम्र|पात्र|पात्रता|दस्तावेज़|दस्तावेज|अंतिम|राशि|स्थिति)(?: |$)/u;

export function helpReply(question, t, search) {
  const query = normalizeSearch(question);
  for (const [topic, faq] of Object.entries(helpTopics)) {
    const labels = topic === 'account' ? ['login', 'register'] : [faq.label];
    if (faq.queries.includes(query) || labels.some((label) => normalizeSearch(t(label)) === query)) return { topic };
  }

  const schemes = search.named(query, { allowTypos: false });
  if (schemes.length) return { schemes, named: true };
  const matches = query ? search.find(query) : [];
  if (matches.length) return {
    schemes: matches.slice(0, 4),
    suggested: matches.map(({ slug }) => slug),
    unsure: factual.test(query) || !discovery.test(query),
  };
  return { topic: 'fallback' };
}
