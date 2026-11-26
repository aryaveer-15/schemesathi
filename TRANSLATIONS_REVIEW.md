# SchemeSathi translation review

## Before Pass 3

26 November 2026

The inventory counts distinct interface keys currently used by the website and a separate inventory of data records. A repeated set is listed once with the languages it affects. English is the source language. Scheme names and official URLs are retained as published or as already shown in the catalogue.

- Hindi · Results (20) — `ageAtLeast`, `ageRange`, `authorityReviewReason`, `copyResults`, `editAnswers`, `eligibilityResults`, `expectedAnswer`, `likelyMatches`, `missingReason`, `notMatched`, `possibleMatches`, `preliminaryResultNotice`, `printResults`, `publicAccessResults`, `resultReasons`, `resultsCopied`, `shareOnlySchemes`, `shareResults`, `uncertainReason`, `unmetReason`
- Hindi · Errors (1) — `ageRequired`
- Hindi · Application (8) — `documentChecklist`, `documentFallback`, `documentSource`, `lastVerified`, `verificationPending`, `verifyListAndLocally`, `verifyLocally`, `verifyOfficialList`
- Hindi · Questions (4) — `guidedMatchIntro`, `nextQuestion`, `previousQuestion`, `questionProgress`
- Bengali, Marathi, Telugu, Tamil, Gujarati, Urdu, Kannada, Odia and Malayalam · Results (22) — `ageAtLeast`, `ageRange`, `authorityReviewReason`, `copyResults`, `editAnswers`, `eligibilityResults`, `expectedAnswer`, `likelyMatches`, `matchCoverage`, `missingReason`, `notMatched`, `possibleMatches`, `preliminaryResultNotice`, `printResults`, `publicAccessResults`, `publicSchemeAccess`, `resultReasons`, `resultsCopied`, `shareOnlySchemes`, `shareResults`, `uncertainReason`, `unmetReason`
- Bengali, Marathi, Telugu, Tamil, Gujarati, Urdu, Kannada, Odia and Malayalam · Errors (2) — `ageRequired`, `extraChecksFailed`
- Bengali, Marathi, Telugu, Tamil, Gujarati, Urdu, Kannada, Odia and Malayalam · Questions (51) — `aicteCourse`, `aicteIncome`, `aicteOtherAid`, `artisanCreditExclusion`, `artisanFamilyExclusion`, `artisanTrade`, `bankAccount`, `cropInterest`, `cropNotification`, `csssCourse`, `csssIncome`, `csssMerit`, `csssOtherAid`, `dialysisBpl`, `dialysisReferral`, `educationLoanAdmission`, `farmerPensionExclusion`, `guidedMatchIntro`, `informalWork`, `jsskCare`, `kccActivity`, `minorAge`, `missedVaccination`, `nextQuestion`, `pragatiFamily`, `pragatiStudent`, `previousQuestion`, `publicFacility`, `questionProgress`, `ruralHousingList`, `sakshamDisability`, `schoolScreening`, `shaktiPassenger`, `shaktiResident`, `shaktiService`, `smallFarmRecord`, `solarConnection`, `solarRoof`, `solarSubsidy`, `streetVendor`, `tbNotification`, `tbTreatment`, `traderExclusion`, `traderTurnover`, `traderWork`, `vaccinationRound`, `vatsalyaCitizenship`, `vatsalyaGuardian`, `vendorCredentials`, `workerExclusion`, `workerIncomeLimit`
- Bengali, Marathi, Telugu, Tamil, Gujarati, Urdu, Kannada, Odia and Malayalam · Application (12) — `documentChecklist`, `documentFallback`, `documentSource`, `eligibilityRequirements`, `eligibilitySource`, `howToGetBenefit`, `lastVerified`, `openOfficialPortal`, `verificationPending`, `verifyListAndLocally`, `verifyLocally`, `verifyOfficialList`
- Chat and remaining interface controls had no missing dictionary keys in the active flow. Chat also displays catalogue summaries, listed below.

### Hardcoded and data-supplied strings

#### Questions (81)

