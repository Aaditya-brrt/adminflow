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
      const composioTools = await composio.tools.get(user.id, {
        toolkits: [], // Get tools for all connected toolkits
      });
      tools = composioTools || {};
    } catch (error) {
      console.warn('Failed to fetch Composio tools:', error);
      // Continue without tools if Composio fails
    }

    // Convert messages to the core format
    const coreMessages = convertToCoreMessages(messages);

    // Stream the response
    const result = streamText({
      model: deepseek('deepseek-chat'),
      messages: coreMessages,
      tools,
      maxTokens: 1000,
      temperature: 0.7,
      onFinish: async ({ text, toolCalls, toolResults }) => {
        try {
          // Save the assistant's response to the database
          if (chatId) {
            const chatService = new ChatService(supabase);
            await chatService.createMessage({
              chat_id: chatId,
              role: 'assistant',
              content: text,
              tool_calls: toolCalls?.length ? toolCalls : undefined,
              tool_results: toolResults?.length ? toolResults : undefined,
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