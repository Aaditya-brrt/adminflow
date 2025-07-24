"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Mail, X } from "lucide-react";

export default function WorkflowDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = React.use(params);
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [prompt, setPrompt] = useState("");
  const [automationType, setAutomationType] = useState("schedule");
  const [scheduleFrequency, setScheduleFrequency] = useState("every");
  const [scheduleInterval, setScheduleInterval] = useState("day");
  const [scheduleTime, setScheduleTime] = useState("09:00");

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Create New Workflow</h1>
          <Button variant="ghost" size="icon" onClick={() => router.push("/workflows")}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Title Section */}
            <div>
              <label className="block text-sm font-medium mb-2">Title</label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter workflow title"
                className="w-full"
              />
            </div>

            {/* Prompt Section - Now Much Larger */}
            <div>
              <label className="block text-sm font-medium mb-2">Prompt</label>
              <Textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Enter the specific prompt/instructions for the AI..."
                className="w-full min-h-[300px] resize-none"
              />
            </div>

            {/* Integrations Section */}
            <div>
              <h3 className="font-semibold mb-3">Connected Services</h3>
              <div className="flex gap-2 mb-4">
                <Badge variant="secondary" className="flex items-center gap-1">
                  <Mail className="h-3 w-3" />
                  Gmail (read)
                </Badge>
                <Badge variant="secondary" className="flex items-center gap-1">
                  Slack (write)
                </Badge>
                <Button variant="outline" size="sm">
                  + Add Integration
                </Button>
              </div>
            </div>

            {/* Execution Schema & Debug */}
            <section>
              <h3 className="font-semibold mb-3">Execution Schema & Debug</h3>
              <Card>
                <CardContent className="p-4">
                  <p className="text-muted-foreground">(Step breakdown placeholder)</p>
                </CardContent>
              </Card>
              <Card className="mt-2">
                <CardContent className="p-4">
                  <p className="text-muted-foreground">(Logs & run history placeholder)</p>
                </CardContent>
              </Card>
            </section>

            {/* Collaboration Settings */}
            <section>
              <h3 className="font-semibold mb-3">Collaboration Settings</h3>
              <Card>
                <CardContent className="p-4">
                  <p className="text-muted-foreground">(Linked workflows/permissions placeholder)</p>
                </CardContent>
              </Card>
            </section>
          </div>

          {/* Right Column - Automation Type */}
          <div className="lg:col-span-1">
            <Card className="sticky top-6">
              <CardContent className="p-6">
                <h3 className="font-semibold mb-4">Automation Type</h3>
                
                {/* Automation Type Tabs */}
                <div className="flex mb-4 bg-muted rounded-lg p-1">
                  <button
                    onClick={() => setAutomationType("schedule")}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-md text-sm transition-colors ${
                      automationType === "schedule"
                        ? "bg-background shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <Calendar className="h-4 w-4" />
                    Schedule-based
                  </button>
                  <button
                    onClick={() => setAutomationType("trigger")}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-md text-sm transition-colors ${
                      automationType === "trigger"
                        ? "bg-background shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <Mail className="h-4 w-4" />
                    Trigger-based
                  </button>
                </div>

                {/* Schedule Configuration */}
                {automationType === "schedule" && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="h-4 w-4" />
                      <span>Run</span>
                      <Select value={scheduleFrequency} onValueChange={setScheduleFrequency}>
                        <SelectTrigger className="w-20">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="every">every</SelectItem>
                          <SelectItem value="once">once</SelectItem>
                        </SelectContent>
                      </Select>
                      <Select value={scheduleInterval} onValueChange={setScheduleInterval}>
                        <SelectTrigger className="w-20">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="day">day</SelectItem>
                          <SelectItem value="week">week</SelectItem>
                          <SelectItem value="month">month</SelectItem>
                        </SelectContent>
                      </Select>
                      <span>at</span>
                      <Input
                        type="time"
                        value={scheduleTime}
                        onChange={(e) => setScheduleTime(e.target.value)}
                        className="w-24"
                      />
                    </div>
                  </div>
                )}

                {/* Trigger Configuration */}
                {automationType === "trigger" && (
                  <div className="space-y-4">
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select trigger type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="email">New Email</SelectItem>
                        <SelectItem value="webhook">Webhook</SelectItem>
                        <SelectItem value="crm">Upserted CRM Record</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-2 mt-8">
                  <Button variant="outline" className="flex-1">
                    Cancel
                  </Button>
                  <Button className="flex-1">
                    Create Workflow
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Bottom Action Bar - Alternative to sidebar buttons */}
        <div className="flex gap-2 mt-8 pt-6 border-t">
          <Button variant="outline">Save Draft</Button>
          <Button variant="secondary">Test Run</Button>
          <Button>Publish</Button>
        </div>
      </div>
    </DashboardLayout>
  );
}