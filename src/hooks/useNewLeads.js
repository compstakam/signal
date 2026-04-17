import { useState, useCallback } from 'react';
import { apiPost } from '../utils/api';

export function useNewLeads() {
  const [newLeadIds, setNewLeadIds] = useState(new Set());
  const [lastLogin, setLastLogin] = useState(null);
  const [initialized, setInitialized] = useState(false);

  const initialize = useCallback(async (allLeads) => {
    if (initialized) return;
    try {
      // Record login
      const session = await apiPost('/api/session/login');
      setLastLogin(session.previousLogin);

      // Send all lead IDs to snapshot, get back which are new
      const leadIds = allLeads.map(l => l.leadId);
      const { newLeadIds: newIds } = await apiPost('/api/session/snapshot', { leadIds });
      setNewLeadIds(new Set(newIds));
      setInitialized(true);
    } catch (err) {
      console.error('Failed to initialize new leads:', err);
      setInitialized(true);
    }
  }, [initialized]);

  return { newLeadIds, lastLogin, initialize, initialized };
}