| Key | English source |
| --- | --- |
| `pm-matru-vandana.maternityStage` | Are you applying as a pregnant or nursing mother for your first living child, or for your second child if she is a girl? |
| `pm-matru-vandana.maternityAge` | Were you between 18 years and 7 months and 55 years old at childbirth, or will you be in that range on the expected delivery date? |
| `pm-matru-vandana.maternityCategory` | Can you document at least one PMMVY eligibility category in the official criteria, such as net family income below ₹8 lakh, a qualifying ration card or e-Shram registration? |
| `pm-matru-vandana.maternityExclusion` | Do you meet the rules on other maternity benefits and the registration deadline for your child? |
| `national-means-merit-scholarship.nmmsSchool` | Is the student in Class VIII at a government, government-aided or local-body school, outside the excluded residential, Kendriya Vidyalaya and Navodaya categories? |
| `national-means-merit-scholarship.nmmsIncome` | Is annual parental income from all sources ₹3.5 lakh or less? |
| `national-means-merit-scholarship.nmmsMarks` | Did the student earn at least 55% or equivalent in Class VII, or meet the 50% threshold for an SC/ST student? |
| `national-means-merit-scholarship.nmmsIntake` | Has the school confirmed the student can register for the current state or UT NMMS selection test? |
| `odisha-subhadra.subhadraResident` | Are you a woman residing in Odisha? |
| `odisha-subhadra.subhadraAge` | Were you at least 21 and under 60 on the qualifying date for this intake? |
| `odisha-subhadra.subhadraIncome` | Is your household covered by NFSA or SFSS, or, if it has neither card, is annual family income ₹2.5 lakh or less? |
| `odisha-subhadra.subhadraExclusions` | Have you checked the official exclusion list, including other government assistance, employment, tax and asset rules, and confirmed that none applies? |
| `karnataka-cmkky.cmkkyCourse` | Have you found a current CMKKY course and confirmed that you meet its Karnataka residence, age and educational entry requirements? |
| `pm-internship.pmInternIntake` | Do you meet the current intake’s age, education, employment and family exclusion rules, including the institution’s no-objection certificate if applying as a final-year student? |
| `niti-internship.nitiAcademic` | Do you meet one NITI academic route? This includes second-year undergraduate exams with at least 85% in Class XII, first-year postgraduate exams or research with at least 70% in graduation, or an eligible recent final-exam route with at least 70%. Check section 2 of the guidelines for the full conditions. |
| `niti-internship.nitiTiming` | Can you meet the internship’s dates, attendance and applicable no-objection certificate requirements? |
| `dpiit-internship.dpiitStudy` | Are you pursuing undergraduate or postgraduate study or research in engineering, management, law, economics, finance, computing or library management? |
| `national-apprenticeship-training.natsQualification` | Do you have a graduate, diploma or vocational qualification accepted for the advertised NATS apprenticeship? |
| `national-apprenticeship-training.natsHistory` | Do you meet that vacancy’s rules on qualification date, earlier apprenticeship and prior work experience? |
| `janani-suraksha.jsyDelivery` | Are you applying for maternity assistance for a delivery under Janani Suraksha Yojana? |
| `janani-suraksha.jsyLocalRules` | Has your ASHA or health facility confirmed that you meet the rules for your state group, type of delivery facility and any applicable BPL, SC or ST criteria? |
| `aicte-swanath.swanathFamily` | Do you meet a family-circumstance category listed in the current Swanath notification, such as being an orphan or the ward of qualifying personnel killed in action? |
| `aicte-swanath.swanathCourse` | Are you currently enrolled in a regular AICTE-approved technical degree or diploma course? |
| `wb-svmcm.svmcmDomicile` | Do you have West Bengal domicile and admission to an institution and course covered by this scholarship? |
| `wb-svmcm.svmcmMerit` | Do you meet the published marks and family-income rules for your course, or qualify for an applicable exemption such as the Kanyashree K3 route? |
| `wb-svmcm.svmcmAid` | Are you receiving another central or state scholarship or stipend for the same course? |
| `wb-kanyashree.kanyashreeResident` | Are you an unmarried girl or young woman enrolled in an eligible education or training programme in West Bengal? |
| `wb-kanyashree.kanyashreeCategory` | Do you meet the rules for the Kanyashree K1 annual grant for ages 13 to under 18 or the K2 one-time grant for ages 18 to under 19, as confirmed by your institution? |
| `odisha-cm-kisan.odishaFarmer` | Are you part of an Odisha small or marginal farming household or a landless agricultural household covered by CM KISAN? |
| `odisha-cm-kisan.odishaFarmerRecords` | Do you meet the official exclusions and have the required records for your CM KISAN component? |
| `mh-ladki-bahin.ladkiResidence` | Are you a Maharashtra resident applying in one of the scheme’s eligible categories for women? |
| `mh-ladki-bahin.ladkiAge` | Are you aged 21 to 65 under the scheme’s qualifying-date rules? |
| `mh-ladki-bahin.ladkiIncome` | Is your annual family income ₹2.5 lakh or less? |
| `mh-ladki-bahin.ladkiExclusions` | Do you meet the official household exclusions and have the documents, including a bank account in your own name? |
| `tn-pudhumai-penn.pudhumaiSchool` | Are you a woman student whose Classes 6–12 schooling meets the current Tamil Nadu government or eligible Tamil-medium aided-school rules? |
| `tn-pudhumai-penn.pudhumaiCourse` | Are you enrolled in a higher education, diploma or ITI programme covered by Pudhumai Penn? |
| `tn-cmchis.cmchisFamily` | Are you part of a Tamil Nadu family with a qualifying family card or other documentation accepted by CMCHIS? |
| `tn-cmchis.cmchisPathway` | Do you have an income certificate that meets the current CMCHIS requirement, or has the scheme office confirmed a special enrolment category for you? |
| `wb-krishak-bandhu.krishakStatus` | Are you a recorded farmer or recorded sharecropper cultivating land in West Bengal and applying for the cultivation benefit? |
| `wb-krishak-bandhu.krishakRecord` | Can you provide accepted land or sharecropping records for your application? |
| `soil-health-card.soilCultivation` | Do you cultivate a farm plot in India for which you want soil testing and nutrient recommendations? |
| `pmegp.pmegpAdult` | Are you over 18 and applying as an individual for a new unit? |
| `pmegp.pmegpProject` | Is the planned new non-farm business permitted by PMEGP, and does the proposal meet the published project requirements? |
| `pmegp.pmegpSchooling` | If the project exceeds ₹10 lakh in manufacturing or ₹5 lakh in business or services, have you passed Class VIII? Answer yes if the schooling rule does not apply. |
| `pmegp.pmegpExclusions` | Do you meet the one-person-per-family and prior government subsidy rules for a new PMEGP unit? |
| `pmjdy.criteria.1` | The basic Jan-Dhan account is intended for someone without another bank account. Ask the bank about documentation and accounts for minors. |
| `pm-surya-ghar.criteria.1` | Applicants must be Indian citizens. |
| `pm-surya-ghar.criteria.2` | Households applying for their own rooftop installation should have a home with a suitable roof. |
| `pm-surya-ghar.criteria.3` | The home needs a valid residential grid connection with the local electricity distributor. |
| `pm-surya-ghar.criteria.4` | Households generally must not have received a solar panel subsidy before. Check the official portal for exceptions and society applications. |
| `pm-internship.criteria.1` | The expanded pilot allows eligible applicants aged 18–25, including final-year undergraduate and postgraduate students with a no-objection certificate from their institution. Check the current round for other requirements. |
| `niti-internship.criteria.1` | Open to eligible students and research scholars from recognised institutions in India or abroad. Academic thresholds and year-of-study rules depend on the applicant’s programme. |
| `dpiit-internship.criteria.1` | Applicants should be pursuing an eligible undergraduate, postgraduate or research programme in one of the listed subject areas. |
| `national-apprenticeship-training.criteria.1` | Check each apprenticeship for accepted qualifications and any restrictions relating to earlier training or work experience. |
| `pm-shram-yogi-maandhan.criteria.1` | Entry is generally for unorganised workers aged 18–40 with monthly income of ₹15,000 or less. Income-tax and other social-security coverage exclusions apply. |
| `pm-kisan-maandhan.criteria.1` | The scheme generally covers farmers joining at ages 18–40 with cultivable landholdings of up to two hectares, subject to land records and scheme exclusions. |
| `nps-traders.criteria.1` | The entry age is 18–40 and the annual business turnover limit is ₹1.5 crore. Check income-tax and other pension or social-security exclusions. |
| `nps-vatsalya.criteria.1` | The subscriber must be under 18. Guardians should check the current citizenship or residency provisions and identity requirements before opening an account. |
| `janani-suraksha.criteria.1` | Eligibility for pregnant women depends on the state group, type of delivery facility and, in some cases, poverty or social-category criteria. |
| `janani-shishu-suraksha.criteria.1` | Covers women delivering in public facilities and sick newborns or infants covered by the programme. Confirm available services with the local public facility. |
| `rashtriya-bal-swasthya.criteria.1` | The programme serves children from birth through age 18. The screening route varies by age and may be through a facility, Anganwadi or covered school. |
| `pm-national-dialysis.criteria.1` | The programme provides free dialysis for eligible patients below the poverty line. Confirm referral, documentation and service availability with the district facility. |
| `jan-aushadhi.criteria.1` | The public can purchase medicines at a Kendra. Prescription medicines still require an appropriate prescription. |
| `nikshay-poshan.criteria.1` | For patients with tuberculosis notified in Ni-kshay. Ask the treating facility to confirm the notification and beneficiary details. |
| `mission-indradhanush.criteria.1` | Pregnant women and children who missed scheduled doses are the intended groups. Ask the local health worker which ages and vaccines the current round covers. |
| `pm-vidyalaxmi.criteria.1` | Admission must be on merit to an eligible institution. Separate household-income conditions apply to interest support. Check the current institution list. |
| `pm-usp-college-scholarship.criteria.1` | For fresh applications, the published criteria include ranking above the 80th percentile of successful Class XII candidates in the relevant board stream, a regular eligible course, and family income up to ₹4.5 lakh a year. Other scholarships or fee waivers can affect eligibility. |
| `aicte-pragati.criteria.1` | Check the current intake rules for admission to an AICTE-approved degree or diploma. Published guidelines include an annual family income cap of ₹8 lakh. |
| `aicte-saksham.criteria.1` | Published criteria include a disability of at least 40%, an eligible AICTE-approved degree or diploma admission, and annual family income up to ₹8 lakh. |
| `aicte-swanath.criteria.1` | Check the current year’s qualifying categories, which include orphans and wards of personnel killed in action. An approved course and family-income criteria also apply. |
| `wb-svmcm.criteria.1` | West Bengal domicile and course-specific merit requirements apply. Check the income limit and exemptions for the relevant applicant category. |
| `wb-kanyashree.criteria.1` | Unmarried applicants must meet the age and education or training requirements for the grant category they are applying under. |
| `odisha-cm-kisan.criteria.1` | The programme has different criteria for small or marginal farmers and landless agricultural households. Check the relevant component and its exclusions. |
| `mh-ladki-bahin.criteria.1` | Published criteria include Maharashtra residence, ages 21–65 and an annual family income limit of ₹2.5 lakh. Household and programme exclusions also apply. |
| `ka-shakti.criteria.1` | Women and transgender residents of Karnataka are among the covered passengers. Check accepted residency proof and whether the route and service are covered. |
| `tn-pudhumai-penn.criteria.1` | The state checks the applicant’s schooling history and higher education enrolment. Check current guidelines for covered government and aided school categories. |
| `tn-cmchis.criteria.1` | Main enrolment uses Tamil Nadu family records and an income certificate. Check the current threshold, covered procedures and any special enrolment categories. |
| `wb-krishak-bandhu.criteria.1` | Cultivation support covers eligible recorded farmers and recorded sharecroppers. The death benefit has separate age and documentation requirements. |
| `kisan-credit-card.criteria.1` | Eligible borrowers can include owner-cultivators, tenant farmers, sharecroppers and qualifying groups. Lenders verify activity, documents and credit eligibility. |
| `soil-health-card.criteria.1` | Farmers can ask the local agriculture department about field sampling, available tests and how to obtain a card. |
| `pmegp.criteria.1` | Individuals applying for a new unit must be over 18. Minimum schooling is required above certain project-cost thresholds. Check the portal for previous-subsidy exclusions, separate expansion provisions and current applications. |

#### Results (33)

