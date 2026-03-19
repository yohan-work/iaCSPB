import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { DashboardHeader } from "@/components/shared/dashboard-header";
import { CreateProjectFlow } from "@/components/shared/create-project-flow";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "새 프로젝트 만들기",
};

export default async function NewProjectPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: templates } = await supabase
    .from("templates")
    .select("*")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  const { data: profile } = await supabase
    .from("profiles")
    .select("name, role")
    .eq("id", user.id)
    .single();

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader
        userName={profile?.name ?? user.email ?? ""}
        isAdmin={profile?.role === "admin"}
      />
      <main className="max-w-4xl mx-auto px-4 py-10">
        <div className="mb-8">
          <h1 className="text-2xl font-bold">새 프로젝트 만들기</h1>
          <p className="text-muted-foreground text-sm mt-1">
            템플릿을 고르고 이름을 입력하면 바로 시작할 수 있습니다.
          </p>
        </div>
        <CreateProjectFlow templates={templates ?? []} />
      </main>
    </div>
  );
}
