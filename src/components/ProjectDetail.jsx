import { useState, useEffect, useMemo } from 'react';

export default function ProjectDetail({ projectId, allLeads, getProjectDetail, removeLeadsFromProject, onBack }) {
  const [project, setProject] = useState(null);
  const [savedLeadIds, setSavedLeadIds] = useState(new Set());
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProject();
  }, [projectId]);

  const loadProject = async () => {
    setLoading(true);
    try {
      const data = await getProjectDetail(projectId);
      setProject(data);
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

  const toggleSelect = (leadId) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(leadId)) next.delete(leadId);
      else next.add(leadId);
      return next;
    });
  };

  const toggleAll = () => {
    if (selectedIds.size === projectLeads.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(projectLeads.map(l => l.leadId)));
    }
  };

  const handleRemove = async () => {
    if (selectedIds.size === 0) return;
    await removeLeadsFromProject(projectId, [...selectedIds]);
    setSavedLeadIds(prev => {
      const next = new Set(prev);
      selectedIds.forEach(id => next.delete(id));
      return next;
    });
    setSelectedIds(new Set());
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin h-8 w-8 border-4 border-cs-cyan border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 py-3 bg-cs-navy-mid border-b border-cs-border flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="text-cs-muted hover:text-cs-cyan text-sm font-medium transition-colors"
          >
            ← Back
          </button>
          <h2 className="text-lg font-semibold text-white">{project?.name}</h2>
          <span className="text-xs text-cs-muted">
            {projectLeads.length} lead{projectLeads.length !== 1 ? 's' : ''}
          </span>
        </div>
        {selectedIds.size > 0 && (
          <button
            onClick={handleRemove}
            className="px-3 py-1.5 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg text-sm font-medium transition-colors"
          >
            Remove {selectedIds.size} selected
          </button>
        )}
      </div>

      {/* Table */}
      <div className="overflow-auto flex-1">
        <table className="w-full text-sm">
          <thead className="bg-cs-navy-mid sticky top-0">
            <tr>
              <th className="w-10 px-3 py-2.5">
                <input
                  type="checkbox"
                  checked={projectLeads.length > 0 && selectedIds.size === projectLeads.length}
                  onChange={toggleAll}
                  className="accent-cs-cyan"
                />
              </th>
              <th className="text-left px-4 py-2.5 font-semibold text-cs-muted uppercase text-xs tracking-wider">Tenant Name</th>
              <th className="text-left px-4 py-2.5 font-semibold text-cs-muted uppercase text-xs tracking-wider">Industry</th>
              <th className="text-left px-4 py-2.5 font-semibold text-cs-muted uppercase text-xs tracking-wider">Leased Sq Ft</th>
              <th className="text-left px-4 py-2.5 font-semibold text-cs-muted uppercase text-xs tracking-wider">Commencement</th>
              <th className="text-left px-4 py-2.5 font-semibold text-cs-muted uppercase text-xs tracking-wider">Expiration</th>
            </tr>
          </thead>
          <tbody>
            {projectLeads.map(lead => (
              <tr key={lead.leadId} className="border-b border-cs-border hover:bg-cs-navy-mid/50 transition-colors">
                <td className="w-10 px-3 py-2.5">
                  <input
                    type="checkbox"
                    checked={selectedIds.has(lead.leadId)}
                    onChange={() => toggleSelect(lead.leadId)}
                    className="accent-cs-cyan"
                  />
                </td>
                <td className="px-4 py-2.5 font-medium text-white">{lead.tenantName}</td>
                <td className="px-4 py-2.5 text-cs-blue-light">{lead.tenantIndustry}</td>
                <td className="px-4 py-2.5 text-white">{lead.sqft?.toLocaleString()}</td>
                <td className="px-4 py-2.5 text-cs-muted">{lead.commencementDateStr}</td>
                <td className="px-4 py-2.5 text-cs-muted">{lead.expirationDateStr}</td>
              </tr>
            ))}
            {projectLeads.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-cs-muted">
                  No leads saved to this project yet
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
