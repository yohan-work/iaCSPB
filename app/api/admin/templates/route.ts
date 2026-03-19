import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { supabase, user: null, error: "Unauthorized" };

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") return { supabase, user, error: "Forbidden" };

  return { supabase, user, error: null };
}

// GET /api/admin/templates – 전체 템플릿 목록 (비활성 포함)
export async function GET() {
  const { supabase, error } = await requireAdmin();
  if (error) {
    return NextResponse.json({ error }, { status: error === "Unauthorized" ? 401 : 403 });
  }

  const { data, err } = await supabase
    .from("templates")
    .select("*")
    .order("sort_order", { ascending: true })
    .then((r) => ({ data: r.data, err: r.error }));

  if (err) return NextResponse.json({ error: err.message }, { status: 500 });

  return NextResponse.json({ data });
}

// POST /api/admin/templates – 템플릿 생성
export async function POST(request: Request) {
  const { supabase, error } = await requireAdmin();
  if (error) {
    return NextResponse.json({ error }, { status: error === "Unauthorized" ? 401 : 403 });
  }

  const body = await request.json();
  const { slug, name, description, preview_image, sort_order } = body;

  if (!slug || !name) {
    return NextResponse.json(
      { error: "slug and name are required" },
      { status: 400 }
    );
  }

  const { data, error: insertError } = await supabase
    .from("templates")
    .insert({ slug, name, description, preview_image, sort_order: sort_order ?? 0 })
    .select()
    .single();

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  return NextResponse.json({ data }, { status: 201 });
}
