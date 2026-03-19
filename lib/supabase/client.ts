import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

/**
 * 프로젝트 전용 URL/Anon Key로 브라우저용 클라이언트 생성.
 * 전용 프로젝트가 있을 때 템플릿 앱에서 사용 (소유권은 서버에서 이미 검증됨).
 */
export function createClientWithCredentials(url: string, anonKey: string) {
  return createSupabaseClient(url, anonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
