import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import composio from '@/lib/service/composio';
type ConnectionRequestResponse = {
  id: string;
  redirectUrl?: string | null;
};
 
export async function POST(request: NextRequest) {
  try {
    // Get authenticated user
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { authConfigId } = await request.json();
    console.log(authConfigId);

    if (!authConfigId) {
      return NextResponse.json(
        { error: 'authConfigId is required' },
        { status: 400 }
      );
    }

    // Get the origin for redirect URL
    const origin = request.headers.get('origin') || 'http://localhost:3000';
    const callbackUrl = `${origin}/api/connections/callback`;

    // Initiate the connection
    const connection = await composio.connectedAccounts.initiate(
      user.id,
      authConfigId,
      // {
      //   callbackUrl,
      // }
    ) as ConnectionRequestResponse;

    return NextResponse.json({
      redirectUrl: connection.redirectUrl,
      connectionId: connection.id,
    });
  } catch (error) {
    console.error('Error initiating connection:', error);
    return NextResponse.json(
      { error: 'Failed to initiate connection' },
      { status: 500 }
    );
  }
} 