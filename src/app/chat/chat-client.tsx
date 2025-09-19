"use client";

import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { useState, useEffect } from "react";
import { useChat } from "@ai-sdk/react";
import { useChats, useChatMessages } from "@/hooks/useChats";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card } from "@/components/ui/card";
import { Loader2, Plus, Send, Trash2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { chatService } from "@/lib/service/chat";

export default function ChatClient() {
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [newChatInput, setNewChatInput] = useState("");
  const [isCreatingChat, setIsCreatingChat] = useState(false);
  const { toast } = useToast();
  
  const { chats, loading: chatsLoading, createChat, deleteChat } = useChats();
  const { messages: dbMessages, loading: messagesLoading } = useChatMessages(selectedChatId);

  // Convert database messages to AI SDK format
  const initialMessages = dbMessages.map(msg => ({
    id: msg.id,
    role: msg.role as 'user' | 'assistant' | 'system',
    content: msg.content,
    createdAt: new Date(msg.created_at),
  }));

  const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat({
    id: selectedChatId || undefined,
    initialMessages,
    body: {
      chatId: selectedChatId,
    },
    onFinish: async (message) => {
      // The message is already saved by the API route, but we can refresh if needed
      console.log('Assistant response finished:', message);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleCreateChat = async () => {
    if (!newChatInput.trim()) return;
    
    setIsCreatingChat(true);
    const title = chatService.generateChatTitle(newChatInput);
    const newChat = await createChat(title);
    
    if (newChat) {
      setSelectedChatId(newChat.id);
      setNewChatInput("");
      toast({
        title: "Success",
        description: "New chat created!",
      });
    }
    setIsCreatingChat(false);
  };

  const handleDeleteChat = async (chatId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    const success = await deleteChat(chatId);
    if (success) {
      if (selectedChatId === chatId) {
        setSelectedChatId(null);
      }
      toast({
        title: "Success",
        description: "Chat deleted successfully.",
      });
    }
  };

  const handleChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedChatId) {
      // Create a new chat if none is selected
      if (!input.trim()) return;
      
      setIsCreatingChat(true);
      const title = chatService.generateChatTitle(input);
      const newChat = await createChat(title);
      
      if (newChat) {
        setSelectedChatId(newChat.id);
        // The useChat hook will handle the message sending
        setTimeout(() => {
          handleSubmit(e);
        }, 100);
      }
      setIsCreatingChat(false);
      return;
    }

    // Save user message to database
    try {
      await fetch(`/api/chats/${selectedChatId}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          role: 'user',
          content: input,
        }),
      });
    } catch (error) {
      console.error('Failed to save user message:', error);
    }

    handleSubmit(e);
  };

  // Auto-select first chat if none selected
  useEffect(() => {
    if (!selectedChatId && chats.length > 0 && !chatsLoading) {
      setSelectedChatId(chats[0].id);
    }
  }, [chats, selectedChatId, chatsLoading]);
  
  return (
    <DashboardLayout>
      <div className="flex w-full h-[80vh] max-w-7xl mx-auto bg-background rounded-lg border shadow overflow-hidden">
        {/* Left: Chat List */}
        <div className="w-72 border-r bg-card flex flex-col">
          <div className="p-4 border-b">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-bold text-lg">Conversations</h2>
              <Button
                size="sm"
                onClick={() => {
                  setSelectedChatId(null);
                  setNewChatInput("");
                }}
                disabled={isCreatingChat}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            
            {!selectedChatId && (
              <div className="flex gap-2">
                <Input
                  placeholder="Start new chat..."
                  value={newChatInput}
                  onChange={(e) => setNewChatInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleCreateChat()}
                  disabled={isCreatingChat}
                />
                <Button
                  size="sm"
                  onClick={handleCreateChat}
                  disabled={!newChatInput.trim() || isCreatingChat}
                >
                  {isCreatingChat ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                </Button>
              </div>
            )}
          </div>
          
          <ScrollArea className="flex-1">
            {chatsLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : (
              <div className="divide-y">
                {chats.map((chat) => (
                  <div
                    key={chat.id}
                    className={`px-4 py-3 cursor-pointer hover:bg-accent transition-colors group ${
                      selectedChatId === chat.id ? "bg-accent" : ""
                    }`}
                    onClick={() => setSelectedChatId(chat.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">{chat.title}</div>
                        <div className="text-xs text-muted-foreground truncate">
                          {new Date(chat.last_message_at).toLocaleDateString()}
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => handleDeleteChat(chat.id, e)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>

        {/* Right: Chat Window */}
        <div className="flex-1 flex flex-col">
          {selectedChatId ? (
            <>
              <div className="p-4 border-b">
                <h3 className="font-semibold">
                  {chats.find(c => c.id === selectedChatId)?.title || "Chat"}
                </h3>
              </div>
              
              <ScrollArea className="flex-1 p-4">
                {messagesLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                ) : (
                  <div className="space-y-4">
                    {messages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex ${
                          message.role === "user" ? "justify-end" : "justify-start"
                        }`}
                      >
                        <Card
                          className={`max-w-[80%] p-3 ${
                            message.role === "user"
                              ? "bg-primary text-primary-foreground"
                              : "bg-secondary"
                          }`}
                        >
                          <div className="text-sm">{message.content}</div>
                          {message.createdAt && (
                            <div className="text-xs opacity-70 mt-1">
                              {new Date(message.createdAt).toLocaleTimeString()}
                            </div>
                          )}
                        </Card>
              </div>
            ))}
                    {isLoading && (
                      <div className="flex justify-start">
                        <Card className="bg-secondary p-3">
                          <Loader2 className="h-4 w-4 animate-spin" />
                        </Card>
                      </div>
                    )}
                  </div>
                )}
              </ScrollArea>

              <form onSubmit={handleChatSubmit} className="p-4 border-t">
                <div className="flex gap-2">
                  <Input
                    value={input}
                    onChange={handleInputChange}
                    placeholder="Type your message..."
                    disabled={isLoading}
                    className="flex-1"
                  />
                  <Button type="submit" disabled={!input.trim() || isLoading}>
                    {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  </Button>
                </div>
              </form>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <h3 className="text-lg font-semibold mb-2">Welcome to AdminFlow Chat</h3>
                <p className="text-muted-foreground mb-4">
                  Create a new conversation to get started with your AI assistant.
                </p>
                <div className="flex gap-2 max-w-md">
                  <Input
                    placeholder="What would you like to discuss?"
                    value={newChatInput}
                    onChange={(e) => setNewChatInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleCreateChat()}
                    disabled={isCreatingChat}
                  />
                  <Button
                    onClick={handleCreateChat}
                    disabled={!newChatInput.trim() || isCreatingChat}
                  >
                    {isCreatingChat ? <Loader2 className="h-4 w-4 animate-spin" /> : "Start Chat"}
                  </Button>
                </div>
          </div>
          </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
} 