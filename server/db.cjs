const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

const db = new Database(path.join(dataDir, 'app.db'));

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS sessions (
    id INTEGER PRIMARY KEY DEFAULT 1,
    last_login TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS lead_snapshots (
    lead_id TEXT PRIMARY KEY,
    first_seen TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS projects (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT DEFAULT '',
    filter_criteria TEXT DEFAULT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS enrichment_cache (
    tenant_name TEXT PRIMARY KEY,
    website TEXT DEFAULT '',
    phone TEXT DEFAULT '',
    contact_name TEXT DEFAULT '',
    contact_email TEXT DEFAULT '',
    enriched_at TEXT NOT NULL DEFAULT (datetime('now')),
    status TEXT DEFAULT 'pending'
  );

  CREATE TABLE IF NOT EXISTS lead_outreach (
    lead_id TEXT PRIMARY KEY,
    contacted INTEGER NOT NULL DEFAULT 0,
    send_outreach INTEGER NOT NULL DEFAULT 0,
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS subscription (
    id INTEGER PRIMARY KEY DEFAULT 1,
    tier TEXT NOT NULL DEFAULT 'starter',
    monthly_limit INTEGER NOT NULL DEFAULT 50
  );

  CREATE TABLE IF NOT EXISTS signal_preferences (
    id INTEGER PRIMARY KEY DEFAULT 1,
    sqft_min INTEGER NOT NULL DEFAULT 5000,
    sqft_max INTEGER NOT NULL DEFAULT 25000,
    preferred_industries TEXT NOT NULL DEFAULT '[]',
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS export_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    lead_count INTEGER NOT NULL,
    exported_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS project_leads (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    lead_id TEXT NOT NULL,
    added_at TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE(project_id, lead_id)
  );
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS onboarding (
    id INTEGER PRIMARY KEY DEFAULT 1,
    completed INTEGER NOT NULL DEFAULT 0,
    current_step INTEGER NOT NULL DEFAULT 1,
    email TEXT DEFAULT '',
    company_name TEXT DEFAULT '',
    industry TEXT DEFAULT '',
    territory_type TEXT DEFAULT '',
    territory_value TEXT DEFAULT '',
    search_count INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT NOT NULL UNIQUE,
    full_name TEXT DEFAULT '',
    company_name TEXT DEFAULT '',
    industry TEXT DEFAULT '',
    role TEXT DEFAULT '',
    territory_type TEXT DEFAULT '',
    territory_value TEXT DEFAULT '',
    tier TEXT NOT NULL DEFAULT 'starter',
    monthly_limit INTEGER NOT NULL DEFAULT 50,
    status TEXT NOT NULL DEFAULT 'active',
    onboarding_completed INTEGER NOT NULL DEFAULT 0,
    onboarding_step INTEGER NOT NULL DEFAULT 1,
    search_count INTEGER NOT NULL DEFAULT 0,
    total_exports INTEGER NOT NULL DEFAULT 0,
    total_logins INTEGER NOT NULL DEFAULT 0,
    leads_saved INTEGER NOT NULL DEFAULT 0,
    projects_created INTEGER NOT NULL DEFAULT 0,
    contacts_uploaded INTEGER NOT NULL DEFAULT 0,
    billing_renewal_date TEXT DEFAULT NULL,
    trial_start_date TEXT DEFAULT NULL,
    trial_end_date TEXT DEFAULT NULL,
    payment_method TEXT DEFAULT '',
    last_login TEXT DEFAULT NULL,
    first_login TEXT DEFAULT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS login_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    logged_in_at TEXT NOT NULL DEFAULT (datetime('now')),
    ip_address TEXT DEFAULT '',
    user_agent TEXT DEFAULT ''
  );

  CREATE TABLE IF NOT EXISTS user_export_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    lead_count INTEGER NOT NULL,
    exported_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS admin_notes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    note TEXT NOT NULL,
    created_by TEXT DEFAULT 'admin',
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
`);

// Seed demo users if table is empty
const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get().count;
if (userCount === 0) {
  const insertUser = db.prepare(`
    INSERT INTO users (email, full_name, company_name, industry, role, tier, monthly_limit, status,
      onboarding_completed, onboarding_step, search_count, total_exports, total_logins, leads_saved,
      projects_created, contacts_uploaded, billing_renewal_date, trial_start_date, trial_end_date,
      payment_method, last_login, first_login, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const now = new Date().toISOString();
  const thirtyDaysFromNow = new Date(Date.now() + 30 * 86400000).toISOString();
  const nextMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 19).toISOString();

  // Primary user (from onboarding)
  insertUser.run(
    'alyssa@compstak.com', 'Alyssa Murrett', 'CompStak', 'Real Estate', 'Sales Director',
    'starter', 50, 'active', 1, 5, 4, 12, 8, 47, 3, 1,
    nextMonth, now, thirtyDaysFromNow, 'visa_4242', now, now, now
  );

  // Demo users
  insertUser.run(
    'john.davis@movingco.com', 'John Davis', 'Metro Moving Co', 'Transportation & Logistics', 'Account Executive',
    'growth', 150, 'active', 1, 5, 18, 87, 24, 210, 7, 3,
    nextMonth, '2025-11-15T10:00:00Z', '2025-12-15T10:00:00Z', 'visa_1234', '2026-03-18T14:30:00Z', '2025-11-15T10:00:00Z', '2025-11-15T10:00:00Z'
  );
  insertUser.run(
    'sarah.chen@cleanpro.io', 'Sarah Chen', 'CleanPro Services', 'Professional Services', 'VP of Sales',
    'pro', 500, 'active', 1, 5, 52, 342, 67, 890, 14, 8,
    nextMonth, '2025-09-01T08:00:00Z', '2025-10-01T08:00:00Z', 'mc_5678', '2026-03-19T09:15:00Z', '2025-09-01T08:00:00Z', '2025-09-01T08:00:00Z'
  );
  insertUser.run(
    'mike.rodriguez@techsales.com', 'Mike Rodriguez', 'TechSales Inc', 'Technology', 'SDR Manager',
    'starter', 50, 'active', 1, 5, 6, 23, 11, 65, 2, 0,
    nextMonth, '2026-01-20T12:00:00Z', '2026-02-20T12:00:00Z', '', '2026-03-15T16:45:00Z', '2026-01-20T12:00:00Z', '2026-01-20T12:00:00Z'
  );
  insertUser.run(
    'lisa.park@officefit.com', 'Lisa Park', 'OfficeFit Solutions', 'Construction', 'Sales Rep',
    'starter', 50, 'trial', 0, 3, 2, 0, 3, 0, 0, 0,
    null, '2026-03-17T11:00:00Z', '2026-04-17T11:00:00Z', '', '2026-03-18T10:00:00Z', '2026-03-17T11:00:00Z', '2026-03-17T11:00:00Z'
  );
  insertUser.run(
    'david.kim@securenet.com', 'David Kim', 'SecureNet Systems', 'Technology', 'Enterprise AE',
    'enterprise', -1, 'active', 1, 5, 120, 1580, 156, 3200, 28, 15,
    nextMonth, '2025-06-10T09:00:00Z', '2025-07-10T09:00:00Z', 'wire_transfer', '2026-03-19T11:30:00Z', '2025-06-10T09:00:00Z', '2025-06-10T09:00:00Z'
  );
  insertUser.run(
    'emma.wilson@realtylead.co', 'Emma Wilson', 'Realty Lead Co', 'Real Estate', 'Founder',
    'growth', 150, 'churned', 1, 5, 31, 145, 42, 410, 9, 5,
    null, '2025-08-01T10:00:00Z', '2025-09-01T10:00:00Z', 'visa_9012', '2026-01-05T08:20:00Z', '2025-08-01T10:00:00Z', '2025-08-01T10:00:00Z'
  );
  insertUser.run(
    'james.foster@insurepro.com', 'James Foster', 'InsurePro Agency', 'Insurance', '',
    'starter', 50, 'invited', 0, 1, 0, 0, 0, 0, 0, 0,
    null, null, null, '', null, null, '2026-03-19T08:00:00Z'
  );

  // Seed some login logs for demo users
  const insertLogin = db.prepare('INSERT INTO login_log (user_id, logged_in_at) VALUES (?, ?)');
  for (let i = 1; i <= 7; i++) {
    const logins = [8, 24, 67, 11, 3, 156, 42][i - 1];
    for (let j = 0; j < Math.min(logins, 10); j++) {
      const daysAgo = Math.floor(Math.random() * 90);
      const loginDate = new Date(Date.now() - daysAgo * 86400000).toISOString();
      insertLogin.run(i, loginDate);
    }
  }

  // Seed some export logs for demo users
  const insertExport = db.prepare('INSERT INTO user_export_log (user_id, lead_count, exported_at) VALUES (?, ?, ?)');
  for (let i = 1; i <= 7; i++) {
    const exports = [12, 87, 342, 23, 0, 1580, 145][i - 1];
    for (let j = 0; j < Math.min(exports, 8); j++) {
      const daysAgo = Math.floor(Math.random() * 30);
      const exportDate = new Date(Date.now() - daysAgo * 86400000).toISOString();
      const count = Math.floor(Math.random() * 20) + 1;
      insertExport.run(i, count, exportDate);
    }
  }
}

// Ensure onboarding row exists
const onb = db.prepare('SELECT id FROM onboarding WHERE id = 1').get();
if (!onb) {
  db.prepare('INSERT INTO onboarding (id) VALUES (1)').run();
}

// Ensure session row exists
const session = db.prepare('SELECT id FROM sessions WHERE id = 1').get();
if (!session) {
  db.prepare('INSERT INTO sessions (id, last_login) VALUES (1, ?)').run(new Date().toISOString());
}

// Ensure subscription row exists
const sub = db.prepare('SELECT id FROM subscription WHERE id = 1').get();
if (!sub) {
  db.prepare("INSERT INTO subscription (id, tier, monthly_limit) VALUES (1, 'starter', 50)").run();
}

// Ensure signal_preferences row exists
const sigPref = db.prepare('SELECT id FROM signal_preferences WHERE id = 1').get();
if (!sigPref) {
  db.prepare('INSERT INTO signal_preferences (id) VALUES (1)').run();
}

module.exports = db;