| Key | English source |
| --- | --- |
| `pm-awas-gramin.verification` | Ask your Gram Panchayat or block rural development office to check the official PMAY-G list and explain any survey or correction process available in your village. |
| `pm-vishwakarma.verification` | Ask the Common Service Centre whether your prior loan is covered by the restriction or by the exception for fully repaid MUDRA and PM SVANidhi loans. |
| `pm-svanidhi.verification` | Ask the Urban Local Body that covers your vending location to check local coverage and how to obtain or update a Certificate of Vending or Letter of Recommendation. |
| `pm-matru-vandana.verification` | Ask the Anganwadi worker or ASHA to check the eligibility category, childbirth dates and any other maternity benefit you receive. |
| `national-means-merit-scholarship.verification` | Ask the school or state examination authority to verify the current exam window, covered schools and marks rules. |
| `odisha-subhadra.state` | Odisha |
| `odisha-subhadra.verification` | Ask a Mo Seva Kendra or local women and child development office to confirm the qualifying date and household exclusions. |
| `karnataka-cmkky.state` | Karnataka |
| `karnataka-cmkky.verification` | Check the CMKKY course with the designated training centre or district skill office. Entry requirements and seats can depend on the specific course. |
| `pm-internship.verification` | Check the current intake on the official internship portal because the pilot rules have changed between rounds. |
| `niti-internship.verification` | Check section 2 of the NITI guidelines for your academic route and ask your institution about the required certificate. |
| `national-apprenticeship-training.verification` | Ask the employer or regional apprenticeship board to check your qualifications and previous training against the vacancy. |
| `janani-suraksha.verification` | Ask the local ASHA or public health facility which JSY rules apply to your state and planned delivery facility. |
| `pm-national-dialysis.verification` | Ask the district hospital’s dialysis unit which documents it accepts for free dialysis and whether your state offers additional coverage. |
| `nikshay-poshan.verification` | Ask your treating facility or district TB office whether your case has been notified in Ni-kshay. |
| `mission-indradhanush.verification` | Ask your ASHA worker, ANM or public health centre which doses are due and whether the current local round covers the child or pregnant person. |
| `aicte-swanath.verification` | Ask your institution’s scholarship office to confirm the applicable categories and documents in the current notification. |
| `wb-svmcm.state` | West Bengal |
| `wb-svmcm.verification` | Ask your institution or the scholarship help desk to confirm the merit threshold and any income exemption for your course. |
| `wb-kanyashree.state` | West Bengal |
| `wb-kanyashree.verification` | Ask your institution’s Kanyashree contact whether you qualify under K1 or K2 and how your age and enrolment are verified. |
| `odisha-cm-kisan.state` | Odisha |
| `odisha-cm-kisan.verification` | Ask the local agriculture office which component covers your household and what records or exclusions apply. |
| `mh-ladki-bahin.state` | Maharashtra |
| `mh-ladki-bahin.verification` | Ask the local women and child development office to check the household exclusions and tell you whether applications are open. |
| `ka-shakti.state` | Karnataka |
| `tn-pudhumai-penn.state` | Tamil Nadu |
| `tn-pudhumai-penn.verification` | Ask your institution to verify your school type, language of instruction and past enrolment through the official records. |
| `tn-cmchis.state` | Tamil Nadu |
| `tn-cmchis.verification` | Ask the District Collector’s CMCHIS centre to verify the current income threshold and any special category before travelling to enrol. |
| `wb-krishak-bandhu.state` | West Bengal |
| `wb-krishak-bandhu.verification` | Ask the block agriculture office to check the land record. Contact the office separately for the scheme’s death-benefit route. |
| `pmegp.verification` | Ask KVIC, the state Khadi and Village Industries Board or the District Industries Centre to check the activity, project cost or expansion route. |

#### Application (98)

