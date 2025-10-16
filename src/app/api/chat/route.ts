import { deepseek } from '@ai-sdk/deepseek';
import { streamText, convertToCoreMessages } from 'ai';
import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { ChatService } from '@/lib/service/chat';
import composio from '@/lib/service/composio';

/**
 * Build system prompt for chat execution - same logic as workflow executor
 */
function buildChatSystemPrompt(connectedToolkits: string[]): string {
  const toolkitList = connectedToolkits.join(', ');
  
  return `You are an AI assistant helping users accomplish tasks across their connected applications.

AVAILABLE TOOLKITS: ${toolkitList}

INSTRUCTIONS:
1. Execute the task described by the user using the available tools
2. Use the composio toolkit to retrieve information about the connected toolkits, and then create a plan using the search agent tool and/or the ask oracle tool available in composio. Then, based on the plan, use composio to execute the tools available in the connected toolkits.
3. Provide detailed feedback about what you're doing, including:
   - Which tools you're using and why
   - What actions are being performed
   - Results of each action
   - Any issues encountered
4. Be thorough in your explanation as this will help the user understand the process
5. If you cannot complete the task, explain why and what tools/permissions are needed
6. You have up to 10 steps available. Make sure to operate concisely and efficiently so all of the tasks get accomplished quickly and effectively.
7. Use multiple tools in sequence if needed to accomplish the goal
8. Always think step-by-step and explain your reasoning

Remember: Provide clear, real-time updates about what you're doing so the user can follow along with your progress.`;
}

