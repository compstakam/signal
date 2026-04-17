import { useState, useEffect, useMemo } from 'react';
import NotificationBadge from './NotificationBadge';
import { exportLeadsToCsv } from '../utils/exportCsv';
import { getGradeColors, getGradeLabel } from '../utils/signalScore';

export default function ProjectsPage({ projects, allLeads, newLeadIds, onCreateProject, onDeleteProject, getProjectDetail, removeLeadsFromProject, fetchProjects, enrichmentData, contactedMap, sendOutreachMap, subscription, onRecordExport, onUpgrade, signalScores, isProTier, updateProject }) {
  const [activeProjectId, setActiveProjectId] = useState(null);
  const [projectDetail, setProjectDetail] = useState(null);
  const [savedLeadIds, setSavedLeadIds] = useState(new Set());
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [showNewForm, setShowNewForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [exportError, setExportError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showCriteria, setShowCriteria] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [editNameValue, setEditNameValue] = useState('');

  useEffect(() => {
    if (activeProjectId) loadProject(activeProjectId);
  }, [activeProjectId]);

  const loadProject = async (id) => {
    setLoading(true);
    try {
      const data = await getProjectDetail(id);
      setProjectDetail(data);
      setSavedLeadIds(new Set(data.leads.map(l => l.lead_id)));
    } catch (err) {
      console.error('Failed to load project:', err);
    } finally {
      setLoading(false);
    }
  };

  const projectLeads = useMemo(() => {
    return allLeads.filter(l => savedLeadIds.has(l.leadId));
  }, [allLeads, savedLeadIds]);

  const handleCreate = async () => {
    if (!newName.trim()) return;
    await onCreateProject(newName.trim());
    setNewName('');
    setShowNewForm(false);
  };

  const handleRemove = async () => {
    if (selectedIds.size === 0 || !activeProjectId) return;
    await removeLeadsFromProject(activeProjectId, [...selectedIds]);
    setSavedLeadIds(prev => {
      const next = new Set(prev);
      selectedIds.forEach(id => next.delete(id));
      return next;
    });
    setSelectedIds(new Set());
    await fetchProjects();
  };

  const handleDelete = async (id) => {
    await onDeleteProject(id);
    if (activeProjectId === id) {
      setActiveProjectId(null);
      setProjectDetail(null);
    }
  };

  // List view
  if (!activeProjectId) {
    return (
      <div className="flex-1 overflow-y-auto bg-gray-50 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">My Projects</h1>
              <p className="text-gray-500 text-sm mt-1">Manage your prospecting lists and saved leads</p>
            </div>
            <button
              onClick={() => setShowNewForm(!showNewForm)}
              className="px-4 py-2 bg-cs-blue hover:bg-cs-cyan text-white rounded-lg text-sm font-semibold transition-colors"
            >
              + New Project
            </button>
          </div>

          {showNewForm && (
            <div className="bg-white border border-gray-200 rounded-xl p-4 mb-4 flex gap-3">
              <input
                type="text"
                value={newName}
                onChange={e => setNewName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleCreate()}
                placeholder="Project name"
                className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cs-blue"
                autoFocus
              />
              <button onClick={handleCreate} disabled={!newName.trim()} className="px-4 py-2 bg-cs-blue hover:bg-cs-cyan disabled:opacity-40 text-white rounded-lg text-sm font-semibold transition-colors">Create</button>
              <button onClick={() => setShowNewForm(false)} className="px-4 py-2 text-gray-500 hover:text-gray-700 text-sm font-medium">Cancel</button>
            </div>
          )}

          {projects.length === 0 && !showNewForm && (
            <div className="bg-white border border-gray-200 rounded-xl p-12 text-center">
              <p className="text-gray-400 text-lg mb-2">No projects yet</p>
              <p className="text-gray-400 text-sm">Create a project to start saving and organizing your leads.</p>
            </div>
          )}

          <div className="grid gap-3">
            {projects.map(project => (
              <div
                key={project.id}
                onClick={() => setActiveProjectId(project.id)}
                className="bg-white border border-gray-200 rounded-xl p-5 hover:border-cs-blue hover:shadow-sm cursor-pointer transition-all group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <h3 className="text-base font-semibold text-gray-900 group-hover:text-cs-blue transition-colors">{project.name}</h3>
                    <NotificationBadge count={project.newLeadCount} />
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDelete(project.id); }}
                    className="text-gray-300 hover:text-red-400 text-sm opacity-0 group-hover:opacity-100 transition-all"
                  >
                    Delete
                  </button>
                </div>
                <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                  <span>{project.lead_count} lead{project.lead_count !== 1 ? 's' : ''}</span>
                  <span>Created {new Date(project.created_at).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Detail view
  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-white">
      <div className="px-6 py-4 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => { setActiveProjectId(null); setProjectDetail(null); setShowCriteria(false); }} className="text-gray-500 hover:text-cs-blue text-sm font-medium transition-colors">
            ← Back to Projects
          </button>
          {editingName ? (
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={editNameValue}
                onChange={e => setEditNameValue(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && editNameValue.trim()) {
                    updateProject?.(activeProjectId, { name: editNameValue.trim() });
                    setProjectDetail(prev => ({ ...prev, name: editNameValue.trim() }));
                    setEditingName(false);
                    fetchProjects();
                  }
                  if (e.key === 'Escape') setEditingName(false);
                }}
                className="border border-cs-blue rounded-lg px-3 py-1 text-sm font-semibold text-gray-900 focus:outline-none focus:ring-2 focus:ring-cs-blue"
                autoFocus
              />
              <button
                onClick={() => {
                  if (editNameValue.trim()) {
                    updateProject?.(activeProjectId, { name: editNameValue.trim() });
                    setProjectDetail(prev => ({ ...prev, name: editNameValue.trim() }));
                    fetchProjects();
                  }
                  setEditingName(false);
                }}
                className="text-cs-blue hover:text-cs-cyan text-xs font-semibold"
              >
                Save
              </button>
              <button onClick={() => setEditingName(false)} className="text-gray-400 hover:text-gray-600 text-xs">Cancel</button>
            </div>
          ) : (
            <h2
              className="text-lg font-semibold text-gray-900 hover:text-cs-blue cursor-pointer transition-colors"
              onClick={() => { setEditNameValue(projectDetail?.name || ''); setEditingName(true); }}
              title="Click to rename"
            >
              {projectDetail?.name}
            </h2>
          )}
          <span className="text-sm text-gray-400">{projectLeads.length} lead{projectLeads.length !== 1 ? 's' : ''}</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowCriteria(!showCriteria)}
            className={`px-3 py-1.5 border rounded-lg text-xs font-semibold transition-colors ${
              showCriteria ? 'border-cs-blue text-cs-blue bg-blue-50' : 'border-gray-300 text-gray-500 hover:border-cs-blue hover:text-cs-blue'
            }`}
          >
            {showCriteria ? 'Hide Criteria' : 'Edit Criteria'}
          </button>
          <button
            onClick={async () => {
              setExportError(null);
              try {
                if (onRecordExport) await onRecordExport(projectLeads.length);
                exportLeadsToCsv(projectLeads, enrichmentData, contactedMap, sendOutreachMap, `${projectDetail?.name || 'project'}-leads.csv`, signalScores);
              } catch (err) {
                setExportError(err?.response?.remaining != null
                  ? `Limit reached. ${err.response.remaining} exports left.`
                  : 'Export failed.');
              }
            }}
            className="px-3 py-1.5 border border-gray-300 hover:border-cs-blue text-gray-500 hover:text-cs-blue rounded-lg text-xs font-semibold transition-colors"
          >
            Export CSV
          </button>
          {exportError && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-red-500">{exportError}</span>
              <button
                onClick={() => { setExportError(null); onUpgrade?.(); }}
                className="px-2.5 py-1 bg-cs-blue hover:bg-cs-cyan text-white rounded-lg text-[11px] font-semibold transition-colors whitespace-nowrap"
              >
                Upgrade Plan
              </button>
              <button onClick={() => setExportError(null)} className="text-gray-400 hover:text-gray-600 text-xs">✕</button>
            </div>
          )}
          {selectedIds.size > 0 && (
            <button onClick={handleRemove} className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg text-sm font-medium transition-colors">
              Remove {selectedIds.size} selected
            </button>
          )}
        </div>
      </div>

      {/* Project Criteria Panel */}
      {showCriteria && (
        <ProjectCriteriaPanel
          projectDetail={projectDetail}
          onSave={async (criteria) => {
            await updateProject?.(activeProjectId, { filterCriteria: criteria });
            setProjectDetail(prev => ({ ...prev, filter_criteria: JSON.stringify(criteria) }));
            fetchProjects();
          }}
        />
      )}

      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin h-8 w-8 border-4 border-cs-blue border-t-transparent rounded-full"></div>
        </div>
      ) : (
        <div className="flex-1 overflow-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 sticky top-0">
              <tr>
                <th className="w-10 px-3 py-2.5">
                  <input
                    type="checkbox"
                    checked={projectLeads.length > 0 && selectedIds.size === projectLeads.length}
                    onChange={() => selectedIds.size === projectLeads.length ? setSelectedIds(new Set()) : setSelectedIds(new Set(projectLeads.map(l => l.leadId)))}
                    className="accent-cs-blue"
                  />
                </th>
                <th className="text-left px-4 py-2.5 font-semibold text-gray-500 uppercase text-xs tracking-wider">Signal Score</th>
                <th className="text-left px-4 py-2.5 font-semibold text-gray-500 uppercase text-xs tracking-wider">Tenant Name</th>
                <th className="text-left px-4 py-2.5 font-semibold text-gray-500 uppercase text-xs tracking-wider">Industry</th>
                <th className="text-left px-4 py-2.5 font-semibold text-gray-500 uppercase text-xs tracking-wider">Leased Sq Ft</th>
                <th className="text-left px-4 py-2.5 font-semibold text-gray-500 uppercase text-xs tracking-wider">Commencement</th>
                <th className="text-left px-4 py-2.5 font-semibold text-gray-500 uppercase text-xs tracking-wider">Expiration</th>
              </tr>
            </thead>
            <tbody>
              {projectLeads.map(lead => (
                <tr key={lead.leadId} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                  <td className="w-10 px-3 py-2.5">
                    <input
                      type="checkbox"
                      checked={selectedIds.has(lead.leadId)}
                      onChange={() => {
                        const next = new Set(selectedIds);
                        next.has(lead.leadId) ? next.delete(lead.leadId) : next.add(lead.leadId);
                        setSelectedIds(next);
                      }}
                      className="accent-cs-blue"
                    />
                  </td>
                  <td className="px-4 py-2.5">
                    {(() => {
                      const ss = signalScores?.[lead.leadId];
                      if (!ss) return <span className="text-gray-300 text-xs">—</span>;
                      const colors = getGradeColors(ss.grade);
                      const showFull = isProTier;
                      return (
                        <div className="flex items-center gap-2" title={showFull ? `${ss.score}/100 — ${getGradeLabel(ss.grade)}` : 'Upgrade to Pro to see full scores'}>
                          <div className="relative w-7 h-7 shrink-0">
                            <svg className="w-7 h-7 -rotate-90" viewBox="0 0 36 36">
                              <circle cx="18" cy="18" r="14" fill="none" stroke="#e5e7eb" strokeWidth="3" />
                              <circle cx="18" cy="18" r="14" fill="none" stroke={ss.grade === 'A' ? '#ef4444' : ss.grade === 'B' ? '#f97316' : ss.grade === 'C' ? '#f59e0b' : '#9ca3af'}
                                strokeWidth="3" strokeDasharray={`${ss.score * 0.88} 88`} strokeLinecap="round" />
                            </svg>
                            <span className={`absolute inset-0 flex items-center justify-center text-[9px] font-bold ${colors.text}`}>
                              {showFull ? ss.score : ss.grade}
                            </span>
                          </div>
                          <span className={`inline-block px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${colors.bg} ${colors.text}`}>
                            {showFull ? `${ss.grade} · ${getGradeLabel(ss.grade)}` : ss.grade}
                          </span>
                        </div>
                      );
                    })()}
                  </td>
                  <td className="px-4 py-2.5 font-medium text-gray-900">{lead.tenantName}</td>
                  <td className="px-4 py-2.5 text-gray-600">{lead.tenantIndustry}</td>
                  <td className="px-4 py-2.5 text-gray-900">{lead.sqft?.toLocaleString()}</td>
                  <td className="px-4 py-2.5 text-gray-500">{lead.commencementDateStr}</td>
                  <td className="px-4 py-2.5 text-gray-500">{lead.expirationDateStr}</td>
                </tr>
              ))}
              {projectLeads.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-gray-400">No leads saved to this project yet</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function ProjectCriteriaPanel({ projectDetail, onSave }) {
  const stored = projectDetail?.filter_criteria ? JSON.parse(projectDetail.filter_criteria) : {};
  const [criteria, setCriteria] = useState({
    industries: stored.industries || [],
    sqftMin: stored.sqftMin || '',
    sqftMax: stored.sqftMax || '',
    signalGrade: stored.signalGrade || '',
    notes: stored.notes || '',
  });
  const [saved, setSaved] = useState(false);

  const update = (key, value) => {
    setCriteria(prev => ({ ...prev, [key]: value }));
    setSaved(false);
  };

  const handleSave = () => {
    const clean = { ...criteria };
    if (!clean.sqftMin) delete clean.sqftMin;
    if (!clean.sqftMax) delete clean.sqftMax;
    if (!clean.signalGrade) delete clean.signalGrade;
    if (!clean.notes) delete clean.notes;
    if (clean.industries?.length === 0) delete clean.industries;
    onSave(Object.keys(clean).length > 0 ? clean : null);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="px-6 py-4 bg-blue-50/50 border-b border-gray-200">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
          <svg className="w-4 h-4 text-cs-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
          </svg>
          Project Criteria
        </h3>
        <div className="flex items-center gap-2">
          {saved && <span className="text-xs text-green-600 font-medium">Saved!</span>}
          <button
            onClick={handleSave}
            className="px-3 py-1 bg-cs-blue hover:bg-cs-cyan text-white rounded-lg text-xs font-semibold transition-colors"
          >
            Save Criteria
          </button>
        </div>
      </div>
      <div className="grid grid-cols-4 gap-4">
        <div>
          <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1">Target Industries</label>
          <input
            type="text"
            value={criteria.industries.join(', ')}
            onChange={e => update('industries', e.target.value ? e.target.value.split(',').map(s => s.trim()).filter(Boolean) : [])}
            placeholder="e.g. Technology, Financial Services"
            className="w-full border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-cs-blue"
          />
        </div>
        <div>
          <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1">Sq Ft Range</label>
          <div className="flex gap-1">
            <input
              type="number"
              value={criteria.sqftMin}
              onChange={e => update('sqftMin', e.target.value ? Number(e.target.value) : '')}
              placeholder="Min"
              className="w-1/2 border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-cs-blue"
            />
            <input
              type="number"
              value={criteria.sqftMax}
              onChange={e => update('sqftMax', e.target.value ? Number(e.target.value) : '')}
              placeholder="Max"
              className="w-1/2 border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-cs-blue"
            />
          </div>
        </div>
        <div>
          <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1">Min Signal Grade</label>
          <select
            value={criteria.signalGrade}
            onChange={e => update('signalGrade', e.target.value)}
            className="w-full border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-cs-blue"
          >
            <option value="">Any</option>
            <option value="A">A — Hot Lead</option>
            <option value="B">B+ — Warm & Hot</option>
            <option value="C">C+ — Moderate & Above</option>
          </select>
        </div>
        <div>
          <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1">Notes</label>
          <input
            type="text"
            value={criteria.notes}
            onChange={e => update('notes', e.target.value)}
            placeholder="Internal notes..."
            className="w-full border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-cs-blue"
          />
        </div>
      </div>
    </div>
  );
}
