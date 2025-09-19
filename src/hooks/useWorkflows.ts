import { useState, useEffect } from 'react';
import { Workflow, CreateWorkflowRequest, UpdateWorkflowRequest, WorkflowRun } from '@/lib/service/workflow';

export function useWorkflows() {
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchWorkflows = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('/api/workflows');
      
      if (!response.ok) {
        throw new Error('Failed to fetch workflows');
      }
      
      const data = await response.json();
      setWorkflows(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error('Error fetching workflows:', err);
    } finally {
      setLoading(false);
    }
  };

  const createWorkflow = async (request: CreateWorkflowRequest): Promise<Workflow | null> => {
    try {
      setError(null);
      const response = await fetch('/api/workflows', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create workflow');
      }

      const workflow = await response.json();
      setWorkflows(prev => [workflow, ...prev]);
      return workflow;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error('Error creating workflow:', err);
      return null;
    }
  };

  const updateWorkflow = async (workflowId: string, request: UpdateWorkflowRequest): Promise<boolean> => {
    try {
      setError(null);
      const response = await fetch(`/api/workflows/${workflowId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update workflow');
      }

      const updatedWorkflow = await response.json();
      setWorkflows(prev => 
        prev.map(workflow => 
          workflow.id === workflowId ? updatedWorkflow : workflow
        )
      );
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error('Error updating workflow:', err);
      return false;
    }
  };

  const deleteWorkflow = async (workflowId: string): Promise<boolean> => {
    try {
      setError(null);
      const response = await fetch(`/api/workflows/${workflowId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete workflow');
      }

      setWorkflows(prev => prev.filter(workflow => workflow.id !== workflowId));
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error('Error deleting workflow:', err);
      return false;
    }
  };

  const toggleWorkflowActivation = async (workflowId: string, active: boolean): Promise<boolean> => {
    try {
      setError(null);
      const response = await fetch(`/api/workflows/${workflowId}/activate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ active }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to toggle workflow activation');
      }

      const updatedWorkflow = await response.json();
      setWorkflows(prev => 
        prev.map(workflow => 
          workflow.id === workflowId ? updatedWorkflow : workflow
        )
      );
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error('Error toggling workflow activation:', err);
      return false;
    }
  };

  useEffect(() => {
    fetchWorkflows();
  }, []);

  return {
    workflows,
    loading,
    error,
    fetchWorkflows,
    createWorkflow,
    updateWorkflow,
    deleteWorkflow,
    toggleWorkflowActivation,
  };
}

export function useWorkflow(workflowId: string | null) {
  const [workflow, setWorkflow] = useState<Workflow | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchWorkflow = async () => {
    if (!workflowId) return;

    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`/api/workflows/${workflowId}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          setWorkflow(null);
          return;
        }
        throw new Error('Failed to fetch workflow');
      }
      
      const data = await response.json();
      setWorkflow(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error('Error fetching workflow:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkflow();
  }, [workflowId]);

  return {
    workflow,
    loading,
    error,
    refetch: fetchWorkflow,
  };
}

export function useWorkflowRuns(workflowId: string | null) {
  const [runs, setRuns] = useState<WorkflowRun[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRuns = async () => {
    if (!workflowId) return;

    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`/api/workflows/${workflowId}/runs`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch workflow runs');
      }
      
      const data = await response.json();
      setRuns(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error('Error fetching workflow runs:', err);
    } finally {
      setLoading(false);
    }
  };

  const createRun = async (inputData?: Record<string, any>): Promise<WorkflowRun | null> => {
    if (!workflowId) return null;

    try {
      setError(null);
      const response = await fetch(`/api/workflows/${workflowId}/runs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ input_data: inputData }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create workflow run');
      }

      const run = await response.json();
      setRuns(prev => [run, ...prev]);
      return run;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error('Error creating workflow run:', err);
      return null;
    }
  };

  useEffect(() => {
    fetchRuns();
  }, [workflowId]);

  return {
    runs,
    loading,
    error,
    fetchRuns,
    createRun,
  };
} 