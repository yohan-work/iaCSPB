import { createClient } from "@supabase/supabase-js";

/**
 * service_role 키를 사용하는 관리자 클라이언트.
 * RLS를 우회하므로 서버 전용으로만 사용해야 한다.
 * 절대 클라이언트 컴포넌트나 브라우저에 노출하지 말 것.
 */
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}
