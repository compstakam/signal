import { useState, useCallback } from 'react';
import { apiGet, apiPost } from '../utils/api';

export function useSubscription() {
  const [subscription, setSubscription] = useState(null);

  const fetchSubscription = useCallback(async () => {
    try {
      const data = await apiGet('/api/subscription');
      setSubscription(data);
    } catch (err) {
      console.error('Failed to fetch subscription:', err);
    }
  }, []);

  const recordExport = useCallback(async (leadCount) => {
    const result = await apiPost('/api/subscription/record-export', { leadCount });
    // Update local state with new usage
    setSubscription(prev => prev ? {
      ...prev,
      exported: result.exported,
      remaining: result.remaining,
    } : prev);
    return result;
  }, []);

  const changeTier = useCallback(async (tier) => {
    await apiPost('/api/subscription/change-tier', { tier });
    await fetchSubscription();
  }, [fetchSubscription]);

  return { subscription, fetchSubscription, recordExport, changeTier };
}
