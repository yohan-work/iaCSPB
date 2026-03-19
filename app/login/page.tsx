import { LoginForm } from "@/components/shared/login-form";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "로그인",
};

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30">
      <div className="w-full max-w-md space-y-6 p-8">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold tracking-tight">MVP Builder</h1>
          <p className="text-muted-foreground text-sm">
            계정에 로그인하세요
          </p>
        </div>
        <LoginForm />
        <p className="text-center text-sm text-muted-foreground">
          계정이 없으신가요?{" "}
          <Link href="/signup" className="font-medium text-primary hover:underline">
            회원가입
          </Link>
        </p>
      </div>
    </div>
  );
}
