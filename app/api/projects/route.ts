import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

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
    .select("*, template:templates(id, slug, name, description, preview_image)")
    .eq("user_id", user.id)
    .eq("status", "active")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data });
}

// POST /api/projects – 원클릭 프로젝트 생성 (핵심 API)
export async function POST(request: Request) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { template_id, name } = body as {
    template_id: string;
    name?: string;
  };

  if (!template_id) {
    return NextResponse.json(
      { error: "template_id is required" },
      { status: 400 }
    );
  }

  // 템플릿 유효성 확인
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

  // 프로젝트 이름 자동 생성 (미입력 시)
  const projectName =
    name?.trim() || `나의 ${template.name} #${Date.now().toString().slice(-4)}`;

  const { data: project, error: projectError } = await supabase
    .from("projects")
    .insert({
      user_id: user.id,
      template_id: template.id,
      name: projectName,
    })
    .select()
    .single();

  if (projectError) {
    return NextResponse.json({ error: projectError.message }, { status: 500 });
  }

  return NextResponse.json(
    {
      data: project,
      redirect: `/app/${project.id}`,
    },
    { status: 201 }
  );
}
