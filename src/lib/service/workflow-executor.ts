import { SupabaseClient } from '@supabase/supabase-js';
import { WorkflowService, Workflow, WorkflowRun } from './workflow';
import { generateText } from 'ai';
import { deepseek } from '@ai-sdk/deepseek';
import composio from './composio';

export interface ExecutionContext {
  workflowId: string;
  runId: string;
  userId: string;
  workflow: Workflow;
  tools: any;
  composio: typeof composio;
}

export interface ExecutionResult {
  success: boolean;
  output: string;
  toolCalls?: any[];
  error?: string;
  executionTime: number;
}

export class WorkflowExecutor {
  private supabase: SupabaseClient;
  private workflowService: WorkflowService;

  constructor(supabase: SupabaseClient) {
    this.supabase = supabase;
    this.workflowService = new WorkflowService(supabase);
  }

  /**
   * Execute a workflow by ID
   */
  async executeWorkflow(workflowId: string, userId: string): Promise<ExecutionResult> {
    const startTime = Date.now();
    
    try {
      console.log(`[WorkflowExecutor] Starting execution for workflow ${workflowId}`);
      
      // Get workflow details
      const workflow = await this.workflowService.getWorkflow(workflowId);
      if (!workflow) {
        throw new Error('Workflow not found');
      }

      if (!workflow.active) {
        throw new Error('Workflow is not active');
      }

      // Create workflow run record
      const workflowRun = await this.workflowService.createWorkflowRun(workflowId, {
        triggered_by: 'schedule',
        input_data: {}
      });

      // Use the shared Composio instance with VercelProvider
      // const composio is imported from './composio'
      
      // Get user's connected accounts and tools
      const connectedAccounts = await composio.connectedAccounts.list({ 
        userIds: [userId] 
      });

      const activeAccounts = connectedAccounts.items.filter(
        (account: any) => account.status === 'ACTIVE' && !account.isDisabled
      );

      if (activeAccounts.length === 0) {
        console.log(`[WorkflowExecutor] No active accounts found for user ${userId}`);
      }

      // Get available toolkits from connected accounts
      const connectedToolkitSlugs = Array.from(new Set(activeAccounts.map((account: any) => account.toolkit.slug)));
      
      // Always include composio toolkit for intelligent routing
      if (!connectedToolkitSlugs.includes('composio')) {
        connectedToolkitSlugs.push('composio');
      }

      console.log(`[WorkflowExecutor] Connected toolkits: ${connectedToolkitSlugs.join(', ')}`);

      // Get tools for connected toolkits
      let tools = {};
      if (connectedToolkitSlugs.length > 0) {
        tools = await composio.tools.get(userId, { 
          toolkits: connectedToolkitSlugs,
          limit: 100 
        });
      }

      console.log(`[WorkflowExecutor] Available tools: ${Object.keys(tools).length}`);

      // Create execution context
      const context: ExecutionContext = {
        workflowId,
        runId: workflowRun.id,
        userId,
        workflow,
        tools: tools,
        composio
      };

      // Execute the workflow
      const result = await this.executeWithAI(context);

      // Update workflow run with results
      await this.workflowService.updateWorkflowRun(workflowRun.id, {
        status: result.success ? 'completed' : 'failed',
        output_data: {
          result: result.output,
          toolCalls: result.toolCalls,
          executionTime: result.executionTime
        },
        error_message: result.error,
        completed_at: new Date().toISOString()
      });

      console.log(`[WorkflowExecutor] Workflow execution completed in ${result.executionTime}ms`);
      return result;

    } catch (error) {
      const executionTime = Date.now() - startTime;
      console.error(`[WorkflowExecutor] Workflow execution failed:`, error);
      
      const result: ExecutionResult = {
        success: false,
        output: '',
        error: error instanceof Error ? error.message : 'Unknown error',
        executionTime
      };

      return result;
    }
  }

