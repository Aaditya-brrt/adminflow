"use client";

import React, { useState } from "react";
import { Bell, Calendar, Mail, Menu, Settings, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import AIAssistant from "./AIAssistant";
import InformationPanel from "./InformationPanel";
import WorkflowBuilder from "./WorkflowBuilder";
import Link from "next/link";

interface DashboardLayoutProps {
  children?: React.ReactNode;
}

export default function DashboardLayout({
  children,
}: DashboardLayoutProps = {}) {
  // Mock user data
  const user = {
    name: "John Doe",
    email: "john.doe@example.com",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=john",
  };

  // Mock notification count
  const notificationCount = 3;

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <div className={`w-64 bg-card border-r border-border transition-all duration-300 flex flex-col`}>
        <div className="p-4 flex items-center justify-between">
          <div className="flex items-center">
            <div className="h-8 w-8 rounded-md bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold">A</span>
            </div>
            <span className="ml-2 font-bold text-lg">AdminFlow</span>
          </div>
        </div>
        <Separator />
        <nav className="flex-1 p-4">
          <ul className="space-y-2">
            <li>
              <Link href="/dashboard" className="block w-full px-4 py-2 rounded hover:bg-accent transition-colors font-medium">
                Dashboard
              </Link>
            </li>
            <li>
              <Link href="/workflows" className="block w-full px-4 py-2 rounded hover:bg-accent transition-colors font-medium">
                Workflows
              </Link>
            </li>
            <li>
              <Link href="/chat" className="block w-full px-4 py-2 rounded hover:bg-accent transition-colors font-medium">
                Chat
              </Link>
            </li>
          </ul>
        </nav>
        <div className="p-4 mt-auto">
          <div className="flex items-center">
            <Avatar>
              <AvatarImage src={user.avatar} alt={user.name} />
              <AvatarFallback>JD</AvatarFallback>
            </Avatar>
            <div className="ml-2 overflow-hidden">
              <p className="text-sm font-medium truncate">{user.name}</p>
              <p className="text-xs text-muted-foreground truncate">{user.email}</p>
            </div>
          </div>
        </div>
      </div>
      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="h-16 border-b border-border flex items-center justify-between px-6">
          <h1 className="text-xl font-semibold">AdminFlow</h1>
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="icon" className="relative">
              <Bell size={18} />
              <span className="absolute top-0 right-0 h-4 w-4 bg-destructive text-destructive-foreground text-xs rounded-full flex items-center justify-center">3</span>
            </Button>
            <Button variant="outline">Connect Services</Button>
          </div>
        </header>
        {/* Main dashboard content */}
        <main className="flex-1 overflow-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
