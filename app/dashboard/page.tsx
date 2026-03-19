import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ProjectCard } from "@/components/shared/project-card";
import { DashboardHeader } from "@/components/shared/dashboard-header";
import { Plus, Layers } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "대시보드",
};

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: projects } = await supabase
    .from("projects")
    .select("*, template:templates(id, slug, name, description, preview_image), project_blocks(block_slug), provisioning_status, supabase_project_ref")
    .eq("user_id", user.id)
    .eq("status", "active")
    .order("created_at", { ascending: false });

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
      <main className="max-w-5xl mx-auto px-4 py-10">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold">내 프로젝트</h1>
            <p className="text-muted-foreground text-sm mt-1">
              {projects?.length ?? 0}개의 프로젝트
            </p>
          </div>
          <Button asChild>
            <Link href="/dashboard/new">
              <Plus />
              새 프로젝트
            </Link>
          </Button>
        </div>

        {!projects || projects.length === 0 ? (
          <div className="text-center py-20 border-2 border-dashed rounded-xl">
            <Layers className="mx-auto h-12 w-12 text-muted-foreground/40 mb-4" />
            <h3 className="text-lg font-medium mb-2">아직 프로젝트가 없습니다</h3>
            <p className="text-muted-foreground text-sm mb-6">
              템플릿을 골라 1분 안에 첫 번째 MVP를 만들어보세요.
            </p>
            <Button asChild>
              <Link href="/dashboard/new">
                <Plus />
                첫 프로젝트 만들기
              </Link>
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {projects.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
