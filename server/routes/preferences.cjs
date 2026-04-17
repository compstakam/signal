const { Router } = require('express');
const db = require('../db.cjs');

const router = Router();

// Get current signal score preferences
router.get('/', (req, res) => {
  const prefs = db.prepare('SELECT * FROM signal_preferences WHERE id = 1').get();
  res.json({
    sqftMin: prefs.sqft_min,
    sqftMax: prefs.sqft_max,
    preferredIndustries: JSON.parse(prefs.preferred_industries),
  });
});

// Save signal score preferences
router.post('/', (req, res) => {
  const { sqftMin, sqftMax, preferredIndustries } = req.body;

  if (typeof sqftMin !== 'number' || typeof sqftMax !== 'number' || sqftMin < 0 || sqftMax <= sqftMin) {
    return res.status(400).json({ error: 'sqftMin must be less than sqftMax, both positive numbers' });
  }
  if (!Array.isArray(preferredIndustries)) {
    return res.status(400).json({ error: 'preferredIndustries must be an array of strings' });
  }

  db.prepare(`
    UPDATE signal_preferences
    SET sqft_min = ?, sqft_max = ?, preferred_industries = ?, updated_at = datetime('now')
    WHERE id = 1
  `).run(sqftMin, sqftMax, JSON.stringify(preferredIndustries));

  res.json({ sqftMin, sqftMax, preferredIndustries });
});

module.exports = router;