| Key | English source |
| --- | --- |
| `pm-kisan.online` | Use New Farmer Registration on PM-KISAN. The state verifies your application and land records. |
| `ayushman-bharat-pmjay.online` | Use the beneficiary portal to find your record and complete Ayushman card verification. |
| `ayushman-bharat-pmjay.visit` | For treatment, go to a participating PM-JAY hospital and ask for the Ayushman Mitra desk to confirm coverage. |
| `pm-ujjwala-yojana.online` | Use the Ujjwala 2.0 page to pick an LPG provider and start an application. |
| `pm-ujjwala-yojana.visit` | You can also submit the application and required documents to a participating LPG distributor. |
| `pm-ujjwala-yojana.documents.1` | KYC application form and applicant Aadhaar copy |
| `pm-ujjwala-yojana.documents.2` | Ration card or another state government record showing household members. Migrant applicants can use the Annexure I declaration. |
| `pm-ujjwala-yojana.documents.3` | Aadhaar copies for the adult household members on that record |
| `pm-ujjwala-yojana.documents.4` | Current address proof if the Aadhaar address differs. Migrant applicants can use the Annexure I declaration. |
| `pm-ujjwala-yojana.documents.5` | Bank passbook copy or cancelled cheque |
| `pm-ujjwala-yojana.documents.6` | Deprivation declaration |
| `sukanya-samriddhi-yojana.visit` | A parent or legal guardian can open the account at a post office or authorised bank. Ask for the Sukanya Samriddhi form and bring the child’s birth certificate and the guardian’s identification documents. |
| `sukanya-samriddhi-yojana.nextSteps.visit` | Ask an authorised bank or post office about opening a Sukanya Samriddhi account. |
| `atal-pension-yojana.visit` | Ask the bank or post office that holds your savings account for the Atal Pension Yojana enrolment form and set up automatic contributions. |
| `atal-pension-yojana.nextSteps.visit` | Ask the bank or post office that holds your savings account about enrolling in APY and setting up automatic contributions. |
| `pm-awas-yojana.online` | Use the PMAY-U 2.0 portal to start the application for your housing category. |
| `pm-awas-yojana.visit` | Your municipality or urban local body can guide you on the applicable category and local verification. |
| `nsap-pension.visit` | Ask your Gram Panchayat if you live in a village, or your ward or municipal office if you live in a town or city. Ask which office takes applications for the old-age or widow pension and which documents to bring. |
| `pm-mudra-yojana.visit` | Contact a participating bank or other MUDRA lender. Ask which loan category fits your business and what documents the lender needs to assess the application. |
| `pmjjby.visit` | Ask the participating bank or post office that holds your savings account for the PMJJBY enrolment and auto-debit consent form. |
| `pmjjby.documents.1` | PMJJBY consent and declaration form |
| `pmjjby.documents.2` | Aadhaar for bank-account KYC |
| `pmsby.visit` | Ask the participating bank or post office that holds your savings account for the PMSBY enrolment and auto-debit consent form. |
| `pmjdy.visit` | Go to a bank branch or Bank Mitra outlet and ask to open a Jan-Dhan basic savings account. Ask what identity and address documents they accept. |
| `pm-awas-gramin.visit` | Visit your Gram Panchayat or block rural development office with the household’s listing details. Ask them to verify your place on the approved list and explain the sanction and documentation process. |
| `pm-surya-ghar.online` | Register on the national portal with your electricity connection details. Follow the portal’s steps for your local electricity distributor before choosing an installation vendor. |
| `pm-vishwakarma.visit` | Visit a Common Service Centre and ask to register for PM Vishwakarma. The operator can explain the required Aadhaar authentication, documents and local verification. |
| `pm-vishwakarma.nextSteps.visit` | Ask a Common Service Centre about registration and local verification. |
| `pm-svanidhi.online` | Apply for the relevant loan tranche through the PM SVANidhi portal with your vending documentation. The lender verifies the application. |
| `pm-svanidhi.visit` | Your Urban Local Body can also help you apply. |
| `pm-fasal-bima.online` | Use the PMFBY farmer enrolment service. Confirm your notified crop, location, closing date and state-required cultivation documents before submitting. |
| `pm-fasal-bima.visit` | You can also ask a participating bank branch or Common Service Centre to assist with enrolment. |
| `pm-matru-vandana.online` | Use the PMMVY portal for citizen registration. Check which documents and maternal health records apply to your claim. |
| `pm-matru-vandana.visit` | An Anganwadi worker or ASHA worker can help with registration and documents. |
| `national-means-merit-scholarship.online` | After selection, check the NMMSS entry on the National Scholarship Portal for the award application and verification deadlines. |
| `national-means-merit-scholarship.visit` | Ask your school or state examination authority how to register for the NMMS test. This check covers entry to the selection process. |
| `odisha-subhadra.online` | Check your application or the current intake instructions on the SUBHADRA portal. |
| `odisha-subhadra.visit` | Ask a Common Service Centre or Mo Seva Kendra to help submit the application and verify your documents. |
| `karnataka-cmkky.online` | Follow Karnataka’s candidate registration guide, then check the training opportunity and how to enrol. |
| `karnataka-cmkky.visit` | Ask the listed training centre or district skill office to confirm a place and required documents. |
| `pm-internship.online` | Register on the Ministry of Corporate Affairs internship portal, check which opportunities are open and apply to those you qualify for. |
| `niti-internship.online` | Use NITI Aayog’s internship form. Check the monthly submission dates and apply for the month allowed by the guidelines. |
| `niti-internship.documents.1` | If selected, bring the original mark sheets and your institution’s no-objection certificate when joining. |
| `dpiit-internship.online` | Open the DPIIT internship portal and check when applications are accepted. Use the available form and select an internship duration allowed by the notification. |
| `national-apprenticeship-training.online` | Register as a student or apprentice on NATS 2.0, complete your profile and apply for an opening that accepts your qualification. |
| `pm-shram-yogi-maandhan.visit` | Visit a Common Service Centre and ask to enrol in PM-SYM. Bring your Aadhaar and savings or Jan-Dhan account details. The centre can explain the contribution and auto-debit process. |
| `pm-shram-yogi-maandhan.nextSteps.visit` | Visit a Common Service Centre and ask about enrolling in PM-SYM. |
| `pm-kisan-maandhan.visit` | Visit a Common Service Centre and ask to enrol in PM-KMY. Bring your Aadhaar, bank account details and mobile phone. Ask the operator how your state verifies land records. |
| `pm-kisan-maandhan.nextSteps.visit` | Visit a Common Service Centre and ask how your state verifies land records for PM-KMY. |
| `pm-kisan-maandhan.documents.1` | Aadhaar card |
| `pm-kisan-maandhan.documents.2` | Bank account details |
| `nps-traders.visit` | Visit a Common Service Centre and ask for the pension scheme for traders and self-employed persons. Bring your Aadhaar and savings or Jan-Dhan account details. |
| `nps-traders.nextSteps.visit` | Ask a Common Service Centre about enrolling in the pension scheme for traders and self-employed persons. |
| `nps-vatsalya.visit` | A parent or legal guardian can visit a PFRDA-registered NPS Point of Presence, such as a participating bank or India Post branch. Ask for NPS Vatsalya and bring proof of the child’s age and the guardian’s identity and address. |
| `nps-vatsalya.nextSteps.visit` | Ask a registered NPS Point of Presence how a parent or guardian can open an account. |
| `nps-vatsalya.documents.1` | Proof of the child’s date of birth, such as a birth certificate or passport |
| `nps-vatsalya.documents.2` | Guardian identity and address document for KYC, plus PAN or Form 60 |
| `janani-suraksha.visit` | Contact your local ASHA worker or the public or accredited delivery facility. Ask to register for JSY and confirm what maternal health records and bank details they need. |
| `janani-suraksha.nextSteps.visit` | Ask your local ASHA worker or the public or accredited delivery facility about JSY registration. |
| `janani-shishu-suraksha.visit` | Contact your local ASHA worker or public health facility for JSSK services and referral or transport arrangements. Ask the facility which services are covered. |
| `rashtriya-bal-swasthya.visit` | Ask the delivery facility about newborn screening. For older children, ask the local ASHA worker, Anganwadi or government school when the screening team visits and how to get a referral. |
| `pm-national-dialysis.visit` | Contact your district hospital’s dialysis unit. Take your clinician’s referral and any proof of BPL status so the unit can confirm free coverage and arrange an appointment. |
| `pm-national-dialysis.nextSteps.visit` | Ask the district hospital’s dialysis unit about coverage and appointments. |
| `jan-aushadhi.online` | Use the official locator to find a Jan Aushadhi Kendra. The stores are open to the public. |
| `jan-aushadhi.visit` | Ask the pharmacist about availability and bring a valid prescription for medicines that require one. |
| `jan-aushadhi.nextSteps.visit` | Ask the pharmacist about medicine availability and any prescription requirements. |
| `nikshay-poshan.visit` | Ask your treating TB centre or district TB office about Ni-kshay Poshan. Have the facility verify your Ni-kshay registration and payment details. |
| `mission-indradhanush.visit` | Contact your ASHA worker, ANM or nearest public health centre to confirm the next catch-up vaccination session. Take any available vaccination card. |
| `mission-indradhanush.nextSteps.visit` | Ask your ASHA worker, ANM or nearest public health centre when the next catch-up vaccination session takes place. |
| `pm-vidyalaxmi.online` | Apply for an education loan through the PM-Vidyalaxmi portal with your admission details. Check the separate income and other conditions for interest support. |
| `pm-vidyalaxmi.documents.1` | Student Aadhaar, PAN and proof of address |
| `pm-vidyalaxmi.documents.2` | Self-attested previous mark sheets and the entrance exam result |
| `pm-vidyalaxmi.documents.3` | Institution’s admission offer and fee structure |
| `pm-vidyalaxmi.documents.4` | Income proof from the designated state authority. Ask the institution about its certificate for documents it already verified. |
| `pm-vidyalaxmi.documents.scope` | This checklist applies to interest support. For the loan itself, check the official page for required documents. |
| `pm-usp-college-scholarship.online` | Find PM-USP CSSS on the National Scholarship Portal. Check the current fresh application window, complete One Time Registration as required and ask your institution to verify the application. |
| `aicte-pragati.online` | Choose AICTE Pragati and the degree or diploma option on the National Scholarship Portal. Check the fresh application deadline and ask your institution to verify your submission. |
| `aicte-saksham.online` | Choose AICTE Saksham and the degree or diploma option on the National Scholarship Portal. Check the application window and keep your disability and family income certificates ready for verification. |
| `aicte-saksham.nextSteps.online` | Find the AICTE Saksham degree or diploma entry on the National Scholarship Portal and check the current window. |
| `aicte-swanath.online` | Find the Swanath degree or diploma entry on the National Scholarship Portal. Check the current intake and ask your institution to verify the documents for your category. |
| `wb-svmcm.online` | Use the West Bengal scholarship portal to choose the appropriate fresh or K3 route, check the current window and follow the instructions for your directorate. |
| `wb-kanyashree.visit` | Ask the head of your school, college or training institution for the relevant Kanyashree form and institution verification. |
| `odisha-cm-kisan.online` | Use the Odisha CM KISAN portal to register or check your beneficiary status under the correct farming or landless household component. |
| `odisha-cm-kisan.visit` | Ask a Common Service Centre or the local agriculture office to help with records and e-KYC. |
| `mh-ladki-bahin.online` | Check the current intake and verification instructions on the Maharashtra Ladki Bahin portal. |
| `mh-ladki-bahin.visit` | Ask your local Anganwadi or women and child development office which application or verification channel is currently open. |
| `ka-shakti.visit` | Board an eligible Karnataka state transport bus and show the conductor accepted Karnataka residence proof to get a zero-fare ticket. Check with the operator if you are unsure about the route or bus type. |
| `ka-shakti.documents.1` | One accepted photo ID, such as an Aadhaar card, voter ID, driving licence, passport or Shakti Smart Card. Original or DigiLocker ID accepted. |
| `tn-pudhumai-penn.visit` | Ask your college, polytechnic or ITI’s scholarship or UMIS coordinator to verify your school records and submit or update your Pudhumai Penn details. |
| `tn-cmchis.online` | Check the official eligibility and enrolment instructions for your category. |
| `tn-cmchis.visit` | Ask the card-issuing centre at the District Collector’s Office to help enrol. Take your family card and the identity and income records it requests. |
| `tn-cmchis.nextSteps.visit` | Contact the card-issuing centre at the District Collector’s Office for enrolment and verification. |
| `wb-krishak-bandhu.visit` | Ask the block agriculture office or a Duare Sarkar camp to enrol for Krishak Bandhu. Bring your land or sharecropper records and ask which identity and bank documents are needed. |
| `wb-krishak-bandhu.nextSteps.visit` | Ask the block agriculture office or a Duare Sarkar camp about enrolment. |
| `kisan-credit-card.visit` | Ask a participating bank, rural bank or cooperative credit institution for a Kisan Credit Card application. Bring the records it requires for your cultivation or allied activity. |
| `soil-health-card.visit` | Contact the local agriculture extension office or soil testing laboratory for the Soil Health Card sampling process and availability for your plot. |
| `pmegp.online` | Use the PMEGP portal’s new-unit application for individuals. Prepare a project report and supporting documents for the implementing agency and lender. |
| `pmegp.nextSteps.online` | Check the new-unit application for individuals on the PMEGP portal and ask the implementing agency about the next step. |

#### Chat (51)

