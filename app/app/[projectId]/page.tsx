import { createClient, createClientForProject } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import { TodoApp } from "@/components/templates/todo/todo-app";
import { BlogApp } from "@/components/templates/blog/blog-app";
import { CrmApp } from "@/components/templates/crm/crm-app";
import { BookingApp } from "@/components/templates/booking/booking-app";
import { BlockTabs, type BlockTabItem, type BlockTabsData } from "@/components/templates/block-tabs";
import { TEMPLATE_REGISTRY } from "@/lib/templates/registry";
import { VALID_BLOCK_SLUGS } from "@/lib/blocks/registry";
import type { BlockSlug } from "@/types";

const BLOCK_ORDER: BlockSlug[] = ["todo", "blog", "crm", "booking"];

function resolveBlockSlugs(project: {
  project_blocks?: Array<{ block_slug: string }> | null;
  template?: { slug: string } | null;
}): BlockSlug[] {
  const fromBlocks = project.project_blocks
    ?.map((b) => b.block_slug)
    .filter((s): s is BlockSlug => VALID_BLOCK_SLUGS.has(s));
  if (fromBlocks && fromBlocks.length > 0) {
    return [...new Set(fromBlocks)].sort(
      (a, b) => BLOCK_ORDER.indexOf(a) - BLOCK_ORDER.indexOf(b)
    );
  }
  const templateSlug = project.template?.slug;
  if (templateSlug && VALID_BLOCK_SLUGS.has(templateSlug)) {
    return [templateSlug as BlockSlug];
  }
  return [];
}

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
    .select("*, template:templates(id, slug, name), supabase_url, supabase_anon_key, project_blocks(block_slug)")
    .eq("id", projectId)
    .eq("user_id", user.id)
    .single();

  if (!project) notFound();

  const dataClient =
    project.supabase_url && project.supabase_anon_key
      ? createClientForProject(project.supabase_url, project.supabase_anon_key)
      : supabase;

  const projectSupabaseUrl = project.supabase_url ?? undefined;
  const projectSupabaseAnonKey = project.supabase_anon_key ?? undefined;

  const blockSlugs = resolveBlockSlugs(project);

  if (blockSlugs.length === 0) {
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

  if (blockSlugs.length === 1) {
    const slug = blockSlugs[0];
    if (slug === "todo") {
      const { data: todos } = await dataClient
        .from("todo_items")
        .select("*")
        .eq("project_id", projectId)
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: true });
      return (
        <TodoApp
          projectId={projectId}
          initialTodos={todos ?? []}
          supabaseUrl={projectSupabaseUrl}
          supabaseAnonKey={projectSupabaseAnonKey}
        />
      );
    }
    if (slug === "blog") {
      const { data: posts } = await dataClient
        .from("blog_posts")
        .select("*")
        .eq("project_id", projectId)
        .order("created_at", { ascending: false });
      return (
        <BlogApp
          projectId={projectId}
          initialPosts={posts ?? []}
          supabaseUrl={projectSupabaseUrl}
          supabaseAnonKey={projectSupabaseAnonKey}
        />
      );
    }
    if (slug === "crm") {
      const { data: contacts } = await dataClient
        .from("contacts")
        .select("*")
        .eq("project_id", projectId)
        .order("created_at", { ascending: false });
      return (
        <CrmApp
          projectId={projectId}
          initialContacts={contacts ?? []}
          supabaseUrl={projectSupabaseUrl}
          supabaseAnonKey={projectSupabaseAnonKey}
        />
      );
    }
    if (slug === "booking") {
      const { data: bookings } = await dataClient
        .from("bookings")
        .select("*")
        .eq("project_id", projectId)
        .order("booking_date", { ascending: true, nullsFirst: false });
      return (
        <BookingApp
          projectId={projectId}
          initialBookings={bookings ?? []}
          supabaseUrl={projectSupabaseUrl}
          supabaseAnonKey={projectSupabaseAnonKey}
        />
      );
    }
  }

  // 다중 블록: 탭 UI
  const blocks: BlockTabItem[] = blockSlugs.map((s) => ({
    slug: s,
    name: TEMPLATE_REGISTRY[s]?.name ?? s,
  }));

  const data: BlockTabsData = {};
  if (blockSlugs.includes("todo")) {
    const { data: todos } = await dataClient
      .from("todo_items")
      .select("*")
      .eq("project_id", projectId)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true });
    data.todo = { initialTodos: todos ?? [] };
  }
  if (blockSlugs.includes("blog")) {
    const { data: posts } = await dataClient
      .from("blog_posts")
      .select("*")
      .eq("project_id", projectId)
      .order("created_at", { ascending: false });
    data.blog = { initialPosts: posts ?? [] };
  }
  if (blockSlugs.includes("crm")) {
    const { data: contacts } = await dataClient
      .from("contacts")
      .select("*")
      .eq("project_id", projectId)
      .order("created_at", { ascending: false });
    data.crm = { initialContacts: contacts ?? [] };
  }
  if (blockSlugs.includes("booking")) {
    const { data: bookings } = await dataClient
      .from("bookings")
      .select("*")
      .eq("project_id", projectId)
      .order("booking_date", { ascending: true, nullsFirst: false });
    data.booking = { initialBookings: bookings ?? [] };
  }

  return (
    <BlockTabs
      projectId={projectId}
      blocks={blocks}
      data={data}
      supabaseUrl={projectSupabaseUrl}
      supabaseAnonKey={projectSupabaseAnonKey}
    />
  );
}
