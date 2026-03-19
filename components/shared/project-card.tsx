"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TEMPLATE_REGISTRY } from "@/lib/templates/registry";
import { formatDate } from "@/lib/utils";
import { ExternalLink, Trash2, Loader2 } from "lucide-react";
import type { Project, TemplateSlug } from "@/types";

interface ProjectCardProps {
  project: Project & { template?: { slug: string; name: string } | null };
}

export function ProjectCard({ project }: ProjectCardProps) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

  const templateConfig = project.template?.slug
    ? TEMPLATE_REGISTRY[project.template.slug as TemplateSlug]
    : null;

  const Icon = templateConfig?.icon;

  async function handleDelete() {
    if (!confirm(`"${project.name}" 프로젝트를 삭제하시겠습니까?`)) return;
    setDeleting(true);
    await fetch(`/api/projects/${project.id}`, { method: "DELETE" });
    router.refresh();
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
          {project.template && (
            <Badge variant="secondary" className="text-xs">
              {project.template.name}
            </Badge>
          )}
        </div>
        <CardTitle className="text-base mt-2 line-clamp-1">{project.name}</CardTitle>
      </CardHeader>
      <CardContent className="pb-3">
        <p className="text-xs text-muted-foreground">
          {formatDate(project.created_at)} 생성
        </p>
      </CardContent>
      <CardFooter className="gap-2">
        <Button asChild size="sm" className="flex-1">
          <Link href={`/app/${project.id}`}>
            <ExternalLink className="h-3.5 w-3.5" />
            열기
          </Link>
        </Button>
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
