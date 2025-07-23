import { TempoInit } from "@/components/tempo-init";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { StagewiseToolbar } from "@stagewise/toolbar-next";
import ReactPlugin from "@stagewise-plugins/react";


const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "AdminFlow Project",
  description: "AI Employees",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <Script src="https://api.tempolabs.ai/proxy-asset?url=https://storage.googleapis.com/tempo-public-assets/error-handling.js" />
      <body className={inter.className}>
        <div id="modal-root"></div>
        {children}
        <StagewiseToolbar config={{ plugins: [ReactPlugin] }} />
        <TempoInit />
      </body>
    </html>
  );
}
