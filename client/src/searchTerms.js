// Discovery labels only. These groups do not describe eligibility or benefits.
export const synonyms = [
  { terms: ['retired farmers'], schemes: ['pm-kisan-maandhan'] },
  {
    terms: ['farmer', 'farmers', 'kisan', 'agriculture', 'किसान', 'कृषि', 'खेती'],
    schemes: ['pm-kisan', 'pm-kisan-maandhan', 'pm-fasal-bima', 'odisha-cm-kisan',
      'wb-krishak-bandhu', 'kisan-credit-card', 'soil-health-card'],
  },
  {
    terms: ['pension', 'old age', 'retirement', 'पेंशन', 'वृद्धावस्था'],
    schemes: ['atal-pension-yojana', 'nsap-pension', 'pm-shram-yogi-maandhan', 'pm-kisan-maandhan', 'nps-traders'],
  },
  {
    terms: ['scholarship', 'scholarships', 'student', 'students', 'education', 'padhai', 'पढ़ाई', 'पढ़ने', 'छात्रवृत्ति', 'शिक्षा', 'विद्यार्थी'],
    schemes: ['national-means-merit-scholarship', 'pm-usp-college-scholarship', 'aicte-pragati',
      'aicte-saksham', 'aicte-swanath', 'wb-svmcm', 'wb-kanyashree', 'tn-pudhumai-penn'],
  },
  {
    terms: ['girl', 'girls', 'beti', 'daughter', 'ladki', 'ladkiyan', 'बेटी', 'बालिका', 'लड़की', 'लड़कियों'],
    schemes: ['sukanya-samriddhi-yojana', 'aicte-pragati', 'wb-kanyashree', 'tn-pudhumai-penn'],
  },
  {
    terms: ['house', 'houses', 'awas', 'housing', 'घर', 'आवास'],
    schemes: ['pm-awas-yojana', 'pm-awas-gramin'],
  },
];

export const schemeAliases = {
  'wb-kanyashree': ['kanyashree'],
  'kisan-credit-card': ['kisan credit card', 'kcc'],
  'pm-kisan-maandhan': ['pm kisan maandhan', 'kisan maandhan'],
  'atal-pension-yojana': ['atal pension', 'apy', 'अटल पेंशन'],
  'sukanya-samriddhi-yojana': ['sukanya', 'sukanya samriddhi', 'सुकन्या'],
  'pm-kisan': ['pm kisan', 'pmkisan', 'kisan samman nidhi', 'पीएम किसान'],
  'ayushman-bharat-pmjay': ['ayushman', 'pmjay', 'pm jay', 'ayushman card', 'आयुष्मान'],
  'pm-ujjwala-yojana': ['ujjwala', 'ujwala', 'pmuy', 'उज्ज्वला'],
  'pm-awas-yojana': ['pmay', 'pm awas', 'pm awas yojana', 'awas yojana', 'pmay urban', 'pmay u', 'पीएम आवास'],
  'pm-awas-gramin': ['pmay', 'pm awas', 'pm awas yojana', 'awas yojana', 'pmay gramin', 'pmay g', 'पीएम आवास'],
  'nsap-pension': ['nsap', 'national social assistance programme', 'samajik sahayata'],
  'pm-mudra-yojana': ['mudra', 'pmmy', 'मुद्रा'],
  'pm-surya-ghar': ['surya ghar', 'rooftop solar'],
  'ka-shakti': ['karnataka shakti', 'shakti'],
};

// Common words in catalogue questions. Benefit-specific words remain searchable.
export const questionWords = new Set([
  'a', 'about', 'an', 'are', 'can', 'do', 'does', 'for', 'help', 'helps', 'how', 'i', 'in',
  'is', 'it', 'me', 'my', 'of', 'on', 's', 'scheme', 'schemes', 'the', 'there', 'to',
  'what', 'when', 'where', 'which', 'with', 'yojana', 'and',
  'ke', 'ki', 'ko', 'liye', 'kya', 'hai', 'hain', 'kaise', 'kare', 'kon', 'kaun',
  'की', 'के', 'लिए', 'क्या', 'कौन', 'कहाँ', 'कैसे', 'करें', 'है', 'हैं', 'में', 'वाली', 'किस', 'सी', 'योजना', 'योजनाएँ',
]);

// Recognized question qualifiers may be omitted in a second, related-listings pass.
export const guidanceQualifiers = [
  'income limit', 'age limit', 'last date', 'deadline', 'amount', 'paisa', 'राशि',
];
