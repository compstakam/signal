import { useState } from 'react';
import NotificationBadge from './NotificationBadge';

export default function ProjectList({ projects, onProjectClick, onCreateProject, onDeleteProject }) {
  const [showNew, setShowNew] = useState(false);
  const [newName, setNewName] = useState('');

  const handleCreate = async () => {
    if (!newName.trim()) return;
    await onCreateProject(newName.trim());
    setNewName('');
    setShowNew(false);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-cs-cyan uppercase tracking-wider">Projects</h2>
        <button
          onClick={() => setShowNew(!showNew)}
          className="text-xs font-semibold text-cs-blue hover:text-cs-cyan transition-colors"
        >
          + New
        </button>
      </div>

      {showNew && (
        <div className="flex gap-2">
          <input
            type="text"
            value={newName}
            onChange={e => setNewName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleCreate()}
            placeholder="Project name"
            className="flex-1 border border-cs-border rounded-lg px-3 py-2 text-sm bg-cs-navy-mid text-white placeholder-cs-muted focus:outline-none focus:ring-2 focus:ring-cs-blue"
            autoFocus
          />
          <button
            onClick={handleCreate}
            disabled={!newName.trim()}
            className="px-3 py-2 bg-cs-blue hover:bg-cs-cyan disabled:opacity-40 text-white rounded-lg text-sm font-semibold transition-colors"
          >
            Create
          </button>
        </div>
      )}

      {projects.length === 0 && !showNew && (
        <p className="text-sm text-cs-muted py-4 text-center">
          No projects yet. Create one to start saving leads.
        </p>
      )}

      {projects.map(project => (
        <div
          key={project.id}
          className="bg-cs-navy-mid border border-cs-border rounded-lg p-3 hover:border-cs-blue transition-colors cursor-pointer group"
          onClick={() => onProjectClick(project.id)}
        >
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white group-hover:text-cs-cyan transition-colors">
              {project.name}
            </h3>
            <div className="flex items-center gap-2">
              <NotificationBadge count={project.newLeadCount} />
              <button
                onClick={(e) => { e.stopPropagation(); onDeleteProject(project.id); }}
                className="text-cs-muted hover:text-red-400 text-xs opacity-0 group-hover:opacity-100 transition-all"
                title="Delete project"
              >
                ✕
              </button>
            </div>
          </div>
          <div className="flex items-center gap-3 mt-1.5">
            <span className="text-xs text-cs-muted">
              {project.lead_count} lead{project.lead_count !== 1 ? 's' : ''}
            </span>
            <span className="text-xs text-cs-muted">
              Created {new Date(project.created_at).toLocaleDateString()}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
