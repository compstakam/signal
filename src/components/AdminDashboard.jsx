import { useState, useEffect, useCallback } from 'react';
import { useAdmin } from '../hooks/useAdmin';

const STATUS_COLORS = {
  active: 'bg-green-50 text-green-700',
  trial: 'bg-blue-50 text-blue-700',
  churned: 'bg-red-50 text-red-700',
  invited: 'bg-amber-50 text-amber-700',
  suspended: 'bg-gray-100 text-gray-600',
};

const TIER_COLORS = {
  starter: 'bg-gray-100 text-gray-700',
  growth: 'bg-blue-50 text-cs-blue',
  pro: 'bg-purple-50 text-purple-700',
  enterprise: 'bg-amber-50 text-amber-800',
};

function formatDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  });
}

function formatDateTime(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: 'numeric', minute: '2-digit',
  });
}

function timeAgo(iso) {
  if (!iso) return 'Never';
  const ms = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(ms / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return formatDate(iso);
}

// ── Stat Card ────────────────────────────────────────────────────────────
function StatCard({ label, value, sublabel, color = 'text-gray-900', icon }) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5">
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{label}</p>
        {icon && <span className="text-gray-300">{icon}</span>}
      </div>
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
      {sublabel && <p className="text-xs text-gray-400 mt-1">{sublabel}</p>}
    </div>
  );
}

