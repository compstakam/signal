import { useState, useRef } from 'react';
import * as XLSX from 'xlsx';

export default function UploadContactsModal({ allLeads, onUpload, onClose }) {
  const [contacts, setContacts] = useState([]);
  const [matched, setMatched] = useState(0);
  const [fileName, setFileName] = useState('');
  const [uploading, setUploading] = useState(false);
  const [done, setDone] = useState(false);
  const [overwrite, setOverwrite] = useState(false);
  const fileRef = useRef(null);

  const tenantNames = new Set(allLeads.map(l => l.tenantName.toLowerCase().trim()));

  const handleFile = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setFileName(file.name);

    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: 'array' });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(sheet, { defval: '' });

    // Try to detect column names
    const headers = Object.keys(rows[0] || {}).map(h => h.toLowerCase());
    const companyCol = Object.keys(rows[0] || {}).find(h =>
      /company|tenant|business|org|firm/i.test(h)
    );
    const nameCol = Object.keys(rows[0] || {}).find(h =>
      /contact.*name|first.*name|full.*name|^name$/i.test(h)
    );
    const emailCol = Object.keys(rows[0] || {}).find(h =>
      /email|e-mail/i.test(h)
    );
    const websiteCol = Object.keys(rows[0] || {}).find(h =>
      /website|url|web|site|homepage/i.test(h)
    );
    const phoneCol = Object.keys(rows[0] || {}).find(h =>
      /phone|tel|mobile|cell/i.test(h)
    );

    if (!companyCol) {
      alert('Could not find a company/tenant name column. Please include a column with "Company" or "Tenant" in the header.');
      return;
    }

    const parsed = rows
      .map(row => ({
        companyName: (row[companyCol] || '').toString().trim(),
        contactName: nameCol ? (row[nameCol] || '').toString().trim() : '',
        contactEmail: emailCol ? (row[emailCol] || '').toString().trim() : '',
        website: websiteCol ? (row[websiteCol] || '').toString().trim() : '',
        phone: phoneCol ? (row[phoneCol] || '').toString().trim() : '',
      }))
      .filter(c => c.companyName);

    const matchCount = parsed.filter(c =>
      tenantNames.has(c.companyName.toLowerCase().trim())
    ).length;

    setContacts(parsed);
    setMatched(matchCount);
  };

  const handleUpload = async () => {
    setUploading(true);
    try {
      await onUpload(contacts, overwrite);
      setDone(true);
    } catch (err) {
      console.error('Upload failed:', err);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60" onClick={onClose}>
      <div
        className="bg-white rounded-xl w-[480px] max-h-[80vh] overflow-hidden shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="px-5 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Upload Contacts</h2>
          <p className="text-sm text-gray-500 mt-1">
            Upload a CSV or Excel file with company names, contact names, and emails.
            We'll match them to your tenant leads.
          </p>
        </div>

        <div className="px-5 py-5 space-y-4">
          {!done ? (
            <>
              <div
                onClick={() => fileRef.current?.click()}
                className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-cs-blue transition-colors"
              >
                <input
                  ref={fileRef}
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  onChange={handleFile}
                  className="hidden"
                />
                {fileName ? (
                  <div>
                    <p className="text-sm font-medium text-gray-900">{fileName}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {contacts.length} contacts found, {matched} matched to existing tenants
                    </p>
                  </div>
                ) : (
                  <div>
                    <p className="text-sm text-gray-500">Click to select a file</p>
                    <p className="text-xs text-gray-400 mt-1">CSV or Excel with Company, Contact Name, Email, Website, Phone columns</p>
                  </div>
                )}
              </div>

              {contacts.length > 0 && (
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Preview</p>
                  <div className="space-y-1 max-h-32 overflow-y-auto">
                    {contacts.slice(0, 5).map((c, i) => (
                      <div key={i} className="flex gap-3 text-xs">
                        <span className="text-gray-900 font-medium w-1/3 truncate">{c.companyName}</span>
                        <span className="text-gray-600 w-1/3 truncate">{c.contactName || '—'}</span>
                        <span className="text-gray-500 w-1/3 truncate">{c.contactEmail || '—'}</span>
                      </div>
                    ))}
                    {contacts.length > 5 && (
                      <p className="text-xs text-gray-400">...and {contacts.length - 5} more</p>
                    )}
                  </div>
                </div>
              )}

              {contacts.length > 0 && (
                <label className="flex items-start gap-3 p-3 rounded-lg border border-gray-200 cursor-pointer hover:border-cs-blue transition-colors">
                  <input
                    type="checkbox"
                    checked={overwrite}
                    onChange={(e) => setOverwrite(e.target.checked)}
                    className="accent-cs-blue mt-0.5"
                  />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Overwrite existing data</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {overwrite
                        ? 'All uploaded values will replace existing data, even if a field is already populated.'
                        : 'Only fill in empty fields. Existing contact, website, and phone data will be preserved.'}
                    </p>
                  </div>
                </label>
              )}
            </>
          ) : (
            <div className="text-center py-4">
              <p className="text-lg font-semibold text-gray-900">Contacts uploaded</p>
              <p className="text-sm text-gray-500 mt-1">
                {matched} contacts matched to tenant records.
              </p>
            </div>
          )}
        </div>

        <div className="px-5 py-4 border-t border-gray-200 flex gap-3 justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-500 hover:text-gray-700 text-sm font-medium transition-colors"
          >
            {done ? 'Close' : 'Cancel'}
          </button>
          {!done && (
            <button
              onClick={handleUpload}
              disabled={contacts.length === 0 || uploading}
              className="px-4 py-2 bg-cs-blue hover:bg-cs-cyan disabled:opacity-40 text-white rounded-lg text-sm font-semibold transition-colors"
            >
              {uploading ? 'Uploading...' : `Upload ${contacts.length} Contacts`}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
