"use client";

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { RealtimeChannel } from '@supabase/supabase-js';

export interface WorkflowLiveStep {
  id: string;
  workflow_run_id: string;
  step_number: number;
  step_type: 'ai_generation' | 'tool_call' | 'tool_result' | 'error' | 'completion';
  content?: string;
  timestamp: string;
  metadata?: Record<string, any>;
  created_at: string;
}

export interface WorkflowRunStatus {
  id: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  workflow_id: string;
  started_at: string;
  completed_at?: string;
  error_message?: string;
}

interface UseWorkflowRealtimeReturn {
  liveSteps: WorkflowLiveStep[];
  currentRunStatus: WorkflowRunStatus | null;
  isConnected: boolean;
  connectionError: string | null;
  clearSteps: () => void;
}

export function useWorkflowRealtime(workflowRunId: string | null): UseWorkflowRealtimeReturn {
  const [liveSteps, setLiveSteps] = useState<WorkflowLiveStep[]>([]);
  const [currentRunStatus, setCurrentRunStatus] = useState<WorkflowRunStatus | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [channel, setChannel] = useState<RealtimeChannel | null>(null);

  const clearSteps = useCallback(() => {
    setLiveSteps([]);
    setCurrentRunStatus(null);
  }, []);

  useEffect(() => {
    if (!workflowRunId) {
      // Clean up when no workflow run ID
      if (channel) {
        console.log('%c[useWorkflowRealtime] 🧹 Cleaning up channel', 'color: #999');
        channel.unsubscribe();
        setChannel(null);
      }
      setLiveSteps([]);
      setCurrentRunStatus(null);
      setIsConnected(false);
      setConnectionError(null);
      return;
    }

    const supabase = createClient();
    console.log(`%c[useWorkflowRealtime] 🔌 Setting up realtime subscription for run: ${workflowRunId}`, 'color: #00C896; font-weight: bold');

    // Create a channel for this specific workflow run
    const realtimeChannel = supabase.channel(`workflow_run:${workflowRunId}`, {
      config: {
        broadcast: {
          self: false, // Don't receive our own broadcasts
        },
      },
    });

    // Subscribe to step updates
    realtimeChannel
      .on('broadcast', { event: 'STEP_UPDATE' }, (payload) => {
        console.log('%c[useWorkflowRealtime] 📨 Received step update:', 'color: #00C896; font-weight: bold', payload);
        console.log('%c[useWorkflowRealtime] 📦 Payload structure:', 'color: #00C896', {
          event: payload.event,
          type: payload.type,
          payload: payload.payload
        });
        
        try {
          const { new: newStep } = payload.payload;
          console.log('%c[useWorkflowRealtime] 📋 New step data:', 'color: #00C896', newStep);
          
          if (newStep && newStep.workflow_run_id === workflowRunId) {
            setLiveSteps(prev => {
              // Check if step already exists (prevent duplicates)
              const exists = prev.some(step => step.id === newStep.id);
              if (exists) {
                console.log(`%c[useWorkflowRealtime] ⏭️  Step ${newStep.step_number} already exists, skipping`, 'color: #FFA500');
                return prev;
              }
              
              // Add new step and sort by step_number and timestamp
              const updated = [...prev, newStep].sort((a, b) => {
                if (a.step_number !== b.step_number) {
                  return a.step_number - b.step_number;
                }
                return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
              });
              
              console.log(`%c[useWorkflowRealtime] ✅ Added step ${newStep.step_number} (${newStep.step_type})`, 'color: #00C896; font-weight: bold');
              console.log(`%c[useWorkflowRealtime] 📊 Total steps: ${updated.length}`, 'color: #00C896');
              return updated;
            });
          } else {
            console.log(`%c[useWorkflowRealtime] ⚠️  Step ignored - workflow_run_id mismatch`, 'color: #FFA500', {
              received: newStep?.workflow_run_id,
              expected: workflowRunId
            });
          }
        } catch (error) {
          console.error('%c[useWorkflowRealtime] ❌ Error processing step update:', 'color: #FF0000; font-weight: bold', error);
          setConnectionError('Failed to process step update');
        }
      })
      
      // Subscribe to workflow run status updates
      .on('broadcast', { event: 'STATUS_UPDATE' }, (payload) => {
        console.log('%c[useWorkflowRealtime] 📊 Received status update:', 'color: #00C896; font-weight: bold', payload);
        
        try {
          const { new: newStatus } = payload.payload;
          if (newStatus && newStatus.id === workflowRunId) {
            setCurrentRunStatus(newStatus);
            console.log(`%c[useWorkflowRealtime] ✅ Updated run status to: ${newStatus.status}`, 'color: #00C896; font-weight: bold');
          }
        } catch (error) {
          console.error('%c[useWorkflowRealtime] ❌ Error processing status update:', 'color: #FF0000; font-weight: bold', error);
          setConnectionError('Failed to process status update');
        }
      })
      
      .subscribe((status) => {
        console.log(`%c[useWorkflowRealtime] 🔌 Subscription status: ${status}`, 'color: #00C896; font-weight: bold');
        
        if (status === 'SUBSCRIBED') {
          setIsConnected(true);
          setConnectionError(null);
          console.log(`%c[useWorkflowRealtime] ✅ Successfully subscribed to workflow_run:${workflowRunId}`, 'color: #00FF00; font-weight: bold; font-size: 14px');
        } else if (status === 'CHANNEL_ERROR') {
          setIsConnected(false);
          setConnectionError('Failed to connect to realtime channel');
          console.error(`%c[useWorkflowRealtime] ❌ Channel error for workflow_run:${workflowRunId}`, 'color: #FF0000; font-weight: bold');
        } else if (status === 'TIMED_OUT') {
          setIsConnected(false);
          setConnectionError('Connection timed out');
          console.error(`%c[useWorkflowRealtime] ⏱️  Connection timed out for workflow_run:${workflowRunId}`, 'color: #FF0000; font-weight: bold');
        } else if (status === 'CLOSED') {
          setIsConnected(false);
          console.log(`%c[useWorkflowRealtime] 🔌 Connection closed for workflow_run:${workflowRunId}`, 'color: #999');
        }
      });

    setChannel(realtimeChannel);

    // Cleanup function
    return () => {
      console.log(`%c[useWorkflowRealtime] 🧹 Cleaning up subscription for workflow_run:${workflowRunId}`, 'color: #999');
      realtimeChannel.unsubscribe();
      setChannel(null);
      setIsConnected(false);
      setConnectionError(null);
    };
  }, [workflowRunId]);

  return {
    liveSteps,
    currentRunStatus,
    isConnected,
    connectionError,
    clearSteps,
  };
} 