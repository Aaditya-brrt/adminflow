import { deepseek } from '@ai-sdk/deepseek';
import { streamText, convertToCoreMessages } from 'ai';
import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { ChatService } from '@/lib/service/chat';
import composio from '@/lib/service/composio';

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
    try {
      // First, get connected accounts to find which toolkits are connected
      const connectedAccounts = await composio.connectedAccounts.list({
        userIds: [user.id],
      });

      // Extract toolkit slugs from connected accounts
      const connectedToolkitSlugs = Array.from(new Set(connectedAccounts.items
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

      console.log('Connected toolkit slugs:', connectedToolkitSlugs);

      if (connectedToolkitSlugs.length > 0) {
        // Use Vercel provider to get properly formatted tools
        tools = await composio.tools.get(user.id, {
          toolkits: connectedToolkitSlugs,
          limit: 100,
        });
        console.log('Total tools available:', Object.keys(tools).length);
        console.log('Tools:', Object.keys(tools));
      } else {
        console.log('No connected toolkits found for user');
      }
    } catch (error) {
      console.warn('Failed to fetch Composio tools:', error);
      // Continue without tools if Composio fails
    }


    // Convert messages to the core format
    const coreMessages = convertToCoreMessages(messages);

    console.log('Final tools being passed to AI model:', Object.keys(tools));
    console.log('Number of tools available:', Object.keys(tools).length);


    // Stream the response
    const result = streamText({
      model: deepseek('deepseek-chat'),
      messages: coreMessages,
      maxSteps: 10, // Allow more steps for complex tasks
      tools: {
        ...tools,
      },
      onStepFinish: async ({ text, toolCalls, toolResults, stepType, isContinued }) => {
        // Log each step for debugging
        console.log(`[Chat] Step completed - Type: ${stepType}, Continued: ${isContinued}`);
        
        if (text) {
          console.log(`[Chat] AI Response: ${text.substring(0, 100)}...`);
        }
        
        if (toolCalls && toolCalls.length > 0) {
          console.log(`[Chat] Tool calls made:`, toolCalls.map((call: any) => ({
            toolName: call.toolName,
            args: Object.keys(call.args || {})
          })));
        }
        
        if (toolResults && toolResults.length > 0) {
          console.log(`[Chat] Tool results:`, toolResults.map((result: any) => ({
            toolCallId: result.toolCallId,
            success: !result.isError,
            resultType: typeof result.result
          })));
        }
      },
      onFinish: async ({ text, toolCalls, toolResults, steps }) => {
        try {
          // Debug: Log final completion
          console.log(`[Chat] Final completion - Total steps: ${steps?.length || 0}`);
          
          if (toolCalls && toolCalls.length > 0) {
            console.log('AI made tool calls:', toolCalls.map((call: any) => ({
              toolName: call.toolName,
              args: call.args
            })));
          } else {
            console.log('AI made no tool calls');
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
                executionTime: Date.now(), // Will be calculated properly in the future
                toolsUsed: toolCalls?.map((call: any) => call.toolName) || []
              }
            });
          }
        } catch (error) {
          console.error('Failed to save assistant message:', error);
        }
      },
    });

    return result.toDataStreamResponse();
  } catch (error) {
    console.error('Chat API error:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
} 