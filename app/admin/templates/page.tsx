import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { DashboardHeader } from "@/components/shared/dashboard-header";
import { AdminTemplateManager } from "@/components/shared/admin-template-manager";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "템플릿 관리 (관리자)",
};

export default async function AdminTemplatesPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("name, role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") redirect("/dashboard");

  const { data: templates } = await supabase
    .from("templates")
    .select("*")
    .order("sort_order", { ascending: true });

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader
        userName={profile.name ?? user.email ?? ""}
        isAdmin
      />
      <main className="max-w-4xl mx-auto px-4 py-10">
        <div className="mb-8">
          <h1 className="text-2xl font-bold">템플릿 관리</h1>
          <p className="text-muted-foreground text-sm mt-1">
            플랫폼에서 제공할 템플릿을 추가하고 관리합니다.
          </p>
        </div>
        <AdminTemplateManager initialTemplates={templates ?? []} />
      </main>
    </div>
  );
}
