import { useState, useEffect, useCallback } from 'react';
import { TriggerType, AvailableTriggersResponse } from '@/types/triggers';

export function useTriggers() {
  const [triggers, setTriggers] = useState<TriggerType[]>([]);
  const [connectedAccounts, setConnectedAccounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAvailableTriggers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/triggers');
      if (!response.ok) {
        throw new Error('Failed to fetch available triggers');
      }
      
      const data: AvailableTriggersResponse = await response.json();
      setTriggers(data.triggers || []);
      setConnectedAccounts(data.connectedAccounts || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load triggers');
      console.error('Error fetching available triggers:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchTriggersForToolkit = useCallback(async (toolkitSlug: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`/api/triggers/${toolkitSlug}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch triggers for ${toolkitSlug}`);
      }
      
      const data = await response.json();
      return data.triggers || [];
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load toolkit triggers');
      console.error(`Error fetching triggers for ${toolkitSlug}:`, err);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const getConnectedAccountForToolkit = useCallback((toolkitSlug: string) => {
    return connectedAccounts.find(account => account.toolkit === toolkitSlug);
  }, [connectedAccounts]);

  const getTriggersForToolkit = useCallback((toolkitSlug: string) => {
    return triggers.filter(trigger => trigger.toolkit === toolkitSlug);
  }, [triggers]);

  useEffect(() => {
    fetchAvailableTriggers();
  }, [fetchAvailableTriggers]);

  return {
    triggers,
    connectedAccounts,
    loading,
    error,
    fetchAvailableTriggers,
    fetchTriggersForToolkit,
    getConnectedAccountForToolkit,
    getTriggersForToolkit,
  };
}

