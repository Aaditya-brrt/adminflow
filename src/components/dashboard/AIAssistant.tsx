"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Send, Mic, Bot, Clock, Loader2, MessageSquare } from "lucide-react";
import { useChat } from "@ai-sdk/react";
import { useChats } from "@/hooks/useChats";
import { useToast } from "@/components/ui/use-toast";
import { chatService } from "@/lib/service/chat";

interface SuggestionChip {
  id: string;
  text: string;
}

interface AIAssistantProps {
  className?: string;
}

const AIAssistant = ({ className = "" }: AIAssistantProps) => {
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<SuggestionChip[]>([
    { id: "1", text: "Check my Gmail inbox" },
    { id: "2", text: "Create a calendar event" },
    { id: "3", text: "List my GitHub repositories" },
    { id: "4", text: "Send a Slack message" },
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { createChat } = useChats();
  const { toast } = useToast();

  const { messages, input, handleInputChange, handleSubmit, isLoading, setInput } = useChat({
    id: currentChatId || undefined,
    body: {
      chatId: currentChatId,
    },
    onFinish: async (message) => {
      console.log('AI Assistant response finished:', message);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Scroll to bottom of messages when new messages are added
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!input.trim() || isLoading) return;

    // If no chat exists, create one
    if (!currentChatId) {
      const title = `Quick Chat: ${chatService.generateChatTitle(input)}`;
      const newChat = await createChat(title, { isQuickChat: true });
      
      if (newChat) {
        setCurrentChatId(newChat.id);
        // Save user message to database
        try {
          await fetch(`/api/chats/${newChat.id}/messages`, {
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
      }
    } else {
      // Save user message to database for existing chat
      try {
        await fetch(`/api/chats/${currentChatId}/messages`, {
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
    }

    // Update suggestions based on input
    updateSuggestions(input);
    
    // Submit to AI
    handleSubmit(e);
  };

  const handleSuggestionClick = (suggestion: string) => {
    setInput(suggestion);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(e as any);
    }
  };

  const handleNewChat = () => {
    setCurrentChatId(null);
    // The useChat hook will reset when id changes
  };

  // Update suggestion chips based on conversation context
  const updateSuggestions = (inputText: string) => {
    const lowerInput = inputText.toLowerCase();

    if (lowerInput.includes("gmail") || lowerInput.includes("email")) {
      setSuggestions([
        { id: "1", text: "Check unread emails" },
        { id: "2", text: "Send an email" },
        { id: "3", text: "Search my emails" },
      ]);
    } else if (lowerInput.includes("calendar") || lowerInput.includes("meeting")) {
      setSuggestions([
        { id: "1", text: "Schedule a meeting" },
        { id: "2", text: "Check my calendar" },
        { id: "3", text: "Find available time slots" },
      ]);
    } else if (lowerInput.includes("github") || lowerInput.includes("repository")) {
      setSuggestions([
        { id: "1", text: "List my repositories" },
        { id: "2", text: "Check recent commits" },
        { id: "3", text: "Create a new issue" },
      ]);
    } else if (lowerInput.includes("slack")) {
      setSuggestions([
        { id: "1", text: "Send a message" },
        { id: "2", text: "Check team channels" },
        { id: "3", text: "Set my status" },
      ]);
    } else {
      setSuggestions([
        { id: "1", text: "Check my Gmail inbox" },
        { id: "2", text: "Create a calendar event" },
        { id: "3", text: "List my GitHub repositories" },
        { id: "4", text: "Send a Slack message" },
      ]);
    }
  };

  const formatTime = (date: Date): string => {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  // Show welcome message if no messages
  const displayMessages = messages.length > 0 ? messages : [
    {
      id: "welcome",
      role: "assistant" as const,
      content: "Hello! I'm your AdminFlow assistant. I can help you with your connected tools and services. What would you like to do today?",
      createdAt: new Date(),
    }
  ];

  return (
    <Card className={`flex flex-col h-full bg-background ${className}`}>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between text-lg font-semibold">
          <div className="flex items-center">
          <Bot className="mr-2 h-5 w-5" />
          AI Assistant
          </div>
          {currentChatId && (
            <Button
              size="sm"
              variant="ghost"
              onClick={handleNewChat}
              className="h-6 w-6 p-0"
            >
              <MessageSquare className="h-4 w-4" />
            </Button>
          )}
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          Quick access to your connected tools
        </p>
      </CardHeader>

      <CardContent className="flex-grow p-0 overflow-hidden">
        <ScrollArea className="h-[calc(100%-2rem)] px-4">
          <div className="flex flex-col space-y-4 py-4">
            {displayMessages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`flex items-start max-w-[80%] ${message.role === "user" ? "flex-row-reverse" : ""}`}
                >
                  <Avatar className="h-8 w-8 mt-1 mx-2">
                    {message.role === "assistant" ? (
                      <AvatarImage
                        src="https://api.dicebear.com/7.x/bottts/svg?seed=adminflow"
                        alt="AI"
                      />
                    ) : (
                      <AvatarImage
                        src="https://api.dicebear.com/7.x/avataaars/svg?seed=user"
                        alt="User"
                      />
                    )}
                    <AvatarFallback>
                      {message.role === "assistant" ? "AI" : "U"}
                    </AvatarFallback>
                  </Avatar>

                  <div>
                    <div
                      className={`rounded-lg px-4 py-2 ${
                        message.role === "assistant"
                          ? "bg-secondary text-secondary-foreground"
                          : "bg-primary text-primary-foreground"
                      }`}
                    >
                      {message.content}
                    </div>
                    {message.createdAt && (
                    <div className="text-xs text-muted-foreground mt-1 flex items-center">
                      <Clock className="h-3 w-3 mr-1" />
                        {formatTime(new Date(message.createdAt))}
                    </div>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex justify-start">
                <div className="flex items-start max-w-[80%]">
                  <Avatar className="h-8 w-8 mt-1 mx-2">
                    <AvatarImage
                      src="https://api.dicebear.com/7.x/bottts/svg?seed=adminflow"
                      alt="AI"
                    />
                    <AvatarFallback>AI</AvatarFallback>
                  </Avatar>

                  <div className="rounded-lg px-4 py-2 bg-secondary text-secondary-foreground">
                    <div className="flex items-center">
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Thinking...
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>
      </CardContent>

      <div className="px-4 py-2">
        <div className="flex flex-wrap gap-2 mb-2">
          {suggestions.map((suggestion) => (
            <Badge
              key={suggestion.id}
              variant="outline"
              className="cursor-pointer hover:bg-secondary transition-colors text-xs"
              onClick={() => handleSuggestionClick(suggestion.text)}
            >
              {suggestion.text}
            </Badge>
          ))}
        </div>
      </div>

      <CardFooter className="pt-0">
        <form onSubmit={handleSendMessage} className="flex w-full items-center space-x-2">
          <Input
            placeholder="Ask me anything..."
            value={input}
            onChange={handleInputChange}
            onKeyDown={handleKeyPress}
            disabled={isLoading}
            className="flex-grow"
          />
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button size="icon" variant="ghost" disabled={true}>
                  <Mic className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Voice input (coming soon)</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <Button
            size="icon"
            type="submit"
            disabled={!input.trim() || isLoading}
          >
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </form>
      </CardFooter>
    </Card>
  );
};

export default AIAssistant;
