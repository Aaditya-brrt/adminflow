import { createClient } from '@/lib/supabase/client';

export interface Integration {
  name: string;
  slug: string;
  description: string;
  logo: string;
  categories: string[];
  isConnected: boolean;
  connectionId?: string;
}

export interface ConnectionStatus {
  id: string;
  status: string;
  authConfig: any;
  data: any;
}

class IntegrationsService {
  private supabase = createClient();

  async getToolkits(): Promise<Integration[]> {
    try {
      const response = await fetch('/api/composio/toolkits');
      if (!response.ok) {
        throw new Error('Failed to fetch toolkits');
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching toolkits:', error);
      return [];
    }
  }

  async initiateConnection(authConfigId: string): Promise<{ redirectUrl: string; connectionId: string }> {
    try {
      const response = await fetch('/api/connections/initiate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ authConfigId }),
      });

      if (!response.ok) {
        throw new Error('Failed to initiate connection');
      }

      return await response.json();
    } catch (error) {
      console.error('Error initiating connection:', error);
      throw error;
    }
  }

  async checkConnectionStatus(connectionId: string): Promise<ConnectionStatus> {
    try {
      const response = await fetch(`/api/connections/callback?connectionId=${connectionId}`);
      if (!response.ok) {
        throw new Error('Failed to check connection status');
      }
      return await response.json();
    } catch (error) {
      console.error('Error checking connection status:', error);
      throw error;
    }
  }

  async deleteConnection(connectionId: string): Promise<void> {
    try {
      const response = await fetch(`/api/connections/delete?connectionId=${connectionId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete connection');
      }
    } catch (error) {
      console.error('Error deleting connection:', error);
      throw error;
    }
  }

  async refreshToolkits(): Promise<Integration[]> {
    // Clear any cached data and fetch fresh toolkits
    return this.getToolkits();
  }
}

export const integrationsService = new IntegrationsService(); 