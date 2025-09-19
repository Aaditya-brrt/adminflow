"use client";

import React, { useState, useEffect } from "react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useWorkflow } from "@/hooks/useWorkflows";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, Calendar, Mail, Clock, ArrowLeft, Save } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function WorkflowEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = React.use(params);
  const router = useRouter();
  const { toast } = useToast();
  
  const { workflow, loading, error } = useWorkflow(id);
  
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [automationType, setAutomationType] = useState<"schedule" | "trigger">("schedule");
  const [scheduleType, setScheduleType] = useState("day");
  const [scheduleTime, setScheduleTime] = useState("09:00");
  const [isSaving, setIsSaving] = useState(false);

  // Populate form when workflow loads
  useEffect(() => {
    if (workflow) {
      setTitle(workflow.name || "");
      setDescription(workflow.description || "");
      setAutomationType(workflow.type);
      
      if (workflow.schedule_config) {
        const config = workflow.schedule_config;
        if (config.type === "daily") {
          setScheduleType("day");
        } else if (config.type === "weekly") {
          setScheduleType("week");
        } else if (config.type === "interval") {
          setScheduleType("month");
        }
        setScheduleTime(config.time || "09:00");
      }
    }
  }, [workflow]);

  const handleSaveWorkflow = async () => {
    if (!title.trim()) {
      toast({
        title: "Error",
        description: "Please enter a workflow title.",
        variant: "destructive",
      });
      return;
    }

    if (!description.trim()) {
      toast({
        title: "Error",
        description: "Please enter a workflow description.",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);

    try {
      const updateData = {
        name: title.trim(),
        description: description.trim(),
        type: automationType,
        schedule_config: automationType === "schedule" ? {
          type: scheduleType === "day" ? "daily" : scheduleType === "week" ? "weekly" : "interval",
          time: scheduleTime,
          ...(scheduleType === "week" && { dayOfWeek: 1 })
        } : undefined,
        trigger_config: automationType === "trigger" ? {
          type: "event",
          conditions: []
        } : undefined,
      };

      const response = await fetch(`/api/workflows/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update workflow');
      }

      toast({
        title: "Success",
        description: "Workflow updated successfully!",
      });
      
      router.push(`/workflows/${id}`);
    } catch (error) {
      console.error('Error updating workflow:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update workflow.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  if (error || !workflow) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold mb-4">Workflow Not Found</h1>
          <p className="text-muted-foreground mb-6">
            {error || "The workflow you're looking for doesn't exist."}
          </p>
          <Button asChild>
            <Link href="/workflows">Back to Workflows</Link>
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto p-6">
        <Card className="border shadow-lg">
          {/* Header */}
          <CardHeader className="flex flex-row items-center justify-between">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" asChild>
                <Link href={`/workflows/${id}`}>
                  <ArrowLeft className="h-4 w-4" />
                </Link>
              </Button>
              <CardTitle className="text-2xl font-bold">Edit Workflow</CardTitle>
            </div>
          </CardHeader>

          <CardContent>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Main Content */}
              <div className="lg:col-span-2 space-y-6">
                {/* Title Input */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Title
                  </label>
                  <Input
                    placeholder="Enter workflow title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full"
                  />
                </div>

                {/* Description Input */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Prompt
                  </label>
                  <Textarea
                    placeholder="Enter the specific prompt/instructions for the AI..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full min-h-[120px] resize-none"
                  />
                </div>
              </div>

              {/* Right Sidebar */}
              <div className="space-y-6">
                {/* Automation Type */}
                <div>
                  <label className="block text-sm font-medium mb-3">
                    Automation Type
                  </label>
                  <div className="space-y-2">
                    <button
                      onClick={() => setAutomationType("schedule")}
                      className={`w-full flex items-center space-x-2 px-3 py-2 rounded-md transition-colors ${
                        automationType === "schedule"
                          ? "bg-primary text-primary-foreground"
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
                          ? "bg-primary text-primary-foreground"
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
                    <div className="flex items-center space-x-2 text-sm mb-3">
                      <Calendar className="h-4 w-4" />
                      <span>Run every {scheduleType} at {scheduleTime}</span>
                    </div>
                    <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                      <span>every</span>
                      <select 
                        className="bg-background border border-border rounded px-2 py-1"
                        value={scheduleType}
                        onChange={(e) => setScheduleType(e.target.value)}
                      >
                        <option value="day">day</option>
                        <option value="week">week</option>
                        <option value="month">month</option>
                      </select>
                      <span>at</span>
                      <Clock className="h-3 w-3" />
                      <input
                        type="time"
                        className="bg-background border border-border rounded px-2 py-1"
                        value={scheduleTime}
                        onChange={(e) => setScheduleTime(e.target.value)}
                      />
                    </div>
                  </div>
                )}

                {/* Trigger Details */}
                {automationType === "trigger" && (
                  <div className="bg-muted/50 rounded-lg p-4">
                    <div className="flex items-center space-x-2 text-sm mb-3">
                      <Mail className="h-4 w-4" />
                      <span>Event-based trigger</span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Trigger configuration is managed separately
                    </div>
                  </div>
                )}

                {/* Integrations */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Integrations
                  </label>
                  <div className="space-y-2">
                    {workflow.steps && workflow.steps.length > 0 ? (
                      workflow.steps.map((step, index) => (
                        <div key={index} className="flex items-center space-x-2 bg-muted rounded p-2">
                          <Mail className="h-4 w-4" />
                          <span className="text-sm capitalize">{step.service} ({step.type})</span>
                        </div>
                      ))
                    ) : (
                      <>
                        <div className="flex items-center space-x-2 bg-muted rounded p-2">
                          <Mail className="h-4 w-4" />
                          <span className="text-sm">Gmail (read)</span>
                        </div>
                        <div className="flex items-center space-x-2 bg-muted rounded p-2">
                          <Mail className="h-4 w-4" />
                          <span className="text-sm">Slack (write)</span>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end space-x-3 mt-8 pt-6 border-t">
              <Button variant="outline" asChild>
                <Link href={`/workflows/${id}`}>Cancel</Link>
              </Button>
              <Button onClick={handleSaveWorkflow} disabled={isSaving}>
                {isSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save Changes
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
} 