| Key | English source |
| --- | --- |
| `pm-kisan.summary` | Income support paid directly to the bank accounts of eligible farmer families. |
| `ayushman-bharat-pmjay.summary` | Hospital care coverage for listed beneficiaries and people aged 70 or older. |
| `pm-ujjwala-yojana.summary` | LPG gas connections for women from eligible poor households. |
| `sukanya-samriddhi-yojana.summary` | A savings scheme for a girl child, to help with future education and marriage expenses. |
| `atal-pension-yojana.summary` | A contributory pension from age 60 for eligible Indian citizens. |
| `pm-awas-yojana.summary` | Housing assistance for eligible urban families under PMAY Urban 2.0. |
| `nsap-pension.summary` | Pension support under the programme formerly called the National Social Assistance Programme (NSAP). |
| `pm-mudra-yojana.summary` | Collateral-free loans for small and micro businesses. |
| `pmjjby.summary` | Renewable life insurance through participating banks and post offices. |
| `pmsby.summary` | Renewable cover for accidental death or disability through participating banks and post offices. |
| `pmjdy.summary` | Financial inclusion programme that helps people access basic banking services. |
| `pm-awas-gramin.summary` | Housing assistance for eligible rural households to build a pucca home. |
| `pm-surya-ghar.summary` | Support for eligible households to install rooftop solar systems. |
| `pm-vishwakarma.summary` | Skills, tools, and business support for eligible artisans and craftspeople in specified traditional trades. |
| `pm-svanidhi.summary` | Working-capital credit and related support for eligible street vendors. |
| `pm-fasal-bima.summary` | Crop insurance for notified crops and areas, subject to seasonal enrolment rules. |
| `pm-matru-vandana.summary` | Maternity benefits for eligible pregnant women and nursing mothers. |
| `national-means-merit-scholarship.summary` | Scholarships to help selected students from lower-income households continue secondary school. Check the current application window on NSP. |
| `odisha-subhadra.summary` | Direct financial assistance for eligible women in Odisha. |
| `karnataka-cmkky.summary` | Karnataka’s skill-development scheme. The state portal publishes its training guidelines. |
| `pm-internship.summary` | Workplace internships with participating companies through the Ministry of Corporate Affairs. |
| `niti-internship.summary` | Internships with divisions of NITI Aayog. |
| `dpiit-internship.summary` | Short internships with the Department for Promotion of Industry and Internal Trade. |
| `national-apprenticeship-training.summary` | Practical training with employers for eligible graduates and diploma or vocational certificate holders. |
| `pm-shram-yogi-maandhan.summary` | A contributory pension for workers in the unorganised sector. |
| `pm-kisan-maandhan.summary` | A contributory pension for small and marginal farmers. |
| `nps-traders.summary` | A voluntary contributory pension for eligible small traders and self-employed workers. |
| `nps-vatsalya.summary` | A pension savings account for a minor, operated by a parent or legal guardian. |
| `janani-suraksha.summary` | Maternity assistance to encourage institutional delivery. |
| `janani-shishu-suraksha.summary` | Free delivery and specified maternal and infant services through public health institutions. |
| `rashtriya-bal-swasthya.summary` | Child health screening and referral for birth defects, deficiencies, disease and developmental delays. |
| `pm-national-dialysis.summary` | Dialysis services through participating public health facilities. |
| `jan-aushadhi.summary` | Affordable generic medicines through Jan Aushadhi Kendras. |
| `nikshay-poshan.summary` | Nutrition support during tuberculosis treatment. |
| `mission-indradhanush.summary` | Catch-up vaccination outreach under the Universal Immunisation Programme. |
| `pm-vidyalaxmi.summary` | Education loan support for students admitted to eligible higher education institutions. |
| `pm-usp-college-scholarship.summary` | Merit-cum-means scholarship for students in regular higher education. |
| `aicte-pragati.summary` | Financial support for women students in approved technical education. |
| `aicte-saksham.summary` | Financial support for students with disabilities in approved technical education. |
| `aicte-swanath.summary` | Financial support for students in approved technical courses who meet the scheme’s family-circumstance criteria. |
| `wb-svmcm.summary` | Scholarships for eligible students pursuing school or higher education in West Bengal. |
| `wb-kanyashree.summary` | Support to help girls in West Bengal continue their education and delay early marriage. |
| `odisha-cm-kisan.summary` | Agriculture and livelihood support for eligible farming households in Odisha. |
| `mh-ladki-bahin.summary` | Direct income support for eligible women in Maharashtra. |
| `ka-shakti.summary` | Fare-free travel for eligible passengers on covered Karnataka state bus services. |
| `tn-pudhumai-penn.summary` | Financial support for eligible women students continuing into higher education. |
| `tn-cmchis.summary` | Coverage for specified treatments at participating hospitals. |
| `wb-krishak-bandhu.summary` | Cultivation support and a death benefit for eligible West Bengal farming households. |
| `kisan-credit-card.summary` | Bank credit for farming and eligible allied activities. |
| `soil-health-card.summary` | Soil tests and nutrient recommendations to help farmers manage their fields. |
| `pmegp.summary` | Credit-linked assistance for qualifying non-farm microenterprises. |

### Catalogue language availability before changes

The English content inventory above lists every summary, including those with existing drafts. Missing titles and summaries share the following slug sets.

- Hindi and Kannada (31 each) — `pm-internship`, `niti-internship`, `dpiit-internship`, `national-apprenticeship-training`, `pm-shram-yogi-maandhan`, `pm-kisan-maandhan`, `nps-traders`, `nps-vatsalya`, `janani-suraksha`, `janani-shishu-suraksha`, `rashtriya-bal-swasthya`, `pm-national-dialysis`, `jan-aushadhi`, `nikshay-poshan`, `mission-indradhanush`, `pm-vidyalaxmi`, `pm-usp-college-scholarship`, `aicte-pragati`, `aicte-saksham`, `aicte-swanath`, `wb-svmcm`, `wb-kanyashree`, `odisha-cm-kisan`, `mh-ladki-bahin`, `ka-shakti`, `tn-pudhumai-penn`, `tn-cmchis`, `wb-krishak-bandhu`, `kisan-credit-card`, `soil-health-card`, `pmegp`
- Bengali, Marathi, Telugu, Tamil, Gujarati, Urdu, Odia and Malayalam (43 each) — `pmjjby`, `pmsby`, `pmjdy`, `pm-awas-gramin`, `pm-surya-ghar`, `pm-vishwakarma`, `pm-svanidhi`, `pm-fasal-bima`, `pm-matru-vandana`, `national-means-merit-scholarship`, `odisha-subhadra`, `karnataka-cmkky`, `pm-internship`, `niti-internship`, `dpiit-internship`, `national-apprenticeship-training`, `pm-shram-yogi-maandhan`, `pm-kisan-maandhan`, `nps-traders`, `nps-vatsalya`, `janani-suraksha`, `janani-shishu-suraksha`, `rashtriya-bal-swasthya`, `pm-national-dialysis`, `jan-aushadhi`, `nikshay-poshan`, `mission-indradhanush`, `pm-vidyalaxmi`, `pm-usp-college-scholarship`, `aicte-pragati`, `aicte-saksham`, `aicte-swanath`, `wb-svmcm`, `wb-kanyashree`, `odisha-cm-kisan`, `mh-ladki-bahin`, `ka-shakti`, `tn-pudhumai-penn`, `tn-cmchis`, `wb-krishak-bandhu`, `kisan-credit-card`, `soil-health-card`, `pmegp`
- Hindi had 4 existing criteria translations. The 36 criteria fields had no alternatives in the other nine non-English languages.

### Errors and other fixed strings

Website errors use interface messages selected from status codes. These 19 hardcoded strings were present in API responses and are included for completeness.

- Too many attempts. Try again later.
- API route not found
- Invalid JSON
- Request too large
- Server error
- Missing token
- Invalid or expired token
- Forbidden
- name, email and password are required
- Password must be at least 8 characters
- Email already registered
- email and password are required
- Invalid email or password
- User not found
- Provide at least one recognized answer
- Eligibility check unavailable
- Provide an answer for each question
- Invalid scheme id
- Scheme not found

The static HTML title is the SchemeSathi brand. Language names appear under their native spellings. Browser-supplied account field validation depends on the device or browser language. User-entered text, official URLs, and navigation symbols are outside the translation inventory.

## Pass 3 language policy

English source copy is used for questionnaire prompts, eligibility statements, scheme summaries, limits, result categories and explanations, official next steps and document details. No non-English eligibility translation has documented native review in this repository. Non-English pages show a localized notice alongside the relevant English content. English blocks identify their language and left-to-right direction for assistive technology and Urdu layout. Existing programme titles, immutable IDs, input values, numeric rules and official links keep their original data.

The language preference is one supported code under `schemesathi.language` in the site's browser `localStorage`. It persists on the same browser profile and origin. Switching languages writes no new preference to cookies, the account, the server or the questionnaire.

## New translations · needs native review

All 288 entries below are new or revised interface copy. Eligibility-critical copy is absent from this list because the site uses the English source while native review is pending.

