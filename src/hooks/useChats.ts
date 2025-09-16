import { useState, useEffect } from 'react';
import { Chat, ChatMessage } from '@/lib/service/chat';
import { createClient } from '@/lib/supabase/client';

export function useChats() {
  const [chats, setChats] = useState<Chat[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  const fetchChats = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/chats');
      if (!response.ok) {
        throw new Error('Failed to fetch chats');
      }
      
      const data = await response.json();
      setChats(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const createChat = async (title: string, metadata?: Record<string, any>): Promise<Chat | null> => {
    try {
      const response = await fetch('/api/chats', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ title, metadata }),
      });

      if (!response.ok) {
        throw new Error('Failed to create chat');
      }

      const newChat = await response.json();
      setChats(prev => [newChat, ...prev]);
      return newChat;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create chat');
      return null;
    }
  };

  const updateChatTitle = async (chatId: string, title: string): Promise<boolean> => {
    try {
      const response = await fetch(`/api/chats/${chatId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ title }),
      });

      if (!response.ok) {
        throw new Error('Failed to update chat');
      }

      const updatedChat = await response.json();
      setChats(prev => prev.map(chat => 
        chat.id === chatId ? updatedChat : chat
      ));
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update chat');
      return false;
    }
  };

  const deleteChat = async (chatId: string): Promise<boolean> => {
    try {
      const response = await fetch(`/api/chats/${chatId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete chat');
      }

      setChats(prev => prev.filter(chat => chat.id !== chatId));
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete chat');
      return false;
    }
  };

  useEffect(() => {
    fetchChats();
  }, []);

  return {
    chats,
    loading,
    error,
    fetchChats,
    createChat,
    updateChatTitle,
    deleteChat,
  };
}

export function useChatMessages(chatId: string | null) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMessages = async () => {
    if (!chatId) {
      setMessages([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`/api/chats/${chatId}/messages`);
      if (!response.ok) {
        throw new Error('Failed to fetch messages');
      }
      
      const data = await response.json();
      setMessages(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const createMessage = async (
    role: 'user' | 'assistant' | 'system',
    content: string,
    tool_calls?: any,
    tool_results?: any,
    metadata?: Record<string, any>
  ): Promise<ChatMessage | null> => {
    if (!chatId) return null;

    try {
      const response = await fetch(`/api/chats/${chatId}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          role,
          content,
          tool_calls,
          tool_results,
          metadata,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create message');
      }

      const newMessage = await response.json();
      setMessages(prev => [...prev, newMessage]);
      return newMessage;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create message');
      return null;
    }
  };

  useEffect(() => {
    fetchMessages();
  }, [chatId]);

  return {
    messages,
    loading,
    error,
    fetchMessages,
    createMessage,
  };
} 