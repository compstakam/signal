import { useState, useRef, useEffect } from 'react';

export default function FilterPanel({ industries, filters, onFilterChange, onClear, resultCount, onSaveResultsToProject, contactedMap, sendOutreachMap, projects, signalGrades }) {
  const [industryOpen, setIndustryOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    function handleClick(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIndustryOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const toggleIndustry = (ind) => {
    const current = filters.industries || [];
    const updated = current.includes(ind)
      ? current.filter(i => i !== ind)
      : [...current, ind];
    onFilterChange({ ...filters, industries: updated });
  };

  const update = (key, value) => {
    onFilterChange({ ...filters, [key]: value || undefined });
  };

  const selectedCount = (filters.industries || []).length;

  return (
    <div className="space-y-4">
      <h2 className="text-sm font-semibold text-cs-cyan uppercase tracking-wider">Filters</h2>

      {/* Tenant Name Search */}
      <div>
        <label className="block text-xs font-medium text-cs-muted mb-1 uppercase tracking-wider">Tenant Name</label>
        <input
          type="text"
          placeholder="Search by name..."
          value={filters.tenantNameSearch || ''}
          onChange={e => update('tenantNameSearch', e.target.value || undefined)}
          className="w-full border border-cs-border rounded-lg px-3 py-2 text-sm bg-cs-navy-mid text-white placeholder-cs-muted focus:outline-none focus:ring-2 focus:ring-cs-blue"
        />
      </div>

      {/* Industry multi-select */}
      <div ref={dropdownRef} className="relative">
        <label className="block text-xs font-medium text-cs-muted mb-1 uppercase tracking-wider">Tenant Industry</label>
        <button
          onClick={() => setIndustryOpen(!industryOpen)}
          className="w-full text-left border border-cs-border rounded-lg px-3 py-2 text-sm bg-cs-navy-mid text-white hover:border-cs-blue focus:outline-none focus:ring-2 focus:ring-cs-blue"
        >
          {selectedCount > 0 ? `${selectedCount} selected` : 'All Industries'}
          <span className="float-right text-cs-muted">&#9662;</span>
        </button>
        {industryOpen && (
          <div className="absolute z-50 mt-1 w-full bg-cs-navy-mid border border-cs-border rounded-lg shadow-lg max-h-60 overflow-y-auto">
            {industries.map(ind => (
              <label key={ind} className="flex items-center px-3 py-1.5 hover:bg-cs-navy cursor-pointer text-sm text-white">
                <input
                  type="checkbox"
                  checked={(filters.industries || []).includes(ind)}
                  onChange={() => toggleIndustry(ind)}
                  className="mr-2 accent-cs-cyan"
                />
                {ind}
              </label>
            ))}
          </div>
        )}
      </div>

      {/* SQFT Range */}
      <div>
        <label className="block text-xs font-medium text-cs-muted mb-1 uppercase tracking-wider">Leased Sq Ft</label>
        <div className="flex gap-2">
          <input
            type="number"
            placeholder="Min"
            value={filters.sqftMin || ''}
            onChange={e => update('sqftMin', e.target.value ? Number(e.target.value) : undefined)}
            className="w-1/2 border border-cs-border rounded-lg px-3 py-2 text-sm bg-cs-navy-mid text-white placeholder-cs-muted focus:outline-none focus:ring-2 focus:ring-cs-blue"
          />
          <input
            type="number"
            placeholder="Max"
            value={filters.sqftMax || ''}
            onChange={e => update('sqftMax', e.target.value ? Number(e.target.value) : undefined)}
            className="w-1/2 border border-cs-border rounded-lg px-3 py-2 text-sm bg-cs-navy-mid text-white placeholder-cs-muted focus:outline-none focus:ring-2 focus:ring-cs-blue"
          />
        </div>
      </div>

      {/* Commencement Date */}
      <div>
        <label className="block text-xs font-medium text-cs-muted mb-1 uppercase tracking-wider">Commencement Date</label>
        <div className="flex gap-2">
          <input
            type="date"
            value={filters.commencementFrom ? filters.commencementFrom.toISOString().split('T')[0] : ''}
            onChange={e => update('commencementFrom', e.target.value ? new Date(e.target.value + 'T00:00:00') : undefined)}
            className="w-1/2 border border-cs-border rounded-lg px-3 py-2 text-sm bg-cs-navy-mid text-white focus:outline-none focus:ring-2 focus:ring-cs-blue [color-scheme:dark]"
          />
          <input
            type="date"
            value={filters.commencementTo ? filters.commencementTo.toISOString().split('T')[0] : ''}
            onChange={e => update('commencementTo', e.target.value ? new Date(e.target.value + 'T00:00:00') : undefined)}
            className="w-1/2 border border-cs-border rounded-lg px-3 py-2 text-sm bg-cs-navy-mid text-white focus:outline-none focus:ring-2 focus:ring-cs-blue [color-scheme:dark]"
          />
        </div>
        <div className="flex gap-2 text-xs text-cs-muted mt-0.5">
          <span className="w-1/2 px-1">From</span>
          <span className="w-1/2 px-1">To</span>
        </div>
      </div>

      {/* Expiration Date */}
      <div>
        <label className="block text-xs font-medium text-cs-muted mb-1 uppercase tracking-wider">Expiration Date</label>
        <div className="flex gap-2">
          <input
            type="date"
            value={filters.expirationFrom ? filters.expirationFrom.toISOString().split('T')[0] : ''}
            onChange={e => update('expirationFrom', e.target.value ? new Date(e.target.value + 'T00:00:00') : undefined)}
            className="w-1/2 border border-cs-border rounded-lg px-3 py-2 text-sm bg-cs-navy-mid text-white focus:outline-none focus:ring-2 focus:ring-cs-blue [color-scheme:dark]"
          />
          <input
            type="date"
            value={filters.expirationTo ? filters.expirationTo.toISOString().split('T')[0] : ''}
            onChange={e => update('expirationTo', e.target.value ? new Date(e.target.value + 'T00:00:00') : undefined)}
            className="w-1/2 border border-cs-border rounded-lg px-3 py-2 text-sm bg-cs-navy-mid text-white focus:outline-none focus:ring-2 focus:ring-cs-blue [color-scheme:dark]"
          />
        </div>
        <div className="flex gap-2 text-xs text-cs-muted mt-0.5">
          <span className="w-1/2 px-1">From</span>
          <span className="w-1/2 px-1">To</span>
        </div>
      </div>

      {/* Send Outreach Filter */}
      <div>
        <label className="block text-xs font-medium text-cs-muted mb-1 uppercase tracking-wider">Send Outreach</label>
        <select
          value={filters.sendOutreachFilter || 'all'}
          onChange={e => update('sendOutreachFilter', e.target.value === 'all' ? undefined : e.target.value)}
          className="w-full border border-cs-border rounded-lg px-3 py-2 text-sm bg-cs-navy-mid text-white focus:outline-none focus:ring-2 focus:ring-cs-blue"
        >
          <option value="all">All</option>
          <option value="yes">Yes — Marked for Outreach</option>
          <option value="no">No — Not Marked</option>
        </select>
      </div>

      {/* Contacted Filter */}
      <div>
        <label className="block text-xs font-medium text-cs-muted mb-1 uppercase tracking-wider">Contacted</label>
        <select
          value={filters.contactedFilter || 'all'}
          onChange={e => update('contactedFilter', e.target.value === 'all' ? undefined : e.target.value)}
          className="w-full border border-cs-border rounded-lg px-3 py-2 text-sm bg-cs-navy-mid text-white focus:outline-none focus:ring-2 focus:ring-cs-blue"
        >
          <option value="all">All</option>
          <option value="yes">Yes — Contacted</option>
          <option value="no">No — Not Contacted</option>
        </select>
      </div>

      {/* Signal Score Grade Filter */}
      <div>
        <label className="block text-xs font-medium text-cs-muted mb-1 uppercase tracking-wider">Signal Score</label>
        <select
          value={filters.signalGrade || 'all'}
          onChange={e => update('signalGrade', e.target.value === 'all' ? undefined : e.target.value)}
          className="w-full border border-cs-border rounded-lg px-3 py-2 text-sm bg-cs-navy-mid text-white focus:outline-none focus:ring-2 focus:ring-cs-blue"
        >
          <option value="all">All Grades</option>
          <option value="A">🔴 A — Hot Lead (80-100)</option>
          <option value="B">🟠 B — Warm Lead (65-79)</option>
          <option value="C">🟡 C — Moderate (45-64)</option>
          <option value="D">⚪ D — Low Signal (25-44)</option>
          <option value="F">⚪ F — Cold (0-24)</option>
          <option value="AB">🔴🟠 A + B — Hot & Warm</option>
          <option value="ABC">🔴🟠🟡 A + B + C</option>
        </select>
      </div>

      {/* Project Filter */}
      {projects && projects.length > 0 && (
        <div>
          <label className="block text-xs font-medium text-cs-muted mb-1 uppercase tracking-wider">Project</label>
          <select
            value={filters.projectId || 'all'}
            onChange={e => update('projectId', e.target.value === 'all' ? undefined : e.target.value)}
            className="w-full border border-cs-border rounded-lg px-3 py-2 text-sm bg-cs-navy-mid text-white focus:outline-none focus:ring-2 focus:ring-cs-blue"
          >
            <option value="all">All Leads</option>
            {projects.map(p => (
              <option key={p.id} value={String(p.id)}>{p.name} ({p.lead_count})</option>
            ))}
          </select>
        </div>
      )}

      <button
        onClick={onSaveResultsToProject}
        className="w-full bg-cs-blue hover:bg-cs-cyan text-white font-semibold py-2 rounded-lg text-sm transition-colors"
      >
        Save {resultCount?.toLocaleString() || 0} Results to Project
      </button>

      <button
        onClick={onClear}
        className="w-full border border-cs-border hover:border-cs-blue text-cs-muted hover:text-white font-medium py-2 rounded-lg text-sm transition-colors"
      >
        Clear All Filters
      </button>
    </div>
  );
}
