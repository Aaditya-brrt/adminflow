"use client";

import React, { useState } from "react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Calendar, Clock, Mail, Zap } from "lucide-react";

export default function WorkflowDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = React.use(params);
  const [title, setTitle] = useState("");
  const [prompt, setPrompt] = useState("");
  const [automationType, setAutomationType] = useState<"schedule" | "trigger">("schedule");

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto p-6">
        <div className="bg-card border border-border rounded-lg p-6 shadow-lg">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold text-foreground">Create New Workflow</h1>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <span className="sr-only">Close</span>
              ×
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Title Input */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Title
                </label>
                <Input
                  placeholder="Enter workflow title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full"
                />
              </div>

              {/* Prompt Input */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Prompt
                </label>
                <Textarea
                  placeholder="Enter the specific prompt/instructions for the AI..."
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  className="w-full min-h-[120px] resize-none"
                />
              </div>
            </div>

            {/* Right Sidebar */}
            <div className="space-y-6">
              {/* Automation Type */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-3">
                  Automation Type
                </label>
                <div className="space-y-2">
                  <button
                    onClick={() => setAutomationType("schedule")}
                    className={`w-full flex items-center space-x-2 px-3 py-2 rounded-md transition-colors ${
                      automationType === "schedule"
                        ? "bg-primary text-primary-foreground border-b-2 border-primary-foreground"
                        : "bg-muted text-muted-foreground hover:bg-accent"
                    }`}
                  >
                    <Calendar className="h-4 w-4" />
                    <span>Schedule-based</span>
                  </button>
                  <button
                    onClick={() => setAutomationType("trigger")}
                    className={`w-full flex items-center space-x-2 px-3 py-2 rounded-md transition-colors ${
                      automationType === "trigger"
                        ? "bg-primary text-primary-foreground border-b-2 border-primary-foreground"
                        : "bg-muted text-muted-foreground hover:bg-accent"
                    }`}
                  >
                    <Mail className="h-4 w-4" />
                    <span>Trigger-based</span>
                  </button>
                </div>
              </div>

              {/* Schedule Details */}
              {automationType === "schedule" && (
                <div className="bg-muted/50 rounded-lg p-4">
                  <div className="flex items-center space-x-2 text-sm">
                    <Calendar className="h-4 w-4" />
                    <span>Run every day at 09:00 AM</span>
                  </div>
                  <div className="mt-2 flex items-center space-x-2 text-xs text-muted-foreground">
                    <span>every</span>
                    <select className="bg-background border border-border rounded px-2 py-1">
                      <option>day</option>
                      <option>week</option>
                      <option>month</option>
                    </select>
                    <span>at</span>
                    <Clock className="h-3 w-3" />
                    <span>09:00 AM</span>
                  </div>
                </div>
              )}

              {/* Integrations */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Integrations
                </label>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2 bg-muted rounded p-2">
                    <Mail className="h-4 w-4" />
                    <span className="text-sm">Gmail (read)</span>
                  </div>
                  <div className="flex items-center space-x-2 bg-muted rounded p-2">
                    <Zap className="h-4 w-4" />
                    <span className="text-sm">Slack (write)</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 mt-8 pt-6 border-t border-border">
            <Button variant="outline">Cancel</Button>
            <Button>Create Workflow</Button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}