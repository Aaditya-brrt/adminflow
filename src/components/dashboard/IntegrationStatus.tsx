"use client";

import { useIntegrations } from "@/hooks/useIntegrations";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Settings, Plus } from "lucide-react";

export function IntegrationStatus() {
  const { integrations, loading, getConnectedIntegrations } = useIntegrations();
  
  const connectedIntegrations = getConnectedIntegrations();
  const totalIntegrations = integrations.length;

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Integrations</CardTitle>
          <CardDescription>Loading integration status...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-2">
            <div className="h-4 bg-muted rounded w-3/4"></div>
            <div className="h-4 bg-muted rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div>
          <CardTitle className="text-sm font-medium">Integrations</CardTitle>
          <CardDescription>
            {connectedIntegrations.length} of {totalIntegrations} connected
          </CardDescription>
        </div>
        <Link href="/integrations">
          <Button variant="outline" size="sm">
            <Settings className="h-4 w-4 mr-2" />
            Manage
          </Button>
        </Link>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {connectedIntegrations.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {connectedIntegrations.slice(0, 5).map((integration) => (
                <Badge key={integration.slug} variant="secondary" className="text-xs">
                  {integration.name}
                </Badge>
              ))}
              {connectedIntegrations.length > 5 && (
                <Badge variant="outline" className="text-xs">
                  +{connectedIntegrations.length - 5} more
                </Badge>
              )}
            </div>
          ) : (
            <div className="text-center py-4">
              <p className="text-sm text-muted-foreground mb-3">
                No integrations connected yet
              </p>
              <Link href="/integrations">
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Connect First Integration
                </Button>
              </Link>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
} 