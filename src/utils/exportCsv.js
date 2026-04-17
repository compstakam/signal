export function exportLeadsToCsv(leads, enrichmentData = {}, contactedMap = {}, sendOutreachMap = {}, filename = 'leads-export.csv', signalScores = {}) {
  const headers = [
    'Signal Score',
    'Signal Grade',
    'Tenant Name',
    'Industry',
    'Street Address',
    'City',
    'State',
    'Zip Code',
    'Leased Sq Ft',
    'Commencement Date',
    'Expiration Date',
    'Building Class',
    'Transaction Type',
    'Contact Name',
    'Contact Email',
    'Website',
    'Phone',
    'Send Outreach',
    'Contacted',
  ];

  const escCsv = (val) => {
    if (val == null) return '';
    const str = String(val);
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const rows = leads.map(lead => {
    const enrich = enrichmentData[lead.tenantName] || {};
    const ss = signalScores[lead.leadId];
    return [
      ss?.score ?? '',
      ss?.grade ?? '',
      lead.tenantName,
      lead.tenantIndustry,
      lead.address,
      lead.city,
      lead.state,
      lead.zip,
      lead.sqft,
      lead.commencementDateStr,
      lead.expirationDateStr,
      lead.buildingClass,
      lead.transactionType,
      enrich.contactName || '',
      enrich.contactEmail || '',
      enrich.website || '',
      enrich.phone || '',
      sendOutreachMap[lead.leadId] ? 'Yes' : 'No',
      contactedMap[lead.leadId] ? 'Yes' : 'No',
    ].map(escCsv).join(',');
  });

  const csv = [headers.join(','), ...rows].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
