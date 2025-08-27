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

    // Create a map of toolkit slugs to connection IDs
    const connectionMap = new Map();
    if (connectedAccounts.items) {
      connectedAccounts.items.forEach(account => {
        // Access the toolkit slug from the account
        if (account.toolkit?.slug) {
          connectionMap.set(account.toolkit.slug, account.id);
        }
      });
    }

    // Try to fetch available toolkits from Composio
    let toolkits: any[] = [];
    
    try {
      // Use the correct method to get toolkits
      const toolkitsResponse = await composio.toolkits.get({});
      
      if (toolkitsResponse && Array.isArray(toolkitsResponse)) {
        // Transform Composio toolkits to our format
        toolkits = toolkitsResponse.map(toolkit => ({
          name: toolkit.name || toolkit.slug,
          slug: toolkit.slug,
          description: `Access tools and triggers from ${toolkit.name || toolkit.slug}`,
          logo: getToolkitIcon(toolkit.slug),
          categories: toolkit.meta ? [
            toolkit.meta.toolsCount && toolkit.meta.toolsCount > 0 ? 'tools' : '', 
            toolkit.meta.triggersCount && toolkit.meta.triggersCount > 0 ? 'triggers' : ''
          ].filter(Boolean) : [],
          isConnected: connectionMap.has(toolkit.slug),
          connectionId: connectionMap.get(toolkit.slug),
        }));
      }
    } catch (toolkitError) {
      console.warn('Failed to fetch toolkits from Composio, using fallback:', toolkitError);
    }

    // If no toolkits were fetched, use fallback
    if (toolkits.length === 0) {
      toolkits = [
        {
          name: "Gmail",
          slug: "gmail",
          description: "Access and manage Gmail emails",
          logo: "📧",
          categories: ["communication", "email"],
          isConnected: connectionMap.has("gmail"),
          connectionId: connectionMap.get("gmail"),
        },
        {
          name: "GitHub",
          slug: "github",
          description: "Manage GitHub repositories and workflows",
          logo: "🐙",
          categories: ["development", "version-control"],
          isConnected: connectionMap.has("github"),
          connectionId: connectionMap.get("github"),
        },
        {
          name: "Notion",
          slug: "notion",
          description: "Access and manage Notion databases and pages",
          logo: "📝",
          categories: ["productivity", "documentation"],
          isConnected: connectionMap.has("notion"),
          connectionId: connectionMap.get("notion"),
        },
        {
          name: "Slack",
          slug: "slack",
          description: "Send messages and manage Slack channels",
          logo: "💬",
          categories: ["communication", "team-collaboration"],
          isConnected: connectionMap.has("slack"),
          connectionId: connectionMap.get("slack"),
        },
        {
          name: "Linear",
          slug: "linear",
          description: "Manage Linear projects and issues",
          logo: "📊",
          categories: ["project-management", "development"],
          isConnected: connectionMap.has("linear"),
          connectionId: connectionMap.get("linear"),
        },
        {
          name: "HubSpot",
          slug: "hubspot",
          description: "Manage HubSpot contacts and deals",
          logo: "🎯",
          categories: ["crm", "marketing"],
          isConnected: connectionMap.has("hubspot"),
          connectionId: connectionMap.get("hubspot"),
        },
        {
          name: "Google Calendar",
          slug: "googlecalendar",
          description: "Access and manage Google Calendar events",
          logo: "📅",
          categories: ["productivity", "scheduling"],
          isConnected: connectionMap.has("googlecalendar"),
          connectionId: connectionMap.get("googlecalendar"),
        },
        {
          name: "Google Docs",
          slug: "googledocs",
          description: "Create and manage Google Docs",
          logo: "📄",
          categories: ["productivity", "documentation"],
          isConnected: connectionMap.has("googledocs"),
          connectionId: connectionMap.get("googledocs"),
        },
        {
          name: "Google Sheets",
          slug: "googlesheets",
          description: "Access and manage Google Sheets",
          logo: "📊",
          categories: ["productivity", "spreadsheets"],
          isConnected: connectionMap.has("googlesheets"),
          connectionId: connectionMap.get("googlesheets"),
        },
        {
          name: "Google Drive",
          slug: "googledrive",
          description: "Access and manage Google Drive files",
          logo: "💾",
          categories: ["productivity", "file-management"],
          isConnected: connectionMap.has("googledrive"),
          connectionId: connectionMap.get("googledrive"),
        },
      ];
    }

    return NextResponse.json(toolkits);
  } catch (error) {
    console.error('Error in toolkits API:', error);
    
    // Return minimal fallback toolkits on critical error
    const fallbackToolkits = [
      {
        name: "Gmail",
        slug: "gmail",
        description: "Access and manage Gmail emails",
        logo: "📧",
        categories: ["communication", "email"],
        isConnected: false,
        connectionId: undefined,
      },
      {
        name: "GitHub",
        slug: "github",
        description: "Manage GitHub repositories and workflows",
        logo: "🐙",
        categories: ["development", "version-control"],
        isConnected: false,
        connectionId: undefined,
      },
      {
        name: "Notion",
        slug: "notion",
        description: "Access and manage Notion databases and pages",
        logo: "📝",
        categories: ["productivity", "documentation"],
        isConnected: false,
        connectionId: undefined,
      },
      {
        name: "Slack",
        slug: "slack",
        description: "Send messages and manage Slack channels",
        logo: "💬",
        categories: ["communication", "team-collaboration"],
        isConnected: false,
        connectionId: undefined,
      },
    ];
    
    return NextResponse.json(fallbackToolkits);
  }
}

// Helper function to get appropriate icons for toolkits
function getToolkitIcon(slug: string): string {
  const iconMap: Record<string, string> = {
    gmail: "📧",
    github: "🐙",
    notion: "📝",
    slack: "💬",
    linear: "📊",
    hubspot: "🎯",
    googlecalendar: "📅",
    googledocs: "📄",
    googlesheets: "📊",
    googledrive: "💾",
    discord: "🎮",
    trello: "📋",
    asana: "✅",
    jira: "🐛",
    confluence: "📚",
    figma: "🎨",
    zoom: "📹",
    teams: "👥",
    dropbox: "📁",
    box: "📦",
  };

  return iconMap[slug.toLowerCase()] || "🔗";
} 