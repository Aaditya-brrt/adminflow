import { SupabaseClient } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/client';
import { WorkflowTrigger, CreateWorkflowTriggerRequest, TriggerType } from '@/types/triggers';

export class TriggersService {
  private supabase: SupabaseClient;

  constructor(supabaseClient?: SupabaseClient) {
    this.supabase = supabaseClient || createClient();
  }

  /**
   * Get available triggers for the authenticated user
   */
  async getAvailableTriggers(): Promise<TriggerType[]> {
    try {
      const response = await fetch('/api/triggers');
      if (!response.ok) {
        throw new Error('Failed to fetch available triggers');
      }
      const data = await response.json();
      return data.triggers || [];
    } catch (error) {
      console.error('Error fetching available triggers:', error);
      throw error;
    }
  }

  /**
   * Get triggers for a specific toolkit
   */
  async getTriggersForToolkit(toolkitSlug: string): Promise<TriggerType[]> {
    try {
      const response = await fetch(`/api/triggers/${toolkitSlug}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch triggers for ${toolkitSlug}`);
      }
      const data = await response.json();
      return data.triggers || [];
    } catch (error) {
      console.error(`Error fetching triggers for ${toolkitSlug}:`, error);
      throw error;
    }
  }

  /**
   * Get all triggers for a specific workflow
   */
  async getWorkflowTriggers(workflowId: string): Promise<WorkflowTrigger[]> {
    try {
      const { data, error } = await this.supabase
        .from('workflow_triggers')
        .select('*')
        .eq('workflow_id', workflowId)
        .order('created_at', { ascending: false });

      if (error) {
        throw new Error(`Failed to fetch workflow triggers: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      console.error('Error fetching workflow triggers:', error);
      throw error;
    }
  }

  /**
   * Create a new trigger for a workflow
   */
  async createTrigger(
    workflowId: string,
    triggerRequest: CreateWorkflowTriggerRequest
  ): Promise<WorkflowTrigger> {
    try {
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

      return await response.json();
    } catch (error) {
      console.error('Error creating trigger:', error);
      throw error;
    }
  }

  /**
   * Delete a trigger
   */
  async deleteTrigger(workflowId: string, triggerId: string): Promise<void> {
    try {
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
    } catch (error) {
      console.error('Error deleting trigger:', error);
      throw error;
    }
  }

  /**
   * Activate a trigger in Composio
   */
  async activateTrigger(triggerId: string, webhookUrl: string): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('workflow_triggers')
        .update({ active: true })
        .eq('id', triggerId);

      if (error) {
        throw new Error(`Failed to activate trigger: ${error.message}`);
      }
    } catch (error) {
      console.error('Error activating trigger:', error);
      throw error;
    }
  }

  /**
   * Deactivate a trigger
   */
  async deactivateTrigger(triggerId: string): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('workflow_triggers')
        .update({ active: false })
        .eq('id', triggerId);

      if (error) {
        throw new Error(`Failed to deactivate trigger: ${error.message}`);
      }
    } catch (error) {
      console.error('Error deactivating trigger:', error);
      throw error;
    }
  }
}

export const triggersService = new TriggersService();

