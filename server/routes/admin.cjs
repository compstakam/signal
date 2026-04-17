const { Router } = require('express');
const db = require('../db.cjs');

const router = Router();

const TIERS = {
  starter:    { label: 'Starter',    limit: 50,   price: 100 },
  growth:     { label: 'Growth',     limit: 150,  price: 250 },
  pro:        { label: 'Pro',        limit: 500,  price: 600 },
  enterprise: { label: 'Enterprise', limit: -1,   price: null },
};

// ── Dashboard stats ──────────────────────────────────────────────────────
router.get('/stats', (req, res) => {
  const totalUsers = db.prepare('SELECT COUNT(*) as count FROM users').get().count;
  const activeUsers = db.prepare("SELECT COUNT(*) as count FROM users WHERE status = 'active'").get().count;
  const trialUsers = db.prepare("SELECT COUNT(*) as count FROM users WHERE status = 'trial'").get().count;
  const churnedUsers = db.prepare("SELECT COUNT(*) as count FROM users WHERE status = 'churned'").get().count;
  const invitedUsers = db.prepare("SELECT COUNT(*) as count FROM users WHERE status = 'invited'").get().count;
  const onboardingComplete = db.prepare('SELECT COUNT(*) as count FROM users WHERE onboarding_completed = 1').get().count;
  const onboardingIncomplete = db.prepare('SELECT COUNT(*) as count FROM users WHERE onboarding_completed = 0').get().count;

  // Revenue metrics
  const tierCounts = db.prepare(`
    SELECT tier, COUNT(*) as count FROM users WHERE status IN ('active', 'trial') GROUP BY tier
  `).all();
  let mrr = 0;
  for (const t of tierCounts) {
    const info = TIERS[t.tier];
    if (info && info.price) mrr += info.price * t.count;
  }

  // Monthly export totals
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const totalExportsThisMonth = db.prepare(
    "SELECT COALESCE(SUM(lead_count), 0) as total FROM user_export_log WHERE exported_at >= ?"
  ).get(monthStart).total;

  // Logins last 7 days
  const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString();
  const loginsLast7Days = db.prepare(
    "SELECT COUNT(*) as count FROM login_log WHERE logged_in_at >= ?"
  ).get(weekAgo).count;

  // Logins last 30 days
  const monthAgo = new Date(Date.now() - 30 * 86400000).toISOString();
  const loginsLast30Days = db.prepare(
    "SELECT COUNT(*) as count FROM login_log WHERE logged_in_at >= ?"
  ).get(monthAgo).count;

  res.json({
    totalUsers,
    activeUsers,
    trialUsers,
    churnedUsers,
    invitedUsers,
    onboardingComplete,
    onboardingIncomplete,
    mrr,
    totalExportsThisMonth,
    loginsLast7Days,
    loginsLast30Days,
    tierBreakdown: tierCounts,
  });
});

