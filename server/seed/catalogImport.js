const { readFile } = require('node:fs/promises');
const dns = require('node:dns');
const mongoose = require('mongoose');
const { categories, languages } = require('../catalogFields');
const Scheme = require('../models/Scheme');
const maintainedSlugs = new Set(require('../catalog').map(({ slug }) => slug));

function requiredText(value, maxLength) {
  if (typeof value !== 'string' || !value.trim() || value.trim().length > maxLength) {
    throw new Error('invalid or missing text');
  }
  return value.trim();
}

function httpsUrl(value) {
  const url = new URL(requiredText(value, 2048));
  if (url.protocol !== 'https:' || url.username || url.password) throw new Error('expected a public HTTPS link');
  return url.href;
}

function translations(value, maxLength) {
  if (typeof value === 'string') return { en: requiredText(value, maxLength) };
  if (!value || typeof value !== 'object' || Array.isArray(value) || !Object.hasOwn(value, 'en')) {
    throw new Error('English text is required');
  }
  return Object.fromEntries(Object.entries(value).map(([language, text]) => {
    if (!languages.includes(language)) throw new Error('unsupported translation language');
    return [language, requiredText(text, maxLength)];
  }));
}

function normalizeImport({ sourceUrl, schemes } = {}) {
  const sourceDataset = httpsUrl(sourceUrl);
  if (!Array.isArray(schemes) || schemes.length === 0 || schemes.length > 20_000) {
    throw new Error('expected between 1 and 20,000 schemes');
  }
  const seen = new Set();
  return schemes.map((scheme, index) => {
    try {
      const slug = requiredText(scheme.slug, 150);
      if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) || seen.has(slug) || maintainedSlugs.has(slug)) {
        throw new Error('invalid, repeated, or maintained scheme slug');
      }
      if (!categories.includes(scheme.category) || !['state', 'central'].includes(scheme.level)) {
        throw new Error('invalid category or jurisdiction');
      }
      if (Object.hasOwn(scheme, 'eligibilityRules') || Object.hasOwn(scheme, 'eligibilityMode')) {
        throw new Error('catalog imports cannot assign eligibility rules');
      }
      const state = scheme.level === 'state' ? requiredText(scheme.state, 100) : 'All India';
      if (scheme.level === 'state' && state.toLowerCase() === 'all india') throw new Error('state is required');
      const requirements = scheme.eligibilityRequirements;
      if (requirements !== undefined && (!Array.isArray(requirements) || requirements.length > 30)) {
        throw new Error('expected up to 30 eligibility requirements');
      }
      seen.add(slug);
      return {
        slug, state, sourceDataset,
        category: scheme.category, level: scheme.level,
        title: translations(scheme.title, 250),
        summary: translations(scheme.summary, 1500),
        sourceUrl: httpsUrl(scheme.sourceUrl),
        ...(requirements?.length && { eligibilityRequirements: requirements.map((item) => translations(item, 600)) }),
      };
    } catch (error) {
      throw new Error(`Row ${index + 1}: ${error.message}`);
    }
  });
}

async function run(file, apply) {
  const rows = normalizeImport(JSON.parse(await readFile(file, 'utf8')));
  if (!apply) {
    console.log(`Validated ${rows.length} schemes. Use --apply to insert missing records.`);
    return;
  }
  require('dotenv').config({ quiet: true });
  if (!process.env.MONGO_URI) throw new Error('MONGO_URI is required');
  if (process.env.MONGO_DNS_SERVERS) {
    dns.setServers(process.env.MONGO_DNS_SERVERS.split(',').map((value) => value.trim()));
  }
  await mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 10_000 });
  try {
    await Scheme.init();
    let added = 0;
    for (let start = 0; start < rows.length; start += 250) {
      const importedAt = new Date();
      const result = await Scheme.bulkWrite(rows.slice(start, start + 250).map((scheme) => ({
        updateOne: {
          filter: { slug: scheme.slug },
          update: { $setOnInsert: { ...scheme, createdAt: importedAt, updatedAt: importedAt } },
          upsert: true,
          timestamps: false,
        },
      })));
      added += result.upsertedCount;
    }
    console.log(`Added ${added} schemes and preserved ${rows.length - added} existing records.`);
  } finally {
    await mongoose.disconnect();
  }
}

if (require.main === module) {
  const [file, flag, ...extra] = process.argv.slice(2);
  if (!file || (flag && flag !== '--apply') || extra.length) {
    console.error('Usage: npm run import:catalog -- path/to/authorized-catalog.json [--apply]');
    process.exitCode = 1;
  } else {
    run(file, flag === '--apply').catch((error) => {
      console.error(error.name === 'MongooseServerSelectionError' ? error.name : error.message);
      process.exitCode = 1;
    });
  }
}

module.exports = { normalizeImport };
