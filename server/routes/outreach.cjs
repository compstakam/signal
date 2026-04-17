const { Router } = require('express');
const db = require('../db.cjs');

const router = Router();

// Get all outreach statuses
router.get('/', (req, res) => {
  const rows = db.prepare('SELECT lead_id, contacted, send_outreach FROM lead_outreach WHERE contacted = 1 OR send_outreach = 1').all();
  const contacted = {};
  const sendOutreach = {};
  for (const row of rows) {
    if (row.contacted) contacted[row.lead_id] = true;
    if (row.send_outreach) sendOutreach[row.lead_id] = true;
  }
  res.json({ contacted, sendOutreach });
});

// Toggle a field for a single lead
router.post('/toggle', (req, res) => {
  const { leadId, field } = req.body;
  if (!leadId) return res.status(400).json({ error: 'leadId is required' });

  const col = field === 'sendOutreach' ? 'send_outreach' : 'contacted';

  const existing = db.prepare(`SELECT ${col} FROM lead_outreach WHERE lead_id = ?`).get(leadId);
  if (existing) {
    const newVal = existing[col] ? 0 : 1;
    db.prepare(`UPDATE lead_outreach SET ${col} = ?, updated_at = datetime('now') WHERE lead_id = ?`).run(newVal, leadId);
    res.json({ leadId, field: col, value: !!newVal });
  } else {
    db.prepare(`INSERT INTO lead_outreach (lead_id, ${col}) VALUES (?, 1)`).run(leadId);
    res.json({ leadId, field: col, value: true });
  }
});

// Bulk update a field
router.post('/bulk', (req, res) => {
  const { leadIds, field, value } = req.body;
  if (!Array.isArray(leadIds)) return res.status(400).json({ error: 'leadIds must be an array' });

  const col = field === 'sendOutreach' ? 'send_outreach' : 'contacted';
  const upsert = db.prepare(`
    INSERT INTO lead_outreach (lead_id, ${col}) VALUES (?, ?)
    ON CONFLICT(lead_id) DO UPDATE SET ${col} = excluded.${col}, updated_at = datetime('now')
  `);
  const run = db.transaction((ids) => {
    for (const id of ids) upsert.run(id, value ? 1 : 0);
  });
  run(leadIds);
  res.json({ updated: leadIds.length });
});

module.exports = router;
