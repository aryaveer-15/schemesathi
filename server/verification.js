const { inventory } = require('./verificationInventory');
const records = require('./verificationRecords.json');

const bySlug = new Map(inventory.map((row) => [row.scheme.slug, row]));

function verificationFor(slug, entries = records) {
  const row = bySlug.get(slug);
  const record = Object.hasOwn(entries, slug) ? entries[slug] : undefined;
  const review = record?.review;
  return {
    bannerDisabled: record?.bannerDisabled === true,
    // The date covers only the reviewed snapshot of a maintained listing.
    lastVerifiedAt: review?.matches === 'yes' && row && review.fingerprint === row.fingerprint ? review.date : null,
  };
}

module.exports = { bySlug, verificationFor };
