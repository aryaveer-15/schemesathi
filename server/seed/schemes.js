const dns = require('dns');
dns.setServers(['8.8.8.8', '1.1.1.1']);
require('dotenv').config();
const mongoose = require('mongoose');
const Scheme = require('../models/Scheme');

const schemes = require('../catalog');

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  try {
    await Scheme.init();
    const result = await Scheme.bulkWrite(schemes.map((scheme) => ({
      updateOne: {
        filter: { slug: scheme.slug },
        update: { $setOnInsert: { ...scheme, createdAt: new Date(), updatedAt: new Date() } },
        upsert: true,
        timestamps: false,
      },
    })));
    console.log(`Added ${result.upsertedCount} schemes. Kept ${result.matchedCount} existing schemes.`);
  } finally {
    await mongoose.disconnect();
  }
}

run().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
