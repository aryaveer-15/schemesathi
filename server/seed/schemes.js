const dns = require('dns');
dns.setServers(['8.8.8.8', '1.1.1.1']);
require('dotenv').config();
const mongoose = require('mongoose');
const Scheme = require('../models/Scheme');

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
    summary: { en: 'Health insurance cover for hospital treatment for selected low-income families.', hi: 'चुने गए परिवारों को अस्पताल में इलाज के लिए स्वास्थ्य बीमा कवर।', kn: 'ಆಯ್ಕೆಯಾದ ಕುಟುಂಬಗಳಿಗೆ ಆಸ್ಪತ್ರೆ ಚಿಕಿತ್ಸೆಗೆ ಆರೋಗ್ಯ ವಿಮೆ ರಕ್ಷಣೆ.' },
    category: 'health',
    sourceUrl: 'https://pmjay.gov.in',
  },
  {
    slug: 'pm-ujjwala-yojana',
    title: { en: 'Pradhan Mantri Ujjwala Yojana', hi: 'प्रधानमंत्री उज्ज्वला योजना', kn: 'ಪ್ರಧಾನ ಮಂತ್ರಿ ಉಜ್ವಲ ಯೋಜನೆ' },
    summary: { en: 'LPG gas connections for women from eligible poor households.', hi: 'पात्र गरीब परिवारों की महिलाओं को एलपीजी गैस कनेक्शन।', kn: 'ಅರ್ಹ ಬಡ ಕುಟುಂಬಗಳ ಮಹಿಳೆಯರಿಗೆ ಎಲ್‌ಪಿಜಿ ಗ್ಯಾಸ್ ಸಂಪರ್ಕ.' },
    category: 'women',
    sourceUrl: 'https://www.pmuy.gov.in',
  },
  {
    slug: 'sukanya-samriddhi-yojana',
    title: { en: 'Sukanya Samriddhi Yojana', hi: 'सुकन्या समृद्धि योजना', kn: 'ಸುಕನ್ಯಾ ಸಮೃದ್ಧಿ ಯೋಜನೆ' },
    summary: { en: 'A savings scheme for a girl child, to help with future education and marriage expenses.', hi: 'बालिका की भविष्य की शिक्षा और विवाह खर्च के लिए बचत योजना।', kn: 'ಹೆಣ್ಣು ಮಗುವಿನ ಭವಿಷ್ಯದ ಶಿಕ್ಷಣ ಮತ್ತು ಮದುವೆ ವೆಚ್ಚಗಳಿಗಾಗಿ ಉಳಿತಾಯ ಯೋಜನೆ.' },
    category: 'women',
    sourceUrl: 'https://www.indiapost.gov.in',
  },
  {
    slug: 'atal-pension-yojana',
    title: { en: 'Atal Pension Yojana', hi: 'अटल पेंशन योजना', kn: 'ಅಟಲ್ ಪಿಂಚಣಿ ಯೋಜನೆ' },
    summary: { en: 'A guaranteed pension after age 60 for workers in the unorganised sector.', hi: 'असंगठित क्षेत्र के कामगारों के लिए 60 वर्ष के बाद निश्चित पेंशन।', kn: 'ಅಸಂಘಟಿತ ವಲಯದ ಕಾರ್ಮಿಕರಿಗೆ 60 ವರ್ಷದ ನಂತರ ನಿಶ್ಚಿತ ಪಿಂಚಣಿ.' },
    category: 'social-security',
    sourceUrl: 'https://www.pfrda.org.in',
  },
  {
    slug: 'pm-awas-yojana',
    title: { en: 'Pradhan Mantri Awas Yojana', hi: 'प्रधानमंत्री आवास योजना', kn: 'ಪ್ರಧಾನ ಮಂತ್ರಿ ಆವಾಸ್ ಯೋಜನೆ' },
    summary: { en: 'Assistance for eligible families to build or buy a pucca house.', hi: 'पात्र परिवारों को पक्का घर बनाने या खरीदने में सहायता।', kn: 'ಅರ್ಹ ಕುಟುಂಬಗಳಿಗೆ ಪಕ್ಕಾ ಮನೆ ಕಟ್ಟಲು ಅಥವಾ ಖರೀದಿಸಲು ನೆರವು.' },
    category: 'housing',
    sourceUrl: 'https://pmay-urban.gov.in',
  },
  {
    slug: 'nsap-pension',
    title: { en: 'National Social Assistance Programme', hi: 'राष्ट्रीय सामाजिक सहायता कार्यक्रम', kn: 'ರಾಷ್ಟ್ರೀಯ ಸಾಮಾಜಿಕ ಸಹಾಯ ಕಾರ್ಯಕ್ರಮ' },
    summary: { en: 'Pension support for poor elderly people, widows and persons with disabilities.', hi: 'गरीब बुजुर्गों, विधवाओं और दिव्यांगजनों को पेंशन सहायता।', kn: 'ಬಡ ವೃದ್ಧರು, ವಿಧವೆಯರು ಮತ್ತು ವಿಶೇಷ ಚೇತನರಿಗೆ ಪಿಂಚಣಿ ನೆರವು.' },
    category: 'social-security',
    sourceUrl: 'https://nsap.nic.in',
  },
  {
    slug: 'pm-mudra-yojana',
    title: { en: 'Pradhan Mantri Mudra Yojana', hi: 'प्रधानमंत्री मुद्रा योजना', kn: 'ಪ್ರಧಾನ ಮಂತ್ರಿ ಮುದ್ರಾ ಯೋಜನೆ' },
    summary: { en: 'Collateral-free loans for small and micro businesses.', hi: 'छोटे और सूक्ष्म व्यवसायों के लिए बिना गारंटी ऋण।', kn: 'ಸಣ್ಣ ಮತ್ತು ಸೂಕ್ಷ್ಮ ಉದ್ಯಮಗಳಿಗೆ ಜಾಮೀನು ರಹಿತ ಸಾಲ.' },
    category: 'employment',
    sourceUrl: 'https://www.mudra.org.in',
  },
];

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  await Scheme.deleteMany({});
  await Scheme.insertMany(schemes);
  console.log(`Seeded ${schemes.length} schemes`);
  await mongoose.disconnect();
}

run().catch((err) => {
  console.error(err.message);
  process.exit(1);
});