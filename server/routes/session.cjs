const { Router } = require('express');
const db = require('../db.cjs');

const router = Router();

// Record login, return previous lastLogin
router.post('/login', (req, res) => {
  const row = db.prepare('SELECT last_login FROM sessions WHERE id = 1').get();
  const previousLogin = row ? row.last_login : null;
  const now = new Date().toISOString();
  db.prepare('UPDATE sessions SET last_login = ? WHERE id = 1').run(now);
  res.json({ previousLogin, currentLogin: now });
});

// Accept leadIds, return which ones are new (not previously seen)
router.post('/snapshot', (req, res) => {
  const { leadIds } = req.body;
  if (!Array.isArray(leadIds)) {
    return res.status(400).json({ error: 'leadIds must be an array' });
  }

  const existing = new Set(
    db.prepare('SELECT lead_id FROM lead_snapshots').all().map(r => r.lead_id)
  );

  const newLeadIds = leadIds.filter(id => !existing.has(id));
  const now = new Date().toISOString();

  const insert = db.prepare('INSERT OR IGNORE INTO lead_snapshots (lead_id, first_seen) VALUES (?, ?)');
  const insertMany = db.transaction((ids) => {
    for (const id of ids) insert.run(id, now);
  });
  insertMany(newLeadIds);

  res.json({ newLeadIds });
});

module.exports = router;
