import { useState, useEffect, useCallback } from 'react';
import { integrationsService, type Integration } from '@/lib/service/integrations';

export function useIntegrations() {
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadIntegrations = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const toolkits = await integrationsService.getToolkits();
      setIntegrations(toolkits);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load integrations');
      console.error('Error loading integrations:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshIntegrations = useCallback(async () => {
    await loadIntegrations();
  }, [loadIntegrations]);

  const getConnectedIntegrations = useCallback(() => {
    return integrations.filter(integration => integration.isConnected);
  }, [integrations]);

  const getIntegrationBySlug = useCallback((slug: string) => {
    return integrations.find(integration => integration.slug === slug);
  }, [integrations]);

  const isIntegrationConnected = useCallback((slug: string) => {
    const integration = getIntegrationBySlug(slug);
    return integration?.isConnected || false;
  }, [getIntegrationBySlug]);

  useEffect(() => {
    loadIntegrations();
  }, [loadIntegrations]);

  return {
    integrations,
    loading,
    error,
    loadIntegrations,
    refreshIntegrations,
    getConnectedIntegrations,
    getIntegrationBySlug,
    isIntegrationConnected,
  };
} 