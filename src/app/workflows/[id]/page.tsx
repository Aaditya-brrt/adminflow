"use client";

import React from "react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";

export default function WorkflowDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = React.use(params);
  // TODO: Fetch workflow by id
  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto p-6">
        <h1 className="text-2xl font-bold mb-4">Workflow Detail: {id}</h1>
        {/* Overview Panel */}
        <section className="mb-6">
          <h2 className="font-semibold mb-2">Overview</h2>
          {/* TODO: Intent prompt, integrations, triggers */}
          <textarea className="input input-bordered w-full mb-2" placeholder="Describe what this agent does..." />
          <div className="flex gap-2 mb-2">
            <div className="bg-muted rounded p-2">Gmail (read)</div>
            <div className="bg-muted rounded p-2">Slack (write)</div>
            {/* TODO: Add integration toggles */}
          </div>
          <div className="flex gap-2">
            <select className="input input-bordered">
              <option>Event Trigger</option>
              <option>New Email</option>
              <option>Webhook</option>
              <option>Upserted CRM Record</option>
            </select>
            <input className="input input-bordered" placeholder="Schedule (e.g. Every day at 7AM)" />
            {/* TODO: Cross-workflow trigger select */}
          </div>
        </section>
        {/* Execution Schema & Debug */}
        <section className="mb-6">
          <h2 className="font-semibold mb-2">Execution Schema & Debug</h2>
          {/* TODO: Step breakdown, logs, run history, retry, versioned prompts */}
          <div className="bg-card rounded p-4 mb-2">(Step breakdown placeholder)</div>
          <div className="bg-card rounded p-4">(Logs & run history placeholder)</div>
        </section>
        {/* Collaboration Settings */}
        <section className="mb-6">
          <h2 className="font-semibold mb-2">Collaboration Settings</h2>
          {/* TODO: Linked workflows, permissions */}
          <div className="bg-card rounded p-4">(Linked workflows/permissions placeholder)</div>
        </section>
        {/* Save & Deploy */}
        <section className="flex gap-2">
          <button className="btn btn-primary">Save Draft</button>
          <button className="btn btn-secondary">Publish</button>
          <button className="btn btn-outline">Test Run</button>
        </section>
      </div>
    </DashboardLayout>
  );
} 