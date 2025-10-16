"use client";

import React from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trash2, Zap, Loader2 } from "lucide-react";
import { TriggerListProps } from "@/types/triggers";

export function TriggerList({ triggers, onDelete, loading }: TriggerListProps) {
  if (loading) {
    return (
      <div className="flex items-center justify-center p-6">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  if (triggers.length === 0) {
    return (
      <div className="text-sm text-muted-foreground p-4 bg-muted/50 rounded-md text-center">
        No triggers configured yet
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {triggers.map((trigger) => (
        <Card key={trigger.id} className="p-3">
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-3 flex-1">
              <Zap className="h-4 w-4 mt-1 text-primary flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2">
                  <span className="font-medium text-sm">
                    {trigger.metadata?.trigger_display_name || trigger.trigger_name}
                  </span>
                  <Badge variant={trigger.active ? "default" : "secondary"} className="text-xs">
                    {trigger.active ? "Active" : "Inactive"}
                  </Badge>
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  {trigger.metadata?.toolkit_display_name || trigger.toolkit_slug}
                </div>
                {trigger.metadata?.webhook_url && (
                  <div className="text-xs text-muted-foreground mt-1 truncate">
                    Webhook: {trigger.metadata.webhook_url}
                  </div>
                )}
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onDelete(trigger.id)}
              className="flex-shrink-0 ml-2"
            >
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </div>
        </Card>
      ))}
    </div>
  );
}