| Language | Key | Text |
| --- | --- | --- |
| hi | `allRegions` | सभी क्षेत्र |
| hi | `copyResults` | टेक्स्ट कॉपी करें |
| hi | `documentChecklist` | आधिकारिक स्रोत में बताए गए दस्तावेज़ |
| hi | `documentSource` | इस सूची का स्रोत |
| hi | `editAnswers` | जवाब बदलें |
| hi | `eligibilityResults` | पात्रता के नतीजे |
| hi | `eligibilitySource` | आधिकारिक मानदंड देखें |
| hi | `extraChecksFailed` | कुछ सवाल लोड नहीं हो सके। |
| hi | `guidedMatchIntro` | एक बार में एक सवाल का जवाब दें या अब तक के नतीजे देखें। आपके जवाब सहेजे नहीं जाते। |
| hi | `howToGetBenefit` | लाभ कैसे लें |
| hi | `labelUnavailable` | जानकारी उपलब्ध नहीं है |
| hi | `lastVerified` | आखिरी सत्यापन |
| hi | `nextQuestion` | आगे |
| hi | `previousQuestion` | पीछे |
| hi | `printResults` | नतीजे प्रिंट करें |
| hi | `questionProgress` | सवाल {current}, अधिकतम {total} में से |
| hi | `resultReasons` | यह नतीजा क्यों? |
| hi | `resultsCopied` | कॉपी हो गया। |
| hi | `shareOnlySchemes` | संभावित योजनाओं के नाम और आधिकारिक लिंक |
| hi | `shareResults` | टेक्स्ट के रूप में साझा करें |
| hi | `stateKarnataka` | कर्नाटक |
| hi | `stateMaharashtra` | महाराष्ट्र |
| hi | `stateOdisha` | ओडिशा |
| hi | `stateTamilNadu` | तमिलनाडु |
| hi | `stateWestBengal` | पश्चिम बंगाल |
| hi | `translationUnderReview` | अनुवाद की समीक्षा जारी है। यह जानकारी अंग्रेज़ी में है। |
| hi | `verificationPending` | समीक्षा बाकी है |
| bn | `allRegions` | সব অঞ্চল |
| bn | `copyResults` | লেখা কপি করুন |
| bn | `documentChecklist` | সরকারি সূত্রে তালিকাভুক্ত নথি |
| bn | `documentSource` | এই তালিকার সূত্র |
| bn | `editAnswers` | উত্তর বদলান |
| bn | `eligibilityRequirements` | কারা যোগ্য হতে পারেন |
| bn | `eligibilityResults` | যোগ্যতার ফলাফল |
| bn | `eligibilitySource` | সরকারি মানদণ্ড দেখুন |
| bn | `extraChecksFailed` | কিছু প্রশ্ন লোড করা যায়নি। |
| bn | `guidedMatchIntro` | একবারে একটি প্রশ্নের উত্তর দিন অথবা এ পর্যন্ত পাওয়া ফল দেখুন। আপনার উত্তর সংরক্ষণ করা হয় না। |
| bn | `howToGetBenefit` | সুবিধা কীভাবে পাবেন |
| bn | `labelUnavailable` | তথ্য পাওয়া যাচ্ছে না |
| bn | `lastVerified` | শেষ যাচাই |
| bn | `nextQuestion` | এগিয়ে যান |
| bn | `openOfficialPortal` | সরকারি পোর্টাল খুলুন |
| bn | `previousQuestion` | ফিরে যান |
| bn | `printResults` | ফলাফল ছাপান |
| bn | `questionProgress` | প্রশ্ন {current}, সর্বোচ্চ {total}টির মধ্যে |
| bn | `resultReasons` | এই ফল কেন? |
| bn | `resultsCopied` | কপি হয়েছে। |
| bn | `shareOnlySchemes` | সম্ভাব্য প্রকল্পের নাম ও সরকারি লিঙ্ক |
| bn | `shareResults` | লেখা হিসেবে শেয়ার করুন |
| bn | `stateKarnataka` | কর্ণাটক |
| bn | `stateMaharashtra` | মহারাষ্ট্র |
| bn | `stateOdisha` | ওড়িশা |
| bn | `stateTamilNadu` | তামিলনাড়ু |
| bn | `stateWestBengal` | পশ্চিমবঙ্গ |
| bn | `translationUnderReview` | অনুবাদ পর্যালোচনাধীন। তথ্যটি ইংরেজিতে দেওয়া হয়েছে। |
| bn | `verificationPending` | পর্যালোচনা বাকি |
| mr | `allRegions` | सर्व प्रदेश |
| mr | `copyResults` | मजकूर कॉपी करा |
| mr | `documentChecklist` | अधिकृत स्रोतात दिलेली कागदपत्रे |
| mr | `documentSource` | या यादीचा स्रोत |
| mr | `editAnswers` | उत्तरे बदला |
| mr | `eligibilityRequirements` | कोण पात्र ठरू शकते |
| mr | `eligibilityResults` | पात्रतेचे निकाल |
| mr | `eligibilitySource` | अधिकृत निकष पाहा |
| mr | `extraChecksFailed` | काही प्रश्न लोड झाले नाहीत. |
| mr | `guidedMatchIntro` | एका वेळी एका प्रश्नाचे उत्तर द्या किंवा आतापर्यंतचे निकाल पाहा. तुमची उत्तरे जतन केली जात नाहीत. |
| mr | `howToGetBenefit` | लाभ कसा मिळवावा |
| mr | `labelUnavailable` | माहिती उपलब्ध नाही |
| mr | `lastVerified` | शेवटची पडताळणी |
| mr | `nextQuestion` | पुढे |
| mr | `openOfficialPortal` | अधिकृत पोर्टल उघडा |
| mr | `previousQuestion` | मागे |
| mr | `printResults` | निकाल छापा |
| mr | `questionProgress` | प्रश्न {current}, कमाल {total} पैकी |
| mr | `resultReasons` | हा निकाल का? |
| mr | `resultsCopied` | कॉपी झाले. |
| mr | `shareOnlySchemes` | संभाव्य योजनांची नावे आणि अधिकृत दुवे |
| mr | `shareResults` | मजकूर म्हणून शेअर करा |
| mr | `stateKarnataka` | कर्नाटक |
| mr | `stateMaharashtra` | महाराष्ट्र |
| mr | `stateOdisha` | ओडिशा |
| mr | `stateTamilNadu` | तमिळनाडू |
| mr | `stateWestBengal` | पश्चिम बंगाल |
| mr | `translationUnderReview` | भाषांतराचे पुनरावलोकन सुरू आहे. ही माहिती इंग्रजीत दिली आहे. |
| mr | `verificationPending` | पुनरावलोकन बाकी |
| te | `allRegions` | అన్ని ప్రాంతాలు |
| te | `copyResults` | వచనాన్ని కాపీ చేయండి |
| te | `documentChecklist` | అధికారిక మూలంలో పేర్కొన్న పత్రాలు |
| te | `documentSource` | ఈ జాబితా మూలం |
| te | `editAnswers` | జవాబులను మార్చండి |
| te | `eligibilityRequirements` | ఎవరికి అర్హత ఉండవచ్చు |
| te | `eligibilityResults` | అర్హత ఫలితాలు |
| te | `eligibilitySource` | అధికారిక ప్రమాణాలు చూడండి |
| te | `extraChecksFailed` | కొన్ని ప్రశ్నలు లోడ్ కాలేదు. |
| te | `guidedMatchIntro` | ఒక్కో ప్రశ్నకు జవాబు ఇవ్వండి లేదా ఇప్పటివరకు వచ్చిన ఫలితాలు చూడండి. మీ జవాబులు నిల్వ చేయబడవు. |
| te | `howToGetBenefit` | ప్రయోజనాన్ని ఎలా పొందాలి |
| te | `labelUnavailable` | సమాచారం అందుబాటులో లేదు |
| te | `lastVerified` | చివరిగా ధృవీకరించిన తేదీ |
| te | `nextQuestion` | తదుపరి |
| te | `openOfficialPortal` | అధికారిక పోర్టల్ తెరవండి |
| te | `previousQuestion` | వెనుకకు |
| te | `printResults` | ఫలితాలను ముద్రించండి |
| te | `questionProgress` | ప్రశ్న {current}, గరిష్ఠంగా {total} ప్రశ్నలు |
| te | `resultReasons` | ఈ ఫలితం ఎందుకు? |
| te | `resultsCopied` | కాపీ అయింది. |
| te | `shareOnlySchemes` | సంభావ్య పథకాల పేర్లు, అధికారిక లింకులు |
| te | `shareResults` | వచనంగా పంచుకోండి |
| te | `stateKarnataka` | కర్ణాటక |
| te | `stateMaharashtra` | మహారాష్ట్ర |
| te | `stateOdisha` | ఒడిశా |
| te | `stateTamilNadu` | తమిళనాడు |
| te | `stateWestBengal` | పశ్చిమ బెంగాల్ |
| te | `translationUnderReview` | అనువాదం సమీక్షలో ఉంది. ఈ సమాచారం ఆంగ్లంలో ఉంది. |
| te | `verificationPending` | సమీక్ష పెండింగ్‌లో ఉంది |
| ta | `allRegions` | அனைத்துப் பகுதிகள் |
| ta | `copyResults` | உரையை நகலெடு |
| ta | `documentChecklist` | அதிகாரப்பூர்வ ஆதாரத்தில் பட்டியலிடப்பட்ட ஆவணங்கள் |
| ta | `documentSource` | இந்தப் பட்டியலின் ஆதாரம் |
| ta | `editAnswers` | பதில்களைத் திருத்து |
| ta | `eligibilityRequirements` | யார் தகுதி பெறலாம் |
| ta | `eligibilityResults` | தகுதி முடிவுகள் |
| ta | `eligibilitySource` | அதிகாரப்பூர்வ தகுதி விதிகளைப் பார் |
| ta | `extraChecksFailed` | சில கேள்விகளை ஏற்ற முடியவில்லை. |
| ta | `guidedMatchIntro` | ஒரு நேரத்தில் ஒரு கேள்விக்குப் பதிலளிக்கவும் அல்லது இதுவரையிலான முடிவுகளைப் பார்க்கவும். உங்கள் பதில்கள் சேமிக்கப்படாது. |
| ta | `howToGetBenefit` | பலனை எப்படிப் பெறுவது |
| ta | `labelUnavailable` | தகவல் கிடைக்கவில்லை |
| ta | `lastVerified` | கடைசியாகச் சரிபார்த்த தேதி |
| ta | `nextQuestion` | அடுத்து |
| ta | `openOfficialPortal` | அதிகாரப்பூர்வத் தளத்தைத் திற |
| ta | `previousQuestion` | பின்செல் |
| ta | `printResults` | முடிவுகளை அச்சிடு |
| ta | `questionProgress` | கேள்வி {current}, அதிகபட்சம் {total} கேள்விகள் |
| ta | `resultReasons` | இந்த முடிவு ஏன்? |
| ta | `resultsCopied` | நகலெடுக்கப்பட்டது. |
| ta | `shareOnlySchemes` | பொருந்தக்கூடிய திட்டங்களின் பெயர்களும் அதிகாரப்பூர்வ இணைப்புகளும் |
| ta | `shareResults` | உரையாகப் பகிர் |
| ta | `stateKarnataka` | கர்நாடகா |
| ta | `stateMaharashtra` | மகாராஷ்டிரா |
| ta | `stateOdisha` | ஒடிசா |
| ta | `stateTamilNadu` | தமிழ்நாடு |
| ta | `stateWestBengal` | மேற்கு வங்காளம் |
| ta | `translationUnderReview` | மொழிபெயர்ப்பு மதிப்பாய்வில் உள்ளது. இந்தத் தகவல் ஆங்கிலத்தில் உள்ளது. |
| ta | `verificationPending` | மதிப்பாய்வு நிலுவையில் உள்ளது |
| gu | `allRegions` | બધા પ્રદેશો |
| gu | `copyResults` | લખાણ કૉપિ કરો |
| gu | `documentChecklist` | સત્તાવાર સ્રોતમાં દર્શાવેલા દસ્તાવેજો |
| gu | `documentSource` | આ યાદીનો સ્રોત |
| gu | `editAnswers` | જવાબો બદલો |
| gu | `eligibilityRequirements` | કોણ પાત્ર હોઈ શકે |
| gu | `eligibilityResults` | પાત્રતાનાં પરિણામો |
| gu | `eligibilitySource` | સત્તાવાર માપદંડ જુઓ |
| gu | `extraChecksFailed` | કેટલાક પ્રશ્નો લોડ થઈ શક્યા નથી. |
| gu | `guidedMatchIntro` | એક સમયે એક પ્રશ્નનો જવાબ આપો અથવા અત્યાર સુધીનાં પરિણામો જુઓ. તમારા જવાબો સંગ્રહાતા નથી. |
| gu | `howToGetBenefit` | લાભ કેવી રીતે મેળવવો |
| gu | `labelUnavailable` | માહિતી ઉપલબ્ધ નથી |
| gu | `lastVerified` | છેલ્લી ચકાસણી |
| gu | `nextQuestion` | આગળ |
| gu | `openOfficialPortal` | સત્તાવાર પોર્ટલ ખોલો |
| gu | `previousQuestion` | પાછળ |
| gu | `printResults` | પરિણામો છાપો |
| gu | `questionProgress` | પ્રશ્ન {current}, વધુમાં વધુ {total}માંથી |
| gu | `resultReasons` | આ પરિણામ કેમ? |
| gu | `resultsCopied` | કૉપિ થઈ ગયું. |
| gu | `shareOnlySchemes` | સંભવિત યોજનાઓનાં નામ અને સત્તાવાર લિંક્સ |
| gu | `shareResults` | લખાણ તરીકે શેર કરો |
| gu | `stateKarnataka` | કર્ણાટક |
| gu | `stateMaharashtra` | મહારાષ્ટ્ર |
| gu | `stateOdisha` | ઓડિશા |
| gu | `stateTamilNadu` | તમિલનાડુ |
| gu | `stateWestBengal` | પશ્ચિમ બંગાળ |
| gu | `translationUnderReview` | અનુવાદની સમીક્ષા ચાલી રહી છે. આ માહિતી અંગ્રેજીમાં છે. |
| gu | `verificationPending` | સમીક્ષા બાકી છે |
| ur | `allRegions` | تمام علاقے |
| ur | `copyResults` | متن کاپی کریں |
| ur | `documentChecklist` | سرکاری ذریعے میں درج دستاویزات |
| ur | `documentSource` | اس فہرست کا ذریعہ |
| ur | `editAnswers` | جواب بدلیں |
| ur | `eligibilityRequirements` | کون اہل ہو سکتا ہے |
| ur | `eligibilityResults` | اہلیت کے نتائج |
| ur | `eligibilitySource` | سرکاری معیار دیکھیں |
| ur | `extraChecksFailed` | کچھ سوال لوڈ نہیں ہو سکے۔ |
| ur | `guidedMatchIntro` | ایک وقت میں ایک سوال کا جواب دیں یا اب تک کے نتائج دیکھیں۔ آپ کے جواب محفوظ نہیں کیے جاتے۔ |
| ur | `howToGetBenefit` | فائدہ کیسے حاصل کریں |
| ur | `labelUnavailable` | معلومات دستیاب نہیں |
| ur | `lastVerified` | آخری تصدیق |
| ur | `nextQuestion` | آگے |
| ur | `openOfficialPortal` | سرکاری پورٹل کھولیں |
| ur | `previousQuestion` | پیچھے |
| ur | `printResults` | نتائج پرنٹ کریں |
| ur | `questionProgress` | سوال {current}، زیادہ سے زیادہ {total} میں سے |
| ur | `resultReasons` | یہ نتیجہ کیوں؟ |
| ur | `resultsCopied` | کاپی ہو گیا۔ |
| ur | `shareOnlySchemes` | ممکنہ اسکیموں کے نام اور سرکاری لنکس |
| ur | `shareResults` | متن کی صورت میں شیئر کریں |
| ur | `stateKarnataka` | کرناٹک |
| ur | `stateMaharashtra` | مہاراشٹر |
| ur | `stateOdisha` | اوڈیشہ |
| ur | `stateTamilNadu` | تمل ناڈو |
| ur | `stateWestBengal` | مغربی بنگال |
| ur | `translationUnderReview` | ترجمے کا جائزہ جاری ہے۔ یہ معلومات انگریزی میں ہیں۔ |
| ur | `verificationPending` | جائزہ باقی ہے |
| kn | `allRegions` | ಎಲ್ಲ ಪ್ರದೇಶಗಳು |
| kn | `copyResults` | ಪಠ್ಯವನ್ನು ನಕಲಿಸಿ |
| kn | `documentChecklist` | ಅಧಿಕೃತ ಮೂಲದಲ್ಲಿ ನೀಡಿರುವ ದಾಖಲೆಗಳು |
| kn | `documentSource` | ಈ ಪಟ್ಟಿಯ ಮೂಲ |
| kn | `editAnswers` | ಉತ್ತರಗಳನ್ನು ಬದಲಿಸಿ |
| kn | `eligibilityRequirements` | ಯಾರು ಅರ್ಹರಾಗಬಹುದು |
| kn | `eligibilityResults` | ಅರ್ಹತೆಯ ಫಲಿತಾಂಶಗಳು |
| kn | `eligibilitySource` | ಅಧಿಕೃತ ಮಾನದಂಡಗಳನ್ನು ನೋಡಿ |
| kn | `extraChecksFailed` | ಕೆಲವು ಪ್ರಶ್ನೆಗಳನ್ನು ಲೋಡ್ ಮಾಡಲು ಸಾಧ್ಯವಾಗಲಿಲ್ಲ. |
| kn | `guidedMatchIntro` | ಒಂದೊಂದು ಪ್ರಶ್ನೆಗೆ ಉತ್ತರಿಸಿ ಅಥವಾ ಇದುವರೆಗಿನ ಫಲಿತಾಂಶಗಳನ್ನು ನೋಡಿ. ನಿಮ್ಮ ಉತ್ತರಗಳನ್ನು ಉಳಿಸುವುದಿಲ್ಲ. |
| kn | `howToGetBenefit` | ಸೌಲಭ್ಯ ಪಡೆಯುವುದು ಹೇಗೆ |
| kn | `labelUnavailable` | ಮಾಹಿತಿ ಲಭ್ಯವಿಲ್ಲ |
| kn | `lastVerified` | ಕೊನೆಯ ಪರಿಶೀಲನೆ |
| kn | `nextQuestion` | ಮುಂದೆ |
| kn | `openOfficialPortal` | ಅಧಿಕೃತ ಪೋರ್ಟಲ್ ತೆರೆಯಿರಿ |
| kn | `previousQuestion` | ಹಿಂದೆ |
| kn | `printResults` | ಫಲಿತಾಂಶಗಳನ್ನು ಮುದ್ರಿಸಿ |
| kn | `questionProgress` | ಪ್ರಶ್ನೆ {current}, ಗರಿಷ್ಠ {total} ಪ್ರಶ್ನೆಗಳಲ್ಲಿ |
| kn | `resultReasons` | ಈ ಫಲಿತಾಂಶ ಏಕೆ? |
| kn | `resultsCopied` | ನಕಲಿಸಲಾಗಿದೆ. |
| kn | `shareOnlySchemes` | ಸಂಭಾವ್ಯ ಯೋಜನೆಗಳ ಹೆಸರುಗಳು ಮತ್ತು ಅಧಿಕೃತ ಕೊಂಡಿಗಳು |
| kn | `shareResults` | ಪಠ್ಯವಾಗಿ ಹಂಚಿಕೊಳ್ಳಿ |
| kn | `stateKarnataka` | ಕರ್ನಾಟಕ |
| kn | `stateMaharashtra` | ಮಹಾರಾಷ್ಟ್ರ |
| kn | `stateOdisha` | ಒಡಿಶಾ |
| kn | `stateTamilNadu` | ತಮಿಳುನಾಡು |
| kn | `stateWestBengal` | ಪಶ್ಚಿಮ ಬಂಗಾಳ |
| kn | `translationUnderReview` | ಅನುವಾದದ ಪರಿಶೀಲನೆ ನಡೆಯುತ್ತಿದೆ. ಈ ಮಾಹಿತಿ ಇಂಗ್ಲಿಷ್‌ನಲ್ಲಿದೆ. |
| kn | `verificationPending` | ಪರಿಶೀಲನೆ ಬಾಕಿ ಇದೆ |
| or | `allRegions` | ସବୁ ଅଞ୍ଚଳ |
| or | `copyResults` | ଲେଖା କପି କରନ୍ତୁ |
| or | `documentChecklist` | ସରକାରୀ ଉତ୍ସରେ ଦିଆଯାଇଥିବା ଦଲିଲ |
| or | `documentSource` | ଏହି ତାଲିକାର ଉତ୍ସ |
| or | `editAnswers` | ଉତ୍ତର ବଦଳାନ୍ତୁ |
| or | `eligibilityRequirements` | କିଏ ଯୋଗ୍ୟ ହୋଇପାରନ୍ତି |
| or | `eligibilityResults` | ଯୋଗ୍ୟତା ଫଳାଫଳ |
| or | `eligibilitySource` | ସରକାରୀ ମାନଦଣ୍ଡ ଦେଖନ୍ତୁ |
| or | `extraChecksFailed` | କିଛି ପ୍ରଶ୍ନ ଲୋଡ୍ ହୋଇପାରିଲା ନାହିଁ। |
| or | `guidedMatchIntro` | ଥରକୁ ଗୋଟିଏ ପ୍ରଶ୍ନର ଉତ୍ତର ଦିଅନ୍ତୁ କିମ୍ବା ଏପର୍ଯ୍ୟନ୍ତର ଫଳାଫଳ ଦେଖନ୍ତୁ। ଆପଣଙ୍କ ଉତ୍ତର ସଞ୍ଚୟ ହୁଏ ନାହିଁ। |
| or | `howToGetBenefit` | ସୁବିଧା କିପରି ପାଇବେ |
| or | `labelUnavailable` | ସୂଚନା ଉପଲବ୍ଧ ନାହିଁ |
| or | `lastVerified` | ଶେଷ ଯାଞ୍ଚ |
| or | `nextQuestion` | ଆଗକୁ |
| or | `openOfficialPortal` | ସରକାରୀ ପୋର୍ଟାଲ୍ ଖୋଲନ୍ତୁ |
| or | `previousQuestion` | ପଛକୁ |
| or | `printResults` | ଫଳାଫଳ ଛାପନ୍ତୁ |
| or | `questionProgress` | ପ୍ରଶ୍ନ {current}, ସର୍ବାଧିକ {total} ମଧ୍ୟରୁ |
| or | `resultReasons` | ଏହି ଫଳାଫଳ କାହିଁକି? |
| or | `resultsCopied` | କପି ହୋଇଛି। |
| or | `shareOnlySchemes` | ସମ୍ଭାବ୍ୟ ଯୋଜନାର ନାମ ଓ ସରକାରୀ ଲିଙ୍କ |
| or | `shareResults` | ଲେଖା ଭାବେ ସେୟାର କରନ୍ତୁ |
| or | `stateKarnataka` | କର୍ଣ୍ଣାଟକ |
| or | `stateMaharashtra` | ମହାରାଷ୍ଟ୍ର |
| or | `stateOdisha` | ଓଡ଼ିଶା |
| or | `stateTamilNadu` | ତାମିଲନାଡୁ |
| or | `stateWestBengal` | ପଶ୍ଚିମ ବଙ୍ଗ |
| or | `translationUnderReview` | ଅନୁବାଦର ସମୀକ୍ଷା ଚାଲିଛି। ଏହି ସୂଚନା ଇଂରାଜୀରେ ଅଛି। |
| or | `verificationPending` | ସମୀକ୍ଷା ବାକି ଅଛି |
| ml | `allRegions` | എല്ലാ പ്രദേശങ്ങളും |
| ml | `copyResults` | എഴുത്ത് പകർത്തുക |
| ml | `documentChecklist` | ഔദ്യോഗിക ഉറവിടത്തിൽ നൽകിയ രേഖകൾ |
| ml | `documentSource` | ഈ പട്ടികയുടെ ഉറവിടം |
| ml | `editAnswers` | ഉത്തരങ്ങൾ തിരുത്തുക |
| ml | `eligibilityRequirements` | ആർക്കൊക്കെ അർഹതയുണ്ടാകാം |
| ml | `eligibilityResults` | അർഹതാ ഫലങ്ങൾ |
| ml | `eligibilitySource` | ഔദ്യോഗിക മാനദണ്ഡങ്ങൾ കാണുക |
| ml | `extraChecksFailed` | ചില ചോദ്യങ്ങൾ ലോഡ് ചെയ്യാനായില്ല. |
| ml | `guidedMatchIntro` | ഒരു സമയം ഒരു ചോദ്യത്തിന് ഉത്തരം നൽകുക, അല്ലെങ്കിൽ ഇതുവരെയുള്ള ഫലങ്ങൾ കാണുക. നിങ്ങളുടെ ഉത്തരങ്ങൾ സൂക്ഷിക്കുന്നില്ല. |
| ml | `howToGetBenefit` | ആനുകൂല്യം എങ്ങനെ നേടാം |
| ml | `labelUnavailable` | വിവരം ലഭ്യമല്ല |
| ml | `lastVerified` | അവസാനം പരിശോധിച്ചത് |
| ml | `nextQuestion` | അടുത്തത് |
| ml | `openOfficialPortal` | ഔദ്യോഗിക പോർട്ടൽ തുറക്കുക |
| ml | `previousQuestion` | പിന്നോട്ട് |
| ml | `printResults` | ഫലങ്ങൾ അച്ചടിക്കുക |
| ml | `questionProgress` | ചോദ്യം {current}, പരമാവധി {total} ചോദ്യങ്ങളിൽ |
| ml | `resultReasons` | ഈ ഫലം എന്തുകൊണ്ട്? |
| ml | `resultsCopied` | പകർത്തി. |
| ml | `shareOnlySchemes` | സാധ്യതയുള്ള പദ്ധതികളുടെ പേരുകളും ഔദ്യോഗിക ലിങ്കുകളും |
| ml | `shareResults` | എഴുത്തായി പങ്കിടുക |
| ml | `stateKarnataka` | കർണാടക |
| ml | `stateMaharashtra` | മഹാരാഷ്ട്ര |
| ml | `stateOdisha` | ഒഡിഷ |
| ml | `stateTamilNadu` | തമിഴ്നാട് |
| ml | `stateWestBengal` | പശ്ചിമ ബംഗാൾ |
| ml | `translationUnderReview` | പരിഭാഷ അവലോകനത്തിലാണ്. ഈ വിവരം ഇംഗ്ലീഷിലാണ് നൽകിയിരിക്കുന്നത്. |
| ml | `verificationPending` | അവലോകനം ബാക്കിയുണ്ട് |

