import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { VALID_BLOCK_SLUGS, templateSlugToBlockSlug } from "@/lib/blocks/registry";

// GET /api/projects – 내 프로젝트 목록 조회
export async function GET() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("projects")
    .select(
      "*, template:templates(id, slug, name, description, preview_image), project_blocks(block_slug)"
    )
    .eq("user_id", user.id)
    .eq("status", "active")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data });
}

// POST /api/projects – 프로젝트 생성 (template_id 또는 block_slugs)
export async function POST(request: Request) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { template_id, name, block_slugs } = body as {
    template_id?: string;
    name?: string;
    block_slugs?: string[];
  };

  let blockSlugs: string[] = [];
  let projectName = name?.trim();
  let templateId: string | null = null;

  if (template_id) {
    const { data: template, error: templateError } = await supabase
      .from("templates")
      .select("id, name, slug")
      .eq("id", template_id)
      .eq("is_active", true)
      .single();

    if (templateError || !template) {
      return NextResponse.json(
        { error: "Template not found or inactive" },
        { status: 404 }
      );
    }
    const slug = templateSlugToBlockSlug(template.slug);
    blockSlugs = slug ? [slug] : [];
    templateId = template.id;
    if (!projectName) {
      projectName = `나의 ${template.name} #${Date.now().toString().slice(-4)}`;
    }
  } else if (block_slugs && Array.isArray(block_slugs) && block_slugs.length > 0) {
    const valid = block_slugs.filter((s: string) => VALID_BLOCK_SLUGS.has(s));
    const unique = [...new Set(valid)];
    if (unique.length === 0) {
      return NextResponse.json(
        { error: "At least one valid block_slug is required (todo, blog, crm, booking)" },
        { status: 400 }
      );
    }
    blockSlugs = unique;
    if (!projectName) {
      projectName = `나의 프로젝트 #${Date.now().toString().slice(-4)}`;
    }
  } else {
    return NextResponse.json(
      { error: "template_id or block_slugs is required" },
      { status: 400 }
    );
  }

  const { data: project, error: projectError } = await supabase
    .from("projects")
    .insert({
      user_id: user.id,
      template_id: templateId,
      name: projectName,
    })
    .select()
    .single();

  if (projectError) {
    return NextResponse.json({ error: projectError.message }, { status: 500 });
  }

  const { error: blocksError } = await supabase.from("project_blocks").insert(
    blockSlugs.map((block_slug) => ({
      project_id: project.id,
      block_slug,
    }))
  );

  if (blocksError) {
    return NextResponse.json({ error: blocksError.message }, { status: 500 });
  }

  return NextResponse.json(
    {
      data: project,
      redirect: `/app/${project.id}`,
    },
    { status: 201 }
  );
}
