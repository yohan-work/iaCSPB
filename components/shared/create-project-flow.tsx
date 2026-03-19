"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { TEMPLATE_REGISTRY } from "@/lib/templates/registry";
import { Loader2, Check, ArrowLeft, Layers } from "lucide-react";
import type { Template, TemplateSlug, BlockSlug } from "@/types";

interface CreateProjectFlowProps {
  templates: Template[];
}

const BLOCK_SLUGS: BlockSlug[] = ["todo", "blog", "crm", "booking"];

export function CreateProjectFlow({ templates }: CreateProjectFlowProps) {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2>(1);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [selectedBlockSlugs, setSelectedBlockSlugs] = useState<BlockSlug[]>([]);
  const [projectName, setProjectName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleSelectTemplate(template: Template) {
    setSelectedTemplate(template);
    setSelectedBlockSlugs([]);
    setProjectName(`나의 ${template.name}`);
    setStep(2);
  }

  function toggleBlock(slug: BlockSlug) {
    setSelectedBlockSlugs((prev) =>
      prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug]
    );
  }

  function handleConfirmBlockCombo() {
    if (selectedBlockSlugs.length === 0) return;
    setSelectedTemplate(null);
    const names = selectedBlockSlugs
      .map((s) => TEMPLATE_REGISTRY[s]?.name ?? s)
      .join(" + ");
    setProjectName(`나의 ${names}`);
    setStep(2);
  }

  async function handleCreate() {
    const name = projectName.trim() || undefined;
    setLoading(true);
    setError(null);

    try {
      const body: { template_id?: string; name?: string; block_slugs?: string[] } = {
        name,
      };
      if (selectedTemplate) {
        body.template_id = selectedTemplate.id;
      } else if (selectedBlockSlugs.length > 0) {
        body.block_slugs = selectedBlockSlugs;
      } else {
        setLoading(false);
        return;
      }

      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const json = await res.json();

      if (!res.ok) {
        setError(json.error ?? "프로젝트 생성에 실패했습니다.");
        setLoading(false);
        return;
      }

      router.push(json.redirect);
    } catch {
      setError("네트워크 오류가 발생했습니다. 다시 시도해주세요.");
      setLoading(false);
    }
  }

  return (
    <div>
      {/* Step 인디케이터 */}
      <div className="flex items-center gap-2 mb-8">
        <div className={cn(
          "flex items-center justify-center w-6 h-6 rounded-full text-xs font-medium",
          step >= 1 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
        )}>
          {step > 1 ? <Check className="h-3.5 w-3.5" /> : "1"}
        </div>
        <span className={cn("text-sm", step >= 1 ? "font-medium" : "text-muted-foreground")}>
          템플릿 선택
        </span>
        <div className="flex-1 h-px bg-border mx-2" />
        <div className={cn(
          "flex items-center justify-center w-6 h-6 rounded-full text-xs font-medium",
          step >= 2 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
        )}>
          2
        </div>
        <span className={cn("text-sm", step >= 2 ? "font-medium" : "text-muted-foreground")}>
          이름 확인 후 생성
        </span>
      </div>

      {/* Step 1: 빠른 선택(템플릿) + 직접 조합(블록) */}
      {step === 1 && (
        <div className="space-y-8">
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-3">빠른 선택</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {templates.map((template) => {
                const config = TEMPLATE_REGISTRY[template.slug as TemplateSlug];
                const Icon = config?.icon;
                return (
                  <button
                    key={template.id}
                    onClick={() => handleSelectTemplate(template)}
                    className="text-left border rounded-xl p-5 hover:border-primary hover:shadow-sm transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <div className={cn(
                      "w-10 h-10 rounded-lg flex items-center justify-center text-white mb-3",
                      config?.color ?? "bg-gray-400"
                    )}>
                      {Icon && <Icon className="h-5 w-5" />}
                    </div>
                    <h3 className="font-semibold mb-1">{template.name}</h3>
                    <p className="text-sm text-muted-foreground leading-snug">
                      {template.description}
                    </p>
                    {config && (
                      <ul className="mt-3 space-y-1">
                        {config.features.map((f) => (
                          <li key={f} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <Check className="h-3 w-3 text-green-500 shrink-0" />
                            {f}
                          </li>
                        ))}
                      </ul>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
              <Layers className="h-4 w-4" />
              직접 조합
            </h3>
            <p className="text-sm text-muted-foreground mb-3">
              사용할 블록을 여러 개 골라 한 프로젝트에 넣을 수 있습니다.
            </p>
            <div className="flex flex-wrap gap-3">
              {BLOCK_SLUGS.map((slug) => {
                const config = TEMPLATE_REGISTRY[slug];
                const Icon = config?.icon;
                const checked = selectedBlockSlugs.includes(slug);
                return (
                  <label
                    key={slug}
                    className={cn(
                      "flex items-center gap-2 border rounded-lg px-4 py-3 cursor-pointer transition-colors",
                      checked ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
                    )}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleBlock(slug)}
                      className="rounded border-input"
                    />
                    <span className={cn(
                      "w-8 h-8 rounded-lg flex items-center justify-center text-white shrink-0",
                      config?.color ?? "bg-gray-400"
                    )}>
                      {Icon && <Icon className="h-4 w-4" />}
                    </span>
                    <span className="font-medium text-sm">{config?.name ?? slug}</span>
                  </label>
                );
              })}
            </div>
            <Button
              type="button"
              variant="secondary"
              className="mt-3"
              onClick={handleConfirmBlockCombo}
              disabled={selectedBlockSlugs.length === 0}
            >
              선택한 블록으로 만들기 ({selectedBlockSlugs.length}개)
            </Button>
          </div>
        </div>
      )}

      {/* Step 2: 이름 입력 + 생성 */}
      {step === 2 && (selectedTemplate || selectedBlockSlugs.length > 0) && (
        <div className="max-w-md space-y-6">
          <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/50 border">
            {selectedTemplate ? (
              (() => {
                const config = TEMPLATE_REGISTRY[selectedTemplate.slug as TemplateSlug];
                const Icon = config?.icon;
                return (
                  <>
                    <div className={cn(
                      "w-9 h-9 rounded-lg flex items-center justify-center text-white shrink-0",
                      config?.color ?? "bg-gray-400"
                    )}>
                      {Icon && <Icon className="h-5 w-5" />}
                    </div>
                    <div>
                      <p className="font-medium text-sm">{selectedTemplate.name}</p>
                      <p className="text-xs text-muted-foreground">선택된 템플릿</p>
                    </div>
                  </>
                );
              })()
            ) : (
              <>
                <Layers className="h-9 w-9 shrink-0 text-muted-foreground" />
                <div>
                  <p className="font-medium text-sm">
                    {selectedBlockSlugs.map((s) => TEMPLATE_REGISTRY[s]?.name ?? s).join(" + ")}
                  </p>
                  <p className="text-xs text-muted-foreground">직접 조합 ({selectedBlockSlugs.length}개 블록)</p>
                </div>
              </>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="project-name">프로젝트 이름</Label>
            <Input
              id="project-name"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              placeholder="나의 할 일 관리"
              maxLength={50}
              autoFocus
            />
            <p className="text-xs text-muted-foreground">
              나중에 변경할 수 있습니다.
            </p>
          </div>

          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}

          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => setStep(1)}
              disabled={loading}
            >
              <ArrowLeft className="h-4 w-4" />
              다시 선택
            </Button>
            <Button
              onClick={handleCreate}
              disabled={loading}
              className="flex-1"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin" />
                  생성 중...
                </>
              ) : (
                "프로젝트 만들기"
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
