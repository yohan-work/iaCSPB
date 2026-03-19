/**
 * 프로비저닝 잡 처리: Management API로 프로젝트 생성 후 project/job 업데이트.
 * Cron에서 호출. 데이터 이전은 새 프로젝트에 스키마 적용 후 별도 실행 가능.
 */

import { createAdminClient } from "@/lib/supabase/admin";
import {
  createManagementProject,
  getManagementProject,
  getProjectApiKeys,
} from "@/lib/supabase/management";

const ORGANIZATION_ID = process.env.SUPABASE_ORGANIZATION_ID;
const MAX_POLL_ATTEMPTS = 60; // 5분 (5초 간격)
const POLL_INTERVAL_MS = 5000;

function getSupabaseUrlFromRef(ref: string): string {
  return `https://${ref}.supabase.co`;
}

export interface ProvisioningResult {
  ok: boolean;
  jobId?: string;
  projectRef?: string;
  error?: string;
}

export async function processOneProvisioningJob(): Promise<ProvisioningResult | null> {
  if (!ORGANIZATION_ID) {
    console.warn("SUPABASE_ORGANIZATION_ID not set, skipping provisioning");
    return null;
  }

  const supabase = createAdminClient();

  const { data: job, error: jobFetchError } = await supabase
    .from("provisioning_jobs")
    .select("id, project_id, status")
    .eq("status", "pending")
    .order("created_at", { ascending: true })
    .limit(1)
    .single();

  if (jobFetchError || !job) return null;

  const jobId = job.id;
  const projectId = job.project_id;

  const { data: project, error: projectFetchError } = await supabase
    .from("projects")
    .select("id, name, template_id, user_id")
    .eq("id", projectId)
    .single();

  if (projectFetchError || !project) {
    await supabase
      .from("provisioning_jobs")
      .update({
        status: "failed",
        error_message: "Project not found",
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", jobId);
    return { ok: false, jobId, error: "Project not found" };
  }

  await supabase
    .from("provisioning_jobs")
    .update({
      status: "in_progress",
      started_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", jobId);

  await supabase
    .from("projects")
    .update({
      provisioning_status: "in_progress",
    })
    .eq("id", projectId);

  try {
    const safeName = project.name.replace(/[^a-zA-Z0-9-_]/g, "-").slice(0, 50);
    const projectName = `mvp-${projectId.slice(0, 8)}-${safeName}`;

    const created = await createManagementProject({
      organization_id: ORGANIZATION_ID,
      name: projectName,
      region: "ap-northeast-2",
    });

    const ref = created.ref;
    if (!ref) {
      throw new Error("Management API did not return project ref");
    }

    await supabase
      .from("provisioning_jobs")
      .update({
        supabase_project_ref: ref,
        updated_at: new Date().toISOString(),
      })
      .eq("id", jobId);

    for (let i = 0; i < MAX_POLL_ATTEMPTS; i++) {
      await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));
      const proj = await getManagementProject(ref);
      if (!proj) continue;
      if (proj.status === "ACTIVE_HEALTHY" || proj.status === "active") {
        break;
      }
      if (i === MAX_POLL_ATTEMPTS - 1) {
        throw new Error("Project did not become ready in time");
      }
    }

    const keys = await getProjectApiKeys(ref);
    if (!keys) {
      throw new Error("Could not get API keys for new project");
    }

    const supabaseUrl = getSupabaseUrlFromRef(ref);

    await supabase
      .from("projects")
      .update({
        supabase_project_ref: ref,
        supabase_url: supabaseUrl,
        supabase_anon_key: keys.anon_key,
        provisioning_status: "completed",
      })
      .eq("id", projectId);

    await supabase
      .from("provisioning_jobs")
      .update({
        status: "completed",
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", jobId);

    await copyProjectDataToDedicatedProject(
      projectId,
      ref,
      supabaseUrl,
      keys.service_role_key,
      project.template_id,
      supabase
    );

    return { ok: true, jobId, projectRef: ref };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await supabase
      .from("provisioning_jobs")
      .update({
        status: "failed",
        error_message: message,
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", jobId);

    await supabase
      .from("projects")
      .update({
        provisioning_status: "failed",
      })
      .eq("id", projectId);

    return { ok: false, jobId, projectRef: undefined, error: message };
  }
}

/**
 * 공용 DB의 프로젝트 데이터를 전용 Supabase 프로젝트로 복사.
 * 전용 프로젝트에는 이미 동일 스키마(projects, todo_items 등)가 적용되어 있어야 함.
 * 스키마 적용은 Supabase 대시보드 또는 마이그레이션 도구로 수행.
 */
async function copyProjectDataToDedicatedProject(
  _projectId: string,
  _ref: string,
  _supabaseUrl: string,
  _serviceRoleKey: string,
  _templateId: string | null,
  _mainSupabase: ReturnType<typeof createAdminClient>
): Promise<void> {
  // TODO: 전용 프로젝트에 001/002 마이그레이션 적용 후,
  // mainSupabase에서 해당 project_id의 todo_items, blog_posts, contacts, bookings 읽어서
  // 새 프로젝트의 service_role 클라이언트로 insert.
  // 새 프로젝트의 projects 테이블에 단일 행(해당 프로젝트) 생성 필요 여부에 따라 처리.
}
