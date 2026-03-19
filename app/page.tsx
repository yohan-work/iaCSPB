import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TEMPLATE_REGISTRY, ALL_TEMPLATES } from "@/lib/templates/registry";
import { ArrowRight, CheckCircle2, Zap, Shield, Layers } from "lucide-react";
import type { TemplateSlug } from "@/types";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      {/* 내비게이션 */}
      <header className="border-b">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <span className="font-bold text-lg">MVP Builder</span>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/login">로그인</Link>
            </Button>
            <Button size="sm" asChild>
              <Link href="/signup">무료 시작</Link>
            </Button>
          </div>
        </div>
      </header>

      <main>
        {/* 히어로 섹션 */}
        <section className="max-w-4xl mx-auto px-4 py-24 text-center">
          <Badge variant="secondary" className="mb-6 text-xs">
            비개발자를 위한 MVP 플랫폼
          </Badge>
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-6 leading-tight">
            아이디어를{" "}
            <span className="text-primary">1분 안에</span>
            <br />
            동작하는 앱으로
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-10">
            개발 지식 없이도 바로 사용 가능한 MVP를 만들어보세요.
            <br />
            템플릿을 고르고 버튼 하나만 클릭하면 끝입니다.
          </p>
          <div className="flex items-center justify-center gap-4 flex-wrap">
            <Button size="lg" asChild className="gap-2">
              <Link href="/signup">
                무료로 시작하기
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button variant="outline" size="lg" asChild>
              <Link href="/login">로그인</Link>
            </Button>
          </div>
        </section>

        {/* 3단계 플로우 */}
        <section className="bg-muted/40 py-20">
          <div className="max-w-4xl mx-auto px-4">
            <h2 className="text-2xl font-bold text-center mb-12">
              3단계로 끝나는 MVP 생성
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
              {[
                {
                  step: "01",
                  icon: <Layers className="h-6 w-6" />,
                  title: "템플릿 선택",
                  desc: "할 일, 블로그, CRM, 예약 등 원하는 형태를 고르세요.",
                },
                {
                  step: "02",
                  icon: <Zap className="h-6 w-6" />,
                  title: "버튼 1번 클릭",
                  desc: "이름을 입력하고 '만들기'를 누르면 DB까지 자동 설정됩니다.",
                },
                {
                  step: "03",
                  icon: <CheckCircle2 className="h-6 w-6" />,
                  title: "즉시 사용 시작",
                  desc: "전용 URL이 생성되어 바로 데이터를 입력하고 사용할 수 있습니다.",
                },
              ].map(({ step, icon, title, desc }) => (
                <div key={step} className="text-center">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 text-primary mb-4">
                    {icon}
                  </div>
                  <div className="text-xs font-mono text-muted-foreground mb-2">{step}</div>
                  <h3 className="font-semibold mb-2">{title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 템플릿 미리보기 */}
        <section className="max-w-4xl mx-auto px-4 py-20">
          <h2 className="text-2xl font-bold text-center mb-4">지금 바로 쓸 수 있는 템플릿</h2>
          <p className="text-center text-muted-foreground text-sm mb-10">
            필요한 기능이 모두 갖춰진 템플릿으로 바로 시작하세요.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {ALL_TEMPLATES.map((config) => {
              const Icon = config.icon;
              return (
                <div
                  key={config.slug}
                  className="border rounded-xl p-5 hover:shadow-sm transition-shadow"
                >
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-white mb-3 ${config.color}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="font-semibold mb-1">{config.name}</h3>
                  <p className="text-sm text-muted-foreground mb-3">{config.description}</p>
                  <ul className="space-y-1">
                    {config.features.map((f) => (
                      <li key={f} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <CheckCircle2 className="h-3 w-3 text-green-500 shrink-0" />
                        {f}
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </section>

        {/* 보안 섹션 */}
        <section className="bg-muted/40 py-16">
          <div className="max-w-2xl mx-auto px-4 text-center">
            <Shield className="mx-auto h-8 w-8 text-primary mb-4" />
            <h2 className="text-xl font-bold mb-3">데이터는 안전하게 보관됩니다</h2>
            <p className="text-sm text-muted-foreground">
              모든 데이터는 Supabase의 Row Level Security로 암호화 보호됩니다.
              내 데이터는 오직 나만 접근할 수 있습니다.
            </p>
          </div>
        </section>

        {/* CTA */}
        <section className="max-w-2xl mx-auto px-4 py-24 text-center">
          <h2 className="text-3xl font-bold mb-4">지금 바로 만들어보세요</h2>
          <p className="text-muted-foreground mb-8">
            무료로 시작할 수 있습니다. 신용카드 불필요.
          </p>
          <Button size="lg" asChild className="gap-2">
            <Link href="/signup">
              무료로 시작하기
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </section>
      </main>

      <footer className="border-t py-8">
        <div className="max-w-5xl mx-auto px-4 text-center text-sm text-muted-foreground">
          © 2026 MVP Builder. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
