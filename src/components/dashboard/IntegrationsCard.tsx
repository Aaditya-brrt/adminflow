"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { X, Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { integrationsService, type Integration } from "@/lib/service/integrations";
import { useIntegrations } from "@/hooks/useIntegrations";
import { useToast } from "@/components/ui/use-toast";

export default function IntegrationsCard({ onClose }: { onClose?: () => void }) {
  const { integrations, loading, refreshIntegrations } = useIntegrations();
  const [connecting, setConnecting] = useState<string | null>(null);
  const [disconnecting, setDisconnecting] = useState<string | null>(null);
  const { toast } = useToast();

  const handleConnect = async (integration: Integration) => {
    try {
      setConnecting(integration.slug);
      
      // Get auth config ID from environment variables
      const authConfigId = process.env[`NEXT_PUBLIC_${integration.slug.toUpperCase()}_AUTH_CONFIG_ID`];
      console.log(integration.slug.toUpperCase(), authConfigId);
      
      if (!authConfigId) {
        toast({
          title: "Configuration Error",
          description: `Auth config for ${integration.name} is not configured`,
          variant: "destructive",
        });
        return;
      }

      const { redirectUrl, connectionId } = await integrationsService.initiateConnection(authConfigId);
      
      // Store connection ID for status checking
      localStorage.setItem(`connection_${integration.slug}`, connectionId);
      
      // Redirect to OAuth
      window.location.href = redirectUrl;
    } catch (error) {
      console.error('Error connecting integration:', error);
      toast({
        title: "Connection Error",
        description: `Failed to connect to ${integration.name}`,
        variant: "destructive",
      });
    } finally {
      setConnecting(null);
    }
  };

  const handleDisconnect = async (integration: Integration) => {
    if (!integration.connectionId) return;

    try {
      setDisconnecting(integration.slug);
      await integrationsService.deleteConnection(integration.connectionId);
      
      // Refresh the integrations list
      await refreshIntegrations();
      
      toast({
        title: "Success",
        description: `Disconnected from ${integration.name}`,
      });
    } catch (error) {
      console.error('Error disconnecting integration:', error);
      toast({
        title: "Disconnection Error",
        description: `Failed to disconnect from ${integration.name}`,
        variant: "destructive",
      });
    } finally {
      setDisconnecting(null);
    }
  };

  const getIntegrationIcon = (slug: string) => {
    // Return appropriate icon based on toolkit slug
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
    };
    
    return iconMap[slug.toLowerCase()] || "🔗";
  };

  if (loading) {
    return (
      <div className="w-full max-w-md rounded-xl p-0 overflow-hidden shadow-2xl relative bg-card border border-border">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="text-lg font-semibold">Add Integrations</h2>
          <button
            className="p-1 rounded hover:bg-muted transition-colors"
            aria-label="Close"
            onClick={onClose}
            type="button"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md rounded-xl p-0 overflow-hidden shadow-2xl relative bg-card border border-border">
      <div className="flex items-center justify-between px-6 py-4 border-b">
        <h2 className="text-lg font-semibold">Add Integrations</h2>
        <button
          className="p-1 rounded hover:bg-muted transition-colors"
          aria-label="Close"
          onClick={onClose}
          type="button"
        >
          <X className="h-5 w-5" />
        </button>
      </div>
      
      {/* Make the list scrollable if it overflows */}
      <div className="divide-y max-h-[60vh] overflow-y-auto">
        {integrations.map((integration) => (
          <div
            key={integration.slug}
            className="flex items-center justify-between px-6 py-4 gap-4 bg-transparent"
          >
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 flex items-center justify-center text-lg">
                {getIntegrationIcon(integration.slug)}
              </div>
              <div className="flex flex-col">
                <span className="font-medium">{integration.name}</span>
                <span className="text-xs text-muted-foreground">
                  {integration.description}
                </span>
              </div>
            </div>
            
            {integration.isConnected ? (
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <Button 
                  variant="ghost" 
                  className="text-destructive hover:bg-destructive/10" 
                  size="sm"
                  onClick={() => handleDisconnect(integration)}
                  disabled={disconnecting === integration.slug}
                >
                  {disconnecting === integration.slug ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "Disconnect"
                  )}
                </Button>
              </div>
            ) : (
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => handleConnect(integration)}
                disabled={connecting === integration.slug}
              >
                {connecting === integration.slug ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Connect"
                )}
              </Button>
            )}
          </div>
        ))}
      </div>
      
      {integrations.length === 0 && (
        <div className="flex items-center justify-center py-12 text-muted-foreground">
          <div className="text-center">
            <AlertCircle className="h-8 w-8 mx-auto mb-2" />
            <p>No integrations available</p>
          </div>
        </div>
      )}
    </div>
  );
} 