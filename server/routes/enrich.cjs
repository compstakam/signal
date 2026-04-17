const { Router } = require('express');
const db = require('../db.cjs');

const router = Router();

// Get all cached enrichment data
router.get('/', (req, res) => {
  const rows = db.prepare(
    "SELECT tenant_name, website, phone, contact_name, contact_email, status FROM enrichment_cache WHERE status = 'done' OR contact_name != '' OR contact_email != ''"
  ).all();
  const map = {};
  for (const row of rows) {
    map[row.tenant_name] = {
      website: row.website,
      phone: row.phone,
      contactName: row.contact_name,
      contactEmail: row.contact_email,
    };
  }
  res.json(map);
});

// Upload contacts - match by tenant/company name
router.post('/upload-contacts', (req, res) => {
  const { contacts, overwrite } = req.body;
  if (!Array.isArray(contacts)) {
    return res.status(400).json({ error: 'contacts must be an array of {companyName, contactName, contactEmail}' });
  }

  // Overwrite mode: always replace with uploaded values (even empty ones won't replace since we filter them)
  // Non-overwrite mode: only fill in empty fields
  const upsertOverwrite = db.prepare(`
    INSERT INTO enrichment_cache (tenant_name, contact_name, contact_email, website, phone, status)
    VALUES (?, ?, ?, ?, ?, 'done')
    ON CONFLICT(tenant_name) DO UPDATE SET
      contact_name = excluded.contact_name,
      contact_email = excluded.contact_email,
      website = excluded.website,
      phone = excluded.phone,
      enriched_at = datetime('now')
  `);

  const upsertMerge = db.prepare(`
    INSERT INTO enrichment_cache (tenant_name, contact_name, contact_email, website, phone, status)
    VALUES (?, ?, ?, ?, ?, 'done')
    ON CONFLICT(tenant_name) DO UPDATE SET
      contact_name = CASE WHEN enrichment_cache.contact_name = '' OR enrichment_cache.contact_name IS NULL THEN excluded.contact_name ELSE enrichment_cache.contact_name END,
      contact_email = CASE WHEN enrichment_cache.contact_email = '' OR enrichment_cache.contact_email IS NULL THEN excluded.contact_email ELSE enrichment_cache.contact_email END,
      website = CASE WHEN enrichment_cache.website = '' OR enrichment_cache.website IS NULL THEN excluded.website ELSE enrichment_cache.website END,
      phone = CASE WHEN enrichment_cache.phone = '' OR enrichment_cache.phone IS NULL THEN excluded.phone ELSE enrichment_cache.phone END,
      enriched_at = datetime('now')
  `);

  const upsert = overwrite ? upsertOverwrite : upsertMerge;

  let matched = 0;
  const insertMany = db.transaction((items) => {
    for (const item of items) {
      if (item.companyName && (item.contactName || item.contactEmail || item.website || item.phone)) {
        upsert.run(
          item.companyName.trim(),
          (item.contactName || '').trim(),
          (item.contactEmail || '').trim(),
          (item.website || '').trim(),
          (item.phone || '').trim()
        );
        matched++;
      }
    }
  });
  insertMany(contacts);

  res.json({ matched, total: contacts.length });
});

// Enrich a batch of tenant names
router.post('/', async (req, res) => {
  const { tenantNames } = req.body;
  if (!Array.isArray(tenantNames)) {
    return res.status(400).json({ error: 'tenantNames must be an array' });
  }

  // Filter out already-cached names
  const cached = new Set(
    db.prepare("SELECT tenant_name FROM enrichment_cache WHERE status = 'done'")
      .all().map(r => r.tenant_name)
  );
  const toEnrich = [...new Set(tenantNames)].filter(n => !cached.has(n));

  if (toEnrich.length === 0) {
    return res.json({ enriched: 0, message: 'All tenants already enriched' });
  }

  // Mark as in-progress
  const upsert = db.prepare(
    "INSERT OR IGNORE INTO enrichment_cache (tenant_name, status) VALUES (?, 'in_progress')"
  );
  for (const name of toEnrich) upsert.run(name);

  // Enrich in background (non-blocking response)
  res.json({ enriched: toEnrich.length, message: `Enriching ${toEnrich.length} tenants in background` });

  // Process enrichment
  enrichBatch(toEnrich).catch(err => console.error('Enrichment error:', err));
});

// Get enrichment status
router.get('/status', (req, res) => {
  const total = db.prepare('SELECT COUNT(*) as count FROM enrichment_cache').get().count;
  const done = db.prepare("SELECT COUNT(*) as count FROM enrichment_cache WHERE status = 'done'").get().count;
  const pending = db.prepare("SELECT COUNT(*) as count FROM enrichment_cache WHERE status IN ('pending', 'in_progress')").get().count;
  res.json({ total, done, pending });
});

async function enrichBatch(names) {
  const update = db.prepare(
    "UPDATE enrichment_cache SET website = ?, phone = ?, status = 'done', enriched_at = datetime('now') WHERE tenant_name = ?"
  );

  for (const name of names) {
    try {
      const result = await searchCompanyInfo(name);
      update.run(result.website || '', result.phone || '', name);
    } catch (err) {
      console.error(`Failed to enrich "${name}":`, err.message);
      update.run('', '', name);
    }
    // Rate limit: wait between requests
    await new Promise(r => setTimeout(r, 1500));
  }
}

async function searchCompanyInfo(companyName) {
  const query = encodeURIComponent(`${companyName} official website`);
  const url = `https://html.duckduckgo.com/html/?q=${query}`;

  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    },
  });
  const html = await response.text();

  let website = '';
  let phone = '';

  // Extract URLs from DuckDuckGo redirect links (uddg= parameter)
  const uddgMatches = html.match(/uddg=([^&"]+)/gi);
  if (uddgMatches) {
    for (const match of uddgMatches) {
      let extracted = decodeURIComponent(match.replace(/^uddg=/i, ''));
      // Skip search engines, social media, and common non-company sites
      if (!/duckduckgo|google|bing|yahoo|facebook|twitter|linkedin|wikipedia|yelp|youtube|instagram|reddit|glassdoor|indeed|zoominfo|bloomberg|crunchbase/i.test(extracted)) {
        if (extracted.startsWith('http')) {
          website = extracted.split('?')[0]; // strip query params
          break;
        }
      }
    }
  }

  // Also search for phone number
  const query2 = encodeURIComponent(`${companyName} phone number contact`);
  const url2 = `https://html.duckduckgo.com/html/?q=${query2}`;
  const response2 = await fetch(url2, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    },
  });
  const html2 = await response2.text();

  // Extract phone number
  const phoneMatches = (html + html2).match(/\(?[2-9][0-9]{2}\)?[-.\s][0-9]{3}[-.\s][0-9]{4}/g);
  if (phoneMatches && phoneMatches.length > 0) {
    phone = phoneMatches[0].trim();
  }

  return { website, phone };
}

module.exports = router;
