import { useState, useCallback } from 'react';
import { apiGet, apiPost } from '../utils/api';

export function useEnrichment() {
  const [enrichmentData, setEnrichmentData] = useState({});
  const [enriching, setEnriching] = useState(false);
  const [status, setStatus] = useState(null);

  const fetchEnrichment = useCallback(async () => {
    try {
      const data = await apiGet('/api/enrich');
      setEnrichmentData(data);
    } catch (err) {
      console.error('Failed to fetch enrichment:', err);
    }
  }, []);

  const enrichLeads = useCallback(async (tenantNames) => {
    setEnriching(true);
    try {
      await apiPost('/api/enrich', { tenantNames });
      // Poll for completion
      pollStatus();
    } catch (err) {
      console.error('Failed to start enrichment:', err);
      setEnriching(false);
    }
  }, []);

  const pollStatus = useCallback(async () => {
    const check = async () => {
      try {
        const s = await apiGet('/api/enrich/status');
        setStatus(s);
        if (s.pending > 0) {
          // Refresh cached data and check again
          await fetchEnrichment();
          setTimeout(check, 3000);
        } else {
          await fetchEnrichment();
          setEnriching(false);
        }
      } catch {
        setEnriching(false);
      }
    };
    check();
  }, [fetchEnrichment]);

  const uploadContacts = useCallback(async (contacts, overwrite = false) => {
    const result = await apiPost('/api/enrich/upload-contacts', { contacts, overwrite });
    await fetchEnrichment();
    return result;
  }, [fetchEnrichment]);

  return { enrichmentData, enriching, status, fetchEnrichment, enrichLeads, uploadContacts };
}
