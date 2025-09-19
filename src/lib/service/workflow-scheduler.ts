import { createClient } from '@/lib/supabase/server';
import { WorkflowExecutor } from './workflow-executor';

export class WorkflowScheduler {
  private executor: WorkflowExecutor | null = null;
  private intervalId: NodeJS.Timeout | null = null;
  private isRunning = false;

  constructor() {
    // Initialize with server supabase client
    this.initializeExecutor();
  }

  private async initializeExecutor() {
    const supabase = await createClient();
    this.executor = new WorkflowExecutor(supabase);
  }

  /**
   * Start the scheduler
   */
  async start(intervalMs: number = 60000) { // Default: check every minute
    if (this.isRunning) {
      console.log('[WorkflowScheduler] Already running');
      return;
    }

    console.log(`[WorkflowScheduler] Starting scheduler with ${intervalMs}ms interval`);
    this.isRunning = true;

    // Ensure executor is initialized
    if (!this.executor) {
      await this.initializeExecutor();
    }

    // Run immediately on start
    this.processScheduledWorkflows();

    // Set up interval
    this.intervalId = setInterval(() => {
      this.processScheduledWorkflows();
    }, intervalMs);
  }

  /**
   * Stop the scheduler
   */
  stop() {
    if (!this.isRunning) {
      console.log('[WorkflowScheduler] Not running');
      return;
    }

    console.log('[WorkflowScheduler] Stopping scheduler');
    this.isRunning = false;

    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  /**
   * Process all scheduled workflows that are due
   */
  private async processScheduledWorkflows() {
    try {
      if (!this.executor) {
        console.error('[WorkflowScheduler] Executor not initialized');
        return;
      }

      await this.executor.processScheduledWorkflows();
    } catch (error) {
      console.error('[WorkflowScheduler] Error processing scheduled workflows:', error);
    }
  }

  /**
   * Get scheduler status
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      intervalId: this.intervalId !== null
    };
  }
}

// Global scheduler instance
let globalScheduler: WorkflowScheduler | null = null;

/**
 * Get or create the global scheduler instance
 */
export function getScheduler(): WorkflowScheduler {
  if (!globalScheduler) {
    globalScheduler = new WorkflowScheduler();
  }
  return globalScheduler;
}

/**
 * Initialize the scheduler (call this in your app startup)
 */
export async function initializeScheduler() {
  const scheduler = getScheduler();
  
  // Only start if not already running
  if (!scheduler.getStatus().isRunning) {
    await scheduler.start();
    console.log('[WorkflowScheduler] Scheduler initialized and started');
  }
}

/**
 * API endpoint helper to start/stop scheduler
 */
export async function handleSchedulerControl(action: 'start' | 'stop' | 'status') {
  const scheduler = getScheduler();
  
  switch (action) {
    case 'start':
      await scheduler.start();
      return { success: true, message: 'Scheduler started', status: scheduler.getStatus() };
    
    case 'stop':
      scheduler.stop();
      return { success: true, message: 'Scheduler stopped', status: scheduler.getStatus() };
    
    case 'status':
      return { success: true, status: scheduler.getStatus() };
    
    default:
      return { success: false, error: 'Invalid action' };
  }
} 