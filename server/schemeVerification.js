// Lists and records used in the existing eligibility checks and application directions.
const officialList = new Set([
  'ayushman-bharat-pmjay', 'pm-awas-gramin', 'pm-fasal-bima', 'pm-vidyalaxmi',
  'pm-usp-college-scholarship', 'national-means-merit-scholarship',
]);

const localVerification = new Set([
  'pm-kisan', 'pm-awas-yojana', 'nsap-pension', 'pm-surya-ghar', 'pm-kisan-maandhan',
  'rashtriya-bal-swasthya', 'janani-shishu-suraksha', 'pm-usp-college-scholarship',
  'aicte-pragati', 'aicte-saksham', 'nikshay-poshan', 'pm-national-dialysis',
  'ka-shakti', 'pm-vishwakarma', 'pm-fasal-bima', 'pm-awas-gramin', 'pm-svanidhi',
  'mission-indradhanush', 'pm-matru-vandana', 'national-means-merit-scholarship',
  'odisha-subhadra', 'karnataka-cmkky', 'national-apprenticeship-training',
  'janani-suraksha', 'aicte-swanath', 'wb-svmcm', 'wb-kanyashree', 'odisha-cm-kisan',
  'mh-ladki-bahin', 'tn-pudhumai-penn', 'tn-cmchis', 'wb-krishak-bandhu',
  'soil-health-card', 'pmegp',
]);

function verificationKind(slug) {
  if (officialList.has(slug)) return localVerification.has(slug) ? 'list-and-local' : 'list';
  return localVerification.has(slug) ? 'local' : null;
}

module.exports = { verificationKind };
