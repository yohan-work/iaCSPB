import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import { TodoApp } from "@/components/templates/todo/todo-app";
import { BlogApp } from "@/components/templates/blog/blog-app";
import { CrmApp } from "@/components/templates/crm/crm-app";
import { BookingApp } from "@/components/templates/booking/booking-app";
import type { TemplateSlug } from "@/types";

export default async function ProjectPage({
  params,
}: {
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

  const slug = project.template?.slug as TemplateSlug | undefined;

  if (slug === "todo") {
    const { data: todos } = await supabase
      .from("todo_items")
      .select("*")
      .eq("project_id", projectId)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true });

    return <TodoApp projectId={projectId} initialTodos={todos ?? []} />;
  }

  if (slug === "blog") {
    const { data: posts } = await supabase
      .from("blog_posts")
      .select("*")
      .eq("project_id", projectId)
      .order("created_at", { ascending: false });

    return <BlogApp projectId={projectId} initialPosts={posts ?? []} />;
  }

  if (slug === "crm") {
    const { data: contacts } = await supabase
      .from("contacts")
      .select("*")
      .eq("project_id", projectId)
      .order("created_at", { ascending: false });

    return <CrmApp projectId={projectId} initialContacts={contacts ?? []} />;
  }

  if (slug === "booking") {
    const { data: bookings } = await supabase
      .from("bookings")
      .select("*")
      .eq("project_id", projectId)
      .order("booking_date", { ascending: true, nullsFirst: false });

    return <BookingApp projectId={projectId} initialBookings={bookings ?? []} />;
  }

  // 등록되지 않은 커스텀 템플릿
  return (
    <div className="text-center py-20">
      <h2 className="text-xl font-semibold mb-2">
        {project.template?.name ?? "알 수 없는 템플릿"}
      </h2>
      <p className="text-muted-foreground">
        이 템플릿은 아직 지원되지 않습니다.
      </p>
    </div>
  );
}
