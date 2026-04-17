import { useState, useCallback } from 'react';
import { apiGet, apiPost } from '../utils/api';

export function usePreferences() {
  const [preferences, setPreferences] = useState(null);

  const fetchPreferences = useCallback(async () => {
    try {
      const data = await apiGet('/api/preferences');
      setPreferences(data);
    } catch (err) {
      console.error('Failed to fetch preferences:', err);
    }
  }, []);

  const savePreferences = useCallback(async (prefs) => {
    const data = await apiPost('/api/preferences', prefs);
    setPreferences(data);
    return data;
  }, []);

  return { preferences, fetchPreferences, savePreferences };
}
