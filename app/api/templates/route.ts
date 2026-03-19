import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET /api/templates – 활성 템플릿 목록 (공개)
export async function GET() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("templates")
    .select("*")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data });
}
