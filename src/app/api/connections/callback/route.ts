import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import composio from '@/lib/service/composio';

export async function GET(request: NextRequest) {
  try {
    // Get authenticated user
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const connectionId = searchParams.get('connectionId');

    if (!connectionId) {
      return NextResponse.json(
        { error: 'connectionId is required' },
        { status: 400 }
      );
    }

    // Wait for connection to complete
    const connection = await composio.connectedAccounts.waitForConnection(connectionId);

    return NextResponse.json({
      id: connection.id,
      status: connection.status,
      authConfig: connection.authConfig,
      data: connection.data,
    });
  } catch (error) {
    console.error('Error checking connection status:', error);
    return NextResponse.json(
      { error: 'Failed to check connection status' },
      { status: 500 }
    );
  }
} 