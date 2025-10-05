import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { WorkflowExecutor } from '@/lib/service/workflow-executor';

export async function POST(
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

    console.log(`[API] Manual execution requested for workflow ${id} by user ${user.id}`);

    // Initialize workflow executor
    const executor = new WorkflowExecutor(supabase);
    
    // Execute the workflow
    const result = await executor.executeWorkflow(id, user.id);
    
    if (result.success) {
      return NextResponse.json({
        success: true,
        message: 'Workflow executed successfully',
        output: result.output,
        toolCalls: result.toolCalls,
        executionTime: result.executionTime,
        runId: result.runId
      });
    } else {
      return NextResponse.json({
        success: false,
        error: result.error,
        executionTime: result.executionTime,
        runId: result.runId
      }, { status: 400 });
    }
    
  } catch (error) {
    console.error('Error executing workflow:', error);
    return NextResponse.json({ 
      success: false,
      error: 'Failed to execute workflow' 
    }, { status: 500 });
  }
} 