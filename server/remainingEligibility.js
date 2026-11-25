const yes = (question) => ({ question, equals: 'yes' });
const no = (question) => ({ question, equals: 'no' });
const confirm = (question) => ({ question, equals: 'yes', reviewWhenDifferent: true });

module.exports = {
  'pm-matru-vandana': {
    criteria: {
      maternityStage: yes('Are you applying as a pregnant or nursing mother for your first living child, or for your second child if she is a girl?'),
      maternityAge: yes('Were you between 18 years and 7 months and 55 years old at childbirth, or will you be in that range on the expected delivery date?'),
      maternityCategory: confirm('Can you document at least one PMMVY eligibility category in the official criteria, such as net family income below ₹8 lakh, a qualifying ration card or e-Shram registration?'),
      maternityExclusion: confirm('Do you meet the rules on other maternity benefits and the registration deadline for your child?'),
    },
    application: {
      url: 'https://pmmvy.wcd.gov.in/',
      online: 'Use the PMMVY portal for citizen registration. Check which documents and maternal health records apply to your claim.',
      visit: 'An Anganwadi worker or ASHA worker can help with registration and documents.',
      verification: 'Ask the Anganwadi worker or ASHA to check the eligibility category, childbirth dates and any other maternity benefit you receive.',
    },
  },
  'national-means-merit-scholarship': {
    criteria: {
      nmmsSchool: yes('Is the student in Class VIII at a government, government-aided or local-body school, outside the excluded residential, Kendriya Vidyalaya and Navodaya categories?'),
      nmmsIncome: yes('Is annual parental income from all sources ₹3.5 lakh or less?'),
      nmmsMarks: yes('Did the student earn at least 55% or equivalent in Class VII, or meet the 50% threshold for an SC/ST student?'),
      nmmsIntake: confirm('Has the school confirmed the student can register for the current state or UT NMMS selection test?'),
    },
    application: {
      url: 'https://scholarships.gov.in/All-Scholarships',
      online: 'After selection, check the NMMSS entry on the National Scholarship Portal for the award application and verification deadlines.',
      visit: 'Ask your school or state examination authority how to register for the NMMS test. This check covers entry to the selection process.',
      verification: 'Ask the school or state examination authority to verify the current exam window, covered schools and marks rules.',
    },
  },
  'odisha-subhadra': {
    sourceUrl: 'https://wcd.odisha.gov.in/sites/default/files/2024-08/SUBHADRA%20Guideline-Eng_1.pdf',
    criteria: {
      subhadraResident: yes('Are you a woman residing in Odisha?'),
      subhadraAge: yes('Were you at least 21 and under 60 on the qualifying date for this intake?'),
      subhadraIncome: yes('Is your household covered by NFSA or SFSS, or, if it has neither card, is annual family income ₹2.5 lakh or less?'),
      subhadraExclusions: confirm('Have you checked the official exclusion list, including other government assistance, employment, tax and asset rules, and confirmed that none applies?'),
    },
    application: {
      url: 'https://subhadra.odisha.gov.in/',
      online: 'Check your application or the current intake instructions on the SUBHADRA portal.',
      visit: 'Ask a Common Service Centre or Mo Seva Kendra to help submit the application and verify your documents.',
      verification: 'Ask a Mo Seva Kendra or local women and child development office to confirm the qualifying date and household exclusions.',
    },
  },
  'karnataka-cmkky': {
    sourceUrl: 'https://skillmission.karnataka.gov.in/wp-content/uploads/2023/10/CMKKY_Guidline-Final_NEW-1.pdf',
    criteria: {
      cmkkyCourse: confirm('Have you found a current CMKKY course and confirmed that you meet its Karnataka residence, age and educational entry requirements?'),
    },
    application: {
      url: 'https://yuvaudyogasethu.karnataka.gov.in/en/user-guide/job-seeker',
      online: 'Follow Karnataka’s candidate registration guide, then check the training opportunity and how to enrol.',
      visit: 'Ask the listed training centre or district skill office to confirm a place and required documents.',
      verification: 'Check the CMKKY course with the designated training centre or district skill office. Entry requirements and seats can depend on the specific course.',
    },
  },
  'pm-internship': {
    criteria: {
      citizen: { equals: 'yes' },
      pmInternIntake: confirm('Do you meet the current intake’s age, education, employment and family exclusion rules, including the institution’s no-objection certificate if applying as a final-year student?'),
    },
    application: {
      url: 'https://www.pminternship.mca.gov.in/',
      online: 'Register on the Ministry of Corporate Affairs internship portal, check which opportunities are open and apply to those you qualify for.',
      verification: 'Check the current intake on the official internship portal because the pilot rules have changed between rounds.',
    },
  },
  'niti-internship': {
    criteria: {
      nitiAcademic: yes('Do you meet one NITI academic route? This includes second-year undergraduate exams with at least 85% in Class XII, first-year postgraduate exams or research with at least 70% in graduation, or an eligible recent final-exam route with at least 70%. Check section 2 of the guidelines for the full conditions.'),
      nitiTiming: confirm('Can you meet the internship’s dates, attendance and applicable no-objection certificate requirements?'),
    },
    application: {
      url: 'https://workforindia.niti.gov.in/intern/InternshipEntry/homepage.aspx',
      online: 'Use NITI Aayog’s internship form. Check the monthly submission dates and apply for the month allowed by the guidelines.',
      verification: 'Check section 2 of the NITI guidelines for your academic route and ask your institution about the required certificate.',
    },
  },
  'dpiit-internship': {
    criteria: {
      dpiitStudy: yes('Are you pursuing undergraduate or postgraduate study or research in engineering, management, law, economics, finance, computing or library management?'),
    },
    application: {
      url: 'https://apps.dpiit.gov.in/internship/',
      online: 'Open the DPIIT internship portal and check when applications are accepted. Use the available form and select an internship duration allowed by the notification.',
    },
  },
  'national-apprenticeship-training': {
    criteria: {
      natsQualification: yes('Do you have a graduate, diploma or vocational qualification accepted for the advertised NATS apprenticeship?'),
      natsHistory: confirm('Do you meet that vacancy’s rules on qualification date, earlier apprenticeship and prior work experience?'),
    },
    application: {
      url: 'https://nats.education.gov.in/',
      online: 'Register as a student or apprentice on NATS 2.0, complete your profile and apply for an opening that accepts your qualification.',
      verification: 'Ask the employer or regional apprenticeship board to check your qualifications and previous training against the vacancy.',
    },
  },
  'janani-suraksha': {
    criteria: {
      jsyDelivery: yes('Are you applying for maternity assistance for a delivery under Janani Suraksha Yojana?'),
      jsyLocalRules: confirm('Has your ASHA or health facility confirmed that you meet the rules for your state group, type of delivery facility and any applicable BPL, SC or ST criteria?'),
    },
    application: {
      visit: 'Contact your local ASHA worker or the public or accredited delivery facility. Ask to register for JSY and confirm what maternal health records and bank details they need.',
      verification: 'Ask the local ASHA or public health facility which JSY rules apply to your state and planned delivery facility.',
    },
  },
  'jan-aushadhi': {
    criteria: {},
    application: {
      url: 'https://janaushadhi.gov.in/locate-kendra',
      online: 'Use the official locator to find a Jan Aushadhi Kendra. The stores are open to the public.',
      visit: 'Ask the pharmacist about availability and bring a valid prescription for medicines that require one.',
    },
  },
  'aicte-swanath': {
    sourceUrl: 'https://highereducation.nagaland.gov.in/nagaland-scholarship-nodal-cell-nsnc/',
    criteria: {
      swanathFamily: confirm('Do you meet a family-circumstance category listed in the current Swanath notification, such as being an orphan or the ward of qualifying personnel killed in action?'),
      swanathCourse: yes('Are you currently enrolled in a regular AICTE-approved technical degree or diploma course?'),
      aicteIncome: { equals: 'yes' },
      aicteOtherAid: { equals: 'no' },
    },
    application: {
      url: 'https://scholarships.gov.in/All-Scholarships',
      online: 'Find the Swanath degree or diploma entry on the National Scholarship Portal. Check the current intake and ask your institution to verify the documents for your category.',
      verification: 'Ask your institution’s scholarship office to confirm the applicable categories and documents in the current notification.',
    },
  },
  'wb-svmcm': {
    criteria: {
      svmcmDomicile: yes('Do you have West Bengal domicile and admission to an institution and course covered by this scholarship?'),
      svmcmMerit: confirm('Do you meet the published marks and family-income rules for your course, or qualify for an applicable exemption such as the Kanyashree K3 route?'),
      svmcmAid: no('Are you receiving another central or state scholarship or stipend for the same course?'),
    },
    application: {
      url: 'https://svmcm.wb.gov.in/page/application_procedure.php',
      online: 'Use the West Bengal scholarship portal to choose the appropriate fresh or K3 route, check the current window and follow the instructions for your directorate.',
      verification: 'Ask your institution or the scholarship help desk to confirm the merit threshold and any income exemption for your course.',
    },
  },
  'wb-kanyashree': {
    criteria: {
      kanyashreeResident: yes('Are you an unmarried girl or young woman enrolled in an eligible education or training programme in West Bengal?'),
      kanyashreeCategory: confirm('Do you meet the rules for the Kanyashree K1 annual grant for ages 13 to under 18 or the K2 one-time grant for ages 18 to under 19, as confirmed by your institution?'),
    },
    application: {
      visit: 'Ask the head of your school, college or training institution for the relevant Kanyashree form and institution verification.',
      verification: 'Ask your institution’s Kanyashree contact whether you qualify under K1 or K2 and how your age and enrolment are verified.',
    },
  },
  'odisha-cm-kisan': {
    criteria: {
      odishaFarmer: yes('Are you part of an Odisha small or marginal farming household or a landless agricultural household covered by CM KISAN?'),
      odishaFarmerRecords: confirm('Do you meet the official exclusions and have the required records for your CM KISAN component?'),
    },
    application: {
      url: 'https://cmkisan.odisha.gov.in/',
      online: 'Use the Odisha CM KISAN portal to register or check your beneficiary status under the correct farming or landless household component.',
      visit: 'Ask a Common Service Centre or the local agriculture office to help with records and e-KYC.',
      verification: 'Ask the local agriculture office which component covers your household and what records or exclusions apply.',
    },
  },
  'mh-ladki-bahin': {
    criteria: {
      ladkiResidence: yes('Are you a Maharashtra resident applying in one of the scheme’s eligible categories for women?'),
      ladkiAge: yes('Are you aged 21 to 65 under the scheme’s qualifying-date rules?'),
      ladkiIncome: yes('Is your annual family income ₹2.5 lakh or less?'),
      ladkiExclusions: confirm('Do you meet the official household exclusions and have the documents, including a bank account in your own name?'),
    },
    application: {
      url: 'https://ladakibahin.maharashtra.gov.in/',
      online: 'Check the current intake and verification instructions on the Maharashtra Ladki Bahin portal.',
      visit: 'Ask your local Anganwadi or women and child development office which application or verification channel is currently open.',
      verification: 'Ask the local women and child development office to check the household exclusions and tell you whether applications are open.',
    },
  },
  'tn-pudhumai-penn': {
    criteria: {
      pudhumaiSchool: confirm('Are you a woman student whose Classes 6–12 schooling meets the current Tamil Nadu government or eligible Tamil-medium aided-school rules?'),
      pudhumaiCourse: yes('Are you enrolled in a higher education, diploma or ITI programme covered by Pudhumai Penn?'),
    },
    application: {
      visit: 'Ask your college, polytechnic or ITI’s scholarship or UMIS coordinator to verify your school records and submit or update your Pudhumai Penn details.',
      verification: 'Ask your institution to verify your school type, language of instruction and past enrolment through the official records.',
    },
  },
  'tn-cmchis': {
    sourceUrl: 'https://www.cmchistn.com/eligibility/',
    criteria: {
      cmchisFamily: confirm('Are you part of a Tamil Nadu family with a qualifying family card or other documentation accepted by CMCHIS?'),
      cmchisPathway: confirm('Do you have an income certificate that meets the current CMCHIS requirement, or has the scheme office confirmed a special enrolment category for you?'),
    },
    application: {
      url: 'https://www.cmchistn.com/eligibility/',
      online: 'Check the official eligibility and enrolment instructions for your category.',
      visit: 'Ask the card-issuing centre at the District Collector’s Office to help enrol. Take your family card and the identity and income records it requests.',
      verification: 'Ask the District Collector’s CMCHIS centre to verify the current income threshold and any special category before travelling to enrol.',
    },
  },
  'wb-krishak-bandhu': {
    criteria: {
      krishakStatus: yes('Are you a recorded farmer or recorded sharecropper cultivating land in West Bengal and applying for the cultivation benefit?'),
      krishakRecord: confirm('Can you provide accepted land or sharecropping records for your application?'),
    },
    application: {
      visit: 'Ask the block agriculture office or a Duare Sarkar camp to enrol for Krishak Bandhu. Bring your land or sharecropper records and ask which identity and bank documents are needed.',
      verification: 'Ask the block agriculture office to check the land record. Contact the office separately for the scheme’s death-benefit route.',
    },
  },
  'soil-health-card': {
    criteria: {
      soilCultivation: yes('Do you cultivate a farm plot in India for which you want soil testing and nutrient recommendations?'),
    },
    application: {
      visit: 'Contact the local agriculture extension office or soil testing laboratory for the Soil Health Card sampling process and availability for your plot.',
    },
  },
  pmegp: {
    criteria: {
      pmegpAdult: yes('Are you over 18 and applying as an individual for a new unit?'),
      pmegpProject: confirm('Is the planned new non-farm business permitted by PMEGP, and does the proposal meet the published project requirements?'),
      pmegpSchooling: yes('If the project exceeds ₹10 lakh in manufacturing or ₹5 lakh in business or services, have you passed Class VIII? Answer yes if the schooling rule does not apply.'),
      pmegpExclusions: confirm('Do you meet the one-person-per-family and prior government subsidy rules for a new PMEGP unit?'),
    },
    application: {
      url: 'https://www.pmegp.msme.gov.in/',
      online: 'Use the PMEGP portal’s new-unit application for individuals. Prepare a project report and supporting documents for the implementing agency and lender.',
      verification: 'Ask KVIC, the state Khadi and Village Industries Board or the District Industries Centre to check the activity, project cost or expansion route.',
    },
  },
};
