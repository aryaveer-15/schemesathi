import nationalMeansMerit from './assets/scholarships/national-means-merit-scholarship.webp';
import pmUsp from './assets/scholarships/pm-usp-college-scholarship.webp';
import pragati from './assets/scholarships/aicte-pragati.webp';
import saksham from './assets/scholarships/aicte-saksham.webp';
import swanath from './assets/scholarships/aicte-swanath.webp';
import swamiVivekananda from './assets/scholarships/wb-svmcm.webp';
import kanyashree from './assets/scholarships/wb-kanyashree.webp';
import pudhumaiPenn from './assets/scholarships/tn-pudhumai-penn.webp';
import agriculture from './assets/schemes/agriculture.webp';
import health from './assets/schemes/health.webp';
import maternity from './assets/schemes/maternity.webp';
import housing from './assets/schemes/housing.webp';
import women from './assets/schemes/women.webp';
import employment from './assets/schemes/employment.webp';
import training from './assets/schemes/training.webp';
import socialSecurity from './assets/schemes/social-security.webp';
import finance from './assets/schemes/finance.webp';
import energy from './assets/schemes/energy.webp';
import publicServices from './assets/schemes/public.webp';

const schemePhotos = new Map([
  ['national-means-merit-scholarship', nationalMeansMerit],
  ['pm-usp-college-scholarship', pmUsp],
  ['aicte-pragati', pragati],
  ['aicte-saksham', saksham],
  ['aicte-swanath', swanath],
  ['wb-svmcm', swamiVivekananda],
  ['wb-kanyashree', kanyashree],
  ['tn-pudhumai-penn', pudhumaiPenn],
  ['pm-matru-vandana', maternity],
  ['janani-suraksha', maternity],
  ['janani-shishu-suraksha', maternity],
  ['karnataka-cmkky', training],
  ['pm-internship', training],
  ['niti-internship', training],
  ['dpiit-internship', training],
  ['national-apprenticeship-training', training],
]);

const categoryPhotos = new Map([
  ['agriculture', agriculture],
  ['health', health],
  ['housing', housing],
  ['women', women],
  ['employment', employment],
  ['social-security', socialSecurity],
  ['education', pmUsp],
  ['finance', finance],
  ['energy', energy],
  ['other', publicServices],
]);

export default function SchemeBanner({ slug, category, featured = false }) {
  const source = schemePhotos.get(slug) ?? categoryPhotos.get(category) ?? publicServices;

  return (
    <div className="scheme-banner">
      <img
        src={source}
        width="1280"
        height="640"
        alt=""
        decoding="async"
        loading={featured ? 'eager' : 'lazy'}
        fetchPriority={featured ? 'high' : undefined}
      />
    </div>
  );
}
