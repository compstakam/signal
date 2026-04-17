import { useState, useCallback } from 'react';
import { apiGet, apiPost } from '../utils/api';

export function useOutreach() {
  const [contactedMap, setContactedMap] = useState({});
  const [sendOutreachMap, setSendOutreachMap] = useState({});

  const fetchOutreach = useCallback(async () => {
    try {
      const data = await apiGet('/api/outreach');
      setContactedMap(data.contacted || {});
      setSendOutreachMap(data.sendOutreach || {});
    } catch (err) {
      console.error('Failed to fetch outreach:', err);
    }
  }, []);

  const toggleField = useCallback(async (leadId, field) => {
    const setter = field === 'sendOutreach' ? setSendOutreachMap : setContactedMap;
    try {
      const result = await apiPost('/api/outreach/toggle', { leadId, field });
      setter(prev => {
        const next = { ...prev };
        if (result.value) {
          next[leadId] = true;
        } else {
          delete next[leadId];
        }
        return next;
      });
    } catch (err) {
      console.error('Failed to toggle:', err);
    }
  }, []);

  const toggleContacted = useCallback((leadId) => toggleField(leadId, 'contacted'), [toggleField]);
  const toggleSendOutreach = useCallback((leadId) => toggleField(leadId, 'sendOutreach'), [toggleField]);

  const bulkUpdate = useCallback(async (leadIds, field, value) => {
    const setter = field === 'sendOutreach' ? setSendOutreachMap : setContactedMap;
    try {
      await apiPost('/api/outreach/bulk', { leadIds, field, value });
      setter(prev => {
        const next = { ...prev };
        for (const id of leadIds) {
          if (value) next[id] = true;
          else delete next[id];
        }
        return next;
      });
    } catch (err) {
      console.error('Failed to bulk update:', err);
    }
  }, []);

  return {
    contactedMap, sendOutreachMap,
    fetchOutreach, toggleContacted, toggleSendOutreach, bulkUpdate,
  };
}
