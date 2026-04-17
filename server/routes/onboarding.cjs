const { Router } = require('express');
const db = require('../db.cjs');

const router = Router();

// Get onboarding state
router.get('/', (req, res) => {
  const row = db.prepare('SELECT * FROM onboarding WHERE id = 1').get();
  res.json({
    completed: !!row.completed,
    currentStep: row.current_step,
    email: row.email,
    companyName: row.company_name,
    industry: row.industry,
    territoryType: row.territory_type,
    territoryValue: row.territory_value,
    searchCount: row.search_count,
  });
});

// Update onboarding step data
router.post('/step', (req, res) => {
  const { step, data } = req.body;
  if (!step || step < 1 || step > 5) {
    return res.status(400).json({ error: 'Invalid step (1-5)' });
  }

  if (step === 1 && data) {
    db.prepare(
      'UPDATE onboarding SET current_step = 2, email = ?, company_name = ?, industry = ? WHERE id = 1'
    ).run(data.email || '', data.companyName || '', data.industry || '');
  } else if (step === 2 && data) {
    db.prepare(
      'UPDATE onboarding SET current_step = 3, territory_type = ?, territory_value = ? WHERE id = 1'
    ).run(data.territoryType || '', JSON.stringify(data.territoryValue || ''));
  } else if (step === 3) {
    db.prepare('UPDATE onboarding SET current_step = 4 WHERE id = 1').run();
  } else if (step === 4) {
    db.prepare('UPDATE onboarding SET current_step = 5 WHERE id = 1').run();
  } else if (step === 5) {
    db.prepare('UPDATE onboarding SET completed = 1, current_step = 5 WHERE id = 1').run();
  }

  const row = db.prepare('SELECT * FROM onboarding WHERE id = 1').get();
  res.json({
    completed: !!row.completed,
    currentStep: row.current_step,
    email: row.email,
    companyName: row.company_name,
    industry: row.industry,
    territoryType: row.territory_type,
    territoryValue: row.territory_value,
    searchCount: row.search_count,
  });
});

// Increment search count (called when user performs a search)
router.post('/search-count', (req, res) => {
  db.prepare('UPDATE onboarding SET search_count = search_count + 1 WHERE id = 1').run();
  const row = db.prepare('SELECT search_count, completed FROM onboarding WHERE id = 1').get();
  res.json({ searchCount: row.search_count, completed: !!row.completed });
});

// Skip / complete onboarding
router.post('/complete', (req, res) => {
  db.prepare('UPDATE onboarding SET completed = 1 WHERE id = 1').run();
  res.json({ completed: true });
});

// Reset onboarding (for testing)
router.post('/reset', (req, res) => {
  db.prepare(
    "UPDATE onboarding SET completed = 0, current_step = 1, email = '', company_name = '', industry = '', territory_type = '', territory_value = '', search_count = 0 WHERE id = 1"
  ).run();
  res.json({ reset: true });
});

module.exports = router;
