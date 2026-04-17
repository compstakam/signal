const { Router } = require('express');
const db = require('../db.cjs');

const router = Router();

// List all projects with lead counts
router.get('/', (req, res) => {
  const projects = db.prepare(`
    SELECT p.*, COUNT(pl.id) as lead_count
    FROM projects p
    LEFT JOIN project_leads pl ON pl.project_id = p.id
    GROUP BY p.id
    ORDER BY p.created_at DESC
  `).all();
  res.json(projects);
});

// Create project
router.post('/', (req, res) => {
  const { name, description, filterCriteria } = req.body;
  if (!name) return res.status(400).json({ error: 'name is required' });

  const result = db.prepare(
    'INSERT INTO projects (name, description, filter_criteria) VALUES (?, ?, ?)'
  ).run(name, description || '', filterCriteria ? JSON.stringify(filterCriteria) : null);

  const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(project);
});

// Get project detail with saved leadIds
router.get('/:id', (req, res) => {
  const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(req.params.id);
  if (!project) return res.status(404).json({ error: 'Project not found' });

  const leads = db.prepare(
    'SELECT lead_id, added_at FROM project_leads WHERE project_id = ? ORDER BY added_at DESC'
  ).all(req.params.id);

  res.json({ ...project, leads });
});

// Update project
router.put('/:id', (req, res) => {
  const { name, description, filterCriteria } = req.body;
  const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(req.params.id);
  if (!project) return res.status(404).json({ error: 'Project not found' });

  const updates = [];
  const params = [];
  if (name !== undefined) { updates.push('name = ?'); params.push(name); }
  if (description !== undefined) { updates.push('description = ?'); params.push(description); }
  if (filterCriteria !== undefined) { updates.push('filter_criteria = ?'); params.push(filterCriteria ? JSON.stringify(filterCriteria) : null); }

  if (updates.length > 0) {
    params.push(req.params.id);
    db.prepare(`UPDATE projects SET ${updates.join(', ')} WHERE id = ?`).run(...params);
  }

  const updated = db.prepare('SELECT * FROM projects WHERE id = ?').get(req.params.id);
  res.json(updated);
});

// Delete project
router.delete('/:id', (req, res) => {
  const result = db.prepare('DELETE FROM projects WHERE id = ?').run(req.params.id);
  if (result.changes === 0) return res.status(404).json({ error: 'Project not found' });
  res.json({ success: true });
});

// Add leads to project
router.post('/:id/leads', (req, res) => {
  const { leadIds } = req.body;
  if (!Array.isArray(leadIds)) return res.status(400).json({ error: 'leadIds must be an array' });

  const project = db.prepare('SELECT id FROM projects WHERE id = ?').get(req.params.id);
  if (!project) return res.status(404).json({ error: 'Project not found' });

  const insert = db.prepare('INSERT OR IGNORE INTO project_leads (project_id, lead_id) VALUES (?, ?)');
  const insertMany = db.transaction((ids) => {
    for (const id of ids) insert.run(req.params.id, id);
  });
  insertMany(leadIds);

  const count = db.prepare('SELECT COUNT(*) as count FROM project_leads WHERE project_id = ?').get(req.params.id);
  res.json({ success: true, leadCount: count.count });
});

// Remove leads from project
router.delete('/:id/leads', (req, res) => {
  const { leadIds } = req.body;
  if (!Array.isArray(leadIds)) return res.status(400).json({ error: 'leadIds must be an array' });

  const del = db.prepare('DELETE FROM project_leads WHERE project_id = ? AND lead_id = ?');
  const deleteMany = db.transaction((ids) => {
    for (const id of ids) del.run(req.params.id, id);
  });
  deleteMany(leadIds);

  const count = db.prepare('SELECT COUNT(*) as count FROM project_leads WHERE project_id = ?').get(req.params.id);
  res.json({ success: true, leadCount: count.count });
});

module.exports = router;
