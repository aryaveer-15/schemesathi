import nationalMeansMerit from './assets/scholarships/national-means-merit-scholarship.webp';
import pmUsp from './assets/scholarships/pm-usp-college-scholarship.webp';
import pragati from './assets/scholarships/aicte-pragati.webp';
import saksham from './assets/scholarships/aicte-saksham.webp';
import swanath from './assets/scholarships/aicte-swanath.webp';
import swamiVivekananda from './assets/scholarships/wb-svmcm.webp';
import kanyashree from './assets/scholarships/wb-kanyashree.webp';
import pudhumaiPenn from './assets/scholarships/tn-pudhumai-penn.webp';

const banners = new Map([
  ['national-means-merit-scholarship', nationalMeansMerit],
  ['pm-usp-college-scholarship', pmUsp],
  ['aicte-pragati', pragati],
  ['aicte-saksham', saksham],
  ['aicte-swanath', swanath],
  ['wb-svmcm', swamiVivekananda],
  ['wb-kanyashree', kanyashree],
  ['tn-pudhumai-penn', pudhumaiPenn],
]);

export default function ScholarshipBanner({ slug, featured = false }) {
  const source = banners.get(slug);
  if (!source) return null;

  return (
    <div className="scholarship-banner">
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
