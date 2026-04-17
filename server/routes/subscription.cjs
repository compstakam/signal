const { Router } = require('express');
const db = require('../db.cjs');

const router = Router();

const TIERS = {
  starter:    { label: 'Starter',      limit: 50,   price: 100 },
  growth:     { label: 'Growth',       limit: 150,  price: 250 },
  pro:        { label: 'Pro',          limit: 500,  price: 600 },
  enterprise: { label: 'Enterprise',   limit: -1,   price: null },
};

// Get current subscription + usage
router.get('/', (req, res) => {
  const sub = db.prepare('SELECT tier, monthly_limit FROM subscription WHERE id = 1').get();
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

  const usage = db.prepare(
    "SELECT COALESCE(SUM(lead_count), 0) as exported FROM export_log WHERE exported_at >= ?"
  ).get(monthStart);

  const tierInfo = TIERS[sub.tier] || TIERS.starter;

  res.json({
    tier: sub.tier,
    tierLabel: tierInfo.label,
    monthlyLimit: tierInfo.limit,
    exported: usage.exported,
    remaining: tierInfo.limit === -1 ? -1 : Math.max(0, tierInfo.limit - usage.exported),
    tiers: Object.entries(TIERS).map(([key, val]) => ({
      key,
      label: val.label,
      limit: val.limit,
      price: val.price,
      current: key === sub.tier,
    })),
  });
});

// Record an export
router.post('/record-export', (req, res) => {
  const { leadCount } = req.body;
  if (!leadCount || leadCount < 1) {
    return res.status(400).json({ error: 'leadCount is required' });
  }

  // Check limit
  const sub = db.prepare('SELECT tier, monthly_limit FROM subscription WHERE id = 1').get();
  const tierInfo = TIERS[sub.tier] || TIERS.starter;

  if (tierInfo.limit !== -1) {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const usage = db.prepare(
      "SELECT COALESCE(SUM(lead_count), 0) as exported FROM export_log WHERE exported_at >= ?"
    ).get(monthStart);

    const remaining = tierInfo.limit - usage.exported;
    if (leadCount > remaining) {
      return res.status(403).json({
        error: 'Export limit exceeded',
        remaining,
        limit: tierInfo.limit,
        exported: usage.exported,
      });
    }
  }

  db.prepare('INSERT INTO export_log (lead_count) VALUES (?)').run(leadCount);

  // Return updated usage
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const usage = db.prepare(
    "SELECT COALESCE(SUM(lead_count), 0) as exported FROM export_log WHERE exported_at >= ?"
  ).get(monthStart);

  res.json({
    exported: usage.exported,
    remaining: tierInfo.limit === -1 ? -1 : Math.max(0, tierInfo.limit - usage.exported),
  });
});

// Change tier
router.post('/change-tier', (req, res) => {
  const { tier } = req.body;
  if (!TIERS[tier]) {
    return res.status(400).json({ error: 'Invalid tier' });
  }
  const tierInfo = TIERS[tier];
  db.prepare('UPDATE subscription SET tier = ?, monthly_limit = ? WHERE id = 1').run(tier, tierInfo.limit);
  res.json({ tier, label: tierInfo.label, limit: tierInfo.limit, price: tierInfo.price });
});

module.exports = router;
