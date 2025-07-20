"use client";

import dynamicImport from "next/dynamic";

const ChatClient = dynamicImport(() => import("./chat-client"), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
        <p>Loading...</p>
      </div>
    </div>
  ),
});

export default function ChatPage() {
  return <ChatClient />;
}

// Force dynamic rendering for this page
export const dynamic = 'force-dynamic'; 