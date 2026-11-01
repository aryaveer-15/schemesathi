const mongoose = require('mongoose');

const schemeSchema = new mongoose.Schema(
  {
    slug: { type: String, required: true, unique: true },
    title: {
      en: { type: String, required: true },
      hi: { type: String, default: '' },
      kn: { type: String, default: '' },
    },
    summary: {
      en: { type: String, required: true },
      hi: { type: String, default: '' },
      kn: { type: String, default: '' },
    },
    category: {
      type: String,
      enum: ['agriculture', 'health', 'housing', 'women', 'employment', 'social-security'],
      required: true,
    },
    level: { type: String, enum: ['central', 'state'], default: 'central' },
    state: { type: String, default: 'All India' },
    sourceUrl: { type: String, default: '' },
    eligibilityRules: { type: Object, default: {} },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Scheme', schemeSchema);