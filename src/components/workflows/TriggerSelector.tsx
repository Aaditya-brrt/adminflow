"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Plus, ChevronDown, Zap } from "lucide-react";
import { TriggerSelectorProps, TriggerType } from "@/types/triggers";
import { useTriggers } from "@/hooks/useTriggers";
import { useToast } from "@/components/ui/use-toast";

export function TriggerSelector({ onTriggerAdd, existingTriggers, disabled }: TriggerSelectorProps) {
  const { triggers, connectedAccounts, loading, error } = useTriggers();
  const { toast } = useToast();
  
  const [selectedToolkit, setSelectedToolkit] = useState<string>("");
  const [selectedTrigger, setSelectedTrigger] = useState<TriggerType | null>(null);
  const [showToolkits, setShowToolkits] = useState(false);
  const [showTriggers, setShowTriggers] = useState(false);

  // Get unique toolkits with connected accounts
  const availableToolkits = React.useMemo(() => {
    return Array.from(new Set(triggers.map(t => t.toolkit)))
      .map(toolkit => ({
        slug: toolkit,
        name: toolkit.charAt(0).toUpperCase() + toolkit.slice(1),
        triggersCount: triggers.filter(t => t.toolkit === toolkit).length,
        connectedAccount: connectedAccounts.find(acc => acc.toolkit === toolkit)
      }))
      .filter(tk => tk.connectedAccount);
  }, [triggers, connectedAccounts]);

  // Get triggers for selected toolkit
  const toolkitTriggers = React.useMemo(() => {
    if (!selectedToolkit) return [];
    return triggers.filter(t => t.toolkit === selectedToolkit);
  }, [selectedToolkit, triggers]);

  const handleToolkitSelect = (toolkitSlug: string) => {
    setSelectedToolkit(toolkitSlug);
    setSelectedTrigger(null);
    setShowToolkits(false);
    setShowTriggers(true);
  };

  const handleTriggerSelect = (trigger: TriggerType) => {
    setSelectedTrigger(trigger);
    setShowTriggers(false);
  };

  const handleAddTrigger = () => {
    if (!selectedTrigger || !selectedToolkit) {
      toast({
        title: "Error",
        description: "Please select a trigger first",
        variant: "destructive",
      });
      return;
    }

    const connectedAccount = connectedAccounts.find(acc => acc.toolkit === selectedToolkit);
    if (!connectedAccount) {
      toast({
        title: "Error",
        description: "No connected account found for this toolkit",
        variant: "destructive",
      });
      return;
    }

    // Check if trigger already exists
    const triggerExists = existingTriggers.some(
      t => t.trigger_name === selectedTrigger.slug && t.toolkit_slug === selectedToolkit
    );

    if (triggerExists) {
      toast({
        title: "Error",
        description: "This trigger has already been added",
        variant: "destructive",
      });
      return;
    }

    onTriggerAdd({
      toolkit_slug: selectedToolkit,
      trigger_name: selectedTrigger.slug,
      trigger_config: selectedTrigger.config || {},
      connected_account_id: connectedAccount.id,
      active: false,
      metadata: {
        trigger_display_name: selectedTrigger.name,
        toolkit_display_name: selectedToolkit.charAt(0).toUpperCase() + selectedToolkit.slice(1)
      }
    });

    // Reset selection
    setSelectedToolkit("");
    setSelectedTrigger(null);
    
    toast({
      title: "Success",
      description: "Trigger added successfully",
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-6">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-sm text-destructive p-4 bg-destructive/10 rounded-md">
        {error}
      </div>
    );
  }

  if (availableToolkits.length === 0) {
    return (
      <div className="text-sm text-muted-foreground p-4 bg-muted/50 rounded-md">
        No connected integrations found. Please connect an integration first.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Step 1: Select Integration */}
      <div>
        <label className="block text-sm font-medium mb-2">
          1. Select Integration
        </label>
        <div className="relative">
          <Button
            variant="outline"
            className="w-full justify-between"
            onClick={() => setShowToolkits(!showToolkits)}
            disabled={disabled}
          >
            <span>
              {selectedToolkit
                ? availableToolkits.find(t => t.slug === selectedToolkit)?.name
                : "Choose an integration..."}
            </span>
            <ChevronDown className="h-4 w-4 ml-2" />
          </Button>
          
          {showToolkits && (
            <Card className="absolute z-10 w-full mt-2 p-2 max-h-60 overflow-y-auto">
              {availableToolkits.map((toolkit) => (
                <button
                  key={toolkit.slug}
                  onClick={() => handleToolkitSelect(toolkit.slug)}
                  className="w-full text-left px-3 py-2 rounded-md hover:bg-accent transition-colors flex items-center justify-between"
                >
                  <span className="font-medium">{toolkit.name}</span>
                  <Badge variant="secondary">{toolkit.triggersCount} triggers</Badge>
                </button>
              ))}
            </Card>
          )}
        </div>
      </div>

      {/* Step 2: Select Trigger */}
      {selectedToolkit && (
        <div>
          <label className="block text-sm font-medium mb-2">
            2. Select Trigger Event
          </label>
          <div className="relative">
            <Button
              variant="outline"
              className="w-full justify-between"
              onClick={() => setShowTriggers(!showTriggers)}
              disabled={disabled}
            >
              <span>
                {selectedTrigger?.name || "Choose a trigger event..."}
              </span>
              <ChevronDown className="h-4 w-4 ml-2" />
            </Button>
            
            {showTriggers && (
              <Card className="absolute z-10 w-full mt-2 p-2 max-h-60 overflow-y-auto">
                {toolkitTriggers.length === 0 ? (
                  <div className="px-3 py-2 text-sm text-muted-foreground">
                    No triggers available for this integration
                  </div>
                ) : (
                  toolkitTriggers.map((trigger) => (
                    <button
                      key={trigger.slug}
                      onClick={() => handleTriggerSelect(trigger)}
                      className="w-full text-left px-3 py-2 rounded-md hover:bg-accent transition-colors"
                    >
                      <div className="flex items-start space-x-2">
                        <Zap className="h-4 w-4 mt-0.5 text-primary" />
                        <div>
                          <div className="font-medium text-sm">{trigger.name}</div>
                          {trigger.description && (
                            <div className="text-xs text-muted-foreground mt-1">
                              {trigger.description}
                            </div>
                          )}
                        </div>
                      </div>
                    </button>
                  ))
                )}
              </Card>
            )}
          </div>
        </div>
      )}

      {/* Selected Trigger Preview */}
      {selectedTrigger && (
        <div className="bg-muted/50 rounded-lg p-4">
          <div className="flex items-center space-x-2 text-sm mb-2">
            <Zap className="h-4 w-4 text-primary" />
            <span className="font-medium">{selectedTrigger.name}</span>
          </div>
          <div className="text-xs text-muted-foreground">
            {selectedTrigger.description || "No description available"}
          </div>
        </div>
      )}

      {/* Add Button */}
      {selectedTrigger && (
        <Button
          onClick={handleAddTrigger}
          disabled={disabled}
          className="w-full"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Trigger
        </Button>
      )}
    </div>
  );
}

