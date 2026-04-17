import * as XLSX from 'xlsx';

function parseGeoPoint(geoStr) {
  if (!geoStr || typeof geoStr !== 'string') return null;
  const cleaned = geoStr.replace(/[()]/g, '').trim();
  const parts = cleaned.split(',').map(s => parseFloat(s.trim()));
  if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
    return { lat: parts[0], lng: parts[1] };
  }
  return null;
}

function parseDate(dateVal) {
  if (!dateVal) return null;
  // Handle Excel serial number dates
  if (typeof dateVal === 'number') {
    const date = new Date((dateVal - 25569) * 86400 * 1000);
    return isNaN(date.getTime()) ? null : date;
  }
  if (typeof dateVal !== 'string') return null;
  const parts = dateVal.split('/');
  if (parts.length === 3) {
    const [month, day, year] = parts.map(Number);
    return new Date(year, month - 1, day);
  }
  return null;
}

function formatDate(dateVal) {
  const date = parseDate(dateVal);
  if (!date) return '';
  return `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`;
}

export async function loadLeadData() {
  const response = await fetch('/data/leads.xls');
  const buffer = await response.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: 'array' });

  const allLeads = [];
  const sheetNames = ['Full Comps', 'Limited Detail Comps', 'Partial Comps'];

  for (const sheetName of sheetNames) {
    const sheet = workbook.Sheets[sheetName];
    if (!sheet) continue;

    const rows = XLSX.utils.sheet_to_json(sheet, { defval: '' });
    for (const row of rows) {
      const geo = parseGeoPoint(row['Geo Point']);
      if (!geo) continue;

      const tenantName = row['Tenant Name'] || '';
      const address = row['Street Address'] || '';
      const sqft = typeof row['Transaction SQFT'] === 'number' ? row['Transaction SQFT'] : parseFloat(row['Transaction SQFT']) || 0;
      const leadId = `${tenantName.toLowerCase().trim()}|${address.toLowerCase().trim()}|${sqft}`;

      allLeads.push({
        leadId,
        tenantName,
        tenantIndustry: row['Tenant Industry'] || '',
        sqft,
        commencementDate: parseDate(row['Execution Date']),
        commencementDateStr: formatDate(row['Execution Date']),
        expirationDate: parseDate(row['Expiration Date']),
        expirationDateStr: formatDate(row['Expiration Date']),
        lat: geo.lat,
        lng: geo.lng,
        address,
        city: row['City'] || '',
        state: row['State'] || '',
        zip: row['Zip Code'] || '',
        buildingClass: row['Building Class'] || '',
        transactionType: row['Transaction Type'] || '',
        floorsOccupied: row['Floors Occupied'] || '',
        market: row['Market'] || '',
        source: sheetName,
      });
    }
  }

  return allLeads;
}
