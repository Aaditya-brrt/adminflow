import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { WorkflowService } from '@/lib/service/workflow';

export async function GET(
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

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');

    const workflowService = new WorkflowService(supabase);
    const runs = await workflowService.getWorkflowRuns(id, limit);
    
    return NextResponse.json(runs);
  } catch (error) {
    console.error('Error fetching workflow runs:', error);
    return NextResponse.json({ error: 'Failed to fetch workflow runs' }, { status: 500 });
  }
}

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
    const { input_data } = body;

    const workflowService = new WorkflowService(supabase);
    const run = await workflowService.createWorkflowRun(id, input_data);
    
    return NextResponse.json(run);
  } catch (error) {
    console.error('Error creating workflow run:', error);
    return NextResponse.json({ error: 'Failed to create workflow run' }, { status: 500 });
  }
} 