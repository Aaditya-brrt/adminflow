"use client";

import DashboardLayout from "@/components/dashboard/DashboardLayout";

export default function WorkflowLogsPage({ params }: { params: { id: string } }) {
  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto p-6">
        <h1 className="text-2xl font-bold mb-4">Workflow Logs: {params.id}</h1>
        {/* TODO: Logs table/list for workflow runs */}
        <div className="bg-card rounded p-4">(Logs table/list placeholder)</div>
      </div>
    </DashboardLayout>
  );
} 