export async function POST(req: NextRequest) {
  try {
    // Get authenticated user
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return new Response('Unauthorized', { status: 401 });
    }

    const { messages, chatId } = await req.json();

    // Get available Composio tools for the user
    let tools = {};
    let connectedToolkitSlugs: string[] = [];
    
    try {
      // First, get connected accounts to find which toolkits are connected
      const connectedAccounts = await composio.connectedAccounts.list({
        userIds: [user.id],
      });

      // Extract toolkit slugs from connected accounts
      connectedToolkitSlugs = Array.from(new Set(connectedAccounts.items
        .filter((account: any) => account.status === 'ACTIVE' && !account.isDisabled)
        .map((account: any) => account.toolkit.slug)));

      // Always include composio toolkit for intelligent routing
      if (!connectedToolkitSlugs.includes('composio')) {
        connectedToolkitSlugs.push('composio');
      }
      
      // Always include composio_search toolkit for research capabilities
      if (!connectedToolkitSlugs.includes('composio_search')) {
        connectedToolkitSlugs.push('composio_search');
      }

      console.log('[Chat] Connected toolkit slugs:', connectedToolkitSlugs);

      if (connectedToolkitSlugs.length > 0) {
        // Use Vercel provider to get properly formatted tools
        tools = await composio.tools.get(user.id, {
          toolkits: connectedToolkitSlugs,
          limit: 100,
        });
        console.log('[Chat] Total tools available:', Object.keys(tools).length);
        console.log('[Chat] Tools:', Object.keys(tools).slice(0, 20)); // Log first 20 tools
      } else {
        console.log('[Chat] No connected toolkits found for user');
      }
    } catch (error) {
      console.warn('[Chat] Failed to fetch Composio tools:', error);
      // Continue without tools if Composio fails
    }

    // Build system prompt using the same logic as workflow executor
    const systemPrompt = buildChatSystemPrompt(connectedToolkitSlugs);

    // Convert messages to the core format
    const coreMessages = convertToCoreMessages(messages);

    console.log('[Chat] System prompt length:', systemPrompt.length, 'characters');
    console.log('[Chat] Available tools count:', Object.keys(tools).length);


    // Stream the response with system prompt
    const result = streamText({
      model: deepseek('deepseek-chat'),
      system: systemPrompt, // Add system prompt like workflow executor
      messages: coreMessages,
      maxSteps: 10, // Allow more steps for complex tasks (matching chat's original setting)
      tools: {
        ...tools,
      },
      onStepFinish: async ({ text, toolCalls, toolResults, stepType, isContinued, finishReason }) => {
        // Enhanced logging matching workflow executor's detail level
        const timestamp = new Date().toISOString();
        
        console.log(`\n[Chat] === Step completed at ${timestamp} ===`);
        console.log(`[Chat] Step Type: ${stepType}, Continued: ${isContinued}, Finish Reason: ${finishReason || 'none'}`);
        
        // Log AI text generation
        if (text) {
          console.log(`[Chat] AI Response (${text.length} chars): ${text.substring(0, 150)}${text.length > 150 ? '...' : ''}`);
        }
        
        // Log tool calls with detailed arguments
        if (toolCalls && toolCalls.length > 0) {
          console.log(`[Chat] Tool Calls Made (${toolCalls.length}):`);
          toolCalls.forEach((call: any, index: number) => {
            console.log(`  ${index + 1}. ${call.toolName}`);
            console.log(`     Call ID: ${call.toolCallId}`);
            console.log(`     Arguments:`, JSON.stringify(call.args, null, 2).substring(0, 200));
          });
        }
        
        // Log tool results with success/error status
        if (toolResults && toolResults.length > 0) {
          console.log(`[Chat] Tool Results (${toolResults.length}):`);
          toolResults.forEach((result: any, index: number) => {
            const isError = result.result instanceof Error || 
                           (typeof result.result === 'object' && result.result?.error);
            console.log(`  ${index + 1}. ${isError ? '❌ FAILED' : '✅ SUCCESS'}`);
            console.log(`     Call ID: ${result.toolCallId}`);
            if (isError) {
              const errorMsg = result.result instanceof Error 
                ? result.result.message 
                : result.result?.error;
              console.log(`     Error: ${errorMsg}`);
            } else {
              const resultStr = JSON.stringify(result.result, null, 2);
              console.log(`     Result: ${resultStr.substring(0, 200)}${resultStr.length > 200 ? '...' : ''}`);
            }
          });
        }
        
        console.log(`[Chat] === End of step ===\n`);
      },
      onFinish: async ({ text, toolCalls, toolResults, steps, finishReason, usage }) => {
        try {
          // Enhanced final completion logging
          const timestamp = new Date().toISOString();
          console.log(`\n[Chat] ========================================`);
          console.log(`[Chat] FINAL COMPLETION at ${timestamp}`);
          console.log(`[Chat] ========================================`);
          console.log(`[Chat] Total Steps: ${steps?.length || 0}`);
          console.log(`[Chat] Finish Reason: ${finishReason}`);
          console.log(`[Chat] Final Text Length: ${text.length} characters`);
          
          // Log token usage if available
          if (usage) {
            console.log(`[Chat] Token Usage:`, {
              promptTokens: usage.promptTokens,
              completionTokens: usage.completionTokens,
              totalTokens: usage.totalTokens
            });
          }
          
          // Log all tool calls made during the conversation
          if (toolCalls && toolCalls.length > 0) {
            console.log(`[Chat] Total Tool Calls Made: ${toolCalls.length}`);
            const toolNames = toolCalls.map((call: any) => call.toolName);
            const uniqueTools = Array.from(new Set(toolNames));
            console.log(`[Chat] Unique Tools Used: ${uniqueTools.join(', ')}`);
          } else {
            console.log('[Chat] No tool calls made during this interaction');
          }

          // Save the assistant's response to the database with detailed metadata
          if (chatId) {
            const chatService = new ChatService(supabase);
            await chatService.createMessage({
              chat_id: chatId,
              role: 'assistant',
              content: text,
              tool_calls: toolCalls?.length ? toolCalls : undefined,
              tool_results: toolResults?.length ? toolResults : undefined,
              metadata: {
                totalSteps: steps?.length || 0,
                finishReason,
                usage: usage ? {
                  promptTokens: usage.promptTokens,
                  completionTokens: usage.completionTokens,
                  totalTokens: usage.totalTokens
                } : undefined,
                toolsUsed: toolCalls?.map((call: any) => call.toolName) || [],
                timestamp
              }
            });
            console.log(`[Chat] Message saved to database (chat_id: ${chatId})`);
          }
          
          console.log(`[Chat] ========================================\n`);
        } catch (error) {
          console.error('[Chat] Failed to save assistant message:', error);
        }
      },
    });

    return result.toDataStreamResponse();
  } catch (error) {
    console.error('Chat API error:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
} 