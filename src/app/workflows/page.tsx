"use client";

import DashboardLayout from "@/components/dashboard/DashboardLayout";
import AIAssistant from "@/components/dashboard/AIAssistant";
import { useState } from "react";
import Link from "next/link";
import { useWorkflows } from "@/hooks/useWorkflows";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Plus, Play, Pause, Trash2, Calendar, Zap, Clock } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { Workflow } from "@/lib/service/workflow";
import { CreateWorkflowModal } from "@/components/dashboard/CreateWorkflowModal";

const workflowTemplates = [
  {
    id: "template1",
    name: "Email to Task",
    description: "Convert important emails into tasks automatically",
    services: ["Gmail", "Notion"],
    popularity: "Popular",
    type: "trigger" as const,
    steps: [
      {
        step_order: 1,
        type: "trigger" as const,
        service: "gmail",
        action: "new_important_email",
        description: "When a new email is marked as important"
      },
      {
        step_order: 2,
        type: "action" as const,
        service: "notion",
        action: "create_task",
        description: "Create a new task in Notion"
      }
    ]
  },
  {
    id: "template2",
    name: "Meeting Notes",
    description: "Automatically create and distribute meeting notes",
    services: ["Google Calendar", "Notion", "Slack"],
    popularity: "Trending",
    type: "trigger" as const,
    steps: [
      {
        step_order: 1,
        type: "trigger" as const,
        service: "googlecalendar",
        action: "meeting_ended",
        description: "When a calendar meeting ends"
      },
      {
        step_order: 2,
        type: "action" as const,
        service: "notion",
        action: "create_page",
        description: "Create meeting notes page"
      },
      {
        step_order: 3,
        type: "action" as const,
        service: "slack",
        action: "send_message",
        description: "Send summary to team channel"
      }
    ]
  },
  {
    id: "template3",
    name: "Contract Processing",
    description: "When receiving signed contracts, notify team and store documents",
    services: ["Gmail", "Google Drive", "Slack"],
    popularity: "New",
    type: "trigger" as const,
    steps: [
      {
        step_order: 1,
        type: "trigger" as const,
        service: "gmail",
        action: "new_attachment",
        description: "When email with contract attachment received"
      },
      {
        step_order: 2,
        type: "action" as const,
        service: "googledrive",
        action: "save_file",
        description: "Save contract to Google Drive"
      },
      {
        step_order: 3,
        type: "action" as const,
        service: "slack",
        action: "send_message",
        description: "Notify team of new contract"
      }
    ]
  },
  {
    id: "template4",
    name: "Daily Summary",
    description: "Generate and send daily summary of activities",
    services: ["Gmail", "Notion", "Slack"],
    popularity: "Popular",
    type: "schedule" as const,
    schedule_config: {
      type: "daily",
      time: "18:00"
    },
    steps: [
      {
        step_order: 1,
        type: "action" as const,
        service: "notion",
        action: "get_today_tasks",
        description: "Get today's completed tasks"
      },
      {
        step_order: 2,
        type: "action" as const,
        service: "slack",
        action: "send_message",
        description: "Send daily summary"
      }
    ]
  },
];

const tabList = ["Templates", "My Workflows"];

