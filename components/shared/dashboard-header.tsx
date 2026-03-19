"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { LogOut, Shield } from "lucide-react";

interface DashboardHeaderProps {
  userName: string;
  isAdmin?: boolean;
}

export function DashboardHeader({ userName, isAdmin }: DashboardHeaderProps) {
  const router = useRouter();

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <header className="border-b bg-background/95 backdrop-blur sticky top-0 z-10">
      <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link href="/dashboard" className="font-bold text-lg tracking-tight">
          MVP Builder
        </Link>
        <div className="flex items-center gap-3">
          {isAdmin && (
            <Button variant="ghost" size="sm" asChild>
              <Link href="/admin/templates">
                <Shield className="h-4 w-4" />
                관리자
              </Link>
            </Button>
          )}
          <span className="text-sm text-muted-foreground hidden sm:inline">
            {userName}
          </span>
          <Button variant="ghost" size="sm" onClick={handleSignOut}>
            <LogOut className="h-4 w-4" />
            <span className="sr-only">로그아웃</span>
          </Button>
        </div>
      </div>
    </header>
  );
}