// ── List all users ───────────────────────────────────────────────────────
router.get('/users', (req, res) => {
  const { status, tier, sort, order, search } = req.query;

  let query = 'SELECT * FROM users WHERE 1=1';
  const params = [];

  if (status) {
    query += ' AND status = ?';
    params.push(status);
  }
  if (tier) {
    query += ' AND tier = ?';
    params.push(tier);
  }
  if (search) {
    query += ' AND (email LIKE ? OR full_name LIKE ? OR company_name LIKE ?)';
    const s = `%${search}%`;
    params.push(s, s, s);
  }

  const sortCol = {
    name: 'full_name', email: 'email', company: 'company_name',
    tier: 'tier', status: 'status', logins: 'total_logins',
    exports: 'total_exports', created: 'created_at', last_login: 'last_login',
  }[sort] || 'created_at';
  const sortOrder = order === 'asc' ? 'ASC' : 'DESC';
  query += ` ORDER BY ${sortCol} ${sortOrder}`;

  const users = db.prepare(query).all(...params);

  // Compute current month exports for each user
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

  const result = users.map(u => {
    const monthExports = db.prepare(
      "SELECT COALESCE(SUM(lead_count), 0) as total FROM user_export_log WHERE user_id = ? AND exported_at >= ?"
    ).get(u.id, monthStart).total;

    const tierInfo = TIERS[u.tier] || TIERS.starter;

    return {
      id: u.id,
      email: u.email,
      fullName: u.full_name,
      companyName: u.company_name,
      industry: u.industry,
      role: u.role,
      territoryType: u.territory_type,
      territoryValue: u.territory_value,
      tier: u.tier,
      tierLabel: tierInfo.label,
      monthlyLimit: tierInfo.limit,
      tierPrice: tierInfo.price,
      status: u.status,
      onboardingCompleted: !!u.onboarding_completed,
      onboardingStep: u.onboarding_step,
      searchCount: u.search_count,
      totalExports: u.total_exports,
      monthExports,
      totalLogins: u.total_logins,
      leadsSaved: u.leads_saved,
      projectsCreated: u.projects_created,
      contactsUploaded: u.contacts_uploaded,
      billingRenewalDate: u.billing_renewal_date,
      trialStartDate: u.trial_start_date,
      trialEndDate: u.trial_end_date,
      paymentMethod: u.payment_method,
      lastLogin: u.last_login,
      firstLogin: u.first_login,
      createdAt: u.created_at,
      updatedAt: u.updated_at,
    };
  });

  res.json(result);
});

// ── Get single user detail ───────────────────────────────────────────────
router.get('/users/:id', (req, res) => {
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.id);
  if (!user) return res.status(404).json({ error: 'User not found' });

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const monthExports = db.prepare(
    "SELECT COALESCE(SUM(lead_count), 0) as total FROM user_export_log WHERE user_id = ? AND exported_at >= ?"
  ).get(user.id, monthStart).total;

  const recentLogins = db.prepare(
    'SELECT * FROM login_log WHERE user_id = ? ORDER BY logged_in_at DESC LIMIT 20'
  ).all(user.id);

  const recentExports = db.prepare(
    'SELECT * FROM user_export_log WHERE user_id = ? ORDER BY exported_at DESC LIMIT 20'
  ).all(user.id);

  const notes = db.prepare(
    'SELECT * FROM admin_notes WHERE user_id = ? ORDER BY created_at DESC'
  ).all(user.id);

  // Monthly export history (last 6 months)
  const exportHistory = [];
  for (let i = 0; i < 6; i++) {
    const start = new Date(now.getFullYear(), now.getMonth() - i, 1).toISOString();
    const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 1).toISOString();
    const total = db.prepare(
      "SELECT COALESCE(SUM(lead_count), 0) as total FROM user_export_log WHERE user_id = ? AND exported_at >= ? AND exported_at < ?"
    ).get(user.id, start, end).total;
    const monthName = new Date(now.getFullYear(), now.getMonth() - i, 1).toLocaleString('default', { month: 'short', year: 'numeric' });
    exportHistory.push({ month: monthName, total });
  }

  const tierInfo = TIERS[user.tier] || TIERS.starter;

  res.json({
    id: user.id,
    email: user.email,
    fullName: user.full_name,
    companyName: user.company_name,
    industry: user.industry,
    role: user.role,
    territoryType: user.territory_type,
    territoryValue: user.territory_value,
    tier: user.tier,
    tierLabel: tierInfo.label,
    monthlyLimit: tierInfo.limit,
    tierPrice: tierInfo.price,
    status: user.status,
    onboardingCompleted: !!user.onboarding_completed,
    onboardingStep: user.onboarding_step,
    searchCount: user.search_count,
    totalExports: user.total_exports,
    monthExports,
    totalLogins: user.total_logins,
    leadsSaved: user.leads_saved,
    projectsCreated: user.projects_created,
    contactsUploaded: user.contacts_uploaded,
    billingRenewalDate: user.billing_renewal_date,
    trialStartDate: user.trial_start_date,
    trialEndDate: user.trial_end_date,
    paymentMethod: user.payment_method,
    lastLogin: user.last_login,
    firstLogin: user.first_login,
    createdAt: user.created_at,
    updatedAt: user.updated_at,
    recentLogins: recentLogins.map(l => ({
      id: l.id, loggedInAt: l.logged_in_at, ipAddress: l.ip_address, userAgent: l.user_agent,
    })),
    recentExports: recentExports.map(e => ({
      id: e.id, leadCount: e.lead_count, exportedAt: e.exported_at,
    })),
    notes: notes.map(n => ({
      id: n.id, note: n.note, createdBy: n.created_by, createdAt: n.created_at,
    })),
    exportHistory,
  });
});

