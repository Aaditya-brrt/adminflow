import { SupabaseClient } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/client';

export interface Workflow {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  type: 'schedule' | 'trigger';
  active: boolean;
  schedule_config?: Record<string, any>;
  trigger_config?: Record<string, any>;
  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
  last_run_at?: string;
  next_run_at?: string;
  steps?: WorkflowStep[];
}

export interface WorkflowStep {
  id: string;
  workflow_id: string;
  step_order: number;
  type: 'trigger' | 'action';
  service: string;
  action: string;
  description?: string;
  config?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface WorkflowRun {
  id: string;
  workflow_id: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  started_at: string;
  completed_at?: string;
  error_message?: string;
  input_data?: Record<string, any>;
  output_data?: Record<string, any>;
  execution_log?: Array<Record<string, any>>;
  created_at: string;
}

export interface WorkflowStepRun {
  id: string;
  workflow_run_id: string;
  workflow_step_id: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped';
  started_at: string;
  completed_at?: string;
  error_message?: string;
  input_data?: Record<string, any>;
  output_data?: Record<string, any>;
  execution_time_ms?: number;
  created_at: string;
}

export interface CreateWorkflowRequest {
  name: string;
  description?: string;
  type: 'schedule' | 'trigger';
  schedule_config?: Record<string, any>;
  trigger_config?: Record<string, any>;
  metadata?: Record<string, any>;
  steps?: CreateWorkflowStepRequest[];
}

export interface CreateWorkflowStepRequest {
  step_order: number;
  type: 'trigger' | 'action';
  service: string;
  action: string;
  description?: string;
  config?: Record<string, any>;
}

export interface UpdateWorkflowRequest {
  name?: string;
  description?: string;
  type?: 'schedule' | 'trigger';
  active?: boolean;
  schedule_config?: Record<string, any>;
  trigger_config?: Record<string, any>;
  metadata?: Record<string, any>;
  next_run_at?: string;
}

export class WorkflowService {
  private supabase: SupabaseClient;

  constructor(supabaseClient?: SupabaseClient) {
    this.supabase = supabaseClient || createClient();
  }

  async createWorkflow(request: CreateWorkflowRequest): Promise<Workflow> {
    // Get authenticated user
    const { data: { user }, error: authError } = await this.supabase.auth.getUser();
    if (authError || !user) {
      throw new Error('User not authenticated');
    }

    // Create workflow
    const { data: workflow, error: workflowError } = await this.supabase
      .from('workflows')
      .insert({
        user_id: user.id,
        name: request.name,
        description: request.description,
        type: request.type,
        active: false, // Start inactive
        schedule_config: request.schedule_config || null,
        trigger_config: request.trigger_config || null,
        metadata: request.metadata || {}
      })
      .select()
      .single();

    if (workflowError) {
      throw new Error(`Failed to create workflow: ${workflowError.message}`);
    }

    // Create workflow steps if provided
    if (request.steps && request.steps.length > 0) {
      const stepsData = request.steps.map(step => ({
        workflow_id: workflow.id,
        step_order: step.step_order,
        type: step.type,
        service: step.service,
        action: step.action,
        description: step.description,
        config: step.config || {}
      }));

      const { error: stepsError } = await this.supabase
        .from('workflow_steps')
        .insert(stepsData);

      if (stepsError) {
        // Clean up workflow if steps creation fails
        await this.supabase.from('workflows').delete().eq('id', workflow.id);
        throw new Error(`Failed to create workflow steps: ${stepsError.message}`);
      }
    }

    return workflow;
  }

  async getWorkflows(): Promise<Workflow[]> {
    const { data, error } = await this.supabase
      .from('workflows')
      .select(`
        *,
        steps:workflow_steps(*)
      `)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch workflows: ${error.message}`);
    }

    return data || [];
  }

  async getWorkflow(workflowId: string): Promise<Workflow | null> {
    const { data, error } = await this.supabase
      .from('workflows')
      .select(`
        *,
        steps:workflow_steps(*),
        runs:workflow_runs(*)
      `)
      .eq('id', workflowId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // Not found
      }
      throw new Error(`Failed to fetch workflow: ${error.message}`);
    }

    return data;
  }

  async updateWorkflow(workflowId: string, request: UpdateWorkflowRequest): Promise<Workflow> {
    const { data, error } = await this.supabase
      .from('workflows')
      .update(request)
      .eq('id', workflowId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update workflow: ${error.message}`);
    }

