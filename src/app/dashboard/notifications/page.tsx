"use client";

import DashboardLayout from "@/components/dashboard/DashboardLayout";
import InformationPanel from "@/components/dashboard/InformationPanel";

export default function NotificationsPage() {
  return (
    <DashboardLayout>
      <div className="p-4">
        <InformationPanel title="Notifications" type="notification" />
      </div>
    </DashboardLayout>
  );
} 