"use client";

import DashboardLayout from "@/components/dashboard/DashboardLayout";
import AIAssistant from "@/components/dashboard/AIAssistant";
import InformationPanel from "@/components/dashboard/InformationPanel";
import WorkflowBuilder from "@/components/dashboard/WorkflowBuilder";

export default function DashboardPage() {
  return (
    <DashboardLayout>
      {/* You can customize this main dashboard view as needed */}
      <div className="flex flex-col lg:flex-row w-full h-full gap-4 p-4 bg-background">
        <div className="flex-1 flex flex-col gap-4">
          <h1 className="text-2xl font-bold">AdminFlow Dashboard</h1>
          {/* Example: Show overview panels or a welcome message */}
          <InformationPanel title="Overview" type="all" />
        </div>
        <div className="w-full lg:w-[400px] flex-shrink-0">
          <AIAssistant />
        </div>
      </div>
    </DashboardLayout>
  );
} 