export default function WorkflowsListPage() {
  const [activeTab, setActiveTab] = useState("My Workflows");
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [isCreatingFromTemplate, setIsCreatingFromTemplate] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  
  const { workflows, loading, error, createWorkflow, deleteWorkflow, toggleWorkflowActivation, fetchWorkflows } = useWorkflows();
  const { toast } = useToast();

  const handleCreateFromTemplate = async () => {
    if (!selectedTemplate) return;

    const template = workflowTemplates.find(t => t.id === selectedTemplate);
    if (!template) return;

    setIsCreatingFromTemplate(true);

    try {
      const workflowData = {
        name: template.name,
        description: template.description,
        type: template.type,
        schedule_config: template.schedule_config,
        steps: template.steps
      };

      const workflow = await createWorkflow(workflowData);
      
      if (workflow) {
        toast({
          title: "Success",
          description: "Workflow created successfully!",
        });
        setActiveTab("My Workflows");
        setSelectedTemplate(null);
      }
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to create workflow from template.",
        variant: "destructive",
      });
    } finally {
      setIsCreatingFromTemplate(false);
    }
  };

  const handleDeleteWorkflow = async (workflowId: string, workflowName: string) => {
    if (!confirm(`Are you sure you want to delete "${workflowName}"?`)) {
      return;
    }

    const success = await deleteWorkflow(workflowId);
    if (success) {
      toast({
        title: "Success",
        description: "Workflow deleted successfully.",
      });
    } else {
      toast({
        title: "Error",
        description: "Failed to delete workflow.",
        variant: "destructive",
      });
    }
  };

  const handleToggleWorkflow = async (workflowId: string, currentActive: boolean, workflowName: string) => {
    const success = await toggleWorkflowActivation(workflowId, !currentActive);
    if (success) {
      toast({
        title: "Success",
        description: `Workflow "${workflowName}" ${!currentActive ? 'activated' : 'deactivated'} successfully.`,
      });
    } else {
      toast({
        title: "Error",
        description: `Failed to ${!currentActive ? 'activate' : 'deactivate'} workflow.`,
        variant: "destructive",
      });
    }
  };

  const handleWorkflowCreated = (workflow: Workflow) => {
    // Refresh the workflows list
    fetchWorkflows();
    toast({
      title: "Success",
      description: "Workflow created successfully!",
    });
  };

  const getWorkflowIcon = (type: string) => {
    switch (type) {
      case 'schedule':
        return <Calendar className="h-4 w-4" />;
      case 'trigger':
        return <Zap className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const getStatusBadge = (workflow: Workflow) => {
    if (workflow.active) {
      return <Badge variant="default" className="bg-green-500">Active</Badge>;
    } else {
      return <Badge variant="secondary">Inactive</Badge>;
    }
  };

  const formatNextRun = (nextRunAt: string | undefined) => {
    if (!nextRunAt) return 'Not scheduled';
    
    const date = new Date(nextRunAt);
    const now = new Date();
    const diffMs = date.getTime() - now.getTime();
    const diffHours = Math.ceil(diffMs / (1000 * 60 * 60));
    
    if (diffHours <= 0) return 'Overdue';
    if (diffHours < 24) return `In ${diffHours} hours`;
    
    const diffDays = Math.ceil(diffHours / 24);
    return `In ${diffDays} days`;
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col lg:flex-row w-full h-full gap-4 p-6 max-w-7xl mx-auto">
        <div className="flex-1 flex flex-col gap-4">
          <div className="mb-2">
            <h1 className="text-2xl font-bold mb-1">Workflow Builder</h1>
            <p className="text-muted-foreground text-sm mb-4">Create and manage automated workflows between your connected apps</p>
            <div className="inline-flex h-9 items-center rounded-lg bg-muted p-1 text-muted-foreground w-full max-w-md mb-6">
              {tabList.map((tab) => (
                <button
                  key={tab}
                  className={`inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 ${activeTab === tab ? "bg-background text-foreground shadow" : ""}`}
                  onClick={() => setActiveTab(tab)}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          {activeTab === "Templates" && (
            <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {workflowTemplates.map((template) => (
                  <Card
                  key={template.id}
                    className={`relative p-6 cursor-pointer hover:shadow-md transition-all ${selectedTemplate === template.id ? "border-primary" : ""}`}
                    onClick={() => setSelectedTemplate(template.id)}
                >
                    <Badge variant="outline" className="absolute top-4 right-4 text-xs">
                    {template.popularity}
                    </Badge>
                    <div className="flex items-center gap-2 mb-2">
                      {getWorkflowIcon(template.type)}
                      <div className="font-bold text-lg">{template.name}</div>
                    </div>
                  <div className="text-sm text-muted-foreground mb-4 flex-1">{template.description}</div>
                  <div className="flex gap-2 flex-wrap mt-auto">
                    {template.services.map((service) => (
                        <Badge key={service} variant="secondary" className="text-xs">
                        {service}
                        </Badge>
                      ))}
                    </div>
                  </Card>
                ))}
              </div>
              <div className="flex justify-end gap-2 mt-8">
                <Button variant="outline" onClick={() => setShowCreateModal(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create from Scratch
                </Button>
                <Button 
                  onClick={handleCreateFromTemplate}
                  disabled={!selectedTemplate || isCreatingFromTemplate}
                >
                  {isCreatingFromTemplate ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : null}
                  Use Template
                </Button>
              </div>
            </>
          )}

          {activeTab === "My Workflows" && (
            <>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : error ? (
                <div className="text-center py-8">
                  <p className="text-red-500 mb-4">{error}</p>
                  <Button onClick={() => window.location.reload()}>Retry</Button>
                </div>
              ) : workflows.length === 0 ? (
                <div className="text-center py-12">
                  <div className="mb-4">
                    <Zap className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No workflows yet</h3>
                    <p className="text-muted-foreground mb-6">
                      Create your first workflow from a template or start from scratch
                    </p>
                  </div>
                  <div className="flex gap-3 justify-center">
                    <Button onClick={() => setActiveTab("Templates")}>
                      Browse Templates
                    </Button>
                    <Button variant="outline" onClick={() => setShowCreateModal(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Create from Scratch
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {workflows.map((workflow) => (
                    <Card key={workflow.id} className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-2">
                          {getWorkflowIcon(workflow.type)}
                          <h3 className="font-semibold">{workflow.name}</h3>
                        </div>
                        {getStatusBadge(workflow)}
                      </div>
                      
                      <p className="text-sm text-muted-foreground mb-4">
                        {workflow.description || "No description"}
                      </p>

                      {workflow.steps && workflow.steps.length > 0 && (
                        <div className="mb-4">
                          <p className="text-xs text-muted-foreground mb-2">
                            {workflow.steps.length} step{workflow.steps.length !== 1 ? 's' : ''}
                          </p>
                          <div className="flex gap-1 flex-wrap">
                            {workflow.steps.slice(0, 3).map((step, index) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                {step.service}
                              </Badge>
                            ))}
                            {workflow.steps.length > 3 && (
                              <Badge variant="outline" className="text-xs">
                                +{workflow.steps.length - 3} more
                              </Badge>
                            )}
                          </div>
                        </div>
                      )}

                      {workflow.type === 'schedule' && workflow.next_run_at && (
                        <p className="text-xs text-muted-foreground mb-4">
                          Next run: {formatNextRun(workflow.next_run_at)}
                        </p>
                      )}

                      <div className="flex items-center justify-between">
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant={workflow.active ? "secondary" : "default"}
                            onClick={() => handleToggleWorkflow(workflow.id, workflow.active, workflow.name)}
                          >
                            {workflow.active ? (
                              <Pause className="h-3 w-3 mr-1" />
                            ) : (
                              <Play className="h-3 w-3 mr-1" />
                            )}
                            {workflow.active ? 'Pause' : 'Activate'}
                          </Button>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            asChild
                          >
                            <Link href={`/workflows/${workflow.id}`}>
                              View
                </Link>
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDeleteWorkflow(workflow.id, workflow.name)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </Card>
              ))}
            </div>
          )}
              
          <div className="flex justify-end gap-2 mt-8">
                <Button variant="outline" onClick={() => setActiveTab("Templates")}>
                  <Plus className="h-4 w-4 mr-2" />
                  Browse Templates
                </Button>
                <Button onClick={() => setShowCreateModal(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create from Scratch
                </Button>
          </div>
            </>
          )}
        </div>
        <div className="w-full lg:w-[400px] flex-shrink-0">
          <AIAssistant />
        </div>
      </div>

      {/* Create Workflow Modal */}
      <CreateWorkflowModal
        open={showCreateModal}
        onOpenChange={setShowCreateModal}
        onWorkflowCreated={handleWorkflowCreated}
      />
    </DashboardLayout>
  );
} 