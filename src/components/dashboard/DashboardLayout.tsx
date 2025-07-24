"use client";

import React, { useState, useEffect } from "react";
import { Bell, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import Link from "next/link";
import { ConnectServicesButton } from "./ConnectServicesButton";
import { createClient } from "@/lib/supabase/client";

interface DashboardLayoutProps {
  children?: React.ReactNode;
}

export default function DashboardLayout({
  children,
}: DashboardLayoutProps = {}) {
    const [user, setUser] = useState<{ name: string; email: string; avatar: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setUser({
          name: user.user_metadata?.full_name || user.email || 'Unknown',
          email: user.email || 'No email',
          avatar: user.user_metadata?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.id}`
        });
      }
      setLoading(false);
    });
  }, []);

  // Mock notification count
  const notificationCount = 3;

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <div className={`w-64 bg-card border-r border-border transition-all duration-300 flex flex-col`}>
        <div className="p-4 flex items-center justify-between">
          <div className="flex items-center">
            <div className="h-8 w-8 rounded-md bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold">A</span>
            </div>
              <span className="ml-2 font-bold text-lg">AdminFlow</span>
          </div>
        </div>
        <Separator />
        <nav className="flex-1 p-4">
          <ul className="space-y-2">
            <li>
              <Link href="/dashboard" className="block w-full px-4 py-2 rounded hover:bg-accent transition-colors font-medium">
                Dashboard
              </Link>
            </li>
            <li>
              <Link href="/workflows" className="block w-full px-4 py-2 rounded hover:bg-accent transition-colors font-medium">
                Workflows
              </Link>
            </li>
            <li>
              <Link href="/chat" className="block w-full px-4 py-2 rounded hover:bg-accent transition-colors font-medium">
                Chat
              </Link>
            </li>
          </ul>
        </nav>
        <div className="p-4 mt-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
            <Avatar>
              {user ? (
              <AvatarImage src={user.avatar} alt={user.name} />
            ) : (
              <AvatarFallback>{loading ? '...' : '?'}</AvatarFallback>
            )}
              <AvatarFallback>JD</AvatarFallback>
            </Avatar>
              <div className="ml-2 overflow-hidden">
                {user ? (
                  <>
                    <p className="text-sm font-medium truncate">{user.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground truncate">
                    {loading ? 'Loading...' : 'Not authenticated'}
                  </p>
                )}
              </div>
            </div>
            <form action="/auth/logout" method="post">
              <Button variant="ghost" size="sm" type="submit" className="p-2">
                <LogOut className="h-5 w-5" aria-hidden="true" />
                <span className="sr-only">Logout</span>
              </Button>
            </form>
          </div>
        </div>
      </div>
      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="h-16 border-b border-border flex items-center justify-between px-6">
          <h1 className="text-xl font-semibold">AdminFlow</h1>
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="icon" className="relative">
              <Bell size={18} />
              <span className="absolute top-0 right-0 h-4 w-4 bg-destructive text-destructive-foreground text-xs rounded-full flex items-center justify-center">3</span>
            </Button>
            {/* Replace the old Connect Services button with the new one */}
            <ConnectServicesButton />
          </div>
        </header>
        {/* Main dashboard content */}
        <main className="flex-1 overflow-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
