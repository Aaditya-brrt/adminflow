"use client";

import React, { useState } from "react";
import { Bell, Calendar, Mail, Menu, Settings, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import AIAssistant from "./AIAssistant";
import InformationPanel from "./InformationPanel";
import WorkflowBuilder from "./WorkflowBuilder";

interface DashboardLayoutProps {
  children?: React.ReactNode;
}

export default function DashboardLayout({
  children,
}: DashboardLayoutProps = {}) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState("dashboard");

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
      <div
        className={`${sidebarOpen ? "w-64" : "w-20"} bg-card border-r border-border transition-all duration-300 flex flex-col`}
      >
        <div className="p-4 flex items-center justify-between">
          <div
            className={`flex items-center ${!sidebarOpen && "justify-center w-full"}`}
          >
            <div className="h-8 w-8 rounded-md bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold">A</span>
            </div>
            {sidebarOpen && (
              <span className="ml-2 font-bold text-lg">AdminFlow</span>
            )}
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className={!sidebarOpen ? "hidden" : ""}
          >
            <Menu size={18} />
          </Button>
        </div>

        <Separator />

        <nav className="flex-1 p-4">
          <ul className="space-y-2">
            <li>
              <Button
                variant={activeTab === "dashboard" ? "secondary" : "ghost"}
                className={`w-full justify-${sidebarOpen ? "start" : "center"}`}
                onClick={() => setActiveTab("dashboard")}
              >
                <Calendar size={18} />
                {sidebarOpen && <span className="ml-2">Dashboard</span>}
              </Button>
            </li>
            <li>
              <Button
                variant={activeTab === "emails" ? "secondary" : "ghost"}
                className={`w-full justify-${sidebarOpen ? "start" : "center"}`}
                onClick={() => setActiveTab("emails")}
              >
                <Mail size={18} />
                {sidebarOpen && <span className="ml-2">Emails</span>}
              </Button>
            </li>
            <li>
              <Button
                variant={activeTab === "workflows" ? "secondary" : "ghost"}
                className={`w-full justify-${sidebarOpen ? "start" : "center"}`}
                onClick={() => setActiveTab("workflows")}
              >
                <Settings size={18} />
                {sidebarOpen && <span className="ml-2">Workflows</span>}
              </Button>
            </li>
          </ul>
        </nav>

        <div className="p-4 mt-auto">
          <div
            className={`flex ${sidebarOpen ? "items-center" : "flex-col items-center"}`}
          >
            <Avatar>
              <AvatarImage src={user.avatar} alt={user.name} />
              <AvatarFallback>JD</AvatarFallback>
            </Avatar>
            {sidebarOpen && (
              <div className="ml-2 overflow-hidden">
                <p className="text-sm font-medium truncate">{user.name}</p>
                <p className="text-xs text-muted-foreground truncate">
                  {user.email}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="h-16 border-b border-border flex items-center justify-between px-6">
          <div className="flex items-center">
            {!sidebarOpen && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSidebarOpen(true)}
                className="mr-4"
              >
                <Menu size={18} />
              </Button>
            )}
            <h1 className="text-xl font-semibold">
              {activeTab === "dashboard" && "Dashboard"}
              {activeTab === "emails" && "Email Management"}
              {activeTab === "workflows" && "Workflow Builder"}
            </h1>
          </div>

          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="icon" className="relative">
              <Bell size={18} />
              {notificationCount > 0 && (
                <span className="absolute top-0 right-0 h-4 w-4 bg-destructive text-destructive-foreground text-xs rounded-full flex items-center justify-center">
                  {notificationCount}
                </span>
              )}
            </Button>
            <Button variant="outline">Connect Services</Button>
          </div>
        </header>

        {/* Main dashboard content */}
        <main className="flex-1 overflow-auto p-6">
          <div className="flex flex-col lg:flex-row gap-6 h-full">
            {/* Left side - Information panels */}
            <div className="flex-1 space-y-6 overflow-auto">
              {activeTab === "dashboard" && (
                <>
                  <InformationPanel
                    title="Calendar Events"
                    type="calendar"
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <InformationPanel title="Tasks" type="task" />
                    <InformationPanel
                      title="Email Summary"
                      type="email"
                    />
                  </div>

                  <InformationPanel
                    title="Notifications"
                    type="notification"
                  />
                </>
              )}

              {activeTab === "emails" && (
                <InformationPanel
                  title="Email Management"
                  type="email"
                />
              )}

              {activeTab === "workflows" && <WorkflowBuilder />}
            </div>

            {/* Right side - AI Assistant */}
            <div className="w-full lg:w-96 bg-card rounded-lg border border-border overflow-hidden flex flex-col">
              <AIAssistant />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
