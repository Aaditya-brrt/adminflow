import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { WorkflowService } from '@/lib/service/workflow';

export async function GET() {
  try {
    // Get authenticated user
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const workflowService = new WorkflowService(supabase);
    const workflows = await workflowService.getWorkflows();
    return NextResponse.json(workflows);
  } catch (error) {
    console.error('Error fetching workflows:', error);
    return NextResponse.json({ error: 'Failed to fetch workflows' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    // Get authenticated user
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, description, type, schedule_config, trigger_config, metadata, steps } = body;

    if (!name || !type) {
      return NextResponse.json({ 
        error: 'Name and type are required' 
      }, { status: 400 });
    }

    if (!['schedule', 'trigger'].includes(type)) {
      return NextResponse.json({ 
        error: 'Type must be either "schedule" or "trigger"' 
      }, { status: 400 });
    }

    const workflowService = new WorkflowService(supabase);
    const workflow = await workflowService.createWorkflow({
      name: name.trim(),
      description: description?.trim(),
      type,
      schedule_config,
      trigger_config,
      metadata: metadata || {},
      steps
    });

    return NextResponse.json(workflow);
  } catch (error) {
    console.error('Error creating workflow:', error);
    return NextResponse.json({ error: 'Failed to create workflow' }, { status: 500 });
  }
} 