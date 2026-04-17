import { useState, useCallback, useEffect } from 'react';
import { apiGet, apiPost } from '../utils/api';

export function useOnboarding() {
  const [onboarding, setOnboarding] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchOnboarding = useCallback(async () => {
    try {
      const data = await apiGet('/api/onboarding');
      setOnboarding(data);
      return data;
    } catch (err) {
      console.error('Failed to fetch onboarding:', err);
      // If the API fails, assume onboarding is complete so the app still works
      setOnboarding({ completed: true, currentStep: 5 });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOnboarding();
  }, [fetchOnboarding]);

  const completeStep = useCallback(async (step, data) => {
    try {
      const result = await apiPost('/api/onboarding/step', { step, data });
      setOnboarding(result);
      return result;
    } catch (err) {
      console.error('Failed to complete onboarding step:', err);
    }
  }, []);

  const incrementSearchCount = useCallback(async () => {
    try {
      const result = await apiPost('/api/onboarding/search-count');
      setOnboarding(prev => prev ? { ...prev, searchCount: result.searchCount } : prev);
      return result;
    } catch (err) {
      console.error('Failed to increment search count:', err);
    }
  }, []);

  const completeOnboarding = useCallback(async () => {
    try {
      await apiPost('/api/onboarding/complete');
      setOnboarding(prev => prev ? { ...prev, completed: true } : prev);
    } catch (err) {
      console.error('Failed to complete onboarding:', err);
    }
  }, []);

  const shouldShowUpgradePrompt = onboarding && !onboarding.completed && onboarding.searchCount >= 3;

  return {
    onboarding,
    loading: loading,
    completeStep,
    incrementSearchCount,
    completeOnboarding,
    shouldShowUpgradePrompt,
    fetchOnboarding,
  };
}
