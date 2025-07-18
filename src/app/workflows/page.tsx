"use client";

import DashboardLayout from "@/components/dashboard/DashboardLayout";
import AIAssistant from "@/components/dashboard/AIAssistant";
import { useState } from "react";
import Link from "next/link";

const workflowTemplates = [
  {
    id: "template1",
    name: "Email to Task",
    description: "Convert important emails into tasks automatically",
    services: ["Gmail", "Notion"],
    popularity: "Popular",
  },
  {
    id: "template2",
    name: "Meeting Notes",
    description: "Automatically create and distribute meeting notes",
    services: ["Google Calendar", "Notion", "Slack"],
    popularity: "Trending",
  },
  {
    id: "template3",
    name: "Contract Processing",
    description: "When receiving signed contracts, notify team and store documents",
    services: ["Gmail", "Google Drive", "Slack"],
    popularity: "New",
  },
  {
    id: "template4",
    name: "Invoice Tracking",
    description: "Track invoices and payment status automatically",
    services: ["Gmail", "Notion", "Slack"],
    popularity: "Popular",
  },
];

const tabList = ["Templates", "My Workflows", "Editor"];

export default function WorkflowsListPage() {
  const [activeTab, setActiveTab] = useState("Templates");
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);

  return (
    <DashboardLayout>
      <div className="flex flex-col lg:flex-row w-full h-full gap-4 p-6 max-w-7xl mx-auto">
        <div className="flex-1 flex flex-col gap-4">
          <div className="mb-2">
            <h1 className="text-2xl font-bold mb-1">Workflow Builder</h1>
            <p className="text-muted-foreground text-sm mb-4">Create and manage automated workflows between your connected apps</p>
            <div className="inline-flex h-9 items-center rounded-lg bg-muted p-1 text-muted-foreground w-full max-w-md mb-6">
              {tabList.map((tab) => (
                <button
                  key={tab}
                  className={`inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 ${activeTab === tab ? "bg-background text-foreground shadow" : ""}`}
                  onClick={() => setActiveTab(tab)}
                  disabled={tab === "Editor"}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>
          {activeTab === "Templates" && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {workflowTemplates.map((template) => (
                <Link
                  key={template.id}
                  href={`/workflows/${template.id}`}
                  className={`relative bg-white border rounded-xl shadow-sm p-6 flex flex-col min-h-[220px] cursor-pointer hover:shadow-md transition-all ${selectedTemplate === template.id ? "border-primary" : "border-border"}`}
                >
                  <span className="absolute top-4 right-4 text-xs bg-muted px-2 py-0.5 rounded font-medium text-muted-foreground">
                    {template.popularity}
                  </span>
                  <div className="font-bold text-lg mb-1">{template.name}</div>
                  <div className="text-sm text-muted-foreground mb-4 flex-1">{template.description}</div>
                  <div className="flex gap-2 flex-wrap mt-auto">
                    {template.services.map((service) => (
                      <span key={service} className="text-xs bg-muted px-2 py-0.5 rounded font-medium text-muted-foreground border border-border">
                        {service}
                      </span>
                    ))}
                  </div>
                </Link>
              ))}
            </div>
          )}
          {/* TODO: My Workflows and Editor tabs */}
          <div className="flex justify-end gap-2 mt-8">
            <button className="btn btn-outline">➕ Create from Scratch</button>
            <button className="btn btn-secondary" disabled={!selectedTemplate}>Use Template</button>
          </div>
        </div>
        <div className="w-full lg:w-[400px] flex-shrink-0">
          <AIAssistant />
        </div>
      </div>
    </DashboardLayout>
  );
} 