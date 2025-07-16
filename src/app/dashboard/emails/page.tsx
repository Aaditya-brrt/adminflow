"use client";

import DashboardLayout from "@/components/dashboard/DashboardLayout";
import InformationPanel from "@/components/dashboard/InformationPanel";

export default function EmailsPage() {
  return (
    <DashboardLayout>
      <div className="p-4">
        <InformationPanel title="Email Management" type="email" />
      </div>
    </DashboardLayout>
  );
} 