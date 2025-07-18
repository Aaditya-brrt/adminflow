"use client";

import DashboardLayout from "@/components/dashboard/DashboardLayout";
import AIAssistant from "@/components/dashboard/AIAssistant";

function MetricCards() {
  // TODO: Replace with real metrics
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      <div className="bg-card rounded-lg p-4 shadow border"><div className="text-sm text-muted-foreground">Active Workflows</div><div className="text-2xl font-bold">--</div></div>
      <div className="bg-card rounded-lg p-4 shadow border"><div className="text-sm text-muted-foreground">Monthly Runs</div><div className="text-2xl font-bold">--</div></div>
      <div className="bg-card rounded-lg p-4 shadow border"><div className="text-sm text-muted-foreground">Hours Saved</div><div className="text-2xl font-bold">--</div></div>
      <div className="bg-card rounded-lg p-4 shadow border"><div className="text-sm text-muted-foreground">Error Rate</div><div className="text-2xl font-bold">--</div></div>
    </div>
  );
}

function RecentActivity() {
  // TODO: Implement timeline of last 10 runs
  return (
    <div className="bg-card rounded-lg p-4 shadow border mb-6">
      <div className="font-semibold mb-2">Recent Workflow Activity</div>
      <div className="text-muted-foreground text-sm">(Timeline placeholder)</div>
    </div>
  );
}

function AgentCollaborationSnapshot() {
  // TODO: Implement mini-graph of workflow triggers
  return (
    <div className="bg-card rounded-lg p-4 shadow border mb-6">
      <div className="font-semibold mb-2">Agent Collaboration Snapshot</div>
      <div className="text-muted-foreground text-sm">(Mini-graph placeholder)</div>
    </div>
  );
}

function QuickActions() {
  // TODO: Implement quick actions
  return (
    <div className="bg-card rounded-lg p-4 shadow border flex gap-4">
      <button className="btn btn-primary">➕ Create New Workflow</button>
      <button className="btn btn-secondary">▶️ Run Workflow Manually</button>
      <button className="btn btn-outline">🔄 Retry Failed Runs</button>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <DashboardLayout>
      <div className="flex flex-col lg:flex-row w-full h-full gap-4 p-6 max-w-7xl mx-auto">
        <div className="flex-1 flex flex-col gap-4">
          <MetricCards />
          <RecentActivity />
          <AgentCollaborationSnapshot />
          <QuickActions />
        </div>
        <div className="w-full lg:w-[400px] flex-shrink-0">
          <AIAssistant />
        </div>
      </div>
    </DashboardLayout>
  );
} 