"use client";

import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Calendar, Mail, Clock, X } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { CreateWorkflowRequest } from "@/lib/service/workflow";

interface CreateWorkflowModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onWorkflowCreated: (workflow: any) => void;
}

export function CreateWorkflowModal({ open, onOpenChange, onWorkflowCreated }: CreateWorkflowModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [automationType, setAutomationType] = useState<"schedule" | "trigger">("schedule");
  const [scheduleType, setScheduleType] = useState("day");
  const [scheduleTime, setScheduleTime] = useState("09:00");
  const [isCreating, setIsCreating] = useState(false);
  const { toast } = useToast();

  const handleClose = () => {
    setTitle("");
    setDescription("");
    setAutomationType("schedule");
    setScheduleType("day");
    setScheduleTime("09:00");
    onOpenChange(false);
  };

  const handleCreateWorkflow = async () => {
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

    setIsCreating(true);

    try {
      const workflowData: CreateWorkflowRequest = {
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
        metadata: {},
        steps: [] // Start with empty steps - user can add them later
      };

      const response = await fetch('/api/workflows', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(workflowData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create workflow');
      }

      const workflow = await response.json();
      
      toast({
        title: "Success",
        description: "Workflow created successfully!",
      });
      
      onWorkflowCreated(workflow);
      handleClose();
    } catch (error) {
      console.error('Error creating workflow:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create workflow.",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="flex flex-row items-center justify-between">
          <DialogTitle className="text-2xl font-bold">Create New Workflow</DialogTitle>
          <Button variant="ghost" size="icon" onClick={handleClose}>
            <X className="h-4 w-4" />
          </Button>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
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
                  Configure triggers after creating the workflow
                </div>
              </div>
            )}

            {/* Integrations Preview */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Integrations
              </label>
              <div className="space-y-2">
                <div className="flex items-center space-x-2 bg-muted rounded p-2">
                  <Mail className="h-4 w-4" />
                  <span className="text-sm">Gmail (read)</span>
                </div>
                <div className="flex items-center space-x-2 bg-muted rounded p-2">
                  <Mail className="h-4 w-4" />
                  <span className="text-sm">Slack (write)</span>
                </div>
                <div className="text-xs text-muted-foreground px-2">
                  Add more integrations after creating the workflow
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end space-x-3 mt-8 pt-6 border-t">
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button onClick={handleCreateWorkflow} disabled={isCreating}>
            {isCreating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Creating...
              </>
            ) : (
              "Create Workflow"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
} 