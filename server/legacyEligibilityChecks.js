module.exports = {
  'atal-pension-yojana': {
    sourceUrl: 'https://pfrda.org.in/web/pfrda/w/faqs/atal-pension-yojana',
    criteria: {
      pensionAge: 'yes',
      citizen: 'yes',
      savings: 'yes',
      taxpayer: 'no',
      pensionAccount: 'no',
    },
  },
  'sukanya-samriddhi-yojana': {
    sourceUrl: 'https://www.nsiindia.gov.in/writereaddata/SchemeRules/SukanyaSamriddhiAccountSchemeRule.pdf',
    criteria: {
      guardian: 'yes',
      childAge: 'yes',
      childResident: 'yes',
      childAccount: 'no',
      familyAccounts: 'no',
    },
    reviewCriteria: ['familyAccounts'],
  },
  'pm-kisan': {
    sourceUrl: 'https://pmkisan.gov.in/Documents/RevisedPM-KISANOperationalGuidelines%28English%29.pdf',
    criteria: {
      land: 'yes',
      exclusions: 'no',
      landReview: 'no',
    },
    reviewCriteria: ['landReview'],
  },
  'ayushman-bharat-pmjay': {
    sourceUrl: 'https://beneficiary.nha.gov.in/',
    criteria: {
      beneficiary: 'yes',
    },
    reviewCriteria: ['beneficiary'],
  },
  'pm-ujjwala-yojana': {
    sourceUrl: 'https://www.pmuy.gov.in/Ujjwala2.html',
    criteria: {
      adultWoman: 'yes',
      lpg: 'no',
      deprivation: 'yes',
    },
  },
  'pm-awas-yojana': {
    sourceUrl: 'https://pmay-urban.gov.in/uploads/guidelines/Operational-Guidelines-of-PMAY-U-2.pdf',
    criteria: {
      urban: 'yes',
      house: 'no',
      housingBenefit: 'no',
      housingIncome: 'yes',
    },
  },
  'nsap-pension': {
    sourceUrl: 'https://www.pib.gov.in/PressReleasepage.aspx?PRID=2323264&lang=1&reg=48',
    criteria: {
      poverty: 'yes',
      pensionCategory: 'yes',
    },
    reviewCriteria: ['pensionCategory'],
  },
  'pm-mudra-yojana': {
    sourceUrl: 'https://www.financialservices.gov.in/pradhan-mantri-mudra-yojana-pmmy',
    criteria: {
      business: 'yes',
      loanLimit: 'yes',
    },
  },
};
