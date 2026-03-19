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

// PUT /api/admin/templates/[id]
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { supabase, error } = await requireAdmin();
  if (error) {
    return NextResponse.json({ error }, { status: error === "Unauthorized" ? 401 : 403 });
  }

  const { id } = await params;
  const body = await request.json();

  const { data, error: updateError } = await supabase
    .from("templates")
    .update(body)
    .eq("id", id)
    .select()
    .single();

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  return NextResponse.json({ data });
}
