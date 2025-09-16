import { createClient } from '@/lib/supabase/client';
import { SupabaseClient } from '@supabase/supabase-js';

export interface Chat {
  id: string;
  user_id: string;
  title: string;
  created_at: string;
  updated_at: string;
  last_message_at: string;
  metadata?: Record<string, any>;
}

export interface ChatMessage {
  id: string;
  chat_id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  tool_calls?: any;
  tool_results?: any;
  created_at: string;
  metadata?: Record<string, any>;
}

export interface CreateChatRequest {
  title: string;
  metadata?: Record<string, any>;
}

export interface CreateMessageRequest {
  chat_id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  tool_calls?: any;
  tool_results?: any;
  metadata?: Record<string, any>;
}

export class ChatService {
  private supabase: SupabaseClient;

  constructor(supabaseClient?: SupabaseClient) {
    this.supabase = supabaseClient || createClient();
  }

  async createChat(request: CreateChatRequest): Promise<Chat> {
    // Get the current user
    const { data: { user }, error: userError } = await this.supabase.auth.getUser();
    
    if (userError || !user) {
      console.error('Error getting user:', userError);
      throw new Error('User not authenticated');
    }

    const { data, error } = await this.supabase
      .from('chats')
      .insert({
        title: request.title,
        metadata: request.metadata || {},
        user_id: user.id
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating chat:', error);
      throw new Error('Failed to create chat');
    }

    return data;
  }

  async getChats(): Promise<Chat[]> {
    const { data, error } = await this.supabase
      .from('chats')
      .select('*')
      .order('last_message_at', { ascending: false });

    if (error) {
      console.error('Error fetching chats:', error);
      throw new Error('Failed to fetch chats');
    }

    return data || [];
  }

  async getChat(chatId: string): Promise<Chat | null> {
    const { data, error } = await this.supabase
      .from('chats')
      .select('*')
      .eq('id', chatId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // Chat not found
      }
      console.error('Error fetching chat:', error);
      throw new Error('Failed to fetch chat');
    }

    return data;
  }

  async updateChatTitle(chatId: string, title: string): Promise<void> {
    const { error } = await this.supabase
      .from('chats')
      .update({ title })
      .eq('id', chatId);

    if (error) {
      console.error('Error updating chat title:', error);
      throw new Error('Failed to update chat title');
    }
  }

  async deleteChat(chatId: string): Promise<void> {
    const { error } = await this.supabase
      .from('chats')
      .delete()
      .eq('id', chatId);

    if (error) {
      console.error('Error deleting chat:', error);
      throw new Error('Failed to delete chat');
    }
  }

  async getChatMessages(chatId: string): Promise<ChatMessage[]> {
    const { data, error } = await this.supabase
      .from('chat_messages')
      .select('*')
      .eq('chat_id', chatId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching chat messages:', error);
      throw new Error('Failed to fetch chat messages');
    }

    return data || [];
  }

  async createMessage(request: CreateMessageRequest): Promise<ChatMessage> {
    const { data, error } = await this.supabase
      .from('chat_messages')
      .insert({
        chat_id: request.chat_id,
        role: request.role,
        content: request.content,
        tool_calls: request.tool_calls,
        tool_results: request.tool_results,
        metadata: request.metadata || {}
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating message:', error);
      throw new Error('Failed to create message');
    }

    return data;
  }

  async deleteMessage(messageId: string): Promise<void> {
    const { error } = await this.supabase
      .from('chat_messages')
      .delete()
      .eq('id', messageId);

    if (error) {
      console.error('Error deleting message:', error);
      throw new Error('Failed to delete message');
    }
  }

  // Generate a chat title from the first message
  generateChatTitle(firstMessage: string): string {
    const words = firstMessage.trim().split(' ');
    if (words.length <= 6) {
      return firstMessage;
    }
    return words.slice(0, 6).join(' ') + '...';
  }
}

export const chatService = new ChatService(); 