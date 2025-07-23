"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { X } from "lucide-react";
import Image from "next/image";

const INTEGRATIONS = [
  { name: "Gmail", icon: "/icons/gmail.svg", connected: true },
  { name: "Google Calendar", icon: "/icons/calendar.svg", connected: false },
  { name: "Google Meet", icon: "/icons/meet.svg", connected: false },
  { name: "Google Docs", icon: "/icons/docs.svg", connected: false },
  { name: "Google Sheets", icon: "/icons/sheets.svg", connected: true },
  { name: "Drive", icon: "/icons/drive.svg", connected: false },
  { name: "Notion", icon: "/icons/notion.svg", connected: false },
  { name: "Slack", icon: "/icons/slack.svg", connected: false },
  { name: "Linear", icon: "/icons/linear.svg", connected: false },
  { name: "Hubspot", icon: "/icons/hubspot.svg", connected: false },
];

export default function IntegrationsCard({ onClose }: { onClose?: () => void }) {
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
        {INTEGRATIONS.map((integration) => (
          <div
            key={integration.name}
            className="flex items-center justify-between px-6 py-4 gap-4 bg-transparent"
          >
            <div className="flex items-center gap-3">
              <Image
                src={integration.icon}
                alt={integration.name}
                width={28}
                height={28}
                className="rounded"
              />
              <span className="font-medium">{integration.name}</span>
            </div>
            {integration.connected ? (
              <Button variant="ghost" className="text-destructive hover:bg-destructive/10" size="sm">
                Disconnect
              </Button>
            ) : (
              <Button variant="outline" size="sm">
                Connect
              </Button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
} 