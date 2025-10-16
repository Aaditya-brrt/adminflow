import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import composio from '@/lib/service/composio';

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
    const { active } = body;

    if (typeof active !== 'boolean') {
      return NextResponse.json(
        { error: 'active must be a boolean' },
        { status: 400 }
      );
    }

    // Get workflow
    const { data: workflow, error: workflowError } = await supabase
      .from('workflows')
      .select('*')
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
        { error: 'Only trigger-based workflows can be activated this way' },
        { status: 400 }
      );
    }

    // Get all triggers for this workflow
    const { data: triggers, error: triggersError } = await supabase
      .from('workflow_triggers')
      .select('*')
      .eq('workflow_id', workflowId)
      .eq('user_id', user.id);

    if (triggersError) {
      throw new Error(`Failed to fetch triggers: ${triggersError.message}`);
    }

    if (!triggers || triggers.length === 0) {
      return NextResponse.json(
        { error: 'No triggers configured for this workflow' },
        { status: 400 }
      );
    }

    // Generate webhook URL for this workflow
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.VERCEL_URL || 'http://localhost:3000';
    const webhookUrl = `${baseUrl}/api/webhooks/composio?workflow_id=${workflowId}`;

    console.log(`[Activate Workflow] ${active ? 'Activating' : 'Deactivating'} workflow ${workflowId}`);
    console.log(`[Activate Workflow] Webhook URL: ${webhookUrl}`);

    if (active) {
      // ACTIVATE: Create trigger instances in Composio
      const activatedTriggers = [];
      
      for (const trigger of triggers) {
        try {
          console.log(`[Activate Workflow] Creating trigger instance for ${trigger.trigger_name}`);
          
          // Create trigger instance in Composio
          const triggerInstance = await composio.triggers.create(
            user.id,
            trigger.trigger_name,
            {
              connectedAccountId: trigger.connected_account_id,
              triggerConfig: {
                ...trigger.trigger_config,
                webhookUrl: webhookUrl
              }
            }
          );

          console.log(`[Activate Workflow] Created trigger instance:`, triggerInstance.triggerId);

          // Update trigger in database with Composio trigger ID
          const { error: updateError } = await supabase
            .from('workflow_triggers')
            .update({
              composio_trigger_id: triggerInstance.triggerId,
              active: true,
              metadata: {
                ...trigger.metadata,
                activated_at: new Date().toISOString(),
                webhook_url: webhookUrl
              }
            })
            .eq('id', trigger.id);

          if (updateError) {
            console.error(`[Activate Workflow] Failed to update trigger ${trigger.id}:`, updateError);
          }

          activatedTriggers.push(trigger.id);
        } catch (error) {
          console.error(`[Activate Workflow] Failed to create trigger instance for ${trigger.trigger_name}:`, error);
          // Continue with other triggers even if one fails
        }
      }

      // Update workflow status and webhook URL
      const { error: updateWorkflowError } = await supabase
        .from('workflows')
        .update({
          active: true,
          webhook_url: webhookUrl
        })
        .eq('id', workflowId);

      if (updateWorkflowError) {
        throw new Error(`Failed to update workflow: ${updateWorkflowError.message}`);
      }

      return NextResponse.json({
        success: true,
        activated_triggers: activatedTriggers.length,
        webhook_url: webhookUrl
      });
    } else {
      // DEACTIVATE: Disable trigger instances in Composio
      const deactivatedTriggers = [];
      
      for (const trigger of triggers) {
        if (trigger.composio_trigger_id) {
          try {
            console.log(`[Activate Workflow] Disabling trigger instance ${trigger.composio_trigger_id}`);
            
            // Delete trigger instance from Composio
            await composio.triggers.delete(trigger.composio_trigger_id);

            // Update trigger in database
            const { error: updateError } = await supabase
              .from('workflow_triggers')
              .update({
                composio_trigger_id: null,
                active: false,
                metadata: {
                  ...trigger.metadata,
                  deactivated_at: new Date().toISOString()
                }
              })
              .eq('id', trigger.id);

            if (updateError) {
              console.error(`[Activate Workflow] Failed to update trigger ${trigger.id}:`, updateError);
            }

            deactivatedTriggers.push(trigger.id);
          } catch (error) {
            console.error(`[Activate Workflow] Failed to delete trigger instance ${trigger.composio_trigger_id}:`, error);
            // Continue with other triggers even if one fails
          }
        }
      }

      // Update workflow status
      const { error: updateWorkflowError } = await supabase
        .from('workflows')
        .update({ active: false })
        .eq('id', workflowId);

      if (updateWorkflowError) {
        throw new Error(`Failed to update workflow: ${updateWorkflowError.message}`);
      }

      return NextResponse.json({
        success: true,
        deactivated_triggers: deactivatedTriggers.length
      });
    }
  } catch (error) {
    console.error('[Activate Workflow] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to activate/deactivate workflow' },
      { status: 500 }
    );
  }
}
