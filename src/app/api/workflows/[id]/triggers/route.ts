import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch triggers for this workflow
    const { data: triggers, error } = await supabase
      .from('workflow_triggers')
      .select('*')
      .eq('workflow_id', id)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch triggers: ${error.message}`);
    }

    return NextResponse.json(triggers || []);
  } catch (error) {
    console.error('[Workflow Triggers API] Error fetching triggers:', error);
    return NextResponse.json(
      { error: 'Failed to fetch workflow triggers' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: workflowId } = await params;
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { toolkit_slug, trigger_name, trigger_config, connected_account_id, metadata } = body;

    // Validate required fields
    if (!toolkit_slug || !trigger_name || !connected_account_id) {
      return NextResponse.json(
        { error: 'toolkit_slug, trigger_name, and connected_account_id are required' },
        { status: 400 }
      );
    }

    // Verify workflow belongs to user
    const { data: workflow, error: workflowError } = await supabase
      .from('workflows')
      .select('id, type')
      .eq('id', workflowId)
      .eq('user_id', user.id)
      .single();

    if (workflowError || !workflow) {
      return NextResponse.json(
        { error: 'Workflow not found' },
        { status: 404 }
      );
    }

    if (workflow.type !== 'trigger') {
      return NextResponse.json(
        { error: 'Workflow must be of type "trigger" to add triggers' },
        { status: 400 }
      );
    }

    // Create trigger in database (not activated in Composio yet)
    const { data: trigger, error: createError } = await supabase
      .from('workflow_triggers')
      .insert({
        workflow_id: workflowId,
        user_id: user.id,
        toolkit_slug,
        trigger_name,
        trigger_config: trigger_config || {},
        connected_account_id,
        active: false,
        metadata: metadata || {}
      })
      .select()
      .single();

    if (createError) {
      throw new Error(`Failed to create trigger: ${createError.message}`);
    }

    console.log(`[Workflow Triggers API] Created trigger ${trigger.id} for workflow ${workflowId}`);

    return NextResponse.json(trigger);
  } catch (error) {
    console.error('[Workflow Triggers API] Error creating trigger:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create trigger' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: workflowId } = await params;
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { trigger_id } = body;

    if (!trigger_id) {
      return NextResponse.json(
        { error: 'trigger_id is required' },
        { status: 400 }
      );
    }

    // Get the trigger to check if it's active and has a composio_trigger_id
    const { data: trigger, error: fetchError } = await supabase
      .from('workflow_triggers')
      .select('*')
      .eq('id', trigger_id)
      .eq('workflow_id', workflowId)
      .eq('user_id', user.id)
      .single();

    if (fetchError || !trigger) {
      return NextResponse.json(
        { error: 'Trigger not found' },
        { status: 404 }
      );
    }

    // If trigger is active in Composio, disable it first
    if (trigger.active && trigger.composio_trigger_id) {
      try {
        // TODO: Call Composio API to disable trigger
        console.log(`[Workflow Triggers API] Should disable Composio trigger: ${trigger.composio_trigger_id}`);
      } catch (error) {
        console.warn('[Workflow Triggers API] Failed to disable trigger in Composio:', error);
        // Continue with deletion even if Composio fails
      }
    }

    // Delete trigger from database
    const { error: deleteError } = await supabase
      .from('workflow_triggers')
      .delete()
      .eq('id', trigger_id)
      .eq('user_id', user.id);

    if (deleteError) {
      throw new Error(`Failed to delete trigger: ${deleteError.message}`);
    }

    console.log(`[Workflow Triggers API] Deleted trigger ${trigger_id}`);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Workflow Triggers API] Error deleting trigger:', error);
    return NextResponse.json(
      { error: 'Failed to delete trigger' },
      { status: 500 }
    );
  }
}

