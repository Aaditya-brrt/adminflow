"use client";

import DashboardLayout from "@/components/dashboard/DashboardLayout";
import InformationPanel from "@/components/dashboard/InformationPanel";

export default function TasksPage() {
  return (
    <DashboardLayout>
      <div className="p-4">
        <InformationPanel title="Task Management" type="task" />
      </div>
    </DashboardLayout>
  );
} 