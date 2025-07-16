"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
  PlusCircle,
  Settings,
  Bell,
  Calendar,
  Mail,
  CheckSquare,
} from "lucide-react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import AIAssistant from "@/components/dashboard/AIAssistant";
import InformationPanel from "@/components/dashboard/InformationPanel";
import WorkflowBuilder from "@/components/dashboard/WorkflowBuilder";

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState("overview");

  // Mock data for demonstration purposes
  const calendarEvents = [
    { id: 1, title: "Team Standup", time: "9:00 AM", duration: "30m" },
    { id: 2, title: "Client Meeting", time: "11:00 AM", duration: "1h" },
    { id: 3, title: "Product Review", time: "2:00 PM", duration: "45m" },
    { id: 4, title: "Weekly Planning", time: "4:00 PM", duration: "1h" },
  ];

  const tasks = [
    {
      id: 1,
      title: "Prepare presentation slides",
      priority: "High",
      dueDate: "Today",
    },
    {
      id: 2,
      title: "Review quarterly report",
      priority: "Medium",
      dueDate: "Tomorrow",
    },
    {
      id: 3,
      title: "Send follow-up emails",
      priority: "Low",
      dueDate: "Friday",
    },
    {
      id: 4,
      title: "Update project timeline",
      priority: "High",
      dueDate: "Today",
    },
  ];

  const emails = [
    {
      id: 1,
      sender: "John Smith",
      subject: "Project Update",
      time: "8:45 AM",
      unread: true,
    },
    {
      id: 2,
      sender: "Sarah Johnson",
      subject: "Meeting Agenda",
      time: "10:12 AM",
      unread: false,
    },
    {
      id: 3,
      sender: "Michael Brown",
      subject: "Contract Review",
      time: "11:30 AM",
      unread: true,
    },
    {
      id: 4,
      sender: "Emily Davis",
      subject: "Weekly Report",
      time: "1:15 PM",
      unread: false,
    },
  ];

  const notifications = [
    {
      id: 1,
      source: "Slack",
      message: "New message in #general",
      time: "5m ago",
    },
    {
      id: 2,
      source: "Notion",
      message: "Document shared with you",
      time: "15m ago",
    },
    { id: 3, source: "Gmail", message: "3 new emails", time: "30m ago" },
    {
      id: 4,
      source: "Calendar",
      message: "Meeting starting in 10 minutes",
      time: "Just now",
    },
  ];

  return (
    <DashboardLayout>
      <div className="flex flex-col lg:flex-row w-full h-full gap-4 p-4 bg-background">
        {/* Main content area - Information panels */}
        <div className="flex-1 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold">AdminFlow Dashboard</h1>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon">
                <Bell className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon">
                <Settings className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <Tabs
            defaultValue="overview"
            className="w-full"
            onValueChange={setActiveTab}
          >
            <TabsList className="grid grid-cols-3 w-[400px]">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="workflows">Workflows</TabsTrigger>
              <TabsTrigger value="integrations">Integrations</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4 mt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Calendar Events Panel */}
                <InformationPanel
                  title="Calendar Events"
                  items={calendarEvents.map(event => ({
                    id: event.id.toString(),
                    title: event.title,
                    time: event.time,
                    date: undefined,
                    status: undefined,
                    source: undefined,
                    type: "calendar"
                  }))}
                  type="calendar"
                />

                {/* Tasks Panel */}
                <InformationPanel
                  title="Tasks"
                  items={tasks.map(task => ({
                    id: task.id.toString(),
                    title: task.title,
                    description: undefined,
                    date: undefined,
                    time: undefined,
                    status: task.priority === "High" ? "urgent" : (task.priority === "Medium" ? "pending" : "info"),
                    source: undefined,
                    type: "task"
                  }))}
                  type="task"
                />

                {/* Emails Panel */}
                <InformationPanel
                  title="Recent Emails"
                  items={emails.map(email => ({
                    id: email.id.toString(),
                    title: email.subject,
                    description: `From: ${email.sender}`,
                    date: undefined,
                    time: email.time,
                    status: email.unread ? "pending" : "completed",
                    source: undefined,
                    type: "email"
                  }))}
                  type="email"
                />

                {/* Notifications Panel */}
                <InformationPanel
                  title="Notifications"
                  items={notifications.map(notification => ({
                    id: notification.id.toString(),
                    title: notification.message,
                    description: undefined,
                    date: undefined,
                    time: notification.time,
                    status: undefined,
                    source: notification.source,
                    type: "notification"
                  }))}
                  type="notification"
                />
              </div>
            </TabsContent>

            <TabsContent value="workflows" className="mt-4">
              <WorkflowBuilder />
            </TabsContent>

            <TabsContent value="integrations" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Connected Services</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[
                      "Gmail",
                      "Google Calendar",
                      "Slack",
                      "Notion",
                      "Outlook",
                    ].map((service) => (
                      <Card
                        key={service}
                        className="p-4 flex items-center justify-between"
                      >
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                            {service.charAt(0)}
                          </div>
                          <span>{service}</span>
                        </div>
                        <Button variant="outline" size="sm">
                          Configure
                        </Button>
                      </Card>
                    ))}
                    <Card className="p-4 flex items-center justify-center border-dashed cursor-pointer hover:bg-accent/50 transition-colors">
                      <PlusCircle className="mr-2 h-4 w-4" />
                      <span>Add New Integration</span>
                    </Card>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* AI Assistant sidebar */}
        <div className="w-full lg:w-[400px] flex-shrink-0">
          <AIAssistant />
        </div>
      </div>
    </DashboardLayout>
  );
}