  /**
   * Execute workflow using AI with tools
   */
  private async executeWithAI(context: ExecutionContext): Promise<ExecutionResult> {
    const startTime = Date.now();
    
    try {
      const { workflow, tools, composio, userId } = context;

      // Build system prompt
      const systemPrompt = this.buildSystemPrompt(workflow, tools);
      
      // Build user prompt
      const userPrompt = this.buildUserPrompt(workflow);

      console.log(`[WorkflowExecutor] Executing AI with ${tools.length} tools available`);
      console.log(`[WorkflowExecutor] User prompt: ${userPrompt.substring(0, 200)}...`);

      // Execute with AI
      // Using the same pattern as the working chat implementation
      const result = await generateText({
        model: deepseek('deepseek-chat'),
        system: systemPrompt,
        prompt: userPrompt,
        tools: {
          ...tools,
        },
        maxSteps: 5,
      });

      const executionTime = Date.now() - startTime;

      return {
        success: true,
        output: result.text,
        toolCalls: result.toolCalls || [],
        executionTime
      };

    } catch (error) {
      const executionTime = Date.now() - startTime;
      console.error(`[WorkflowExecutor] AI execution failed:`, error);
      
      return {
        success: false,
        output: '',
        error: error instanceof Error ? error.message : 'AI execution failed',
        executionTime
      };
    }
  }

  /**
   * Build system prompt for AI execution
   */
  private buildSystemPrompt(workflow: Workflow, tools: any): string {
    const toolNames = Object.keys(tools).join(', ');
    
    return `You are an AI assistant executing a scheduled workflow named "${workflow.name}".

WORKFLOW DESCRIPTION: ${workflow.description}

AVAILABLE TOOLS: ${toolNames}

INSTRUCTIONS:
1. Execute the workflow task described in the user prompt
2. Use the available tools to complete the required actions
3. Provide detailed feedback about what you did, including:
   - Which tools you used and why
   - What actions were performed
   - Results of each action
   - Any issues encountered
4. Be thorough in your explanation as this will be logged for the user
5. If you cannot complete the task, explain why and what tools/permissions are needed

Remember: You are running automatically on a schedule, so the user is not actively monitoring this execution. Your response will be logged for later review.`;
  }

  /**
   * Build user prompt for AI execution
   */
  private buildUserPrompt(workflow: Workflow): string {
    let prompt = workflow.description || workflow.name;
    
    // Add context about the workflow type and schedule
    if (workflow.type === 'schedule' && workflow.schedule_config) {
      const schedule = workflow.schedule_config;
      prompt += `\n\nThis is a scheduled workflow that runs ${schedule.type}`;
      if (schedule.time) {
        prompt += ` at ${schedule.time}`;
      }
      prompt += '. Execute the task now.';
    }

    // Add any workflow steps as additional context
    if (workflow.steps && workflow.steps.length > 0) {
      prompt += '\n\nWorkflow steps:';
      workflow.steps.forEach((step, index) => {
        prompt += `\n${index + 1}. ${step.description || `${step.type} with ${step.service}`}`;
      });
    }

    return prompt;
  }

  /**
   * Get workflows that should be executed now
   */
  async getWorkflowsDueForExecution(): Promise<Workflow[]> {
    try {
      const now = new Date().toISOString();
      
      const { data: workflows, error } = await this.supabase
        .from('workflows')
        .select('*')
        .eq('active', true)
        .eq('type', 'schedule')
        .not('next_run_at', 'is', null)
        .lte('next_run_at', now);

      if (error) {
        console.error('[WorkflowExecutor] Error fetching due workflows:', error);
        return [];
      }

      return workflows || [];
    } catch (error) {
      console.error('[WorkflowExecutor] Error in getWorkflowsDueForExecution:', error);
      return [];
    }
  }

  /**
   * Process all workflows that are due for execution
   */
  async processScheduledWorkflows(): Promise<void> {
    try {
      console.log('[WorkflowExecutor] Checking for scheduled workflows...');
      
      const dueWorkflows = await this.getWorkflowsDueForExecution();
      
      if (dueWorkflows.length === 0) {
        console.log('[WorkflowExecutor] No workflows due for execution');
        return;
      }

      console.log(`[WorkflowExecutor] Found ${dueWorkflows.length} workflows due for execution`);

      // Execute each workflow
      for (const workflow of dueWorkflows) {
        try {
          console.log(`[WorkflowExecutor] Executing workflow: ${workflow.name} (${workflow.id})`);
          
          await this.executeWorkflow(workflow.id, workflow.user_id);
          
          // Update next run time by reactivating the workflow
          await this.workflowService.activateWorkflow(workflow.id);
          
        } catch (error) {
          console.error(`[WorkflowExecutor] Failed to execute workflow ${workflow.id}:`, error);
        }
      }

    } catch (error) {
      console.error('[WorkflowExecutor] Error in processScheduledWorkflows:', error);
    }
  }
} 