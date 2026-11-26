const mongoose = require('mongoose');
const Scheme = require('./models/Scheme');

function classifySchemeId(id) {
  const objectId = mongoose.isValidObjectId(id);
  const slug = typeof id === 'string' && id.length <= 150 && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(id);
  return objectId || slug ? { objectId, slug } : null;
}

async function findScheme(id, { objectId, slug }) {
  const legacy = objectId ? await Scheme.findById(id).lean() : null;
  return legacy ?? (slug ? await Scheme.findOne({ slug: id }).lean() : null);
}

module.exports = { classifySchemeId, findScheme };
