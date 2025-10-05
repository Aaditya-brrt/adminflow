"use client";

import React, { useState } from "react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useWorkflow, useWorkflowRuns } from "@/hooks/useWorkflows";
import { useWorkflows } from "@/hooks/useWorkflows";
import { useToast } from "@/components/ui/use-toast";
import { LiveRunCard } from "@/components/workflow/LiveRunCard";
import { 
  Calendar, 
  Clock, 
  Play, 
  Pause, 
  Zap, 
  ArrowRight, 
  Settings,
  Trash2,
  Loader2,
  Activity,
  CheckCircle,
  XCircle,
  AlertCircle
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function WorkflowDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = React.use(params);
  const router = useRouter();
  const { toast } = useToast();
  const [isToggling, setIsToggling] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  const [currentExecutionRunId, setCurrentExecutionRunId] = useState<string | null>(null);
  
  const { workflow, loading, error } = useWorkflow(id);
  const { runs, loading: runsLoading, fetchRuns } = useWorkflowRuns(id);
  const { toggleWorkflowActivation, deleteWorkflow } = useWorkflows();

  const handleToggleActivation = async () => {
    if (!workflow) return;
    
    setIsToggling(true);
    const success = await toggleWorkflowActivation(workflow.id, !workflow.active);
    
    if (success) {
      toast({
        title: "Success",
        description: `Workflow ${!workflow.active ? 'activated' : 'deactivated'} successfully.`,
      });
      // Refresh the page to get updated data
      window.location.reload();
    } else {
      toast({
        title: "Error",
        description: "Failed to toggle workflow activation.",
        variant: "destructive",
      });
    }
    setIsToggling(false);
  };

  const handleDelete = async () => {
    if (!workflow) return;
    
    if (!confirm(`Are you sure you want to delete "${workflow.name}"?`)) {
      return;
    }

    const success = await deleteWorkflow(workflow.id);
    if (success) {
      toast({
        title: "Success",
        description: "Workflow deleted successfully.",
      });
      router.push('/workflows');
    } else {
      toast({
        title: "Error",
        description: "Failed to delete workflow.",
        variant: "destructive",
      });
    }
  };

  const handleExecutionComplete = (status: 'completed' | 'failed') => {
    setIsExecuting(false);
    
    // Refresh the runs to show the completed execution
    if (fetchRuns) {
      fetchRuns();
    }
    
    toast({
      title: status === 'completed' ? "Execution Completed" : "Execution Failed",
      description: status === 'completed' 
        ? "Workflow executed successfully!" 
        : "Workflow execution failed. Check the logs for details.",
      variant: status === 'failed' ? "destructive" : "default",
    });

    // Clear the current execution after a delay to allow viewing the final state
    setTimeout(() => {
      setCurrentExecutionRunId(null);
    }, 5000);
  };

  const handleExecuteNow = async () => {
    if (!workflow) return;
    
    setIsExecuting(true);
    try {
      const response = await fetch(`/api/workflows/${workflow.id}/execute`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();
      
      if (result.success) {
        // Set the run ID for live tracking
        if (result.runId) {
          setCurrentExecutionRunId(result.runId);
        }
        
        toast({
          title: "Execution Started",
          description: "Workflow execution started! Watch the live updates below.",
        });
      } else {
        toast({
          title: "Execution Failed",
          description: result.error || "Failed to execute workflow.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error executing workflow:', error);
      toast({
        title: "Error",
        description: "Failed to execute workflow.",
        variant: "destructive",
      });
    } finally {
      setIsExecuting(false);
    }
  };

  const getWorkflowIcon = (type: string) => {
    switch (type) {
      case 'schedule':
        return <Calendar className="h-5 w-5" />;
      case 'trigger':
        return <Zap className="h-5 w-5" />;
      default:
        return <Clock className="h-5 w-5" />;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'running':
        return <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  const formatDuration = (startedAt: string, completedAt?: string) => {
    if (!completedAt) return 'Running...';
    
    const start = new Date(startedAt);
    const end = new Date(completedAt);
    const diffMs = end.getTime() - start.getTime();
    const diffSeconds = Math.round(diffMs / 1000);
    
    if (diffSeconds < 60) return `${diffSeconds}s`;
    const diffMinutes = Math.round(diffSeconds / 60);
    return `${diffMinutes}m`;
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
      <div className="max-w-6xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            {getWorkflowIcon(workflow.type)}
            <div>
              <h1 className="text-3xl font-bold">{workflow.name}</h1>
              <p className="text-muted-foreground">
                {workflow.description || "No description"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={workflow.active ? "default" : "secondary"} className={workflow.active ? "bg-green-500" : ""}>
              {workflow.active ? "Active" : "Inactive"}
            </Badge>
            <Button
              variant={workflow.active ? "secondary" : "default"}
              onClick={handleToggleActivation}
              disabled={isToggling}
            >
              {isToggling ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : workflow.active ? (
                <Pause className="h-4 w-4 mr-2" />
              ) : (
                <Play className="h-4 w-4 mr-2" />
              )}
              {workflow.active ? "Deactivate" : "Activate"}
            </Button>
            <Button 
              onClick={handleExecuteNow}
              disabled={isExecuting}
              variant="outline"
            >
              {isExecuting ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Play className="h-4 w-4 mr-2" />
              )}
              Run Now
            </Button>
            <Button variant="outline" asChild>
              <Link href={`/workflows/${workflow.id}/edit`}>
                <Settings className="h-4 w-4 mr-2" />
                Edit
              </Link>
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Workflow Configuration */}
            <Card>
              <CardHeader>
                <CardTitle>Configuration</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Type</label>
                    <div className="flex items-center gap-2 mt-1">
                      {getWorkflowIcon(workflow.type)}
                      <span className="capitalize">{workflow.type}</span>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Status</label>
                    <div className="mt-1">
                      <Badge variant={workflow.active ? "default" : "secondary"} className={workflow.active ? "bg-green-500" : ""}>
                        {workflow.active ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                  </div>
                </div>

                {workflow.type === 'schedule' && workflow.schedule_config && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Schedule</label>
                    <div className="mt-1 p-3 bg-muted rounded-lg">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        <span>
                          {workflow.schedule_config.type === 'daily' && `Daily at ${workflow.schedule_config.time || '09:00'}`}
                          {workflow.schedule_config.type === 'weekly' && `Weekly on day ${workflow.schedule_config.dayOfWeek || 1} at ${workflow.schedule_config.time || '09:00'}`}
                          {workflow.schedule_config.type === 'interval' && `Every ${workflow.schedule_config.interval || 60} minutes`}
                        </span>
                      </div>
                      {workflow.next_run_at && (
                        <div className="text-sm text-muted-foreground mt-2">
                          Next run: {formatDate(workflow.next_run_at)}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {workflow.type === 'trigger' && workflow.trigger_config && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Trigger</label>
                    <div className="mt-1 p-3 bg-muted rounded-lg">
                      <div className="flex items-center gap-2">
                        <Zap className="h-4 w-4" />
                        <span>Event-based trigger</span>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Workflow Steps */}
            {workflow.steps && workflow.steps.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Workflow Steps</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {workflow.steps
                      .sort((a, b) => a.step_order - b.step_order)
                      .map((step, index) => (
                        <div key={step.id} className="flex items-start gap-4">
                          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-medium">
                            {index + 1}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <Badge variant={step.type === 'trigger' ? 'default' : 'secondary'}>
                                {step.type}
                              </Badge>
                              <span className="font-medium capitalize">{step.service}</span>
                              <ArrowRight className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm text-muted-foreground">{step.action}</span>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {step.description || "No description"}
                            </p>
                          </div>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Recent Runs */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Recent Runs
                </CardTitle>
              </CardHeader>
              <CardContent>
                {runsLoading ? (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="h-5 w-5 animate-spin" />
                  </div>
                ) : (
                  <div className="space-y-3">
                    {/* Live Execution Card - Show when there's an active execution */}
                    {currentExecutionRunId && (
                      <LiveRunCard 
                        workflowRunId={currentExecutionRunId}
                        onComplete={handleExecutionComplete}
                      />
                    )}
                    
                    {/* Historical Runs */}
                    {runs.length === 0 && !currentExecutionRunId ? (
                      <p className="text-muted-foreground text-center py-4">No runs yet</p>
                    ) : (
                      runs.slice(0, 5).map((run) => (
                      <div key={run.id} className="border rounded-lg overflow-hidden">
                        <div className="flex items-center justify-between p-3">
                          <div className="flex items-center gap-3">
                            {getStatusIcon(run.status)}
                            <div>
                              <div className="font-medium capitalize">{run.status}</div>
                              <div className="text-sm text-muted-foreground">
                                {formatDate(run.started_at)}
                              </div>
                            </div>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {formatDuration(run.started_at, run.completed_at)}
                          </div>
                        </div>
                        
                        {/* Detailed Execution Log */}
                        {run.execution_log && run.execution_log.length > 0 && (
                          <div className="px-3 pb-3">
                            <details className="group">
                              <summary className="text-xs font-medium text-muted-foreground mb-2 cursor-pointer hover:text-foreground flex items-center gap-2">
                                <span>Execution Steps ({run.execution_log.length})</span>
                                <ArrowRight className="h-3 w-3 transition-transform group-open:rotate-90" />
                              </summary>
                              <div className="mt-2 space-y-2 max-h-64 overflow-y-auto">
                                {run.execution_log.map((step: any, index: number) => (
                                  <div key={index} className="text-xs border-l-2 pl-3 py-1" 
                                       style={{
                                         borderColor: 
                                           step.stepType === 'error' ? '#ef4444' :
                                           step.stepType === 'tool_call' ? '#3b82f6' :
                                           step.stepType === 'tool_result' ? '#10b981' :
                                           '#6b7280'
                                       }}>
                                    <div className="flex items-center gap-2 mb-1">
                                      <span className="font-medium text-xs">
                                        Step {step.stepNumber}
                                      </span>
                                      <Badge variant="outline" className="text-xs px-1 py-0">
                                        {step.stepType.replace('_', ' ')}
                                      </Badge>
                                      <span className="text-xs text-muted-foreground">
                                        {new Date(step.timestamp).toLocaleTimeString()}
                                      </span>
                                    </div>
                                    
                                    {step.aiResponse && (
                                      <div className="text-xs text-muted-foreground mb-1">
                                        <strong>AI:</strong> {step.aiResponse.substring(0, 100)}
                                        {step.aiResponse.length > 100 && '...'}
                                      </div>
                                    )}
                                    
                                    {step.toolCall && (
                                      <div className="text-xs text-blue-600 mb-1">
                                        <strong>Tool:</strong> {step.toolCall.toolName}
                                        {step.toolCall.arguments && Object.keys(step.toolCall.arguments).length > 0 && (
                                          <span className="text-muted-foreground ml-1">
                                            ({Object.keys(step.toolCall.arguments).join(', ')})
                                          </span>
                                        )}
                                      </div>
                                    )}
                                    
                                    {step.toolResult && (
                                      <div className={`text-xs mb-1 ${step.toolResult.success ? 'text-green-600' : 'text-red-600'}`}>
                                        <strong>Result:</strong> 
                                        {step.toolResult.success ? ' ✓ Success' : ' ✗ Error'}
                                        {step.toolResult.error && (
                                          <div className="text-red-600 mt-1">
                                            {step.toolResult.error}
                                          </div>
                                        )}
                                      </div>
                                    )}
                                    
                                    {step.error && (
                                      <div className="text-xs text-red-600 mb-1">
                                        <strong>Error:</strong> {step.error}
                                      </div>
                                    )}
                                    
                                    {step.metadata?.action && (
                                      <div className="text-xs text-muted-foreground">
                                        {step.metadata.action.replace('_', ' ')}
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </details>
                          </div>
                        )}
                        
                        {/* Fallback: AI Execution Output (for runs without detailed logs) */}
                        {(!run.execution_log || run.execution_log.length === 0) && run.output_data && run.output_data.result && (
                          <div className="px-3 pb-3">
                            <div className="text-xs font-medium text-muted-foreground mb-1">AI Output:</div>
                            <div className="text-sm bg-muted p-2 rounded text-muted-foreground max-h-20 overflow-y-auto">
                              {typeof run.output_data.result === 'string' 
                                ? run.output_data.result.substring(0, 200) + (run.output_data.result.length > 200 ? '...' : '')
                                : JSON.stringify(run.output_data.result).substring(0, 200) + '...'
                              }
                            </div>
                          </div>
                        )}
                        
                        {/* Fallback: Tool Calls (for runs without detailed logs) */}
                        {(!run.execution_log || run.execution_log.length === 0) && run.output_data && run.output_data.toolCalls && run.output_data.toolCalls.length > 0 && (
                          <div className="px-3 pb-3">
                            <div className="text-xs font-medium text-muted-foreground mb-1">
                              Tools Used ({run.output_data.toolCalls.length}):
                            </div>
                            <div className="flex flex-wrap gap-1">
                              {run.output_data.toolCalls.slice(0, 3).map((toolCall: any, index: number) => (
                                <Badge key={index} variant="outline" className="text-xs">
                                  {toolCall.toolName}
                                </Badge>
                              ))}
                              {run.output_data.toolCalls.length > 3 && (
                                <Badge variant="outline" className="text-xs">
                                  +{run.output_data.toolCalls.length - 3} more
                                </Badge>
                              )}
                            </div>
                          </div>
                        )}
                        
                        {/* Error Message */}
                        {run.error_message && (
                          <div className="px-3 pb-3">
                            <div className="text-xs font-medium text-red-600 mb-1">Error:</div>
                            <div className="text-sm bg-red-50 text-red-700 p-2 rounded">
                              {run.error_message}
                            </div>
                          </div>
                        )}
                      </div>
                    ))
                    )}
                    {runs.length > 5 && (
                      <Button variant="outline" className="w-full" asChild>
                        <Link href={`/workflows/${workflow.id}/logs`}>
                          View All Runs
                        </Link>
                      </Button>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Stats */}
            <Card>
              <CardHeader>
                <CardTitle>Statistics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="text-2xl font-bold">{runs.length}</div>
                  <div className="text-sm text-muted-foreground">Total Runs</div>
                </div>
                <Separator />
                <div>
                  <div className="text-2xl font-bold text-green-600">
                    {runs.filter(r => r.status === 'completed').length}
                  </div>
                  <div className="text-sm text-muted-foreground">Successful</div>
                </div>
                <Separator />
                <div>
                  <div className="text-2xl font-bold text-red-600">
                    {runs.filter(r => r.status === 'failed').length}
                  </div>
                  <div className="text-sm text-muted-foreground">Failed</div>
                </div>
                <Separator />
                <div>
                  <div className="text-sm text-muted-foreground">Created</div>
                  <div className="font-medium">{formatDate(workflow.created_at)}</div>
                </div>
                {workflow.last_run_at && (
                  <>
                    <Separator />
                    <div>
                      <div className="text-sm text-muted-foreground">Last Run</div>
                      <div className="font-medium">{formatDate(workflow.last_run_at)}</div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button 
                  className="w-full" 
                  variant="outline"
                  disabled={!workflow.active}
                >
                  <Play className="h-4 w-4 mr-2" />
                  Run Now
                </Button>
                <Button className="w-full" variant="outline" asChild>
                  <Link href={`/workflows/${workflow.id}/logs`}>
                    <Activity className="h-4 w-4 mr-2" />
                    View Logs
                  </Link>
                </Button>
                <Button className="w-full" variant="outline" asChild>
                  <Link href={`/workflows/${workflow.id}/edit`}>
                    <Settings className="h-4 w-4 mr-2" />
                    Edit Workflow
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}