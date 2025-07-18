"use client";

import DashboardLayout from "@/components/dashboard/DashboardLayout";

export default function WorkflowEditPage({ params }: { params: { id: string } }) {
  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto p-6">
        <h1 className="text-2xl font-bold mb-4">Edit Workflow: {params.id}</h1>
        {/* TODO: Edit form for workflow */}
        <div className="bg-card rounded p-4">(Edit form placeholder)</div>
      </div>
    </DashboardLayout>
  );
} 