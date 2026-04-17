import { useState } from 'react';
import { exportLeadsToCsv } from '../utils/exportCsv';
import { getGradeColors, getGradeLabel } from '../utils/signalScore';
import SignalScoreTooltip, { SignalScoreInfoButton } from './SignalScoreTooltip';

export default function LeadTable({
  leads, onRowClick, selectedId,
  selectable, selectedLeadIds, onSelectionChange,
  newLeadIds, onSaveToProject,
  enrichmentData, onEnrich, enriching, onUploadContacts,
  contactedMap, sendOutreachMap, onToggleContacted, onToggleSendOutreach, onBulkUpdate,
  subscription, onRecordExport, onUpgrade,
  signalScores, isProTier,
}) {
  const [sortKey, setSortKey] = useState(null);
  const [exportError, setExportError] = useState(null);
  const [sortDir, setSortDir] = useState('asc');

  const handleSort = (key) => {
    if (sortKey === key) {
      setSortDir(d => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  const sorted = [...leads].sort((a, b) => {
    if (!sortKey) return 0;
    let aVal, bVal;
    if (sortKey === 'signalScore') {
      aVal = signalScores?.[a.leadId]?.score ?? 0;
      bVal = signalScores?.[b.leadId]?.score ?? 0;
    } else {
      aVal = a[sortKey];
      bVal = b[sortKey];
    }
    if (aVal == null) return 1;
    if (bVal == null) return -1;
    if (aVal instanceof Date && bVal instanceof Date) {
      return sortDir === 'asc' ? aVal - bVal : bVal - aVal;
    }
    if (typeof aVal === 'number') {
      return sortDir === 'asc' ? aVal - bVal : bVal - aVal;
    }
    aVal = String(aVal).toLowerCase();
    bVal = String(bVal).toLowerCase();
    if (aVal < bVal) return sortDir === 'asc' ? -1 : 1;
    if (aVal > bVal) return sortDir === 'asc' ? 1 : -1;
    return 0;
  });

  const columns = [
    { key: 'signalScore', label: 'Signal Score', hasInfo: true },
    { key: 'tenantName', label: 'Tenant Name' },
    { key: 'tenantIndustry', label: 'Industry' },
    { key: 'address', label: 'Street Address' },
    { key: 'sqft', label: 'Leased Sq Ft' },
    { key: 'commencementDate', label: 'Commencement' },
    { key: 'expirationDate', label: 'Expiration' },
    { key: '_contactName', label: 'Contact' },
    { key: '_contactEmail', label: 'Email' },
    { key: '_website', label: 'Website' },
    { key: '_phone', label: 'Phone' },
    { key: '_sendOutreach', label: 'Send Outreach' },
    { key: '_contacted', label: 'Contacted' },
  ];

  const arrow = (key) => {
    if (key.startsWith('_')) return '';
    if (sortKey !== key) return ' ↕';
    return sortDir === 'asc' ? ' ↑' : ' ↓';
  };

  const toggleSelect = (leadId) => {
    const next = new Set(selectedLeadIds);
    if (next.has(leadId)) next.delete(leadId);
    else next.add(leadId);
    onSelectionChange(next);
  };

  const toggleAll = () => {
    if (selectedLeadIds?.size === sorted.length) {
      onSelectionChange(new Set());
    } else {
      onSelectionChange(new Set(sorted.map(l => l.leadId)));
    }
  };

  const selectionCount = selectedLeadIds?.size || 0;
  const selectedIds = [...(selectedLeadIds || [])];
  const isNew = (lead) => newLeadIds?.has(lead.leadId);
  const getEnrichment = (lead) => enrichmentData?.[lead.tenantName] || {};

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 py-2 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
        <span className="text-sm font-semibold text-cs-blue">
          {leads.length.toLocaleString()} result{leads.length !== 1 ? 's' : ''}
        </span>
        <div className="flex items-center gap-2 flex-wrap">
          {onUploadContacts && (
            <button
              onClick={onUploadContacts}
              className="px-3 py-1.5 border border-gray-300 hover:border-cs-blue text-gray-500 hover:text-cs-blue rounded-lg text-xs font-semibold transition-colors"
            >
              Upload Contacts
            </button>
          )}
          {onEnrich && (
            <button
              onClick={onEnrich}
              disabled={enriching}
              className="px-3 py-1.5 border border-gray-300 hover:border-cs-blue text-gray-500 hover:text-cs-blue rounded-lg text-xs font-semibold transition-colors disabled:opacity-40"
            >
              {enriching ? 'Enriching...' : 'Enrich Contacts'}
            </button>
          )}
          <button
            onClick={async () => {
              setExportError(null);
              const leadsToExport = selectionCount > 0
                ? sorted.filter(l => selectedLeadIds.has(l.leadId))
                : sorted;
              try {
                if (onRecordExport) {
                  await onRecordExport(leadsToExport.length);
                }
                exportLeadsToCsv(leadsToExport, enrichmentData, contactedMap, sendOutreachMap, 'leads-export.csv', signalScores);
              } catch (err) {
                const data = err?.response || err;
                setExportError(
                  data?.remaining != null
                    ? `Export limit reached. You have ${data.remaining} exports remaining this month. Upgrade your plan for more.`
                    : 'Export failed. Please try again.'
                );
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
              <button
                onClick={() => setExportError(null)}
                className="text-gray-400 hover:text-gray-600 text-xs"
              >
                ✕
              </button>
            </div>
          )}
          {selectionCount > 0 && (
            <>
              <span className="text-xs text-gray-500 border-l border-gray-300 pl-2 ml-1">{selectionCount} selected</span>
              <button
                onClick={onSaveToProject}
                className="px-3 py-1.5 bg-cs-blue hover:bg-cs-cyan text-white rounded-lg text-xs font-semibold transition-colors"
              >
                Save to Project
              </button>
              <button
                onClick={() => onBulkUpdate?.(selectedIds, 'sendOutreach', true)}
                className="px-2.5 py-1.5 border border-blue-300 text-blue-600 hover:bg-blue-50 rounded-lg text-xs font-semibold transition-colors"
              >
                Mark Outreach ✓
              </button>
              <button
                onClick={() => onBulkUpdate?.(selectedIds, 'contacted', true)}
                className="px-2.5 py-1.5 border border-green-300 text-green-600 hover:bg-green-50 rounded-lg text-xs font-semibold transition-colors"
              >
                Mark Contacted ✓
              </button>
            </>
          )}
        </div>
      </div>
      <div className="overflow-auto flex-1">
        <table className="min-w-max text-sm">
          <thead className="bg-gray-50 sticky top-0">
            <tr>
              {selectable && (
                <th className="w-10 px-3 py-2.5">
                  <input
                    type="checkbox"
                    checked={sorted.length > 0 && selectionCount === sorted.length}
                    onChange={toggleAll}
                    className="accent-cs-blue"
                  />
                </th>
              )}
              {columns.map(col => (
                <th
                  key={col.key}
                  onClick={() => !col.key.startsWith('_') && handleSort(col.key)}
                  className={`text-left px-4 py-2.5 font-semibold text-gray-500 select-none whitespace-nowrap uppercase text-xs tracking-wider transition-colors ${
                    col.key.startsWith('_') ? '' : 'cursor-pointer hover:text-cs-blue'
                  }`}
                >
                  <span className="inline-flex items-center gap-1">
                    {col.label}{arrow(col.key)}
                    {col.hasInfo && <SignalScoreInfoButton isProTier={isProTier} />}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.map((lead, i) => {
              const enrich = getEnrichment(lead);
              return (
                <tr
                  key={lead.leadId || i}
                  onClick={() => onRowClick?.(lead, i)}
                  className={`border-b border-gray-100 cursor-pointer transition-colors ${
                    selectedId === i ? 'bg-blue-50' : 'hover:bg-gray-50'
                  }`}
                >
                  {selectable && (
                    <td className="w-10 px-3 py-2.5" onClick={e => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={selectedLeadIds?.has(lead.leadId) || false}
                        onChange={() => toggleSelect(lead.leadId)}
                        className="accent-cs-blue"
                      />
                    </td>
                  )}
                  {/* Signal Score column */}
                  <td className="px-4 py-2.5" onClick={e => e.stopPropagation()}>
                    {(() => {
                      const ss = signalScores?.[lead.leadId];
                      if (!ss) return <span className="text-gray-300 text-xs">—</span>;
                      const colors = getGradeColors(ss.grade);
                      const showFull = isProTier;
                      return (
                        <SignalScoreTooltip signalScore={ss} isProTier={isProTier}>
                          <div className="flex items-center gap-2">
                            <div className="relative w-8 h-8 shrink-0">
                              <svg className="w-8 h-8 -rotate-90" viewBox="0 0 36 36">
                                <circle cx="18" cy="18" r="14" fill="none" stroke="#e5e7eb" strokeWidth="3" />
                                <circle cx="18" cy="18" r="14" fill="none" stroke={ss.grade === 'A' ? '#ef4444' : ss.grade === 'B' ? '#f97316' : ss.grade === 'C' ? '#f59e0b' : '#9ca3af'}
                                  strokeWidth="3" strokeDasharray={`${ss.score * 0.88} 88`} strokeLinecap="round" />
                              </svg>
                              <span className={`absolute inset-0 flex items-center justify-center text-[10px] font-bold ${colors.text}`}>
                                {showFull ? ss.score : ss.grade}
                              </span>
                            </div>
                            {showFull ? (
                              <div className="min-w-0">
                                <span className={`inline-block px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${colors.bg} ${colors.text}`}>
                                  {ss.grade} · {getGradeLabel(ss.grade)}
                                </span>
                              </div>
                            ) : (
                              <div className="min-w-0">
                                <span className={`inline-block px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${colors.bg} ${colors.text}`}>
                                  {ss.grade}
                                </span>
                              </div>
                            )}
                          </div>
                        </SignalScoreTooltip>
                      );
                    })()}
                  </td>
                  <td className="px-4 py-2.5 font-medium text-gray-900">
                    <span className="flex items-center gap-2">
                      {lead.tenantName}
                      {isNew(lead) && (
                        <span className="inline-block px-1.5 py-0.5 text-[10px] font-bold bg-cs-cyan text-white rounded uppercase leading-none">
                          New
                        </span>
                      )}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-gray-600">{lead.tenantIndustry}</td>
                  <td className="px-4 py-2.5 text-gray-600 text-xs whitespace-nowrap">
                    {lead.address}{lead.city ? `, ${lead.city}` : ''}{lead.state ? `, ${lead.state}` : ''}
                  </td>
                  <td className="px-4 py-2.5 text-gray-900">{lead.sqft?.toLocaleString()}</td>
                  <td className="px-4 py-2.5 text-gray-500">{lead.commencementDateStr}</td>
                  <td className="px-4 py-2.5 text-gray-500">{lead.expirationDateStr}</td>
                  <td className="px-4 py-2.5 text-gray-900 text-xs whitespace-nowrap">
                    {enrich.contactName || <span className="text-gray-300">—</span>}
                  </td>
                  <td className="px-4 py-2.5 text-xs" onClick={e => e.stopPropagation()}>
                    {enrich.contactEmail ? (
                      <a href={`mailto:${enrich.contactEmail}`} className="text-cs-blue hover:text-cs-cyan">{enrich.contactEmail}</a>
                    ) : (
                      <span className="text-gray-300">—</span>
                    )}
                  </td>
                  <td className="px-4 py-2.5" onClick={e => e.stopPropagation()}>
                    {enrich.website ? (
                      <a
                        href={enrich.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-cs-blue hover:text-cs-cyan text-xs truncate block max-w-40"
                        title={enrich.website}
                      >
                        {enrich.website.replace(/^https?:\/\/(www\.)?/, '').split('/')[0]}
                      </a>
                    ) : (
                      <span className="text-gray-300 text-xs">—</span>
                    )}
                  </td>
                  <td className="px-4 py-2.5 text-gray-500 text-xs whitespace-nowrap">
                    {enrich.phone || <span className="text-gray-300">—</span>}
                  </td>
                  <td className="px-4 py-2.5" onClick={e => e.stopPropagation()}>
                    <button
                      onClick={() => onToggleSendOutreach?.(lead.leadId)}
                      className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider transition-colors ${
                        sendOutreachMap?.[lead.leadId]
                          ? 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                          : 'bg-gray-100 text-gray-400 hover:bg-gray-200 hover:text-gray-600'
                      }`}
                    >
                      {sendOutreachMap?.[lead.leadId] ? 'Yes' : 'No'}
                    </button>
                  </td>
                  <td className="px-4 py-2.5" onClick={e => e.stopPropagation()}>
                    <button
                      onClick={() => onToggleContacted?.(lead.leadId)}
                      className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider transition-colors ${
                        contactedMap?.[lead.leadId]
                          ? 'bg-green-100 text-green-700 hover:bg-green-200'
                          : 'bg-gray-100 text-gray-400 hover:bg-gray-200 hover:text-gray-600'
                      }`}
                    >
                      {contactedMap?.[lead.leadId] ? 'Yes' : 'No'}
                    </button>
                  </td>
                </tr>
              );
            })}
            {sorted.length === 0 && (
              <tr>
                <td colSpan={selectable ? 15 : 14} className="px-4 py-8 text-center text-gray-400">
                  No leads match your filters
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
