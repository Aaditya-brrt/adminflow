"use client";

import dynamic from "next/dynamic";
import { useEffect } from "react";
import { createPortal } from "react-dom";

const IntegrationsCard = dynamic(() => import("./IntegrationsCard"), { ssr: false });

function ModalPortal({ children }: { children: React.ReactNode }) {
  if (typeof window === "undefined") return null;
  const modalRoot = document.getElementById("modal-root") || (() => {
    const el = document.createElement("div");
    el.id = "modal-root";
    document.body.appendChild(el);
    return el;
  })();
  return createPortal(children, modalRoot);
}

export default function IntegrationsModalClient() {
  // Prevent background scroll when modal is open
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  return (
    <ModalPortal>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
        <div className="relative w-full max-w-md mx-auto my-8 bg-card rounded-xl shadow-2xl border border-border flex flex-col max-h-[90vh]">
          <IntegrationsCard onClose={() => window.history.back()} />
        </div>
      </div>
    </ModalPortal>
  );
} 