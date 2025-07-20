"use client";

import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { useState } from "react";

const mockThreads = [
  { id: "1", name: "Sales Outreach Agent", last: "12 emails sent." },
  { id: "2", name: "Onboarding Agent", last: "Onboarding started." },
  { id: "3", name: "Ad-hoc: Q3 Plan", last: "Google Doc created." },
];

const mockMessages = [
  { id: 1, sender: "agent", text: "Hello! How can I help you today?", time: "2:10 PM" },
  { id: 2, sender: "user", text: "Summarize my inbox", time: "2:11 PM" },
  { id: 3, sender: "agent", text: "You have 5 unread emails.", time: "2:11 PM" },
];

export default function ChatClient() {
  const [selectedThread, setSelectedThread] = useState("1");
  
  return (
    <DashboardLayout>
      <div className="flex w-full h-[80vh] max-w-7xl mx-auto bg-background rounded-lg border shadow overflow-hidden">
        {/* Left: Thread List */}
        <div className="w-72 border-r bg-card flex flex-col">
          <div className="p-4 font-bold text-lg border-b">Conversations</div>
          <div className="flex-1 overflow-y-auto">
            {mockThreads.map((thread) => (
              <div
                key={thread.id}
                className={`px-4 py-3 cursor-pointer border-b hover:bg-accent transition-colors ${selectedThread === thread.id ? "bg-accent" : ""}`}
                onClick={() => setSelectedThread(thread.id)}
              >
                <div className="font-medium">{thread.name}</div>
                <div className="text-xs text-muted-foreground truncate">{thread.last}</div>
              </div>
            ))}
          </div>
        </div>
        {/* Right: Chat Window */}
        <div className="flex-1 flex flex-col">
          <div className="p-4 border-b font-semibold">Chat with Agent</div>
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {/* TODO: Render messages for selected thread */}
            {mockMessages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`rounded-lg px-4 py-2 ${msg.sender === "user" ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"}`}>{msg.text}</div>
                <span className="text-xs text-muted-foreground ml-2 self-end">{msg.time}</span>
              </div>
            ))}
          </div>
          <div className="p-4 border-t flex items-center gap-2">
            {/* TODO: File upload and voice dictation */}
            <button className="btn btn-ghost" title="Voice dictation (coming soon)">🎤</button>
            <button className="btn btn-ghost" title="Upload file (coming soon)">📎</button>
            <input className="input input-bordered flex-1" placeholder="Type a message..." />
            <button className="btn btn-primary">➤</button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
} 