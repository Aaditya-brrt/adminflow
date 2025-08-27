# Composio Integrations Setup

This document explains how to set up Composio integrations for the AdminFlow application.

## Prerequisites

1. **Composio Account**: You need a Composio account with API access
2. **Auth Configs**: Create authentication configurations for the services you want to integrate
3. **Environment Variables**: Configure the necessary environment variables

## Step 1: Create Auth Configs in Composio Dashboard

1. Log into your [Composio Dashboard](https://dashboard.composio.dev)
2. Navigate to "Auth Configs" section
3. Create new auth configs for each service you want to integrate:
   - Gmail
   - GitHub
   - Notion
   - Slack
   - Linear
   - HubSpot
   - Google Calendar
   - Google Docs
   - Google Sheets
   - Google Drive

4. For each auth config, note down the `ac_xxxxxxxxxx` ID

## Step 2: Configure Environment Variables

Create a `.env.local` file in your project root with the following variables:

```bash
# Composio Configuration
COMPOSIO_API_KEY=your_composio_api_key

# Integration Auth Config IDs
NEXT_PUBLIC_GMAIL_AUTH_CONFIG_ID=ac_xxxxxxxxxx
NEXT_PUBLIC_GITHUB_AUTH_CONFIG_ID=ac_xxxxxxxxxx
NEXT_PUBLIC_NOTION_AUTH_CONFIG_ID=ac_xxxxxxxxxx
NEXT_PUBLIC_SLACK_AUTH_CONFIG_ID=ac_xxxxxxxxxx
NEXT_PUBLIC_LINEAR_AUTH_CONFIG_ID=ac_xxxxxxxxxx
NEXT_PUBLIC_HUBSPOT_AUTH_CONFIG_ID=ac_xxxxxxxxxx
NEXT_PUBLIC_GOOGLECALENDAR_AUTH_CONFIG_ID=ac_xxxxxxxxxx
NEXT_PUBLIC_GOOGLEDOCS_AUTH_CONFIG_ID=ac_xxxxxxxxxx
NEXT_PUBLIC_GOOGLESHEETS_AUTH_CONFIG_ID=ac_xxxxxxxxxx
NEXT_PUBLIC_GOOGLEDRIVE_AUTH_CONFIG_ID=ac_xxxxxxxxxx
```

## Step 3: Install Dependencies

Make sure you have the required Composio packages installed:

```bash
npm install @composio/core @composio/vercel
```

## Step 4: Test the Integration

1. Start your development server: `npm run dev`
2. Navigate to `/integrations` page
3. Try connecting to a service
4. Check the browser console and server logs for any errors

## How It Works

### 1. Integration Flow

1. **User clicks "Connect"** on an integration
2. **System checks** if auth config ID is configured
3. **Composio API call** initiates OAuth flow
4. **User redirected** to service for authentication
5. **Callback handling** processes the OAuth response
6. **Connection status** is updated in the UI

### 2. API Endpoints

- `GET /api/composio/toolkits` - Fetch available integrations
- `POST /api/connections/initiate` - Start OAuth flow
- `GET /api/connections/callback` - Check connection status
- `DELETE /api/connections/delete` - Remove connection

### 3. Components

- `IntegrationsCard` - Main integration management interface
- `IntegrationStatus` - Dashboard widget showing connection status
- `useIntegrations` - Hook for managing integration state
- `IntegrationsService` - Service layer for API calls

## Troubleshooting

### Common Issues

1. **"Auth config not configured" error**
   - Check that the environment variable is set correctly
   - Verify the auth config ID in your Composio dashboard

2. **OAuth redirect errors**
   - Ensure your redirect URLs are configured correctly in Composio
   - Check that your domain is allowed in the auth config

3. **API key errors**
   - Verify your `COMPOSIO_API_KEY` is correct
   - Check that your Composio account has the necessary permissions

### Debug Mode

Enable debug logging by setting:

```bash
NODE_ENV=development
```

This will show detailed logs in the console for debugging integration issues.

## Security Considerations

1. **Environment Variables**: Never commit `.env.local` to version control
2. **API Keys**: Keep your Composio API key secure
3. **OAuth Scopes**: Only request the minimum permissions needed
4. **User Data**: Handle user data according to privacy regulations

## Next Steps

Once integrations are working:

1. **Workflow Builder**: Use connected integrations in workflow automation
2. **AI Assistant**: Enable AI to interact with connected services
3. **Monitoring**: Add logging and monitoring for integration health
4. **Error Handling**: Implement retry mechanisms for failed connections 