## Remaining risks before commit

| Area | What can still affect users |
| --- | --- |
| Eligibility access | The localized notice explains why an English question, result or direction is being shown. Readers who cannot read English may still need help interpreting it. Native review remains pending across all ten non-English languages. |
| Interface terminology | These new translations are drafts. Existing labels, localized programme titles and chat navigation replies also lack a recorded native review. Official scheme names and links may appear in English. |
| Catalogue and search | A search based on the translated name still works where a catalogue title exists. Searching eligibility or benefits prose in a local language can miss schemes because that prose is shown in English. Imported state names remain as filed when no maintained label exists. |
| Official instructions | Official external portals set their own language availability. Prior link problems and scheme-specific interpretation risks remain in DATA_REVIEW.md. |
| Validation | Application errors use local interface copy. The browser controls the language of its own form-validation messages. API error strings remain English for non-browser clients. |
| Fonts and layout | Script stacks use device fonts such as Noto and Nirmala UI. Devices without the relevant fonts may use a different typeface or lack glyphs. Chromium checks cover 360 px, including Urdu right-to-left layout. Physical low-end Android devices, larger system font settings, and native select popups remain unverified. Very long selected scheme names may be abbreviated by the native control, with the name also shown above the question. |
| Preference | Storage is browser- and origin-specific. Clearing site data or disabling browser storage returns the visitor to English. Shared devices retain the last chosen language code. |
