"use client";

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Loader2, ArrowRight } from 'lucide-react';
import { useWorkflowRealtime } from '@/hooks/useWorkflowRealtime';

interface LiveRunCardProps {
  workflowRunId: string;
  onComplete?: (status: 'completed' | 'failed') => void;
}

export function LiveRunCard({ workflowRunId, onComplete }: LiveRunCardProps) {
  const { liveSteps, currentRunStatus, isConnected, connectionError } = useWorkflowRealtime(workflowRunId);

  // Handle completion callback
  React.useEffect(() => {
    if (currentRunStatus && (currentRunStatus.status === 'completed' || currentRunStatus.status === 'failed')) {
      onComplete?.(currentRunStatus.status);
    }
  }, [currentRunStatus?.status, onComplete]);

  // Log to help with debugging
  React.useEffect(() => {
    console.log('%c[LiveRunCard] Component mounted/updated', 'color: #9333ea; font-weight: bold', {
      workflowRunId,
      isConnected,
      liveStepsCount: liveSteps.length,
      connectionError
    });
  }, [workflowRunId, isConnected, liveSteps.length, connectionError]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  return (
    <div className="border rounded-lg overflow-hidden bg-blue-50 border-blue-200">
      <div className="flex items-center justify-between p-3">
        <div className="flex items-center gap-3">
          {currentRunStatus?.status === 'completed' ? (
            <div className="h-4 w-4 rounded-full bg-green-500 flex items-center justify-center">
              <div className="h-2 w-2 rounded-full bg-white" />
            </div>
          ) : currentRunStatus?.status === 'failed' ? (
            <div className="h-4 w-4 rounded-full bg-red-500 flex items-center justify-center">
              <div className="h-1 w-2 bg-white rounded" />
            </div>
          ) : (
            <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />
          )}
          <div>
            <div className="font-medium text-blue-900">
              {currentRunStatus?.status === 'completed' ? 'Completed' : 
               currentRunStatus?.status === 'failed' ? 'Failed' : 'Running'}
            </div>
            <div className="text-sm text-blue-700">
              {currentRunStatus?.started_at ? formatDate(currentRunStatus.started_at) : 'Just started'}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className={`h-2 w-2 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} 
               title={isConnected ? 'Connected to real-time updates' : 'Disconnected from real-time updates'} />
          <span className="text-xs text-blue-600">
            {isConnected ? 'Live' : 'Disconnected'}
          </span>
        </div>
      </div>
      
      {/* Connection Error Warning */}
      {connectionError && (
        <div className="px-3 pb-2">
          <div className="text-xs bg-yellow-50 text-yellow-800 p-2 rounded border border-yellow-200">
            ⚠️ {connectionError}
          </div>
        </div>
      )}

      {/* Debug Info - Only show if not connected */}
      {!isConnected && (
        <div className="px-3 pb-2">
          <div className="text-xs bg-gray-50 text-gray-600 p-2 rounded border border-gray-200">
            <strong>💡 Debug Tip:</strong> Open browser console (F12) to see real-time logs
          </div>
        </div>
      )}
      
      {/* Live Steps Display */}
      {liveSteps.length > 0 && (
        <div className="px-3 pb-3">
          <details className="group" open>
            <summary className="text-xs font-medium text-blue-700 mb-2 cursor-pointer hover:text-blue-900 flex items-center gap-2">
              <span>Live Execution Steps ({liveSteps.length})</span>
              <ArrowRight className="h-3 w-3 transition-transform group-open:rotate-90" />
            </summary>
            <div className="mt-2 space-y-2 max-h-64 overflow-y-auto">
              {liveSteps.map((step) => (
                <div key={step.id} className="text-xs border-l-2 pl-3 py-1 animate-in slide-in-from-left-2 duration-300" 
                     style={{
                       borderColor: 
                         step.step_type === 'error' ? '#ef4444' :
                         step.step_type === 'tool_call' ? '#f97316' :
                         step.step_type === 'tool_result' ? '#10b981' :
                         step.step_type === 'completion' ? '#059669' :
                         '#3b82f6'
                     }}>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-xs">
                      Step {step.step_number}
                    </span>
                    <Badge variant="outline" className="text-xs px-1 py-0">
                      {step.step_type.replace('_', ' ')}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {new Date(step.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  
                  {step.content && (
                    <div className="text-xs text-foreground mb-1">
                      {step.content}
                    </div>
                  )}
                  
                  {step.metadata?.toolName && (
                    <div className="text-xs text-orange-600 mb-1">
                      <strong>Tool:</strong> {step.metadata.toolName}
                    </div>
                  )}
                  
                  {step.metadata?.success !== undefined && (
                    <div className={`text-xs mb-1 ${step.metadata.success ? 'text-green-600' : 'text-red-600'}`}>
                      <strong>Result:</strong> {step.metadata.success ? '✓ Success' : '✗ Failed'}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </details>
        </div>
      )}

      {/* No Steps Yet Message */}
      {liveSteps.length === 0 && isConnected && (
        <div className="px-3 pb-3">
          <div className="text-xs text-blue-600 p-2 bg-blue-100/50 rounded">
            ⏳ Waiting for workflow steps...
          </div>
        </div>
      )}
      
      {/* Error Message */}
      {currentRunStatus?.error_message && (
        <div className="px-3 pb-3">
          <div className="text-xs font-medium text-red-600 mb-1">Error:</div>
          <div className="text-sm bg-red-50 text-red-700 p-2 rounded">
            {currentRunStatus.error_message}
          </div>
        </div>
      )}
    </div>
  );
} 