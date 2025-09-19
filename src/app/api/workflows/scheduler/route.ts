import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { handleSchedulerControl } from '@/lib/service/workflow-scheduler';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { action } = body;

    if (!action || !['start', 'stop', 'status'].includes(action)) {
      return NextResponse.json({ 
        error: 'Invalid action. Must be "start", "stop", or "status"' 
      }, { status: 400 });
    }

    const result = await handleSchedulerControl(action);
    
    if (result.success) {
      return NextResponse.json(result);
    } else {
      return NextResponse.json(result, { status: 400 });
    }
    
  } catch (error) {
    console.error('Error controlling scheduler:', error);
    return NextResponse.json({ 
      error: 'Failed to control scheduler' 
    }, { status: 500 });
  }
}

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const result = await handleSchedulerControl('status');
    return NextResponse.json(result);
    
  } catch (error) {
    console.error('Error getting scheduler status:', error);
    return NextResponse.json({ 
      error: 'Failed to get scheduler status' 
    }, { status: 500 });
  }
} 