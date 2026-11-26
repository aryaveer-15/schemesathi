const catalog = require('./catalog');
const legacy = require('./legacyEligibilityChecks');
const additional = require('./remainingEligibility');
const { rules } = require('./profileEligibility');
const { verificationKind } = require('./schemeVerification');
const applications = require('./applicationDirections');

const questionnaire = catalog.map(({ slug, title, sourceUrl }) => {
  const check = legacy[slug];
  return {
    slug, title, sourceUrl: check?.sourceUrl ?? additional[slug]?.sourceUrl ?? sourceUrl,
    group: check ? 'answers' : 'profile',
    criteria: check?.criteria ?? rules[slug],
    reviewCriteria: check?.reviewCriteria,
    verificationKind: verificationKind(slug),
    publicAccess: slug === 'jan-aushadhi',
  };
});

const sourceBySlug = new Map(questionnaire.map(({ slug, sourceUrl }) => [slug, sourceUrl]));
const documentChecklists = Object.fromEntries(Object.entries({
  'pm-ujjwala-yojana': [
    'KYC application form and applicant Aadhaar copy',
    'Ration card or another state government record showing household members. Migrant applicants can use the Annexure I declaration.',
    'Aadhaar copies for the adult household members on that record',
    'Current address proof if the Aadhaar address differs. Migrant applicants can use the Annexure I declaration.',
    'Bank passbook copy or cancelled cheque',
    'Deprivation declaration',
  ],
  pmjjby: ['PMJJBY consent and declaration form', 'Aadhaar for bank-account KYC'],
  'nps-vatsalya': [
    'Proof of the child’s date of birth, such as a birth certificate or passport',
    'Guardian identity and address document for KYC, plus PAN or Form 60',
  ],
  'pm-kisan-maandhan': ['Aadhaar card', 'Bank account details'],
  'ka-shakti': [
    'One accepted photo ID, such as an Aadhaar card, voter ID, driving licence, passport or Shakti Smart Card. Original or DigiLocker ID accepted.',
  ],
  'niti-internship': [
    'If selected, bring the original mark sheets and your institution’s no-objection certificate when joining.',
  ],
  'pm-vidyalaxmi': [
    'Student Aadhaar, PAN and proof of address',
    'Self-attested previous mark sheets and the entrance exam result',
    'Institution’s admission offer and fee structure',
    'Income proof from the designated state authority. Ask the institution about its certificate for documents it already verified.',
  ],
}).map(([slug, items]) => [slug, {
  items,
  sourceUrl: sourceBySlug.get(slug),
  ...(slug === 'pm-vidyalaxmi' && {
    scope: 'This checklist applies to interest support. For the loan itself, check the official page for required documents.',
  }),
}]));

// Keep older application directions intact. On results, separate next steps from document claims.
const resultDirectionOverrides = {
  'sukanya-samriddhi-yojana': { visit: 'Ask an authorised bank or post office about opening a Sukanya Samriddhi account.' },
  'atal-pension-yojana': { visit: 'Ask the bank or post office that holds your savings account about enrolling in APY and setting up automatic contributions.' },
  'pm-shram-yogi-maandhan': { visit: 'Visit a Common Service Centre and ask about enrolling in PM-SYM.' },
  'pm-kisan-maandhan': { visit: 'Visit a Common Service Centre and ask how your state verifies land records for PM-KMY.' },
  'nps-traders': { visit: 'Ask a Common Service Centre about enrolling in the pension scheme for traders and self-employed persons.' },
  'nps-vatsalya': { visit: 'Ask a registered NPS Point of Presence how a parent or guardian can open an account.' },
  'aicte-saksham': { online: 'Find the AICTE Saksham degree or diploma entry on the National Scholarship Portal and check the current window.' },
  'pm-national-dialysis': { visit: 'Ask the district hospital’s dialysis unit about coverage and appointments.' },
  'pm-vishwakarma': { visit: 'Ask a Common Service Centre about registration and local verification.' },
  'mission-indradhanush': { visit: 'Ask your ASHA worker, ANM or nearest public health centre when the next catch-up vaccination session takes place.' },
  'janani-suraksha': { visit: 'Ask your local ASHA worker or the public or accredited delivery facility about JSY registration.' },
  'jan-aushadhi': { visit: 'Ask the pharmacist about medicine availability and any prescription requirements.' },
  'tn-cmchis': { visit: 'Contact the card-issuing centre at the District Collector’s Office for enrolment and verification.' },
  'wb-krishak-bandhu': { visit: 'Ask the block agriculture office or a Duare Sarkar camp about enrolment.' },
  pmegp: { online: 'Check the new-unit application for individuals on the PMEGP portal and ask the implementing agency about the next step.' },
};

function resultDirections(slug) {
  return { ...applications[slug], ...resultDirectionOverrides[slug] };
}

module.exports = { questionnaire, documentChecklists, resultDirections };
