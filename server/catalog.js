const schemes = [
  {
    slug: 'pm-kisan',
    title: { en: 'PM-KISAN (Pradhan Mantri Kisan Samman Nidhi)', hi: 'प्रधानमंत्री किसान सम्मान निधि (पीएम-किसान)', kn: 'ಪ್ರಧಾನ ಮಂತ್ರಿ ಕಿಸಾನ್ ಸಮ್ಮಾನ್ ನಿಧಿ (ಪಿಎಂ-ಕಿಸಾನ್)' },
    summary: { en: 'Income support paid directly to the bank accounts of eligible farmer families.', hi: 'पात्र किसान परिवारों को सीधे बैंक खाते में आर्थिक सहायता।', kn: 'ಅರ್ಹ ರೈತ ಕುಟುಂಬಗಳಿಗೆ ನೇರವಾಗಿ ಬ್ಯಾಂಕ್ ಖಾತೆಗೆ ಆರ್ಥಿಕ ನೆರವು.' },
    category: 'agriculture',
    sourceUrl: 'https://pmkisan.gov.in',
  },
  {
    slug: 'ayushman-bharat-pmjay',
    title: { en: 'Ayushman Bharat PM-JAY', hi: 'आयुष्मान भारत पीएम-जय', kn: 'ಆಯುಷ್ಮಾನ್ ಭಾರತ್ ಪಿಎಂ-ಜೇಯ್' },
    summary: { en: 'Hospital care coverage for listed beneficiaries and people aged 70 or older.', hi: 'सूचीबद्ध लाभार्थियों और 70 वर्ष या अधिक उम्र के लोगों के लिए अस्पताल में इलाज का कवर।', kn: 'ಪಟ್ಟಿಯಲ್ಲಿರುವ ಫಲಾನುಭವಿಗಳು ಮತ್ತು 70 ವರ್ಷ ಅಥವಾ ಅದಕ್ಕಿಂತ ಹೆಚ್ಚಿನ ವಯಸ್ಸಿನವರಿಗೆ ಆಸ್ಪತ್ರೆ ಚಿಕಿತ್ಸೆಯ ರಕ್ಷಣೆ.' },
    category: 'health',
    sourceUrl: 'https://beneficiary.nha.gov.in/',
  },
  {
    slug: 'pm-ujjwala-yojana',
    title: { en: 'Pradhan Mantri Ujjwala Yojana', hi: 'प्रधानमंत्री उज्ज्वला योजना', kn: 'ಪ್ರಧಾನ ಮಂತ್ರಿ ಉಜ್ವಲ ಯೋಜನೆ' },
    summary: { en: 'LPG gas connections for women from eligible poor households.', hi: 'पात्र गरीब परिवारों की महिलाओं को एलपीजी गैस कनेक्शन।', kn: 'ಅರ್ಹ ಬಡ ಕುಟುಂಬಗಳ ಮಹಿಳೆಯರಿಗೆ ಎಲ್‌ಪಿಜಿ ಗ್ಯಾಸ್ ಸಂಪರ್ಕ.' },
    category: 'women',
    sourceUrl: 'https://www.pmuy.gov.in/Ujjwala2.html',
  },
  {
    slug: 'sukanya-samriddhi-yojana',
    title: { en: 'Sukanya Samriddhi Yojana', hi: 'सुकन्या समृद्धि योजना', kn: 'ಸುಕನ್ಯಾ ಸಮೃದ್ಧಿ ಯೋಜನೆ' },
    summary: { en: 'A savings scheme for a girl child, to help with future education and marriage expenses.', hi: 'बालिका की भविष्य की शिक्षा और विवाह खर्च के लिए बचत योजना।', kn: 'ಹೆಣ್ಣು ಮಗುವಿನ ಭವಿಷ್ಯದ ಶಿಕ್ಷಣ ಮತ್ತು ಮದುವೆ ವೆಚ್ಚಗಳಿಗಾಗಿ ಉಳಿತಾಯ ಯೋಜನೆ.' },
    category: 'women',
    sourceUrl: 'https://www.nsiindia.gov.in/writereaddata/SchemeRules/SukanyaSamriddhiAccountSchemeRule.pdf',
  },
  {
    slug: 'atal-pension-yojana',
    title: { en: 'Atal Pension Yojana', hi: 'अटल पेंशन योजना', kn: 'ಅಟಲ್ ಪಿಂಚಣಿ ಯೋಜನೆ' },
    summary: { en: 'A contributory pension from age 60 for eligible Indian citizens.', hi: 'पात्र भारतीय नागरिकों के लिए 60 वर्ष की उम्र से अंशदायी पेंशन।', kn: 'ಅರ್ಹ ಭಾರತೀಯ ನಾಗರಿಕರಿಗೆ 60 ವರ್ಷ ವಯಸ್ಸಿನಿಂದ ಕೊಡುಗೆ ಆಧಾರಿತ ಪಿಂಚಣಿ.' },
    category: 'social-security',
    sourceUrl: 'https://pfrda.org.in/web/pfrda/w/faqs/atal-pension-yojana',
  },
  {
    slug: 'pm-awas-yojana',
    title: { en: 'Pradhan Mantri Awas Yojana – Urban 2.0', hi: 'प्रधानमंत्री आवास योजना – शहरी 2.0', kn: 'ಪ್ರಧಾನ ಮಂತ್ರಿ ಆವಾಸ್ ಯೋಜನೆ – ನಗರ 2.0' },
    summary: { en: 'Housing assistance for eligible urban families under PMAY Urban 2.0.', hi: 'पीएमएवाई शहरी 2.0 के तहत पात्र शहरी परिवारों के लिए आवास सहायता।', kn: 'ಪಿಎಂಎವೈ ನಗರ 2.0 ಅಡಿಯಲ್ಲಿ ಅರ್ಹ ನಗರ ಕುಟುಂಬಗಳಿಗೆ ವಸತಿ ನೆರವು.' },
    category: 'housing',
    sourceUrl: 'https://pmay-urban.gov.in/pmay-u-2.0-guidelines',
  },
  {
    slug: 'nsap-pension',
    title: { en: 'Pradhan Mantri Samajik Sahayata Yojana – Pensions', hi: 'प्रधानमंत्री सामाजिक सहायता योजना – पेंशन', kn: 'ಪ್ರಧಾನ ಮಂತ್ರಿ ಸಾಮಾಜಿಕ ಸಹಾಯತಾ ಯೋಜನೆ – ಪಿಂಚಣಿಗಳು' },
    summary: { en: 'Pension support under the programme formerly called the National Social Assistance Programme (NSAP).', hi: 'पूर्व में राष्ट्रीय सामाजिक सहायता कार्यक्रम (एनएसएपी) कहे जाने वाले कार्यक्रम के तहत पेंशन सहायता।', kn: 'ಹಿಂದೆ ರಾಷ್ಟ್ರೀಯ ಸಾಮಾಜಿಕ ಸಹಾಯ ಕಾರ್ಯಕ್ರಮ (ಎನ್‌ಎಸ್‌ಎಪಿ) ಎಂದು ಕರೆಯಲಾಗುತ್ತಿದ್ದ ಯೋಜನೆಯಡಿ ಪಿಂಚಣಿ ನೆರವು.' },
    category: 'social-security',
    sourceUrl: 'https://www.pib.gov.in/PressReleasepage.aspx?PRID=2323264&lang=1&reg=48',
  },
  {
    slug: 'pm-mudra-yojana',
    title: { en: 'Pradhan Mantri Mudra Yojana', hi: 'प्रधानमंत्री मुद्रा योजना', kn: 'ಪ್ರಧಾನ ಮಂತ್ರಿ ಮುದ್ರಾ ಯೋಜನೆ' },
    summary: { en: 'Collateral-free loans for small and micro businesses.', hi: 'छोटे और सूक्ष्म व्यवसायों के लिए बिना गारंटी ऋण।', kn: 'ಸಣ್ಣ ಮತ್ತು ಸೂಕ್ಷ್ಮ ಉದ್ಯಮಗಳಿಗೆ ಜಾಮೀನು ರಹಿತ ಸಾಲ.' },
    category: 'employment',
    sourceUrl: 'https://www.financialservices.gov.in/pradhan-mantri-mudra-yojana-pmmy',
  },
];

module.exports = schemes;