// ── Overview Tab ─────────────────────────────────────────────────────────
function OverviewTab({ stats }) {
  if (!stats) return <div className="text-gray-400 p-8 text-center">Loading...</div>;

  return (
    <div className="space-y-6">
      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Users" value={stats.totalUsers} sublabel={`${stats.activeUsers} active`} />
        <StatCard label="MRR" value={`$${stats.mrr.toLocaleString()}`} sublabel="Monthly recurring revenue" color="text-green-600" />
        <StatCard label="Exports This Month" value={stats.totalExportsThisMonth.toLocaleString()} sublabel="Leads exported" />
        <StatCard label="Logins (7d)" value={stats.loginsLast7Days} sublabel={`${stats.loginsLast30Days} last 30d`} />
      </div>

      {/* Status + Tier breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">User Status Breakdown</h3>
          <div className="space-y-3">
            {[
              { label: 'Active', value: stats.activeUsers, color: 'bg-green-500', pct: (stats.activeUsers / Math.max(stats.totalUsers, 1)) * 100 },
              { label: 'Trial', value: stats.trialUsers, color: 'bg-blue-500', pct: (stats.trialUsers / Math.max(stats.totalUsers, 1)) * 100 },
              { label: 'Churned', value: stats.churnedUsers, color: 'bg-red-400', pct: (stats.churnedUsers / Math.max(stats.totalUsers, 1)) * 100 },
              { label: 'Invited', value: stats.invitedUsers, color: 'bg-amber-400', pct: (stats.invitedUsers / Math.max(stats.totalUsers, 1)) * 100 },
            ].map(s => (
              <div key={s.label}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600">{s.label}</span>
                  <span className="font-semibold text-gray-900">{s.value}</span>
                </div>
                <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full ${s.color}`} style={{ width: `${s.pct}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Onboarding Completion</h3>
          <div className="flex items-center gap-6 mb-4">
            <div className="relative w-24 h-24">
              <svg className="w-24 h-24 -rotate-90" viewBox="0 0 36 36">
                <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none" stroke="#e5e7eb" strokeWidth="3" />
                <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none" stroke="#228FFF" strokeWidth="3"
                  strokeDasharray={`${(stats.onboardingComplete / Math.max(stats.totalUsers, 1)) * 100}, 100`}
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-lg font-bold text-gray-900">
                  {Math.round((stats.onboardingComplete / Math.max(stats.totalUsers, 1)) * 100)}%
                </span>
              </div>
            </div>
            <div>
              <p className="text-sm text-gray-600"><span className="font-semibold text-gray-900">{stats.onboardingComplete}</span> completed</p>
              <p className="text-sm text-gray-600"><span className="font-semibold text-gray-900">{stats.onboardingIncomplete}</span> in progress</p>
            </div>
          </div>
          <h3 className="text-sm font-semibold text-gray-900 mb-3 mt-6">Plan Distribution</h3>
          <div className="flex gap-2 flex-wrap">
            {(stats.tierBreakdown || []).map(t => (
              <span key={t.tier} className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${TIER_COLORS[t.tier] || 'bg-gray-100 text-gray-600'}`}>
                {t.tier.charAt(0).toUpperCase() + t.tier.slice(1)}: {t.count}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── User Detail Panel ────────────────────────────────────────────────────
function UserDetailPanel({ user, onClose, onUpdate, onAddNote, onDeleteNote, onDelete }) {
  const [editMode, setEditMode] = useState(false);
  const [editData, setEditData] = useState({});
  const [newNote, setNewNote] = useState('');
  const [activeDetailTab, setActiveDetailTab] = useState('overview');

  useEffect(() => {
    if (user) {
      setEditData({
        fullName: user.fullName,
        email: user.email,
        companyName: user.companyName,
        industry: user.industry,
        role: user.role,
        tier: user.tier,
        status: user.status,
        billingRenewalDate: user.billingRenewalDate?.split('T')[0] || '',
      });
      setEditMode(false);
      setActiveDetailTab('overview');
    }
  }, [user?.id]);

  if (!user) return null;

  const handleSave = () => {
    onUpdate(user.id, editData);
    setEditMode(false);
  };

  const handleAddNote = () => {
    if (newNote.trim()) {
      onAddNote(user.id, newNote.trim());
      setNewNote('');
    }
  };

  const detailTabs = [
    { key: 'overview', label: 'Overview' },
    { key: 'activity', label: 'Activity' },
    { key: 'billing', label: 'Billing' },
    { key: 'notes', label: `Notes (${user.notes?.length || 0})` },
  ];

  return (
    <div className="fixed inset-0 z-[9999]" style={{ position: 'fixed' }} onClick={onClose}>
      <div className="fixed inset-0 bg-black/20" />
      <div
        className="fixed top-0 right-0 bottom-0 w-[600px] bg-white border-l border-gray-200 shadow-2xl overflow-y-auto animate-fadeIn"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-cs-blue flex items-center justify-center text-white font-bold text-sm">
                {user.fullName?.charAt(0) || user.email.charAt(0).toUpperCase()}
              </div>
              <div>
                <h2 className="text-base font-bold text-gray-900">{user.fullName || user.email}</h2>
                <p className="text-xs text-gray-500">{user.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${STATUS_COLORS[user.status] || 'bg-gray-100'}`}>
                {user.status}
              </span>
              <button onClick={onClose} className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
                ✕
              </button>
            </div>
          </div>

          {/* Detail tabs */}
          <div className="flex gap-1 mt-4">
            {detailTabs.map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveDetailTab(tab.key)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                  activeDetailTab === tab.key ? 'bg-cs-blue text-white' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Overview tab */}
          {activeDetailTab === 'overview' && (
            <>
              {/* Quick stats */}
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-gray-50 rounded-lg p-3 text-center">
                  <p className="text-lg font-bold text-gray-900">{user.totalLogins}</p>
                  <p className="text-[10px] uppercase text-gray-500 font-semibold tracking-wider">Total Logins</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3 text-center">
                  <p className="text-lg font-bold text-gray-900">{user.totalExports.toLocaleString()}</p>
                  <p className="text-[10px] uppercase text-gray-500 font-semibold tracking-wider">Total Exports</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3 text-center">
                  <p className="text-lg font-bold text-gray-900">{user.leadsSaved.toLocaleString()}</p>
                  <p className="text-[10px] uppercase text-gray-500 font-semibold tracking-wider">Leads Saved</p>
                </div>
              </div>

              {/* User info */}
              <div className="bg-white border border-gray-200 rounded-lg">
                <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                  <h3 className="text-sm font-semibold text-gray-900">User Information</h3>
                  <button
                    onClick={() => editMode ? handleSave() : setEditMode(true)}
                    className="text-xs font-semibold text-cs-blue hover:text-cs-cyan"
                  >
                    {editMode ? 'Save' : 'Edit'}
                  </button>
                </div>
                <div className="divide-y divide-gray-50">
                  {[
                    { label: 'Full Name', key: 'fullName', value: user.fullName },
                    { label: 'Email', key: 'email', value: user.email },
                    { label: 'Company', key: 'companyName', value: user.companyName },
                    { label: 'Industry', key: 'industry', value: user.industry },
                    { label: 'Role', key: 'role', value: user.role },
                  ].map(field => (
                    <div key={field.key} className="flex items-center justify-between px-4 py-2.5">
                      <span className="text-xs text-gray-500 font-medium w-28">{field.label}</span>
                      {editMode ? (
                        <input
                          value={editData[field.key] || ''}
                          onChange={e => setEditData(d => ({ ...d, [field.key]: e.target.value }))}
                          className="flex-1 text-sm text-gray-900 border border-gray-200 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-cs-blue"
                        />
                      ) : (
                        <span className="text-sm text-gray-900">{field.value || '—'}</span>
                      )}
                    </div>
                  ))}
                  <div className="flex items-center justify-between px-4 py-2.5">
                    <span className="text-xs text-gray-500 font-medium w-28">Status</span>
                    {editMode ? (
                      <select
                        value={editData.status}
                        onChange={e => setEditData(d => ({ ...d, status: e.target.value }))}
                        className="flex-1 text-sm text-gray-900 border border-gray-200 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-cs-blue"
                      >
                        <option value="active">Active</option>
                        <option value="trial">Trial</option>
                        <option value="churned">Churned</option>
                        <option value="invited">Invited</option>
                        <option value="suspended">Suspended</option>
                      </select>
                    ) : (
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${STATUS_COLORS[user.status]}`}>
                        {user.status}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center justify-between px-4 py-2.5">
                    <span className="text-xs text-gray-500 font-medium w-28">Plan</span>
                    {editMode ? (
                      <select
                        value={editData.tier}
                        onChange={e => setEditData(d => ({ ...d, tier: e.target.value }))}
                        className="flex-1 text-sm text-gray-900 border border-gray-200 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-cs-blue"
                      >
                        <option value="starter">Starter ($100/mo)</option>
                        <option value="growth">Growth ($250/mo)</option>
                        <option value="pro">Pro ($600/mo)</option>
                        <option value="enterprise">Enterprise (Custom)</option>
                      </select>
                    ) : (
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${TIER_COLORS[user.tier]}`}>
                        {user.tierLabel} {user.tierPrice ? `($${user.tierPrice}/mo)` : ''}
                      </span>
                    )}
                  </div>
                </div>
                {editMode && (
                  <div className="px-4 py-3 border-t border-gray-100 flex gap-2 justify-end">
                    <button onClick={() => setEditMode(false)} className="px-3 py-1.5 text-xs text-gray-500 hover:text-gray-700">Cancel</button>
                    <button onClick={handleSave} className="px-3 py-1.5 bg-cs-blue text-white text-xs font-semibold rounded-md hover:bg-cs-cyan">Save Changes</button>
                  </div>
                )}
              </div>

              {/* Key dates */}
              <div className="bg-white border border-gray-200 rounded-lg">
                <div className="px-4 py-3 border-b border-gray-100">
                  <h3 className="text-sm font-semibold text-gray-900">Key Dates</h3>
                </div>
                <div className="divide-y divide-gray-50">
                  {[
                    { label: 'First Login', value: formatDateTime(user.firstLogin) },
                    { label: 'Last Login', value: user.lastLogin ? timeAgo(user.lastLogin) : 'Never' },
                    { label: 'Account Created', value: formatDate(user.createdAt) },
                    { label: 'Trial Started', value: formatDate(user.trialStartDate) },
                    { label: 'Trial Ends', value: formatDate(user.trialEndDate) },
                    { label: 'Onboarding', value: user.onboardingCompleted ? `Completed (all 5 steps)` : `Step ${user.onboardingStep} of 5` },
                  ].map(item => (
                    <div key={item.label} className="flex items-center justify-between px-4 py-2.5">
                      <span className="text-xs text-gray-500 font-medium">{item.label}</span>
                      <span className="text-sm text-gray-900">{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Usage stats */}
              <div className="bg-white border border-gray-200 rounded-lg">
                <div className="px-4 py-3 border-b border-gray-100">
                  <h3 className="text-sm font-semibold text-gray-900">Usage Stats</h3>
                </div>
                <div className="divide-y divide-gray-50">
                  {[
                    { label: 'Searches Performed', value: user.searchCount },
                    { label: 'Projects Created', value: user.projectsCreated },
                    { label: 'Leads Saved', value: user.leadsSaved.toLocaleString() },
                    { label: 'Contacts Uploaded', value: user.contactsUploaded },
                    { label: 'Exports This Month', value: `${user.monthExports} / ${user.monthlyLimit === -1 ? '∞' : user.monthlyLimit}` },
                    { label: 'Total All-Time Exports', value: user.totalExports.toLocaleString() },
                  ].map(item => (
                    <div key={item.label} className="flex items-center justify-between px-4 py-2.5">
                      <span className="text-xs text-gray-500 font-medium">{item.label}</span>
                      <span className="text-sm font-medium text-gray-900">{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Danger zone */}
              <div className="border border-red-200 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-red-600 mb-2">Danger Zone</h3>
                <p className="text-xs text-gray-500 mb-3">Permanently delete this user and all associated data.</p>
                <button
                  onClick={() => {
                    if (confirm(`Are you sure you want to delete ${user.fullName || user.email}? This cannot be undone.`)) {
                      onDelete(user.id);
                    }
                  }}
                  className="px-3 py-1.5 bg-red-50 text-red-600 text-xs font-semibold rounded-md hover:bg-red-100 border border-red-200"
                >
                  Delete User
                </button>
              </div>
            </>
          )}

          {/* Activity tab */}
          {activeDetailTab === 'activity' && (
            <>
              <div className="bg-white border border-gray-200 rounded-lg">
                <div className="px-4 py-3 border-b border-gray-100">
                  <h3 className="text-sm font-semibold text-gray-900">Recent Logins</h3>
                </div>
                {user.recentLogins?.length > 0 ? (
                  <div className="divide-y divide-gray-50 max-h-64 overflow-y-auto">
                    {user.recentLogins.map(login => (
                      <div key={login.id} className="px-4 py-2.5 flex items-center justify-between">
                        <span className="text-sm text-gray-900">{formatDateTime(login.loggedInAt)}</span>
                        <span className="text-xs text-gray-400">{timeAgo(login.loggedInAt)}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="px-4 py-6 text-sm text-gray-400 text-center">No login history</p>
                )}
              </div>

              <div className="bg-white border border-gray-200 rounded-lg">
                <div className="px-4 py-3 border-b border-gray-100">
                  <h3 className="text-sm font-semibold text-gray-900">Recent Exports</h3>
                </div>
                {user.recentExports?.length > 0 ? (
                  <div className="divide-y divide-gray-50 max-h-64 overflow-y-auto">
                    {user.recentExports.map(exp => (
                      <div key={exp.id} className="px-4 py-2.5 flex items-center justify-between">
                        <span className="text-sm text-gray-900">{exp.leadCount} leads exported</span>
                        <span className="text-xs text-gray-400">{formatDateTime(exp.exportedAt)}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="px-4 py-6 text-sm text-gray-400 text-center">No export history</p>
                )}
              </div>

              <div className="bg-white border border-gray-200 rounded-lg">
                <div className="px-4 py-3 border-b border-gray-100">
                  <h3 className="text-sm font-semibold text-gray-900">Monthly Export History</h3>
                </div>
                <div className="p-4">
                  {(user.exportHistory || []).map(month => {
                    const maxVal = Math.max(...(user.exportHistory || []).map(m => m.total), 1);
                    return (
                      <div key={month.month} className="flex items-center gap-3 mb-2">
                        <span className="text-xs text-gray-500 w-20">{month.month}</span>
                        <div className="flex-1 h-4 bg-gray-100 rounded-full overflow-hidden">
                          <div className="h-full bg-cs-blue rounded-full" style={{ width: `${(month.total / maxVal) * 100}%` }} />
                        </div>
                        <span className="text-xs font-semibold text-gray-900 w-10 text-right">{month.total}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}

          {/* Billing tab */}
          {activeDetailTab === 'billing' && (
            <>
              <div className="bg-white border border-gray-200 rounded-lg">
                <div className="px-4 py-3 border-b border-gray-100">
                  <h3 className="text-sm font-semibold text-gray-900">Subscription</h3>
                </div>
                <div className="divide-y divide-gray-50">
                  <div className="flex items-center justify-between px-4 py-2.5">
                    <span className="text-xs text-gray-500 font-medium">Current Plan</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${TIER_COLORS[user.tier]}`}>
                      {user.tierLabel}
                    </span>
                  </div>
                  <div className="flex items-center justify-between px-4 py-2.5">
                    <span className="text-xs text-gray-500 font-medium">Monthly Price</span>
                    <span className="text-sm font-semibold text-gray-900">
                      {user.tierPrice ? `$${user.tierPrice}/mo` : 'Custom'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between px-4 py-2.5">
                    <span className="text-xs text-gray-500 font-medium">Export Limit</span>
                    <span className="text-sm text-gray-900">
                      {user.monthlyLimit === -1 ? 'Unlimited' : `${user.monthlyLimit}/month`}
                    </span>
                  </div>
                  <div className="flex items-center justify-between px-4 py-2.5">
                    <span className="text-xs text-gray-500 font-medium">Exports This Month</span>
                    <span className="text-sm font-medium text-gray-900">{user.monthExports}</span>
                  </div>
                  <div className="flex items-center justify-between px-4 py-2.5">
                    <span className="text-xs text-gray-500 font-medium">Renewal Date</span>
                    <span className="text-sm text-gray-900">{formatDate(user.billingRenewalDate)}</span>
                  </div>
                  <div className="flex items-center justify-between px-4 py-2.5">
                    <span className="text-xs text-gray-500 font-medium">Payment Method</span>
                    <span className="text-sm text-gray-900">
                      {user.paymentMethod ? user.paymentMethod.replace('_', ' **** ') : 'None'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-white border border-gray-200 rounded-lg">
                <div className="px-4 py-3 border-b border-gray-100">
                  <h3 className="text-sm font-semibold text-gray-900">Trial Info</h3>
                </div>
                <div className="divide-y divide-gray-50">
                  <div className="flex items-center justify-between px-4 py-2.5">
                    <span className="text-xs text-gray-500 font-medium">Trial Started</span>
                    <span className="text-sm text-gray-900">{formatDate(user.trialStartDate)}</span>
                  </div>
                  <div className="flex items-center justify-between px-4 py-2.5">
                    <span className="text-xs text-gray-500 font-medium">Trial Ends</span>
                    <span className="text-sm text-gray-900">{formatDate(user.trialEndDate)}</span>
                  </div>
                  <div className="flex items-center justify-between px-4 py-2.5">
                    <span className="text-xs text-gray-500 font-medium">Days Remaining</span>
                    <span className="text-sm text-gray-900">
                      {user.trialEndDate
                        ? `${Math.max(0, Math.ceil((new Date(user.trialEndDate) - Date.now()) / 86400000))} days`
                        : '—'}
                    </span>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Notes tab */}
          {activeDetailTab === 'notes' && (
            <>
              <div className="flex gap-2">
                <input
                  value={newNote}
                  onChange={e => setNewNote(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleAddNote()}
                  placeholder="Add a note about this user..."
                  className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cs-blue"
                />
                <button
                  onClick={handleAddNote}
                  disabled={!newNote.trim()}
                  className="px-4 py-2 bg-cs-blue text-white text-sm font-semibold rounded-lg hover:bg-cs-cyan disabled:opacity-40 transition-colors"
                >
                  Add
                </button>
              </div>

              {user.notes?.length > 0 ? (
                <div className="space-y-3">
                  {user.notes.map(note => (
                    <div key={note.id} className="bg-white border border-gray-200 rounded-lg p-4">
                      <p className="text-sm text-gray-900">{note.note}</p>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-xs text-gray-400">{formatDateTime(note.createdAt)} · {note.createdBy}</span>
                        <button
                          onClick={() => onDeleteNote(user.id, note.id)}
                          className="text-xs text-red-400 hover:text-red-600"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-400 text-center py-8">No notes yet. Add one above.</p>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Invite User Modal ────────────────────────────────────────────────────
function InviteUserModal({ onInvite, onClose }) {
  const [form, setForm] = useState({ email: '', fullName: '', companyName: '', industry: '', tier: 'starter' });
  const [error, setError] = useState('');
  const [inviting, setInviting] = useState(false);

  const handleSubmit = async () => {
    if (!form.email) { setError('Email is required'); return; }
    setInviting(true);
    setError('');
    try {
      await onInvite(form);
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to invite user');
    } finally {
      setInviting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50" onClick={onClose}>
      <div className="bg-white rounded-xl w-[440px] shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Invite New User</h2>
        </div>
        <div className="px-6 py-5 space-y-4">
          {error && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Email *</label>
            <input value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cs-blue" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Full Name</label>
            <input value={form.fullName} onChange={e => setForm(f => ({ ...f, fullName: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cs-blue" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Company</label>
            <input value={form.companyName} onChange={e => setForm(f => ({ ...f, companyName: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cs-blue" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Industry</label>
              <input value={form.industry} onChange={e => setForm(f => ({ ...f, industry: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cs-blue" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Plan</label>
              <select value={form.tier} onChange={e => setForm(f => ({ ...f, tier: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cs-blue">
                <option value="starter">Starter</option>
                <option value="growth">Growth</option>
                <option value="pro">Pro</option>
                <option value="enterprise">Enterprise</option>
              </select>
            </div>
          </div>
        </div>
        <div className="px-6 py-4 border-t border-gray-200 flex gap-3 justify-end">
          <button onClick={onClose} className="px-4 py-2 text-gray-500 text-sm font-medium">Cancel</button>
          <button onClick={handleSubmit} disabled={inviting}
            className="px-4 py-2 bg-cs-blue hover:bg-cs-cyan disabled:opacity-50 text-white rounded-lg text-sm font-semibold transition-colors">
            {inviting ? 'Inviting...' : 'Send Invite'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Admin Dashboard ─────────────────────────────────────────────────
export default function AdminDashboard() {
  const {
    stats, users, selectedUser, loading,
    fetchStats, fetchUsers, fetchUserDetail,
    updateUser, createUser, deleteUser,
    addNote, deleteNote, setSelectedUser,
  } = useAdmin();

  const [activeTab, setActiveTab] = useState('overview');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterTier, setFilterTier] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortCol, setSortCol] = useState('created');
  const [sortOrder, setSortOrder] = useState('desc');
  const [showInviteModal, setShowInviteModal] = useState(false);

  useEffect(() => {
    fetchStats();
    fetchUsers();
  }, []);

  useEffect(() => {
    if (activeTab === 'users') {
      fetchUsers({ status: filterStatus, tier: filterTier, search: searchQuery, sort: sortCol, order: sortOrder });
    }
  }, [filterStatus, filterTier, searchQuery, sortCol, sortOrder, activeTab]);

  const handleSort = (col) => {
    if (sortCol === col) {
      setSortOrder(o => o === 'asc' ? 'desc' : 'asc');
    } else {
      setSortCol(col);
      setSortOrder('desc');
    }
  };

  const SortIcon = ({ col }) => {
    if (sortCol !== col) return <span className="text-gray-300 ml-1">↕</span>;
    return <span className="text-cs-blue ml-1">{sortOrder === 'asc' ? '↑' : '↓'}</span>;
  };

  const tabs = [
    { key: 'overview', label: 'Overview' },
    { key: 'users', label: `Users (${stats?.totalUsers || 0})` },
  ];

  return (
    <div className="flex-1 overflow-y-auto bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-8 py-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
            <p className="text-sm text-gray-500 mt-0.5">Manage users, track activity, and monitor platform metrics.</p>
          </div>
          <button
            onClick={() => setShowInviteModal(true)}
            className="px-4 py-2.5 bg-cs-blue hover:bg-cs-cyan text-white rounded-lg text-sm font-semibold transition-colors flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Invite User
          </button>
        </div>

        <div className="flex gap-1 mt-5">
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-2.5 text-sm font-medium rounded-lg transition-colors ${
                activeTab === tab.key
                  ? 'text-cs-blue bg-blue-50'
                  : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="p-8 max-w-7xl mx-auto">
        {activeTab === 'overview' && <OverviewTab stats={stats} />}

        {activeTab === 'users' && (
          <div className="space-y-4">
            {/* Filters bar */}
            <div className="flex items-center gap-3 flex-wrap">
              <input
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search by name, email, or company..."
                className="flex-1 min-w-[240px] border border-gray-200 rounded-lg px-4 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-cs-blue"
              />
              <select
                value={filterStatus}
                onChange={e => setFilterStatus(e.target.value)}
                className="border border-gray-200 rounded-lg px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-cs-blue"
              >
                <option value="">All Statuses</option>
                <option value="active">Active</option>
                <option value="trial">Trial</option>
                <option value="churned">Churned</option>
                <option value="invited">Invited</option>
              </select>
              <select
                value={filterTier}
                onChange={e => setFilterTier(e.target.value)}
                className="border border-gray-200 rounded-lg px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-cs-blue"
              >
                <option value="">All Plans</option>
                <option value="starter">Starter</option>
                <option value="growth">Growth</option>
                <option value="pro">Pro</option>
                <option value="enterprise">Enterprise</option>
              </select>
            </div>

            {/* Users table */}
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wider cursor-pointer hover:text-gray-900" onClick={() => handleSort('name')}>
                        User <SortIcon col="name" />
                      </th>
                      <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wider cursor-pointer hover:text-gray-900" onClick={() => handleSort('company')}>
                        Company <SortIcon col="company" />
                      </th>
                      <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wider cursor-pointer hover:text-gray-900" onClick={() => handleSort('tier')}>
                        Plan <SortIcon col="tier" />
                      </th>
                      <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wider cursor-pointer hover:text-gray-900" onClick={() => handleSort('status')}>
                        Status <SortIcon col="status" />
                      </th>
                      <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wider cursor-pointer hover:text-gray-900" onClick={() => handleSort('logins')}>
                        Logins <SortIcon col="logins" />
                      </th>
                      <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wider cursor-pointer hover:text-gray-900" onClick={() => handleSort('exports')}>
                        Exports <SortIcon col="exports" />
                      </th>
                      <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wider">
                        Onboarding
                      </th>
                      <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wider cursor-pointer hover:text-gray-900" onClick={() => handleSort('last_login')}>
                        Last Login <SortIcon col="last_login" />
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr><td colSpan={8} className="px-4 py-8 text-center text-gray-400">Loading...</td></tr>
                    ) : users.length === 0 ? (
                      <tr><td colSpan={8} className="px-4 py-8 text-center text-gray-400">No users found</td></tr>
                    ) : users.map(user => (
                      <tr
                        key={user.id}
                        onClick={() => fetchUserDetail(user.id)}
                        className="border-t border-gray-100 hover:bg-blue-50/30 cursor-pointer transition-colors"
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-cs-blue/10 text-cs-blue flex items-center justify-center text-xs font-bold shrink-0">
                              {user.fullName?.charAt(0) || user.email.charAt(0).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-gray-900 truncate">{user.fullName || '—'}</p>
                              <p className="text-xs text-gray-400 truncate">{user.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-gray-600">{user.companyName || '—'}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${TIER_COLORS[user.tier]}`}>
                            {user.tierLabel}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${STATUS_COLORS[user.status]}`}>
                            {user.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-900 font-medium">{user.totalLogins}</td>
                        <td className="px-4 py-3">
                          <span className="text-gray-900 font-medium">{user.monthExports}</span>
                          <span className="text-gray-400 text-xs"> / {user.monthlyLimit === -1 ? '∞' : user.monthlyLimit}</span>
                        </td>
                        <td className="px-4 py-3">
                          {user.onboardingCompleted ? (
                            <span className="text-green-600 text-xs font-medium">✓ Complete</span>
                          ) : (
                            <span className="text-amber-600 text-xs font-medium">Step {user.onboardingStep}/5</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-gray-500 text-xs">{timeAgo(user.lastLogin)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* User detail panel */}
      {selectedUser && (
        <UserDetailPanel
          user={selectedUser}
          onClose={() => setSelectedUser(null)}
          onUpdate={updateUser}
          onAddNote={addNote}
          onDeleteNote={deleteNote}
          onDelete={deleteUser}
        />
      )}

      {/* Invite modal */}
      {showInviteModal && (
        <InviteUserModal
          onInvite={createUser}
          onClose={() => setShowInviteModal(false)}
        />
      )}
    </div>
  );
}
