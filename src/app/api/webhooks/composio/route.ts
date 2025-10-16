import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { WorkflowExecutor } from '@/lib/service/workflow-executor';

export async function POST(request: NextRequest) {
  try {
    // Parse webhook payload
    const payload = await request.json();
    
    console.log('[Composio Webhook] Received trigger event:', {
      triggerId: payload.trigger_id,
      triggerName: payload.trigger_name,
      timestamp: new Date().toISOString()
    });

    // Get workflow_id from query params
    const { searchParams } = new URL(request.url);
    const workflowId = searchParams.get('workflow_id');

    if (!workflowId) {
      console.error('[Composio Webhook] No workflow_id in query params');
      return NextResponse.json(
        { error: 'workflow_id is required' },
        { status: 400 }
      );
    }

    // Get workflow and verify it's active
    const supabase = await createClient();
    const { data: workflow, error: workflowError } = await supabase
      .from('workflows')
      .select('*')
      .eq('id', workflowId)
      .single();

    if (workflowError || !workflow) {
      console.error('[Composio Webhook] Workflow not found:', workflowId);
      return NextResponse.json(
        { error: 'Workflow not found' },
        { status: 404 }
      );
    }

    if (!workflow.active) {
      console.log('[Composio Webhook] Workflow is not active:', workflowId);
      return NextResponse.json(
        { message: 'Workflow is not active, ignoring trigger' },
        { status: 200 }
      );
    }

    // Verify the trigger belongs to this workflow
    const { data: trigger, error: triggerError } = await supabase
      .from('workflow_triggers')
      .select('*')
      .eq('workflow_id', workflowId)
      .eq('composio_trigger_id', payload.trigger_id)
      .single();

    if (triggerError || !trigger) {
      console.warn('[Composio Webhook] Trigger not found for workflow:', {
        workflowId,
        triggerId: payload.trigger_id
      });
      // Return 200 to avoid retries from Composio
      return NextResponse.json(
        { message: 'Trigger not found for this workflow' },
        { status: 200 }
      );
    }

    if (!trigger.active) {
      console.log('[Composio Webhook] Trigger is not active:', trigger.id);
      return NextResponse.json(
        { message: 'Trigger is not active, ignoring event' },
        { status: 200 }
      );
    }

    console.log('[Composio Webhook] Executing workflow:', {
      workflowId,
      triggerId: trigger.id,
      triggerName: trigger.trigger_name
    });

    // Create workflow run with trigger context
    const { data: workflowRun, error: runError } = await supabase
      .from('workflow_runs')
      .insert({
        workflow_id: workflowId,
        status: 'pending',
        input_data: {
          triggered_by: 'webhook',
          trigger: {
            id: trigger.id,
            name: trigger.trigger_name,
            toolkit: trigger.toolkit_slug,
            payload: payload.payload || payload,
            timestamp: new Date().toISOString()
          }
        }
      })
      .select()
      .single();

    if (runError || !workflowRun) {
      console.error('[Composio Webhook] Failed to create workflow run:', runError);
      return NextResponse.json(
        {
          status: 'error',
          message: 'Failed to create workflow run',
          error: runError?.message
        },
        { status: 200 }
      );
    }

    // Execute workflow asynchronously - don't wait for completion
    const executor = new WorkflowExecutor(supabase);
    executor.executeWorkflow(workflowId, workflow.user_id).catch(error => {
      console.error('[Composio Webhook] Workflow execution error:', error);
    });

    // Return success immediately
    return NextResponse.json({
      status: 'received',
      workflow_id: workflowId,
      trigger_id: trigger.id,
      message: 'Workflow execution started'
    });
  } catch (error) {
    console.error('[Composio Webhook] Error processing webhook:', error);
    
    // Return 200 even on error to avoid retries from Composio
    // Log the error for debugging
    return NextResponse.json(
      {
        status: 'error',
        message: 'Webhook received but processing failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 200 }
    );
  }
}

// Handle GET requests for webhook verification (if needed by Composio)
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const challenge = searchParams.get('challenge');
  
  if (challenge) {
    return NextResponse.json({ challenge });
  }
  
  return NextResponse.json({
    status: 'ok',
    endpoint: 'Composio webhook handler'
  });
}

