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
import { Send, Mic, Bot, User, Clock, Loader2 } from "lucide-react";

interface Message {
  id: string;
  content: string;
  sender: "user" | "assistant";
  timestamp: Date;
}

interface SuggestionChip {
  id: string;
  text: string;
}

interface AIAssistantProps {
  className?: string;
}

const AIAssistant = ({ className = "" }: AIAssistantProps) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      content: "Hello! I'm your AdminFlow assistant. How can I help you today?",
      sender: "assistant",
      timestamp: new Date(),
    },
  ]);

  const [inputValue, setInputValue] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [suggestions, setSuggestions] = useState<SuggestionChip[]>([
    { id: "1", text: "Summarize my inbox" },
    { id: "2", text: "Schedule a meeting" },
    { id: "3", text: "Create a task" },
    { id: "4", text: "Reschedule my 2pm meeting" },
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom of messages when new messages are added
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isProcessing) return;

    // Add user message to chat
    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputValue,
      sender: "user",
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setIsProcessing(true);

    // Simulate AI response (in a real app, this would call your AI service)
    setTimeout(() => {
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: getSimulatedResponse(inputValue),
        sender: "assistant",
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
      setIsProcessing(false);

      // Update suggestions based on the conversation context
      updateSuggestions(inputValue);
    }, 1500);
  };

  const handleSuggestionClick = (suggestion: string) => {
    setInputValue(suggestion);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Simulate AI responses based on user input
  const getSimulatedResponse = (input: string): string => {
    const lowerInput = input.toLowerCase();

    if (lowerInput.includes("summarize") && lowerInput.includes("inbox")) {
      return "I've analyzed your inbox. You have 12 unread emails: 3 high priority from your team, 5 client inquiries, and 4 newsletters. Would you like me to draft responses to any of these?";
    } else if (
      lowerInput.includes("schedule") &&
      lowerInput.includes("meeting")
    ) {
      return "I can help schedule a meeting. What's the purpose, who should attend, and when would you prefer to have it?";
    } else if (lowerInput.includes("create") && lowerInput.includes("task")) {
      return "I've created a new task. Could you provide more details like deadline, priority, and any related documents?";
    } else if (
      lowerInput.includes("reschedule") &&
      lowerInput.includes("2pm")
    ) {
      return "I've checked your calendar. Would you like to reschedule your 2pm 'Project Review' meeting to 4pm today or 10am tomorrow? I can notify all participants.";
    } else {
      return "I understand you need assistance with that. Could you provide more details so I can help you more effectively?";
    }
  };

  // Update suggestion chips based on conversation context
  const updateSuggestions = (input: string) => {
    const lowerInput = input.toLowerCase();

    if (lowerInput.includes("inbox") || lowerInput.includes("email")) {
      setSuggestions([
        { id: "1", text: "Draft responses to high priority emails" },
        { id: "2", text: "Archive newsletters" },
        { id: "3", text: "Flag client inquiries" },
      ]);
    } else if (
      lowerInput.includes("meeting") ||
      lowerInput.includes("schedule")
    ) {
      setSuggestions([
        { id: "1", text: "Schedule for 3pm today" },
        { id: "2", text: "Schedule for tomorrow morning" },
        { id: "3", text: "Send meeting agenda template" },
      ]);
    } else if (lowerInput.includes("task")) {
      setSuggestions([
        { id: "1", text: "Set high priority" },
        { id: "2", text: "Due by end of week" },
        { id: "3", text: "Assign to team member" },
      ]);
    } else {
      setSuggestions([
        { id: "1", text: "Summarize my inbox" },
        { id: "2", text: "Schedule a meeting" },
        { id: "3", text: "Create a task" },
        { id: "4", text: "Reschedule my 2pm meeting" },
      ]);
    }
  };

  const formatTime = (date: Date): string => {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <Card className={`flex flex-col h-full bg-background ${className}`}>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center text-lg font-semibold">
          <Bot className="mr-2 h-5 w-5" />
          AI Assistant
        </CardTitle>
      </CardHeader>

      <CardContent className="flex-grow p-0 overflow-hidden">
        <ScrollArea className="h-[calc(100%-2rem)] px-4">
          <div className="flex flex-col space-y-4 py-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.sender === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`flex items-start max-w-[80%] ${message.sender === "user" ? "flex-row-reverse" : ""}`}
                >
                  <Avatar className="h-8 w-8 mt-1 mx-2">
                    {message.sender === "assistant" ? (
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
                      {message.sender === "assistant" ? "AI" : "U"}
                    </AvatarFallback>
                  </Avatar>

                  <div>
                    <div
                      className={`rounded-lg px-4 py-2 ${
                        message.sender === "assistant"
                          ? "bg-secondary text-secondary-foreground"
                          : "bg-primary text-primary-foreground"
                      }`}
                    >
                      {message.content}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1 flex items-center">
                      <Clock className="h-3 w-3 mr-1" />
                      {formatTime(message.timestamp)}
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {isProcessing && (
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
                      Processing...
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
              className="cursor-pointer hover:bg-secondary transition-colors"
              onClick={() => handleSuggestionClick(suggestion.text)}
            >
              {suggestion.text}
            </Badge>
          ))}
        </div>
      </div>

      <CardFooter className="pt-0">
        <div className="flex w-full items-center space-x-2">
          <Input
            placeholder="Type a command or question..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyPress}
            disabled={isProcessing}
            className="flex-grow"
          />
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button size="icon" variant="ghost" disabled={isProcessing}>
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
            onClick={handleSendMessage}
            disabled={!inputValue.trim() || isProcessing}
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
};

export default AIAssistant;
