import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import composio from '@/lib/service/composio';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ toolkit: string }> }
) {
  try {
    const { toolkit } = await params;
    
    // Get authenticated user
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log(`[Triggers API] Fetching triggers for toolkit: ${toolkit}`);

    // Fetch trigger types for the specific toolkit
    const triggerTypes = await composio.triggers.listTypes({
      toolkits: [toolkit]
    });

    if (!triggerTypes || !triggerTypes.items) {
      return NextResponse.json({
        triggers: [],
        message: `No triggers found for ${toolkit}`
      });
    }

    // Format triggers
    const formattedTriggers = triggerTypes.items.map((trigger: any) => ({
      name: trigger.name || trigger.slug,
      slug: trigger.slug,
      description: trigger.description || `Trigger for ${toolkit}`,
      toolkit: toolkit,
      schema: trigger.config || {},
      payload: trigger.payload || {},
      config: trigger.config || {}
    }));

    console.log(`[Triggers API] Found ${formattedTriggers.length} triggers for ${toolkit}`);

    return NextResponse.json({
      triggers: formattedTriggers
    });
  } catch (error) {
    console.error('[Triggers API] Error fetching toolkit triggers:', error);
    return NextResponse.json(
      { error: `Failed to fetch triggers for toolkit` },
      { status: 500 }
    );
  }
}

