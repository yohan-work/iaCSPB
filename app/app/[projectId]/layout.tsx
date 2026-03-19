import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { TEMPLATE_REGISTRY } from "@/lib/templates/registry";
import { LayoutDashboard, LogOut } from "lucide-react";
import type { TemplateSlug } from "@/types";

export default async function AppLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ projectId: string }>;
}) {
  const supabase = await createClient();
  const { projectId } = await params;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: project } = await supabase
    .from("projects")
    .select("*, template:templates(id, slug, name)")
    .eq("id", projectId)
    .eq("user_id", user.id)
    .single();

  if (!project) notFound();

  const templateSlug = project.template?.slug as TemplateSlug | undefined;
  const config = templateSlug ? TEMPLATE_REGISTRY[templateSlug] : null;
  const Icon = config?.icon;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* 앱 헤더 */}
      <header className="border-b bg-background/95 backdrop-blur sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {Icon && config && (
              <div
                className={`w-7 h-7 rounded-md flex items-center justify-center text-white text-xs ${config.color}`}
              >
                <Icon className="h-4 w-4" />
              </div>
            )}
            <span className="font-semibold text-sm">{project.name}</span>
            {project.template && (
              <>
                <Separator orientation="vertical" className="h-4" />
                <span className="text-xs text-muted-foreground">
                  {project.template.name}
                </span>
              </>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/dashboard">
                <LayoutDashboard className="h-4 w-4" />
                <span className="hidden sm:inline">대시보드</span>
              </Link>
            </Button>
          </div>
        </div>
      </header>

      {/* 콘텐츠 */}
      <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-8">
        {children}
      </main>
    </div>
  );
}
