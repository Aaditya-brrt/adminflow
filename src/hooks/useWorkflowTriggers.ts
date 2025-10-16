import { useState, useEffect, useCallback } from 'react';
import { WorkflowTrigger, CreateWorkflowTriggerRequest } from '@/types/triggers';

export function useWorkflowTriggers(workflowId: string | null) {
  const [triggers, setTriggers] = useState<WorkflowTrigger[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTriggers = useCallback(async () => {
    if (!workflowId) {
      setTriggers([]);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`/api/workflows/${workflowId}/triggers`);
      if (!response.ok) {
        throw new Error('Failed to fetch workflow triggers');
      }
      
      const data = await response.json();
      setTriggers(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load triggers');
      console.error('Error fetching workflow triggers:', err);
    } finally {
      setLoading(false);
    }
  }, [workflowId]);

  const createTrigger = useCallback(async (
    triggerRequest: CreateWorkflowTriggerRequest
  ): Promise<WorkflowTrigger | null> => {
    if (!workflowId) return null;

    try {
      setError(null);
      const response = await fetch(`/api/workflows/${workflowId}/triggers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(triggerRequest),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create trigger');
      }

      const newTrigger = await response.json();
      setTriggers(prev => [newTrigger, ...prev]);
      return newTrigger;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create trigger');
      console.error('Error creating trigger:', err);
      return null;
    }
  }, [workflowId]);

  const deleteTrigger = useCallback(async (triggerId: string): Promise<boolean> => {
    if (!workflowId) return false;

    try {
      setError(null);
      const response = await fetch(`/api/workflows/${workflowId}/triggers`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ trigger_id: triggerId }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete trigger');
      }

      setTriggers(prev => prev.filter(t => t.id !== triggerId));
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete trigger');
      console.error('Error deleting trigger:', err);
      return false;
    }
  }, [workflowId]);

  useEffect(() => {
    fetchTriggers();
  }, [fetchTriggers]);

  return {
    triggers,
    loading,
    error,
    fetchTriggers,
    createTrigger,
    deleteTrigger,
  };
}

