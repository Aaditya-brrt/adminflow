"use client";

import DashboardLayout from "@/components/dashboard/DashboardLayout";
import IntegrationsModalClient from "@/components/dashboard/IntegrationsModalClient";

export default function IntegrationsPage() {
  return (
    <DashboardLayout>
      <div className="p-4">
        <h1 className="text-2xl font-bold mb-4">Integrations</h1>
        <p className="text-muted-foreground mb-6">
          Connect your favorite tools and services to automate your workflows.
        </p>
        <IntegrationsModalClient />
      </div>
    </DashboardLayout>
  );
} 