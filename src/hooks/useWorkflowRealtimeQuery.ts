// // This file is prepared for TanStack Query integration
// // It provides a structured interface for real-time workflow data that can be easily
// // integrated with React Query's caching and synchronization features

// import { useWorkflowRealtime, WorkflowLiveStep, WorkflowRunStatus } from './useWorkflowRealtime';

// export interface WorkflowRealtimeQueryData {
//   steps: WorkflowLiveStep[];
//   runStatus: WorkflowRunStatus | null;
//   isConnected: boolean;
//   connectionError: string | null;
//   // TanStack Query compatible metadata
//   queryKey: string[];
//   lastUpdated: Date | null;
//   stepsCount: number;
// }

// export interface WorkflowRealtimeQueryActions {
//   clearSteps: () => void;
//   // Future TanStack Query actions
//   invalidateQueries?: () => void;
//   refetchSteps?: () => Promise<void>;
//   prefetchNextRun?: () => Promise<void>;
// }

// export interface UseWorkflowRealtimeQueryReturn {
//   data: WorkflowRealtimeQueryData;
//   actions: WorkflowRealtimeQueryActions;
//   // TanStack Query compatibility
//   isLoading: boolean;
//   isError: boolean;
//   error: Error | null;
// }

// /**
//  * Hook that wraps useWorkflowRealtime with TanStack Query compatible structure
//  * This makes it easy to migrate to TanStack Query later while keeping the same interface
//  */
// export function useWorkflowRealtimeQuery(workflowRunId: string | null): UseWorkflowRealtimeQueryReturn {
//   const { 
//     liveSteps, 
//     currentRunStatus, 
//     isConnected, 
//     connectionError, 
//     clearSteps 
//   } = useWorkflowRealtime(workflowRunId);

//   const data: WorkflowRealtimeQueryData = {
//     steps: liveSteps,
//     runStatus: currentRunStatus,
//     isConnected,
//     connectionError,
//     queryKey: ['workflow-realtime', workflowRunId].filter(Boolean),
//     lastUpdated: liveSteps.length > 0 ? new Date(liveSteps[liveSteps.length - 1].timestamp) : null,
//     stepsCount: liveSteps.length,
//   };

//   const actions: WorkflowRealtimeQueryActions = {
//     clearSteps,
//     // These will be implemented when migrating to TanStack Query
//     invalidateQueries: undefined,
//     refetchSteps: undefined,
//     prefetchNextRun: undefined,
//   };

//   return {
//     data,
//     actions,
//     // TanStack Query compatibility - these map to connection status for now
//     isLoading: !isConnected && !connectionError,
//     isError: !!connectionError,
//     error: connectionError ? new Error(connectionError) : null,
//   };
// }

// // Export types for easy migration to TanStack Query
// export type WorkflowRealtimeQueryKey = ['workflow-realtime', string | null];
// export type WorkflowRealtimeQueryOptions = {
//   enabled?: boolean;
//   refetchInterval?: number;
//   staleTime?: number;
//   cacheTime?: number;
// };

// // Future TanStack Query hook structure (commented out for now)
// /*
// export function useWorkflowRealtimeWithQuery(
//   workflowRunId: string | null,
//   options?: WorkflowRealtimeQueryOptions
// ) {
//   return useQuery({
//     queryKey: ['workflow-realtime', workflowRunId] as WorkflowRealtimeQueryKey,
//     queryFn: () => fetchWorkflowSteps(workflowRunId),
//     enabled: options?.enabled ?? !!workflowRunId,
//     refetchInterval: options?.refetchInterval,
//     staleTime: options?.staleTime ?? 1000 * 60, // 1 minute
//     cacheTime: options?.cacheTime ?? 1000 * 60 * 5, // 5 minutes
//     // Integrate with realtime updates
//     onSuccess: (data) => {
//       // Merge with realtime data
//     },
//   });
// }
// */ 