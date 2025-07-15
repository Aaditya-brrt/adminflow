"use client";

import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  PlusCircle,
  ArrowRight,
  Save,
  Play,
  Pause,
  Trash2,
  Settings,
  ChevronDown,
} from "lucide-react";

interface WorkflowStep {
  id: string;
  type: "trigger" | "action";
  service: string;
  event: string;
  description: string;
  config?: Record<string, any>;
}

interface Workflow {
  id: string;
  name: string;
  description: string;
  active: boolean;
  steps: WorkflowStep[];
}

const WorkflowBuilder = () => {
  const [activeTab, setActiveTab] = useState("templates");
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [workflows, setWorkflows] = useState<Workflow[]>([
    {
      id: "1",
      name: "Email to Notion",
      description: "When I receive an important email, create a task in Notion",
      active: true,
      steps: [
        {
          id: "t1",
          type: "trigger",
          service: "Gmail",
          event: "New Important Email",
          description: "When a new email is marked as important",
        },
        {
          id: "a1",
          type: "action",
          service: "Notion",
          event: "Create Task",
          description: "Create a new task in Notion",
        },
      ],
    },
    {
      id: "2",
      name: "Meeting Follow-up",
      description:
        "After a calendar meeting, send follow-up emails and create tasks",
      active: false,
      steps: [
        {
          id: "t2",
          type: "trigger",
          service: "Google Calendar",
          event: "Meeting Ended",
          description: "When a calendar meeting ends",
        },
        {
          id: "a2",
          type: "action",
          service: "Gmail",
          event: "Send Email",
          description: "Send follow-up email to attendees",
        },
        {
          id: "a3",
          type: "action",
          service: "Notion",
          event: "Create Tasks",
          description: "Create follow-up tasks in Notion",
        },
      ],
    },
  ]);

  const [workflowTemplates] = useState([
    {
      id: "template1",
      name: "Email to Task",
      description: "Convert important emails into tasks automatically",
      services: ["Gmail", "Notion"],
      popularity: "Popular",
    },
    {
      id: "template2",
      name: "Meeting Notes",
      description: "Automatically create and distribute meeting notes",
      services: ["Google Calendar", "Notion", "Slack"],
      popularity: "Trending",
    },
    {
      id: "template3",
      name: "Contract Processing",
      description:
        "When receiving signed contracts, notify team and store documents",
      services: ["Gmail", "Google Drive", "Slack"],
      popularity: "New",
    },
    {
      id: "template4",
      name: "Invoice Tracking",
      description: "Track invoices and payment status automatically",
      services: ["Gmail", "Notion", "Slack"],
      popularity: "Popular",
    },
  ]);

  const [currentWorkflow, setCurrentWorkflow] = useState<Workflow | null>(null);

  const handleTemplateSelect = (templateId: string) => {
    setSelectedTemplate(templateId);
    // In a real app, this would load the template configuration
  };

  const handleWorkflowSelect = (workflow: Workflow) => {
    setCurrentWorkflow(workflow);
    setActiveTab("editor");
  };

  const handleCreateFromTemplate = () => {
    if (!selectedTemplate) return;

    const template = workflowTemplates.find((t) => t.id === selectedTemplate);
    if (!template) return;

    // Create a new workflow based on the template
    const newWorkflow: Workflow = {
      id: `new-${Date.now()}`,
      name: template.name,
      description: template.description,
      active: false,
      steps: [
        {
          id: `trigger-${Date.now()}`,
          type: "trigger",
          service: template.services[0] || "Service",
          event: "Event",
          description: "Configure this trigger",
        },
        {
          id: `action-${Date.now()}`,
          type: "action",
          service: template.services[1] || "Service",
          event: "Event",
          description: "Configure this action",
        },
      ],
    };

    setWorkflows([...workflows, newWorkflow]);
    setCurrentWorkflow(newWorkflow);
    setActiveTab("editor");
  };

  const handleCreateNew = () => {
    const newWorkflow: Workflow = {
      id: `new-${Date.now()}`,
      name: "New Workflow",
      description: "Describe your workflow",
      active: false,
      steps: [
        {
          id: `trigger-${Date.now()}`,
          type: "trigger",
          service: "Select Service",
          event: "Select Event",
          description: "Configure this trigger",
        },
      ],
    };

    setWorkflows([...workflows, newWorkflow]);
    setCurrentWorkflow(newWorkflow);
    setActiveTab("editor");
  };

  const handleAddStep = () => {
    if (!currentWorkflow) return;

    const updatedWorkflow = {
      ...currentWorkflow,
      steps: [
        ...currentWorkflow.steps,
        {
          id: `action-${Date.now()}`,
          type: "action",
          service: "Select Service",
          event: "Select Event",
          description: "Configure this action",
        },
      ],
    };

    setCurrentWorkflow(updatedWorkflow);

    // Update the workflow in the workflows array
    const updatedWorkflows = workflows.map((w) =>
      w.id === currentWorkflow.id ? updatedWorkflow : w,
    );

    setWorkflows(updatedWorkflows);
  };

  const handleToggleActive = () => {
    if (!currentWorkflow) return;

    const updatedWorkflow = {
      ...currentWorkflow,
      active: !currentWorkflow.active,
    };

    setCurrentWorkflow(updatedWorkflow);

    // Update the workflow in the workflows array
    const updatedWorkflows = workflows.map((w) =>
      w.id === currentWorkflow.id ? updatedWorkflow : w,
    );

    setWorkflows(updatedWorkflows);
  };

  const handleSaveWorkflow = () => {
    if (!currentWorkflow) return;

    // In a real app, this would save to the backend
    // For now, we just update the local state
    const updatedWorkflows = workflows.map((w) =>
      w.id === currentWorkflow.id ? currentWorkflow : w,
    );

    setWorkflows(updatedWorkflows);
    // Show a success message or notification here
  };

  const handleDeleteWorkflow = () => {
    if (!currentWorkflow) return;

    // Filter out the current workflow
    const updatedWorkflows = workflows.filter(
      (w) => w.id !== currentWorkflow.id,
    );

    setWorkflows(updatedWorkflows);
    setCurrentWorkflow(null);
    setActiveTab("my-workflows");
  };

  const handleUpdateWorkflowField = (field: keyof Workflow, value: string) => {
    if (!currentWorkflow) return;

    setCurrentWorkflow({
      ...currentWorkflow,
      [field]: value,
    });
  };

  return (
    <div className="w-full h-full bg-background border shadow-sm rounded-lg">
      <div className="p-6 pb-4">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold">Workflow Builder</h2>
            <p className="text-sm text-muted-foreground">
              Create and manage automated workflows between your connected apps
            </p>
          </div>
          {currentWorkflow && (
            <div className="flex gap-2">
              <Button
                variant={currentWorkflow.active ? "destructive" : "default"}
                size="sm"
                onClick={handleToggleActive}
              >
                {currentWorkflow.active ? (
                  <Pause className="mr-1 h-4 w-4" />
                ) : (
                  <Play className="mr-1 h-4 w-4" />
                )}
                {currentWorkflow.active ? "Deactivate" : "Activate"}
              </Button>
              <Button variant="outline" size="sm" onClick={handleSaveWorkflow}>
                <Save className="mr-1 h-4 w-4" />
                Save
              </Button>
            </div>
          )}
        </div>
        <div className="mt-4">
          <div className="inline-flex h-9 items-center justify-center rounded-lg bg-muted p-1 text-muted-foreground w-full max-w-md">
            <button
              className={`inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 ${
                activeTab === "templates"
                  ? "bg-background text-foreground shadow"
                  : ""
              }`}
              onClick={() => setActiveTab("templates")}
            >
              Templates
            </button>
            <button
              className={`inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 ${
                activeTab === "my-workflows"
                  ? "bg-background text-foreground shadow"
                  : ""
              }`}
              onClick={() => setActiveTab("my-workflows")}
            >
              My Workflows
            </button>
            <button
              className={`inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 ${
                activeTab === "editor"
                  ? "bg-background text-foreground shadow"
                  : ""
              } ${!currentWorkflow ? "opacity-50 pointer-events-none" : ""}`}
              onClick={() => currentWorkflow && setActiveTab("editor")}
              disabled={!currentWorkflow}
            >
              Editor
            </button>
          </div>
        </div>
      </div>
      <div className="px-6 pt-2">
        {activeTab === "templates" && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {workflowTemplates.map((template) => (
                <Card
                  key={template.id}
                  className={`cursor-pointer hover:border-primary transition-all ${selectedTemplate === template.id ? "border-primary" : ""}`}
                  onClick={() => handleTemplateSelect(template.id)}
                >
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-lg">{template.name}</CardTitle>
                      <Badge variant="secondary">{template.popularity}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      {template.description}
                    </p>
                    <div className="flex gap-2 mt-4">
                      {template.services.map((service) => (
                        <Badge key={service} variant="outline">
                          {service}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <Button variant="outline" onClick={handleCreateNew}>
                <PlusCircle className="mr-1 h-4 w-4" />
                Create from Scratch
              </Button>
              <Button
                onClick={handleCreateFromTemplate}
                disabled={!selectedTemplate}
              >
                Use Template
              </Button>
            </div>
          </div>
        )}

        {activeTab === "my-workflows" && (
          <div className="space-y-4">
            {workflows.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {workflows.map((workflow) => (
                  <Card
                    key={workflow.id}
                    className="cursor-pointer hover:border-primary transition-all"
                    onClick={() => handleWorkflowSelect(workflow)}
                  >
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start">
                        <CardTitle className="text-lg">
                          {workflow.name}
                        </CardTitle>
                        <Badge
                          variant={workflow.active ? "default" : "outline"}
                        >
                          {workflow.active ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">
                        {workflow.description}
                      </p>
                      <div className="flex items-center gap-2 mt-4 text-sm text-muted-foreground">
                        <span>{workflow.steps[0]?.service}</span>
                        <ArrowRight className="h-3 w-3" />
                        <span>
                          {workflow.steps[workflow.steps.length - 1]?.service}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                <Card
                  className="cursor-pointer border-dashed border-2 hover:border-primary flex items-center justify-center h-[200px]"
                  onClick={handleCreateNew}
                >
                  <CardContent className="flex flex-col items-center justify-center p-6">
                    <PlusCircle className="h-10 w-10 text-muted-foreground mb-2" />
                    <p className="text-muted-foreground font-medium">
                      Create New Workflow
                    </p>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12">
                <div className="rounded-full bg-muted p-4 mb-4">
                  <Settings className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-medium mb-2">No workflows yet</h3>
                <p className="text-muted-foreground text-center max-w-md mb-6">
                  Create your first workflow to automate tasks between your
                  connected apps
                </p>
                <Button onClick={handleCreateNew}>
                  <PlusCircle className="mr-1 h-4 w-4" />
                  Create Workflow
                </Button>
              </div>
            )}
          </div>
        )}

        {activeTab === "editor" && (
          <div className="space-y-6">
            {currentWorkflow && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="text-sm font-medium mb-2 block">
                      Workflow Name
                    </label>
                    <Input
                      value={currentWorkflow.name}
                      onChange={(e) =>
                        handleUpdateWorkflowField("name", e.target.value)
                      }
                      placeholder="Enter workflow name"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">
                      Description
                    </label>
                    <Input
                      value={currentWorkflow.description}
                      onChange={(e) =>
                        handleUpdateWorkflowField("description", e.target.value)
                      }
                      placeholder="Describe what this workflow does"
                    />
                  </div>
                </div>

                <div className="mt-8">
                  <h3 className="text-lg font-medium mb-4">Workflow Steps</h3>
                  <div className="space-y-6">
                    {currentWorkflow.steps.map((step, index) => (
                      <div key={step.id} className="border rounded-lg p-4">
                        <div className="flex justify-between items-center mb-4">
                          <Badge
                            variant={
                              step.type === "trigger" ? "default" : "secondary"
                            }
                          >
                            {step.type === "trigger"
                              ? "Trigger"
                              : `Action ${index}`}
                          </Badge>
                          <Button variant="ghost" size="sm">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="text-sm font-medium mb-2 block">
                              Service
                            </label>
                            <Select defaultValue={step.service}>
                              <SelectTrigger>
                                <SelectValue placeholder="Select service" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Gmail">Gmail</SelectItem>
                                <SelectItem value="Google Calendar">
                                  Google Calendar
                                </SelectItem>
                                <SelectItem value="Notion">Notion</SelectItem>
                                <SelectItem value="Slack">Slack</SelectItem>
                                <SelectItem value="Google Drive">
                                  Google Drive
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div>
                            <label className="text-sm font-medium mb-2 block">
                              Event
                            </label>
                            <Select defaultValue={step.event}>
                              <SelectTrigger>
                                <SelectValue placeholder="Select event" />
                              </SelectTrigger>
                              <SelectContent>
                                {step.service === "Gmail" && (
                                  <>
                                    <SelectItem value="New Email">
                                      New Email
                                    </SelectItem>
                                    <SelectItem value="New Important Email">
                                      New Important Email
                                    </SelectItem>
                                    <SelectItem value="Send Email">
                                      Send Email
                                    </SelectItem>
                                  </>
                                )}
                                {step.service === "Google Calendar" && (
                                  <>
                                    <SelectItem value="Meeting Created">
                                      Meeting Created
                                    </SelectItem>
                                    <SelectItem value="Meeting Started">
                                      Meeting Started
                                    </SelectItem>
                                    <SelectItem value="Meeting Ended">
                                      Meeting Ended
                                    </SelectItem>
                                  </>
                                )}
                                {step.service === "Notion" && (
                                  <>
                                    <SelectItem value="Create Page">
                                      Create Page
                                    </SelectItem>
                                    <SelectItem value="Create Task">
                                      Create Task
                                    </SelectItem>
                                    <SelectItem value="Update Task">
                                      Update Task
                                    </SelectItem>
                                  </>
                                )}
                                {step.service === "Slack" && (
                                  <>
                                    <SelectItem value="Send Message">
                                      Send Message
                                    </SelectItem>
                                    <SelectItem value="Create Channel">
                                      Create Channel
                                    </SelectItem>
                                  </>
                                )}
                                {step.service === "Google Drive" && (
                                  <>
                                    <SelectItem value="Upload File">
                                      Upload File
                                    </SelectItem>
                                    <SelectItem value="Create Folder">
                                      Create Folder
                                    </SelectItem>
                                  </>
                                )}
                                <SelectItem value="Select Event">
                                  Select Event
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        <div className="mt-4">
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full"
                          >
                            <ChevronDown className="h-4 w-4 mr-1" />
                            Configure Additional Options
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <Button
                    variant="outline"
                    className="mt-4 w-full border-dashed"
                    onClick={handleAddStep}
                  >
                    <PlusCircle className="mr-1 h-4 w-4" />
                    Add Action
                  </Button>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {currentWorkflow && activeTab === "editor" && (
        <div className="flex justify-between border-t pt-4 px-6 pb-6">
          <Button variant="destructive" onClick={handleDeleteWorkflow}>
            <Trash2 className="mr-1 h-4 w-4" />
            Delete Workflow
          </Button>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setActiveTab("my-workflows")}
            >
              Cancel
            </Button>
            <Button onClick={handleSaveWorkflow}>
              <Save className="mr-1 h-4 w-4" />
              Save Workflow
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkflowBuilder;
