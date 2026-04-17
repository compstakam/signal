import { useState } from 'react';

export default function SaveToProjectModal({ projects, selectedCount, saveMode, filters, onSave, onClose }) {
  const [selectedProjectId, setSelectedProjectId] = useState(null);
  const [newName, setNewName] = useState('');
  const [mode, setMode] = useState(projects.length > 0 ? 'existing' : 'new');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      const filterCriteria = saveMode === 'results' ? filters : undefined;
      if (mode === 'new' && newName.trim()) {
        await onSave({ createNew: true, name: newName.trim(), filterCriteria });
      } else if (mode === 'existing' && selectedProjectId) {
        await onSave({ createNew: false, projectId: selectedProjectId, filterCriteria });
      }
    } finally {
      setSaving(false);
    }
  };

  const canSave = mode === 'new' ? newName.trim().length > 0 : selectedProjectId != null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60" onClick={onClose}>
      <div
        className="bg-cs-navy-light border border-cs-border rounded-xl w-[420px] max-h-[80vh] overflow-hidden shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-cs-border">
          <h2 className="text-lg font-semibold text-white">Save to Project</h2>
          <p className="text-sm text-cs-muted mt-1">
            {selectedCount.toLocaleString()} {saveMode === 'results' ? 'filtered' : 'selected'} lead{selectedCount !== 1 ? 's' : ''}
          </p>
        </div>

        {/* Body */}
        <div className="px-5 py-4 space-y-4 max-h-96 overflow-y-auto">
          {/* Mode toggle */}
          {projects.length > 0 && (
            <div className="flex gap-2">
              <button
                onClick={() => setMode('existing')}
                className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-colors ${
                  mode === 'existing'
                    ? 'bg-cs-blue text-white'
                    : 'border border-cs-border text-cs-muted hover:text-white'
                }`}
              >
                Existing Project
              </button>
              <button
                onClick={() => setMode('new')}
                className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-colors ${
                  mode === 'new'
                    ? 'bg-cs-blue text-white'
                    : 'border border-cs-border text-cs-muted hover:text-white'
                }`}
              >
                New Project
              </button>
            </div>
          )}

          {mode === 'existing' && projects.length > 0 ? (
            <div className="space-y-2">
              {projects.map(p => (
                <label
                  key={p.id}
                  className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                    selectedProjectId === p.id
                      ? 'bg-cs-navy-mid border border-cs-blue'
                      : 'border border-cs-border hover:border-cs-blue/50'
                  }`}
                >
                  <input
                    type="radio"
                    name="project"
                    checked={selectedProjectId === p.id}
                    onChange={() => setSelectedProjectId(p.id)}
                    className="accent-cs-cyan"
                  />
                  <div>
                    <span className="text-sm font-medium text-white">{p.name}</span>
                    <span className="text-xs text-cs-muted ml-2">{p.lead_count} leads</span>
                  </div>
                </label>
              ))}
            </div>
          ) : (
            <div>
              <label className="block text-xs font-medium text-cs-muted mb-1 uppercase tracking-wider">
                Project Name
              </label>
              <input
                type="text"
                value={newName}
                onChange={e => setNewName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && canSave && handleSave()}
                placeholder="Enter project name"
                className="w-full border border-cs-border rounded-lg px-3 py-2 text-sm bg-cs-navy-mid text-white placeholder-cs-muted focus:outline-none focus:ring-2 focus:ring-cs-blue"
                autoFocus
              />
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-cs-border flex gap-3 justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-cs-border text-cs-muted hover:text-white rounded-lg text-sm font-medium transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!canSave || saving}
            className="px-4 py-2 bg-cs-blue hover:bg-cs-cyan disabled:opacity-40 text-white rounded-lg text-sm font-semibold transition-colors"
          >
            {saving ? 'Saving...' : 'Save Leads'}
          </button>
        </div>
      </div>
    </div>
  );
}
