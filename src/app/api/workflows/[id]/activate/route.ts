import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { WorkflowService } from '@/lib/service/workflow';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // Get authenticated user
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { active } = body;

    if (typeof active !== 'boolean') {
      return NextResponse.json({ 
        error: 'Active field must be a boolean' 
      }, { status: 400 });
    }

    const workflowService = new WorkflowService(supabase);
    
    let workflow;
    if (active) {
      workflow = await workflowService.activateWorkflow(id);
    } else {
      workflow = await workflowService.deactivateWorkflow(id);
    }
    
    return NextResponse.json(workflow);
  } catch (error) {
    console.error('Error toggling workflow activation:', error);
    return NextResponse.json({ error: 'Failed to toggle workflow activation' }, { status: 500 });
  }
} 