    return data;
  }

  async deleteWorkflow(workflowId: string): Promise<void> {
    const { error } = await this.supabase
      .from('workflows')
      .delete()
      .eq('id', workflowId);

    if (error) {
      throw new Error(`Failed to delete workflow: ${error.message}`);
    }
  }

  async activateWorkflow(workflowId: string): Promise<Workflow> {
    const workflow = await this.getWorkflow(workflowId);
    if (!workflow) {
      throw new Error('Workflow not found');
    }

    // Calculate next run time if it's a schedule-based workflow
    let nextRunAt: string | undefined;
    if (workflow.type === 'schedule' && workflow.schedule_config) {
      nextRunAt = this.calculateNextRunTime(workflow.schedule_config);
    }

    return this.updateWorkflow(workflowId, {
      active: true,
      next_run_at: nextRunAt
    });
  }

  async deactivateWorkflow(workflowId: string): Promise<Workflow> {
    return this.updateWorkflow(workflowId, {
      active: false,
      next_run_at: undefined
    });
  }

  async createWorkflowRun(workflowId: string, inputData?: Record<string, any>): Promise<WorkflowRun> {
    const { data, error } = await this.supabase
      .from('workflow_runs')
      .insert({
        workflow_id: workflowId,
        status: 'pending',
        input_data: inputData || {}
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create workflow run: ${error.message}`);
    }

    return data;
  }

  async getWorkflowRuns(workflowId: string, limit: number = 50): Promise<WorkflowRun[]> {
    const { data, error } = await this.supabase
      .from('workflow_runs')
      .select('*')
      .eq('workflow_id', workflowId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      throw new Error(`Failed to fetch workflow runs: ${error.message}`);
    }

    return data || [];
  }

  async updateWorkflowRun(runId: string, updates: Partial<WorkflowRun>): Promise<WorkflowRun> {
    const { data, error } = await this.supabase
      .from('workflow_runs')
      .update(updates)
      .eq('id', runId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update workflow run: ${error.message}`);
    }

    return data;
  }

  async addWorkflowStep(workflowId: string, step: CreateWorkflowStepRequest): Promise<WorkflowStep> {
    const { data, error } = await this.supabase
      .from('workflow_steps')
      .insert({
        workflow_id: workflowId,
        step_order: step.step_order,
        type: step.type,
        service: step.service,
        action: step.action,
        description: step.description,
        config: step.config || {}
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to add workflow step: ${error.message}`);
    }

    return data;
  }

  async updateWorkflowStep(stepId: string, updates: Partial<WorkflowStep>): Promise<WorkflowStep> {
    const { data, error } = await this.supabase
      .from('workflow_steps')
      .update(updates)
      .eq('id', stepId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update workflow step: ${error.message}`);
    }

    return data;
  }

  async deleteWorkflowStep(stepId: string): Promise<void> {
    const { error } = await this.supabase
      .from('workflow_steps')
      .delete()
      .eq('id', stepId);

    if (error) {
      throw new Error(`Failed to delete workflow step: ${error.message}`);
    }
  }

  async getActiveWorkflows(): Promise<Workflow[]> {
    const { data, error } = await this.supabase
      .from('workflows')
      .select(`
        *,
        steps:workflow_steps(*)
      `)
      .eq('active', true)
      .order('next_run_at', { ascending: true, nullsFirst: false });

    if (error) {
      throw new Error(`Failed to fetch active workflows: ${error.message}`);
    }

    return data || [];
  }

  private calculateNextRunTime(scheduleConfig: Record<string, any>): string {
    // Simple implementation - in a real app, you'd use a proper cron library
    const now = new Date();
    const { type, interval, time } = scheduleConfig;

    switch (type) {
      case 'daily':
        const [hours, minutes] = (time || '09:00').split(':').map(Number);
        const nextRun = new Date(now);
        nextRun.setHours(hours, minutes, 0, 0);
        if (nextRun <= now) {
          nextRun.setDate(nextRun.getDate() + 1);
        }
        return nextRun.toISOString();

      case 'weekly':
        const daysUntilNext = (scheduleConfig.dayOfWeek || 1) - now.getDay();
        const nextWeeklyRun = new Date(now);
        nextWeeklyRun.setDate(now.getDate() + (daysUntilNext <= 0 ? daysUntilNext + 7 : daysUntilNext));
        const [weeklyHours, weeklyMinutes] = (time || '09:00').split(':').map(Number);
        nextWeeklyRun.setHours(weeklyHours, weeklyMinutes, 0, 0);
        return nextWeeklyRun.toISOString();

      case 'interval':
        const intervalMs = (interval || 60) * 60 * 1000; // Default 1 hour
        return new Date(now.getTime() + intervalMs).toISOString();

      default:
        // Default to 1 hour from now
        return new Date(now.getTime() + 60 * 60 * 1000).toISOString();
    }
  }

  generateWorkflowTitle(description: string): string {
    const words = description.trim().split(' ');
    if (words.length <= 4) {
      return description.trim();
    }
    return words.slice(0, 4).join(' ') + '...';
  }
}

// Export a default instance
export const workflowService = new WorkflowService(); 