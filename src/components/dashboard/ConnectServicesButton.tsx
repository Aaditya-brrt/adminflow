"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export function ConnectServicesButton() {
  const router = useRouter();
  return (
    <Button variant="outline" onClick={() => router.push("/integrations")}>Connect Services</Button>
  );
} 