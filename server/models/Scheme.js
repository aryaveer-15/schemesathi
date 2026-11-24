const mongoose = require('mongoose');
const { categories, languages } = require('../catalogFields');

const translationFields = Object.fromEntries(languages.map((language) => [
  language, { type: String, required: language === 'en', trim: true },
]));

const schemeSchema = new mongoose.Schema(
  {
    slug: { type: String, required: true, unique: true },
    title: translationFields,
    summary: translationFields,
    category: {
      type: String,
      enum: categories,
      required: true,
    },
    level: { type: String, enum: ['central', 'state'], default: 'central' },
    state: { type: String, default: 'All India' },
    sourceUrl: { type: String, default: '' },
    sourceDataset: { type: String, default: '' },
    eligibilityRules: { type: Object, default: {} },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Scheme', schemeSchema);
