import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * POST /api/projects/[id]/provision
 * 전용 Supabase 프로젝트 프로비저닝 요청.
 * provisioning_jobs에 잡을 생성하고 projects.provisioning_status를 'pending'으로 설정.
 * 실제 생성은 Cron/Worker에서 비동기 처리.
 */
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const { id: projectId } = await params;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: project, error: projectError } = await supabase
    .from("projects")
    .select("id, user_id, provisioning_status, supabase_project_ref")
    .eq("id", projectId)
    .eq("user_id", user.id)
    .single();

  if (projectError || !project) {
    return NextResponse.json(
      { error: "Project not found or access denied" },
      { status: 404 }
    );
  }

  if (project.supabase_project_ref) {
    return NextResponse.json(
      { error: "Project already has a dedicated Supabase instance" },
      { status: 400 }
    );
  }

  if (
    project.provisioning_status === "pending" ||
    project.provisioning_status === "in_progress"
  ) {
    return NextResponse.json(
      { error: "Provisioning already in progress" },
      { status: 409 }
    );
  }

  const { data: job, error: jobError } = await supabase
    .from("provisioning_jobs")
    .insert({
      project_id: projectId,
      status: "pending",
    })
    .select("id, status, created_at")
    .single();

  if (jobError || !job) {
    return NextResponse.json(
      { error: jobError?.message ?? "Failed to create provisioning job" },
      { status: 500 }
    );
  }

  const { error: updateError } = await supabase
    .from("projects")
    .update({ provisioning_status: "pending" })
    .eq("id", projectId)
    .eq("user_id", user.id);

  if (updateError) {
    return NextResponse.json(
      { error: "Failed to update project status" },
      { status: 500 }
    );
  }

  return NextResponse.json(
    {
      data: {
        job_id: job.id,
        status: job.status,
        created_at: job.created_at,
      },
      message:
        "Provisioning requested. This may take a few minutes. Poll GET /api/projects/[id] or the dashboard for status.",
    },
    { status: 202 }
  );
}
