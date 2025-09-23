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

export interface ExecutionStep {
  stepNumber: number;
  stepType: 'ai_generation' | 'tool_call' | 'tool_result' | 'error';
  timestamp: string;
  aiResponse?: string;
  toolCall?: {
    toolCallId: string;
    toolName: string;
    arguments: any;
  };
  toolResult?: {
    toolCallId: string;
    result: any;
    executionTime?: number;
    success: boolean;
    error?: string;
  };
  error?: string;
  metadata?: Record<string, any>;
}

export class WorkflowExecutor {
  private supabase: SupabaseClient;
  private workflowService: WorkflowService;

  constructor(supabase: SupabaseClient) {
    this.supabase = supabase;
    this.workflowService = new WorkflowService(supabase);
  }

  /**
   * Execute a workflow by ID with detailed step-by-step logging
   */
  async executeWorkflow(workflowId: string, userId: string): Promise<ExecutionResult> {
    const startTime = Date.now();
    const executionLog: ExecutionStep[] = [];
    let stepNumber = 1;
    
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

      // Log workflow start
      executionLog.push({
        stepNumber: stepNumber++,
        stepType: 'ai_generation',
        timestamp: new Date().toISOString(),
        metadata: {
          action: 'workflow_start',
          workflowName: workflow.name,
          workflowDescription: workflow.description
        }
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
      
      // Always include composio_search toolkit for research capabilities
      if (!connectedToolkitSlugs.includes('composio_search')) {
        connectedToolkitSlugs.push('composio_search');
      }

      console.log(`[WorkflowExecutor] Connected toolkits: ${connectedToolkitSlugs.join(', ')}`);

      // Log available tools
      executionLog.push({
        stepNumber: stepNumber++,
        stepType: 'ai_generation',
        timestamp: new Date().toISOString(),
        metadata: {
          action: 'tools_available',
          connectedToolkits: connectedToolkitSlugs,
          activeAccountsCount: activeAccounts.length
        }
      });

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

      // Execute the workflow with detailed logging
      const result = await this.executeWithAI(context, executionLog, stepNumber);

      // Update workflow run with results and detailed execution log
      await this.workflowService.updateWorkflowRun(workflowRun.id, {
        status: result.success ? 'completed' : 'failed',
        output_data: {
          result: result.output,
          toolCalls: result.toolCalls,
          executionTime: result.executionTime
        },
        execution_log: executionLog,
        error_message: result.error,
        completed_at: new Date().toISOString()
      });

      console.log(`[WorkflowExecutor] Workflow execution completed in ${result.executionTime}ms`);
      return result;

    } catch (error) {
      const executionTime = Date.now() - startTime;
      console.error(`[WorkflowExecutor] Workflow execution failed:`, error);
      
      // Log the error
      executionLog.push({
        stepNumber: stepNumber++,
        stepType: 'error',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error',
        metadata: {
          executionTime,
          stackTrace: error instanceof Error ? error.stack : undefined
        }
      });

      // Try to update the workflow run with error log
      try {
        const workflowRun = await this.workflowService.createWorkflowRun(workflowId, {
          triggered_by: 'schedule',
          input_data: {}
        });
        
        await this.workflowService.updateWorkflowRun(workflowRun.id, {
          status: 'failed',
          execution_log: executionLog,
          error_message: error instanceof Error ? error.message : 'Unknown error',
          completed_at: new Date().toISOString()
        });
      } catch (updateError) {
        console.error('Failed to update workflow run with error:', updateError);
      }
      
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
   * Execute workflow using AI with detailed step-by-step logging
   */
  private async executeWithAI(context: ExecutionContext, executionLog: ExecutionStep[], startingStepNumber: number): Promise<ExecutionResult> {
    const startTime = Date.now();
    let stepNumber = startingStepNumber;
    
    try {
      const { workflow, tools, composio, userId } = context;

      // Build system prompt
      const systemPrompt = this.buildSystemPrompt(workflow, tools);
      
      // Build user prompt
      const userPrompt = this.buildUserPrompt(workflow);

      console.log(`[WorkflowExecutor] Executing AI with ${Object.keys(tools).length} tools available`);
      console.log(`[WorkflowExecutor] User prompt: ${userPrompt.substring(0, 200)}...`);

      // Log AI execution start
      executionLog.push({
        stepNumber: stepNumber++,
        stepType: 'ai_generation',
        timestamp: new Date().toISOString(),
        metadata: {
          action: 'ai_execution_start',
          systemPrompt: systemPrompt.substring(0, 500) + '...',
          userPrompt: userPrompt,
          availableToolsCount: Object.keys(tools).length,
          availableTools: Object.keys(tools).slice(0, 10) // First 10 tools
        }
      });

      // Execute with AI using enhanced logging
      const result = await generateText({
        model: deepseek('deepseek-chat'),
        system: systemPrompt,
        prompt: userPrompt,
        tools: {
          ...tools,
        },
        maxSteps: 10, // Allow more steps for complex workflows
        onStepFinish: async ({ text, toolCalls, toolResults, stepType, isContinued }) => {
          // Log each step completion
          executionLog.push({
            stepNumber: stepNumber++,
            stepType: 'ai_generation',
            timestamp: new Date().toISOString(),
            aiResponse: text,
            metadata: {
              stepType,
              isContinued,
              toolCallsCount: toolCalls?.length || 0,
              toolResultsCount: toolResults?.length || 0
            }
          });

          // Log individual tool calls
          if (toolCalls && toolCalls.length > 0) {
            for (const toolCall of toolCalls) {
              executionLog.push({
                stepNumber: stepNumber++,
                stepType: 'tool_call',
                timestamp: new Date().toISOString(),
                toolCall: {
                  toolCallId: toolCall.toolCallId,
                  toolName: toolCall.toolName,
                  arguments: toolCall.args
                },
                metadata: {
                  toolCallType: 'initiated'
                }
              });
            }
          }

          // Log individual tool results
          if (toolResults && toolResults.length > 0) {
            for (const toolResult of toolResults) {
              const isError = toolResult.result instanceof Error || 
                             (typeof toolResult.result === 'object' && toolResult.result?.error);
              
              executionLog.push({
                stepNumber: stepNumber++,
                stepType: 'tool_result',
                timestamp: new Date().toISOString(),
                toolResult: {
                  toolCallId: toolResult.toolCallId,
                  result: toolResult.result,
                  success: !isError,
                  error: isError ? (toolResult.result instanceof Error ? toolResult.result.message : toolResult.result?.error) : undefined
                },
                metadata: {
                  resultType: isError ? 'error' : 'success'
                }
              });
            }
          }

          console.log(`[WorkflowExecutor] Step ${stepNumber - 1} completed: ${text?.substring(0, 100)}...`);
        },
      });

      const executionTime = Date.now() - startTime;

      // Log final AI completion
      executionLog.push({
        stepNumber: stepNumber++,
        stepType: 'ai_generation',
        timestamp: new Date().toISOString(),
        aiResponse: result.text,
        metadata: {
          action: 'ai_execution_complete',
          totalSteps: result.steps?.length || 0,
          finalResponse: result.text,
          executionTime
        }
      });

      return {
        success: true,
        output: result.text,
        toolCalls: result.toolCalls || [],
        executionTime
      };

    } catch (error) {
      const executionTime = Date.now() - startTime;
      console.error(`[WorkflowExecutor] AI execution failed:`, error);
      
      // Log AI execution error
      executionLog.push({
        stepNumber: stepNumber++,
        stepType: 'error',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'AI execution failed',
        metadata: {
          action: 'ai_execution_error',
          executionTime,
          stackTrace: error instanceof Error ? error.stack : undefined
        }
      });
      
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
6. Take your time to complete complex tasks - you have up to 10 steps available
7. Use multiple tools in sequence if needed to accomplish the goal

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