import { initializeScheduler } from '@/lib/service/workflow-scheduler';

export async function WorkflowSchedulerInit() {
  // Initialize the scheduler on the server side
  if (typeof window === 'undefined') {
    try {
      await initializeScheduler();
    } catch (error) {
      console.error('Failed to initialize workflow scheduler:', error);
    }
  }
  
  return null; // This component doesn't render anything
} 