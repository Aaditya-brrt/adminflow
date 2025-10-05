"use client";

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Activity, 
  CheckCircle, 
  XCircle, 
  Loader2, 
  Clock, 
  AlertCircle,
  Zap,
  Settings,
  Play
} from 'lucide-react';
import { useWorkflowRealtime, WorkflowLiveStep, WorkflowRunStatus } from '@/hooks/useWorkflowRealtime';

interface LiveExecutionViewerProps {
  workflowRunId: string | null;
  onComplete?: (status: 'completed' | 'failed') => void;
  className?: string;
}

export function LiveExecutionViewer({ 
  workflowRunId, 
  onComplete,
  className = ""
}: LiveExecutionViewerProps) {
  const { liveSteps, currentRunStatus, isConnected, connectionError, clearSteps } = useWorkflowRealtime(workflowRunId);
  const [hasCompleted, setHasCompleted] = useState(false);

  // Handle completion callback
  useEffect(() => {
    if (currentRunStatus && !hasCompleted && (currentRunStatus.status === 'completed' || currentRunStatus.status === 'failed')) {
      setHasCompleted(true);
      onComplete?.(currentRunStatus.status);
    }
  }, [currentRunStatus, hasCompleted, onComplete]);

  const getStepIcon = (stepType: string) => {
    switch (stepType) {
      case 'ai_generation':
        return <Activity className="h-4 w-4 text-blue-500" />;
      case 'tool_call':
        return <Settings className="h-4 w-4 text-orange-500" />;
      case 'tool_result':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'completion':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStepColor = (stepType: string) => {
    switch (stepType) {
      case 'ai_generation':
        return 'border-blue-200 bg-blue-50';
      case 'tool_call':
        return 'border-orange-200 bg-orange-50';
      case 'tool_result':
        return 'border-green-200 bg-green-50';
      case 'error':
        return 'border-red-200 bg-red-50';
      case 'completion':
        return 'border-green-300 bg-green-100';
      default:
        return 'border-gray-200 bg-gray-50';
    }
  };

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case 'running':
        return <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      default:
        return <Play className="h-4 w-4 text-gray-500" />;
    }
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  const formatStepType = (stepType: string) => {
    return stepType.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  if (!workflowRunId) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Live Execution
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            No active workflow execution
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Live Execution
          </div>
          <div className="flex items-center gap-2">
            {/* Connection Status */}
            <Badge variant={isConnected ? "default" : "destructive"} className="text-xs">
              {isConnected ? "Connected" : "Disconnected"}
            </Badge>
            
            {/* Run Status */}
            {currentRunStatus && (
              <div className="flex items-center gap-1">
                {getStatusIcon(currentRunStatus.status)}
                <Badge 
                  variant={
                    currentRunStatus.status === 'completed' ? "default" : 
                    currentRunStatus.status === 'failed' ? "destructive" : 
                    "secondary"
                  }
                  className={
                    currentRunStatus.status === 'completed' ? "bg-green-500" :
                    currentRunStatus.status === 'running' ? "bg-blue-500" :
                    ""
                  }
                >
                  {currentRunStatus.status.charAt(0).toUpperCase() + currentRunStatus.status.slice(1)}
                </Badge>
              </div>
            )}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {connectionError && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center gap-2 text-red-700">
              <AlertCircle className="h-4 w-4" />
              <span className="text-sm font-medium">Connection Error</span>
            </div>
            <p className="text-sm text-red-600 mt-1">{connectionError}</p>
          </div>
        )}

        <ScrollArea className="h-96 w-full">
          {liveSteps.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {isConnected ? "Waiting for execution steps..." : "Connecting..."}
            </div>
          ) : (
            <div className="space-y-3">
              {liveSteps.map((step, index) => (
                <div 
                  key={step.id} 
                  className={`p-3 rounded-lg border-l-4 transition-all duration-300 ${getStepColor(step.step_type)}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      {getStepIcon(step.step_type)}
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          Step {step.step_number}
                        </Badge>
                        <Badge variant="secondary" className="text-xs">
                          {formatStepType(step.step_type)}
                        </Badge>
                      </div>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {formatTime(step.timestamp)}
                    </span>
                  </div>
                  
                  {step.content && (
                    <div className="mt-2">
                      <p className="text-sm text-foreground">
                        {step.content}
                      </p>
                    </div>
                  )}

                  {step.metadata && Object.keys(step.metadata).length > 0 && (
                    <div className="mt-2">
                      <details className="group">
                        <summary className="text-xs text-muted-foreground cursor-pointer hover:text-foreground">
                          View metadata
                        </summary>
                        <div className="mt-1 p-2 bg-white/50 rounded text-xs font-mono">
                          {step.metadata.toolName && (
                            <div><strong>Tool:</strong> {step.metadata.toolName}</div>
                          )}
                          {step.metadata.action && (
                            <div><strong>Action:</strong> {step.metadata.action}</div>
                          )}
                          {step.metadata.arguments && Array.isArray(step.metadata.arguments) && (
                            <div><strong>Args:</strong> {step.metadata.arguments.join(', ')}</div>
                          )}
                          {step.metadata.success !== undefined && (
                            <div><strong>Success:</strong> {step.metadata.success ? 'Yes' : 'No'}</div>
                          )}
                        </div>
                      </details>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        {/* Summary Footer */}
        {liveSteps.length > 0 && (
          <div className="mt-4 pt-4 border-t">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                {liveSteps.length} step{liveSteps.length !== 1 ? 's' : ''} completed
              </span>
              {currentRunStatus?.started_at && (
                <span className="text-muted-foreground">
                  Started: {formatTime(currentRunStatus.started_at)}
                </span>
              )}
            </div>
            
            {currentRunStatus?.completed_at && (
              <div className="text-sm text-muted-foreground mt-1">
                Completed: {formatTime(currentRunStatus.completed_at)}
              </div>
            )}
            
            {currentRunStatus?.error_message && (
              <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                <strong>Error:</strong> {currentRunStatus.error_message}
              </div>
            )}
          </div>
        )}

        {/* Clear Steps Button */}
        {liveSteps.length > 0 && hasCompleted && (
          <div className="mt-4 pt-4 border-t">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={clearSteps}
              className="w-full"
            >
              Clear Steps
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
} 