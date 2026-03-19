/**
 * Supabase Management API 클라이언트.
 * 사용자별 Supabase 프로젝트 생성 시 사용.
 * 환경변수: SUPABASE_ACCESS_TOKEN (Personal Access Token)
 * @see https://supabase.com/docs/reference/api/create-a-project
 */

const MANAGEMENT_API_BASE = "https://api.supabase.com/v1";

function getAccessToken(): string {
  const token = process.env.SUPABASE_ACCESS_TOKEN;
  if (!token) {
    throw new Error(
      "SUPABASE_ACCESS_TOKEN is required for provisioning. Set it in environment variables."
    );
  }
  return token;
}

export interface CreateProjectParams {
  organization_id: string;
  name: string;
  region?: string;
  database_password?: string;
}

export interface ManagementProject {
  id: number;
  ref: string;
  name: string;
  organization_id: string;
  region: string;
  status: string;
  created_at: string;
  [key: string]: unknown;
}

export interface ProjectApiKeys {
  anon_key: string;
  service_role_key: string;
}

/**
 * Supabase Management API로 새 프로젝트 생성.
 * 생성 후 프로젝트가 ready 될 때까지 대기하지 않음 (비동기로 생성됨).
 */
export async function createManagementProject(
  params: CreateProjectParams
): Promise<ManagementProject> {
  const token = getAccessToken();
  const res = await fetch(`${MANAGEMENT_API_BASE}/projects`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      organization_id: params.organization_id,
      name: params.name,
      region: params.region ?? "ap-northeast-2",
      database_password: params.database_password,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(
      `Supabase Management API error: ${res.status} ${res.statusText}. ${text}`
    );
  }

  return res.json() as Promise<ManagementProject>;
}

/**
 * 프로젝트 상세 조회 (상태 확인용).
 */
export async function getManagementProject(
  projectRef: string
): Promise<ManagementProject | null> {
  const token = getAccessToken();
  const res = await fetch(
    `${MANAGEMENT_API_BASE}/projects/${encodeURIComponent(projectRef)}`,
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );

  if (res.status === 404) return null;
  if (!res.ok) {
    const text = await res.text();
    throw new Error(
      `Supabase Management API error: ${res.status} ${res.statusText}. ${text}`
    );
  }

  return res.json() as Promise<ManagementProject>;
}

/**
 * 프로젝트 API 키 조회 (anon_key, service_role_key).
 * 프로젝트가 완전히 준비된 후 호출해야 함.
 */
export async function getProjectApiKeys(
  projectRef: string
): Promise<ProjectApiKeys | null> {
  const token = getAccessToken();
  const res = await fetch(
    `${MANAGEMENT_API_BASE}/projects/${encodeURIComponent(projectRef)}/api-keys`,
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );

  if (res.status === 404) return null;
  if (!res.ok) {
    const text = await res.text();
    throw new Error(
      `Supabase Management API error: ${res.status} ${res.statusText}. ${text}`
    );
  }

  const data = (await res.json()) as { api_key: string }[] | unknown;
  if (!Array.isArray(data) || data.length === 0) return null;

  const anon = data.find((k: { name?: string }) => k.name === "anon");
  const serviceRole = data.find(
    (k: { name?: string }) => k.name === "service_role"
  );
  if (!anon || !serviceRole || !("api_key" in anon) || !("api_key" in serviceRole)) {
    return null;
  }

  return {
    anon_key: (anon as { api_key: string }).api_key,
    service_role_key: (serviceRole as { api_key: string }).api_key,
  };
}