// ── Update user ──────────────────────────────────────────────────────────
router.put('/users/:id', (req, res) => {
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.id);
  if (!user) return res.status(404).json({ error: 'User not found' });

  const {
    fullName, email, companyName, industry, role,
    tier, status, billingRenewalDate,
  } = req.body;

  const tierInfo = tier ? (TIERS[tier] || TIERS.starter) : null;

  db.prepare(`
    UPDATE users SET
      full_name = COALESCE(?, full_name),
      email = COALESCE(?, email),
      company_name = COALESCE(?, company_name),
      industry = COALESCE(?, industry),
      role = COALESCE(?, role),
      tier = COALESCE(?, tier),
      monthly_limit = COALESCE(?, monthly_limit),
      status = COALESCE(?, status),
      billing_renewal_date = COALESCE(?, billing_renewal_date),
      updated_at = datetime('now')
    WHERE id = ?
  `).run(
    fullName ?? null, email ?? null, companyName ?? null, industry ?? null, role ?? null,
    tier ?? null, tierInfo ? tierInfo.limit : null, status ?? null,
    billingRenewalDate ?? null, req.params.id
  );

  res.json({ success: true });
});

// ── Add admin note ───────────────────────────────────────────────────────
router.post('/users/:id/notes', (req, res) => {
  const { note } = req.body;
  if (!note) return res.status(400).json({ error: 'Note text is required' });

  db.prepare(
    'INSERT INTO admin_notes (user_id, note) VALUES (?, ?)'
  ).run(req.params.id, note);

  const notes = db.prepare(
    'SELECT * FROM admin_notes WHERE user_id = ? ORDER BY created_at DESC'
  ).all(req.params.id);

  res.json(notes.map(n => ({
    id: n.id, note: n.note, createdBy: n.created_by, createdAt: n.created_at,
  })));
});

// ── Delete admin note ────────────────────────────────────────────────────
router.delete('/users/:id/notes/:noteId', (req, res) => {
  db.prepare('DELETE FROM admin_notes WHERE id = ? AND user_id = ?').run(req.params.noteId, req.params.id);
  res.json({ success: true });
});

// ── Create / invite user ─────────────────────────────────────────────────
router.post('/users', (req, res) => {
  const { email, fullName, companyName, industry, tier } = req.body;
  if (!email) return res.status(400).json({ error: 'Email is required' });

  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
  if (existing) return res.status(409).json({ error: 'User with this email already exists' });

  const tierInfo = TIERS[tier || 'starter'] || TIERS.starter;
  const now = new Date().toISOString();

  const result = db.prepare(`
    INSERT INTO users (email, full_name, company_name, industry, tier, monthly_limit, status, created_at)
    VALUES (?, ?, ?, ?, ?, ?, 'invited', ?)
  `).run(email, fullName || '', companyName || '', industry || '', tier || 'starter', tierInfo.limit, now);

  res.json({ id: result.lastInsertRowid, email });
});

// ── Delete user ──────────────────────────────────────────────────────────
router.delete('/users/:id', (req, res) => {
  db.prepare('DELETE FROM users WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

module.exports = router;
