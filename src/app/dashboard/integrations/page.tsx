"use client";

import DashboardLayout from "@/components/dashboard/DashboardLayout";

export default function IntegrationsPage() {
  return (
    <DashboardLayout>
      <div className="p-4">
        <h1 className="text-2xl font-bold mb-4">Integration Management</h1>
        <div className="bg-card rounded-lg p-6 border border-border">
          <p className="text-muted-foreground">Connect and manage permissions for your third-party services here. (Coming soon)</p>
        </div>
      </div>
    </DashboardLayout>
  );
} 