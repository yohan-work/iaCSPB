import { SignupForm } from "@/components/shared/signup-form";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "회원가입",
};

export default function SignupPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30">
      <div className="w-full max-w-md space-y-6 p-8">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold tracking-tight">MVP Builder</h1>
          <p className="text-muted-foreground text-sm">
            무료로 시작하세요
          </p>
        </div>
        <SignupForm />
        <p className="text-center text-sm text-muted-foreground">
          이미 계정이 있으신가요?{" "}
          <Link href="/login" className="font-medium text-primary hover:underline">
            로그인
          </Link>
        </p>
      </div>
    </div>
  );
}
