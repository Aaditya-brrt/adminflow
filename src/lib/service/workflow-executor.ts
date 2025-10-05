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
  runId?: string;
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
      return { ...result, runId: workflowRun.id };

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
        executionTime,
        runId: undefined // No run ID available on error during initial setup
      };

      return result;
    }
  }

  /**
   * Insert a live step and broadcast it for real-time updates
   */
  private async insertLiveStep(
    runId: string,
    stepNumber: number,
    stepType: 'ai_generation' | 'tool_call' | 'tool_result' | 'error' | 'completion',
    content?: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    const liveStep = {
      workflow_run_id: runId,
      step_number: stepNumber,
      step_type: stepType,
      content: content,
      timestamp: new Date().toISOString(),
      metadata: metadata || {}
    };

    try {
      // Insert into database
      const { data, error } = await this.supabase
        .from('workflow_live_steps')
        .insert([liveStep])
        .select()
        .single();

      if (error) {
        console.error('[WorkflowExecutor] Failed to insert live step:', error);
        return;
      }

      // Broadcast directly to Supabase Realtime channel
      const channel = this.supabase.channel(`workflow_run:${runId}`);
      
      await channel.send({
        type: 'broadcast',
        event: 'STEP_UPDATE',
        payload: {
          new: data
        }
      });

      console.log(`[WorkflowExecutor] Broadcasted step ${stepNumber} (${stepType}) to workflow_run:${runId}`);
    } catch (error) {
      console.error('[WorkflowExecutor] Error in insertLiveStep:', error);
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

      // Get the connected toolkits for the system prompt
      const connectedAccounts = await composio.connectedAccounts.list({ 
        userIds: [userId] 
      });
      const activeAccounts = connectedAccounts.items.filter(
        (account: any) => account.status === 'ACTIVE' && !account.isDisabled
      );
      const connectedToolkitSlugs = Array.from(new Set(activeAccounts.map((account: any) => account.toolkit.slug)));
      
      // Always include composio toolkit for intelligent routing
      if (!connectedToolkitSlugs.includes('composio')) {
        connectedToolkitSlugs.push('composio');
      }
      
      // Always include composio_search toolkit for research capabilities
      if (!connectedToolkitSlugs.includes('composio_search')) {
        connectedToolkitSlugs.push('composio_search');
      }

      // Build system prompt
      const systemPrompt = this.buildSystemPrompt(workflow, tools, connectedToolkitSlugs);
      
      // Build user prompt
      const userPrompt = this.buildUserPrompt(workflow);

      console.log(`[WorkflowExecutor] Executing AI with ${Object.keys(tools).length} tools available`);
      console.log(`[WorkflowExecutor] User prompt: ${userPrompt.substring(0, 200)}...`);
      console.log(`[WorkflowExecutor] System prompt length: ${systemPrompt.length} characters`);
      console.log(`[WorkflowExecutor] Connected toolkits: ${connectedToolkitSlugs.join(', ')}`);

      // Log AI execution start
      const currentStep = stepNumber++;
      const stepMetadata = {
        action: 'ai_execution_start',
        systemPrompt: systemPrompt.substring(0, 500) + '...',
        userPrompt: userPrompt,
        availableToolsCount: Object.keys(tools).length,
        availableTools: Object.keys(tools).slice(0, 10) // First 10 tools
      };
      
      executionLog.push({
        stepNumber: currentStep,
        stepType: 'ai_generation',
        timestamp: new Date().toISOString(),
        metadata: stepMetadata
      });

      // Broadcast live step for real-time updates
      await this.insertLiveStep(
        context.runId, 
        currentStep, 
        'ai_generation', 
        'Starting AI execution...', 
        stepMetadata
      );

      // Execute with AI using enhanced logging with retry logic
      let result;
      let retries = 3;
      
      while (retries > 0) {
        try {
          result = await generateText({
            model: deepseek('deepseek-chat'),
            system: systemPrompt,
            prompt: userPrompt,
            tools: {
              ...tools,
            },
            maxSteps: 5, // Allow more steps for complex workflows
            onStepFinish: async ({ text, toolCalls, toolResults, stepType, isContinued }) => {
              // Log each step completion
              const aiStepNumber = stepNumber++;
              const aiStepMetadata = {
                stepType,
                isContinued,
                toolCallsCount: toolCalls?.length || 0,
                toolResultsCount: toolResults?.length || 0
              };
              
              executionLog.push({
                stepNumber: aiStepNumber,
                stepType: 'ai_generation',
                timestamp: new Date().toISOString(),
                aiResponse: text,
                metadata: aiStepMetadata
              });

              // Broadcast AI generation step
              await this.insertLiveStep(
                context.runId,
                aiStepNumber,
                'ai_generation',
                text,
                aiStepMetadata
              );

              // Log individual tool calls
              if (toolCalls && toolCalls.length > 0) {
                for (const toolCall of toolCalls) {
                  const toolCallStepNumber = stepNumber++;
                  const toolCallMetadata = {
                    toolCallType: 'initiated'
                  };
                  
                  executionLog.push({
                    stepNumber: toolCallStepNumber,
                    stepType: 'tool_call',
                    timestamp: new Date().toISOString(),
                    toolCall: {
                      toolCallId: toolCall.toolCallId,
                      toolName: toolCall.toolName,
                      arguments: toolCall.args
                    },
                    metadata: toolCallMetadata
                  });

                  // Broadcast tool call step
                  await this.insertLiveStep(
                    context.runId,
                    toolCallStepNumber,
                    'tool_call',
                    `Calling ${toolCall.toolName}`,
                    { 
                      ...toolCallMetadata,
                      toolName: toolCall.toolName,
                      arguments: Object.keys(toolCall.args || {})
                    }
                  );
                }
              }

              // Log individual tool results
              if (toolResults && toolResults.length > 0) {
                for (const toolResult of toolResults) {
                  const isError = toolResult.result instanceof Error || 
                                 (typeof toolResult.result === 'object' && toolResult.result?.error);
                  
                  const toolResultStepNumber = stepNumber++;
                  const toolResultMetadata = {
                    resultType: isError ? 'error' : 'success'
                  };
                  
                  executionLog.push({
                    stepNumber: toolResultStepNumber,
                    stepType: 'tool_result',
                    timestamp: new Date().toISOString(),
                    toolResult: {
                      toolCallId: toolResult.toolCallId,
                      result: toolResult.result,
                      success: !isError,
                      error: isError ? (toolResult.result instanceof Error ? toolResult.result.message : toolResult.result?.error) : undefined
                    },
                    metadata: toolResultMetadata
                  });

                  // Broadcast tool result step
                  const resultContent = isError 
                    ? `Tool failed: ${toolResult.result instanceof Error ? toolResult.result.message : toolResult.result?.error}`
                    : 'Tool executed successfully';
                  
                  await this.insertLiveStep(
                    context.runId,
                    toolResultStepNumber,
                    'tool_result',
                    resultContent,
                    {
                      ...toolResultMetadata,
                      success: !isError,
                      toolCallId: toolResult.toolCallId
                    }
                  );
                }
              }

              console.log(`[WorkflowExecutor] Step ${stepNumber - 1} completed: ${text?.substring(0, 100)}...`);
            },
          });
          break; // Success, exit retry loop
        } catch (error) {
          retries--;
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          console.log(`[WorkflowExecutor] API call failed (attempt ${4 - retries}/3):`, errorMessage);
          
          if (retries === 0) {
            // Log the final retry failure
            executionLog.push({
              stepNumber: stepNumber++,
              stepType: 'error',
              timestamp: new Date().toISOString(),
              error: `API call failed after 3 attempts: ${errorMessage}`,
              metadata: {
                errorType: 'api_failure',
                finalAttempt: true
              }
            });
            throw error; // Re-throw on final attempt
          }
          
          // Log retry attempt
          executionLog.push({
            stepNumber: stepNumber++,
            stepType: 'error',
            timestamp: new Date().toISOString(),
            error: `API call failed, retrying... (${4 - retries}/3): ${errorMessage}`,
            metadata: {
              errorType: 'api_retry',
              remainingRetries: retries
            }
          });
          
          // Exponential backoff: wait 1s, then 2s, then 3s
          const waitTime = (4 - retries) * 1000;
          console.log(`[WorkflowExecutor] Waiting ${waitTime}ms before retry...`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
        }
      }

      const executionTime = Date.now() - startTime;

      // Ensure result is defined (should be after successful retry loop)
      if (!result) {
        throw new Error('AI execution failed: no result returned');
      }

      // Log final AI completion
      const completionStepNumber = stepNumber++;
      const completionMetadata = {
        action: 'ai_execution_complete',
        totalSteps: result.steps?.length || 0,
        finalResponse: result.text,
        executionTime
      };
      
      executionLog.push({
        stepNumber: completionStepNumber,
        stepType: 'ai_generation',
        timestamp: new Date().toISOString(),
        aiResponse: result.text,
        metadata: completionMetadata
      });

      // Broadcast completion step
      await this.insertLiveStep(
        context.runId,
        completionStepNumber,
        'completion',
        `Workflow completed successfully in ${executionTime}ms`,
        completionMetadata
      );

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
      const errorStepNumber = stepNumber++;
      const errorMessage = error instanceof Error ? error.message : 'AI execution failed';
      const errorMetadata = {
        action: 'ai_execution_error',
        executionTime,
        stackTrace: error instanceof Error ? error.stack : undefined
      };
      
      executionLog.push({
        stepNumber: errorStepNumber,
        stepType: 'error',
        timestamp: new Date().toISOString(),
        error: errorMessage,
        metadata: errorMetadata
      });

      // Broadcast error step
      await this.insertLiveStep(
        context.runId,
        errorStepNumber,
        'error',
        errorMessage,
        errorMetadata
      );
      
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
  private buildSystemPrompt(workflow: Workflow, tools: any, connectedToolkits: string[]): string {
    const toolkitList = connectedToolkits.join(', ');
    
    return `You are an AI assistant executing a scheduled workflow named "${workflow.name}".

WORKFLOW DESCRIPTION: ${workflow.description}

AVAILABLE TOOLKITS: ${toolkitList}

INSTRUCTIONS:
1. Execute the workflow task described in the user prompt
2. Use the composio toolkit to retrieve information about the connected toolkits, and then create a plan using the search agent tool and/or the ask oracle tool available in composio. Then, based on the plan, use composio to execute the tools available in the connected toolkits.
3. Provide detailed feedback about what you did, including:
   - Which tools you used and why
   - What actions were performed
   - Results of each action
   - Any issues encountered
4. Be thorough in your explanation as this will be logged for the user
5. If you cannot complete the task, explain why and what tools/permissions are needed
6. You have up to 5 steps available. Make sure to operate concisely and efficiently so all of the tasks get accomplished quickly and effectively.
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