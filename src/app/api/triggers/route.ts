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

    // Get connected accounts for the user
    const connectedAccounts = await composio.connectedAccounts.list({
      userIds: [user.id],
    });

    // Filter for active accounts only
    const activeAccounts = connectedAccounts.items.filter(
      (account: any) => account.status === 'ACTIVE' && !account.isDisabled
    );

    if (activeAccounts.length === 0) {
      return NextResponse.json({ 
        triggers: [],
        connectedAccounts: [],
        message: 'No connected integrations found'
      });
    }

    // Extract unique toolkit slugs
    const toolkitSlugs = Array.from(
      new Set(activeAccounts.map((account: any) => account.toolkit.slug))
    );

    console.log('[Triggers API] Fetching triggers for toolkits:', toolkitSlugs);

    // Fetch trigger types for all connected toolkits
    const allTriggers: any[] = [];
    
    for (const toolkit of toolkitSlugs) {
      try {
        const triggerTypes = await composio.triggers.listTypes({
          toolkits: [toolkit]
        });
        
        if (triggerTypes && triggerTypes.items) {
          const formattedTriggers = triggerTypes.items.map((trigger: any) => ({
            name: trigger.name || trigger.slug,
            slug: trigger.slug,
            description: trigger.description || `Trigger for ${toolkit}`,
            toolkit: toolkit,
            schema: trigger.config || {},
            payload: trigger.payload || {}
          }));
          
          allTriggers.push(...formattedTriggers);
        }
      } catch (error) {
        console.warn(`[Triggers API] Failed to fetch triggers for ${toolkit}:`, error);
        // Continue with other toolkits even if one fails
      }
    }

    // Format connected accounts for response
    const formattedAccounts = activeAccounts.map((account: any) => ({
      id: account.id,
      toolkit: account.toolkit.slug,
      status: account.status
    }));

    return NextResponse.json({
      triggers: allTriggers,
      connectedAccounts: formattedAccounts
    });
  } catch (error) {
    console.error('[Triggers API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch triggers' },
      { status: 500 }
    );
  }
}

