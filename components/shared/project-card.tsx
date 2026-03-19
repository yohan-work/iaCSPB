"use client";

import Link from "next/link";
import { useState, useRef, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TEMPLATE_REGISTRY } from "@/lib/templates/registry";
import { formatDate } from "@/lib/utils";
import { ExternalLink, Trash2, Loader2, Database, Cloud, Download } from "lucide-react";
import type { Project, TemplateSlug } from "@/types";

function defaultDownloadFilename(projectName: string | null): string {
  const base = (projectName ?? "mvp").replace(/[^a-zA-Z0-9가-힣-_]/g, "-").slice(0, 50);
  return `mvp-${base}.zip`;
}

interface ProjectCardProps {
  project: Project & {
    template?: { slug: string; name: string } | null;
    project_blocks?: Array<{ block_slug: string }> | null;
    provisioning_status?: string | null;
    supabase_project_ref?: string | null;
  };
}

const PROVISIONING_LABELS: Record<string, string> = {
  pending: "대기 중",
  in_progress: "생성 중",
  completed: "완료",
  failed: "실패",
};

export function ProjectCard({ project }: ProjectCardProps) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);
  const [provisioning, setProvisioning] = useState(false);
  const [isDownloadModalOpen, setIsDownloadModalOpen] = useState(false);
  const [downloadFilename, setDownloadFilename] = useState("");
  const [downloading, setDownloading] = useState(false);
  const downloadDialogRef = useRef<HTMLDialogElement>(null);

  const openDownloadDialog = useCallback(() => {
    setDownloadFilename(defaultDownloadFilename(project.name));
    setIsDownloadModalOpen(true);
  }, [project.name]);

  const closeDownloadDialog = useCallback(() => {
    downloadDialogRef.current?.close();
    setIsDownloadModalOpen(false);
  }, []);

  useEffect(() => {
    if (isDownloadModalOpen && downloadDialogRef.current) {
      downloadDialogRef.current.showModal();
    }
  }, [isDownloadModalOpen]);

  async function handleDownload() {
    const name = downloadFilename.trim() || defaultDownloadFilename(project.name);
    const filename = name.endsWith(".zip") ? name : `${name}.zip`;
    setDownloading(true);
    try {
      const res = await fetch(`/api/projects/${project.id}/download`, {
        credentials: "include",
      });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        alert(json.error ?? "다운로드에 실패했습니다.");
        return;
      }
      const blob = await res.blob();

      if (typeof window !== "undefined" && "showSaveFilePicker" in window) {
        try {
          const handle = await (window as Window & { showSaveFilePicker?: (opts: { suggestedName: string }) => Promise<FileSystemFileHandle> }).showSaveFilePicker!({ suggestedName: filename });
          const writable = await handle.createWritable();
          await writable.write(blob);
          await writable.close();
          closeDownloadDialog();
        } catch (err) {
          if ((err as Error).name !== "AbortError") {
            alert("저장 위치 선택이 취소되었거나 실패했습니다.");
          }
        }
        return;
      }

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
      closeDownloadDialog();
    } finally {
      setDownloading(false);
    }
  }

  const blockSlugs = (project.project_blocks as Array<{ block_slug: string }> | null | undefined)
    ?.map((b) => b.block_slug)
    .filter((s): s is TemplateSlug => ["todo", "blog", "crm", "booking"].includes(s)) ?? [];
  const primarySlug = blockSlugs[0] ?? project.template?.slug;
  const templateConfig = primarySlug
    ? TEMPLATE_REGISTRY[primarySlug as TemplateSlug]
    : null;

  const Icon = templateConfig?.icon;
  const hasDedicated = Boolean(project.supabase_project_ref);
  const status = project.provisioning_status ?? null;
  const isProvisioning = status === "pending" || status === "in_progress";
  const canUpgrade = !hasDedicated && !isProvisioning;

  async function handleDelete() {
    if (!confirm(`"${project.name}" 프로젝트를 삭제하시겠습니까?`)) return;
    setDeleting(true);
    await fetch(`/api/projects/${project.id}`, { method: "DELETE" });
    router.refresh();
  }

  async function handleProvision() {
    setProvisioning(true);
    try {
      const res = await fetch(`/api/projects/${project.id}/provision`, {
        method: "POST",
      });
      if (res.ok) router.refresh();
      else {
        const json = await res.json().catch(() => ({}));
        alert(json.error ?? "프로비저닝 요청에 실패했습니다.");
      }
    } finally {
      setProvisioning(false);
    }
  }

  return (
    <Card className="group hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div
            className={`w-9 h-9 rounded-lg flex items-center justify-center text-white ${templateConfig?.color ?? "bg-gray-400"}`}
          >
            {Icon && <Icon className="h-5 w-5" />}
          </div>
          <div className="flex items-center gap-1.5 flex-wrap justify-end">
            {hasDedicated && (
              <Badge variant="outline" className="text-xs gap-1">
                <Database className="h-3 w-3" />
                전용 DB
              </Badge>
            )}
            {project.template && (
              <Badge variant="secondary" className="text-xs">
                {project.template.name}
              </Badge>
            )}
            {!project.template && blockSlugs.length > 0 && (
              <Badge variant="secondary" className="text-xs">
                직접 조합 ({blockSlugs.map((s) => TEMPLATE_REGISTRY[s]?.name ?? s).join(", ")})
              </Badge>
            )}
          </div>
        </div>
        <CardTitle className="text-base mt-2 line-clamp-1">{project.name}</CardTitle>
      </CardHeader>
      <CardContent className="pb-3 space-y-2">
        <p className="text-xs text-muted-foreground">
          {formatDate(project.created_at)} 생성
        </p>
        {isProvisioning && (
          <p className="text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1">
            <Loader2 className="h-3 w-3 animate-spin" />
            {PROVISIONING_LABELS[status ?? ""] ?? status}
          </p>
        )}
        {status === "failed" && (
          <p className="text-xs text-destructive">프로비저닝 실패</p>
        )}
      </CardContent>
      <CardFooter className="gap-2 flex-wrap">
        <Button asChild size="sm" className="flex-1 min-w-0">
          <Link href={`/app/${project.id}`}>
            <ExternalLink className="h-3.5 w-3.5" />
            열기
          </Link>
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={openDownloadDialog}
          title="로컬 PC에 프로젝트 ZIP 다운로드 (DB 연결 포함)"
        >
          <Download className="h-3.5 w-3.5" />
          로컬에 다운로드
        </Button>
        {isDownloadModalOpen && (
        <dialog
          ref={downloadDialogRef}
          onCancel={closeDownloadDialog}
          onClick={(e) => { if (e.target === e.currentTarget) closeDownloadDialog(); }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 w-full h-full min-h-[100dvh] max-w-none max-h-none m-0 border-0 open:flex"
        >
          <div className="rounded-lg border bg-background p-6 shadow-lg max-w-md w-full flex flex-col gap-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold">로컬에 다운로드</h3>
            <p className="text-sm text-muted-foreground">
              파일 이름을 정한 뒤 다운로드하세요. 지원 브라우저(Chrome, Edge 등)에서는 저장 경로와 파일명을 선택할 수 있습니다.
            </p>
            <div className="space-y-2">
              <Label htmlFor="download-filename">파일 이름</Label>
              <Input
                id="download-filename"
                value={downloadFilename}
                onChange={(e) => setDownloadFilename(e.target.value)}
                placeholder="mvp-내프로젝트.zip"
                className="font-mono text-sm"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={closeDownloadDialog} type="button">
                취소
              </Button>
              <Button onClick={handleDownload} disabled={downloading} type="button">
                {downloading ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Download className="h-3.5 w-3.5" />
                )}
                다운로드
              </Button>
            </div>
          </div>
        </dialog>
        )}
        {canUpgrade && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleProvision}
            disabled={provisioning}
            title="전용 Supabase 프로젝트로 업그레이드 (2~5분 소요)"
          >
            {provisioning ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Cloud className="h-3.5 w-3.5" />
            )}
            전용 DB
          </Button>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={handleDelete}
          disabled={deleting}
          className="text-destructive hover:text-destructive hover:bg-destructive/10"
        >
          {deleting ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Trash2 className="h-3.5 w-3.5" />
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}
