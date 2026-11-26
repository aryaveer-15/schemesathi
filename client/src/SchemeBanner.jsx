const images = import.meta.glob('./assets/{responsive,schemes,scholarships}/*.webp', {
  eager: true, query: '?url', import: 'default',
});

const schemePhotos = new Map([
  ['national-means-merit-scholarship', 'national-means-merit-scholarship'],
  ['pm-usp-college-scholarship', 'pm-usp-college-scholarship'],
  ['aicte-pragati', 'aicte-pragati'],
  ['aicte-saksham', 'aicte-saksham'],
  ['aicte-swanath', 'aicte-swanath'],
  ['wb-svmcm', 'wb-svmcm'],
  ['wb-kanyashree', 'wb-kanyashree'],
  ['tn-pudhumai-penn', 'tn-pudhumai-penn'],
  ['pm-matru-vandana', 'maternity'],
  ['janani-suraksha', 'maternity'],
  ['janani-shishu-suraksha', 'maternity'],
  ['karnataka-cmkky', 'training'],
  ['pm-internship', 'training'],
  ['niti-internship', 'training'],
  ['dpiit-internship', 'training'],
  ['national-apprenticeship-training', 'training'],
]);

const categoryPhotos = new Map([
  ['agriculture', 'agriculture'],
  ['health', 'health'],
  ['housing', 'housing'],
  ['women', 'women'],
  ['employment', 'employment'],
  ['social-security', 'social-security'],
  ['education', 'pm-usp-college-scholarship'],
  ['finance', 'finance'],
  ['energy', 'energy'],
  ['other', 'public'],
]);

const descriptions = new Map([
  ['agriculture', 'Two people examining a plant in a field'],
  ['employment', 'A woman sewing patterned fabric while others work nearby'],
  ['energy', 'A technician showing a family the solar panels on their roof'],
  ['finance', 'Two people discussing paperwork across a counter'],
  ['health', 'A clinician checking a patient’s blood pressure'],
  ['housing', 'Two people sitting together on a porch outside a home'],
  ['maternity', 'A health worker talking to a woman holding a baby'],
  ['public', 'A worker at a service counter helping a group with paperwork'],
  ['social-security', 'Two older adults and a woman looking at a form together'],
  ['training', 'An instructor and three learners working on a mechanical part'],
  ['women', 'A group of women talking around a table with papers'],
  ['aicte-pragati', 'Two students working on an electronics project at a bench'],
  ['aicte-saksham', 'A student in a wheelchair and a classmate working on an electronics project'],
  ['aicte-swanath', 'A student writing at a desk beside a classroom window'],
  ['national-means-merit-scholarship', 'Two school students studying together outdoors'],
  ['pm-usp-college-scholarship', 'Three students reading and taking notes together outdoors'],
  ['tn-pudhumai-penn', 'Two students carrying notebooks through a college corridor'],
  ['wb-kanyashree', 'Two students sharing a book on a school walkway'],
  ['wb-svmcm', 'A student writing at a library table beside an open book'],
]);

export default function SchemeBanner({ slug, category, featured = false, priority = false }) {
  const name = schemePhotos.get(slug) ?? categoryPhotos.get(category) ?? 'public';
  const original = images[`./assets/schemes/${name}.webp`] ?? images[`./assets/scholarships/${name}.webp`];
  const variants = [256, 640, 960].map((width) => `${images[`./assets/responsive/${name}-${width}.webp`]} ${width}w`);
  const eager = featured || priority;
  const sizes = featured ? '(max-width: 639px) calc(100vw - 2rem), (max-width: 1216px) 45vw, 535px'
    : 'clamp(5.5rem, 16vw, 14rem)';

  return (
    <div className="scheme-banner">
      <img
        src={original}
        srcSet={[...variants, `${original} 1280w`].join(', ')}
        sizes={sizes}
        width="1280"
        height="640"
        alt={descriptions.get(name)}
        lang="en"
        dir="ltr"
        decoding="async"
        loading={eager ? 'eager' : 'lazy'}
        fetchPriority={eager ? 'high' : undefined}
      />
    </div>
  );
}
