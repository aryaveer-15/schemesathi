const express = require('express');
const mongoose = require('mongoose');
const Scheme = require('../models/Scheme');

const router = express.Router();

function escapeRegex(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

router.get('/', async (req, res) => {
  try {
    const filter = {};
    if (typeof req.query.category === 'string' && req.query.category) {
      filter.category = req.query.category;
    }
    if (typeof req.query.q === 'string' && req.query.q.trim()) {
      const rx = new RegExp(escapeRegex(req.query.q.trim()), 'i');
      filter.$or = [{ 'title.en': rx }, { 'summary.en': rx }, { 'title.hi': rx }, { 'title.kn': rx }];
    }
    const schemes = await Scheme.find(filter).sort({ 'title.en': 1 });
    res.json(schemes);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ error: 'Invalid scheme id' });
    }
    const scheme = await Scheme.findById(req.params.id);
    if (!scheme) return res.status(404).json({ error: 'Scheme not found' });
    res.json(scheme);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;