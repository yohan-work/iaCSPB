import { NextResponse } from "next/server";
import { processOneProvisioningJob } from "@/lib/provisioning/worker";

/**
 * GET /api/cron/provisioning
 * Vercel Cron에서 호출. 대기 중인 프로비저닝 잡 1건 처리.
 * 인증: Authorization: Bearer <CRON_SECRET> 또는 x-cron-secret 헤더.
 */
export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = request.headers.get("x-cron-secret");
  const expectedSecret = process.env.CRON_SECRET;

  if (expectedSecret) {
    const token = authHeader?.replace(/^Bearer\s+/i, "") ?? cronSecret;
    if (token !== expectedSecret) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  try {
    const result = await processOneProvisioningJob();
    if (!result) {
      return NextResponse.json({
        processed: false,
        message: "No pending provisioning jobs",
      });
    }
    return NextResponse.json({
      processed: true,
      ok: result.ok,
      job_id: result.jobId,
      project_ref: result.projectRef,
      error: result.error,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { error: "Provisioning failed", detail: message },
      { status: 500 }
    );
  }
}
