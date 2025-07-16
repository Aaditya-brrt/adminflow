"use client";

import DashboardLayout from "@/components/dashboard/DashboardLayout";
import WorkflowBuilder from "@/components/dashboard/WorkflowBuilder";

export default function WorkflowsPage() {
  return (
    <DashboardLayout>
      <div className="p-4">
        <WorkflowBuilder />
      </div>
    </DashboardLayout>
  );
} 