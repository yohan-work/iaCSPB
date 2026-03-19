"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Plus, Pencil, Check, X, Loader2, ToggleLeft, ToggleRight } from "lucide-react";
import type { Template } from "@/types";

interface AdminTemplateManagerProps {
  initialTemplates: Template[];
}

export function AdminTemplateManager({ initialTemplates }: AdminTemplateManagerProps) {
  const [templates, setTemplates] = useState<Template[]>(initialTemplates);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // 신규 추가 폼 상태
  const [newSlug, setNewSlug] = useState("");
  const [newName, setNewName] = useState("");
  const [newDescription, setNewDescription] = useState("");

  // 수정 폼 상태
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");

  async function handleAdd() {
    if (!newSlug.trim() || !newName.trim()) return;
    setLoading(true);

    const res = await fetch("/api/admin/templates", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        slug: newSlug.trim(),
        name: newName.trim(),
        description: newDescription.trim() || null,
        sort_order: templates.length,
      }),
    });

    const json = await res.json();
    if (json.data) {
      setTemplates((prev) => [...prev, json.data]);
      setNewSlug("");
      setNewName("");
      setNewDescription("");
      setShowAddForm(false);
    }
    setLoading(false);
  }

  function startEdit(template: Template) {
    setEditingId(template.id);
    setEditName(template.name);
    setEditDescription(template.description ?? "");
  }

  async function handleSaveEdit(templateId: string) {
    setLoading(true);
    const res = await fetch(`/api/admin/templates/${templateId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: editName.trim(),
        description: editDescription.trim() || null,
      }),
    });

    const json = await res.json();
    if (json.data) {
      setTemplates((prev) =>
        prev.map((t) => (t.id === templateId ? json.data : t))
      );
      setEditingId(null);
    }
    setLoading(false);
  }

  async function handleToggleActive(template: Template) {
    const res = await fetch(`/api/admin/templates/${template.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_active: !template.is_active }),
    });
    const json = await res.json();
    if (json.data) {
      setTemplates((prev) => prev.map((t) => (t.id === template.id ? json.data : t)));
    }
  }

  return (
    <div className="space-y-6">
      {/* 템플릿 목록 */}
      <div className="space-y-3">
        {templates.map((template) => (
          <Card key={template.id}>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CardTitle className="text-base">
                    {editingId === template.id ? (
                      <Input
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="h-7 text-sm w-48"
                        autoFocus
                      />
                    ) : (
                      template.name
                    )}
                  </CardTitle>
                  <Badge variant="outline" className="text-xs font-mono">
                    {template.slug}
                  </Badge>
                  <Badge variant={template.is_active ? "default" : "secondary"} className="text-xs">
                    {template.is_active ? "활성" : "비활성"}
                  </Badge>
                </div>
                <div className="flex gap-1">
                  {editingId === template.id ? (
                    <>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleSaveEdit(template.id)}
                        disabled={loading}
                      >
                        {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setEditingId(null)}
                      >
                        <X className="h-3.5 w-3.5" />
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => startEdit(template)}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleToggleActive(template)}
                        title={template.is_active ? "비활성화" : "활성화"}
                      >
                        {template.is_active ? (
                          <ToggleRight className="h-4 w-4 text-primary" />
                        ) : (
                          <ToggleLeft className="h-4 w-4 text-muted-foreground" />
                        )}
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="pb-3">
              {editingId === template.id ? (
                <Input
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  placeholder="설명 (선택)"
                  className="h-7 text-sm"
                />
              ) : (
                <p className="text-sm text-muted-foreground">
                  {template.description ?? "설명 없음"}
                </p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <Separator />

      {/* 신규 추가 */}
      {showAddForm ? (
        <div className="space-y-4 p-5 border rounded-xl">
          <h3 className="font-semibold">새 템플릿 추가</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>슬러그 (고유 ID)</Label>
              <Input
                value={newSlug}
                onChange={(e) => setNewSlug(e.target.value.toLowerCase().replace(/\s/g, "-"))}
                placeholder="my-template"
                className="font-mono"
              />
            </div>
            <div className="space-y-1.5">
              <Label>이름</Label>
              <Input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="내 템플릿"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>설명 (선택)</Label>
            <Input
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
              placeholder="이 템플릿에 대한 간단한 설명"
            />
          </div>
          <div className="flex gap-2">
            <Button onClick={handleAdd} disabled={loading || !newSlug || !newName}>
              {loading ? <Loader2 className="animate-spin" /> : <Check />}
              추가
            </Button>
            <Button variant="outline" onClick={() => setShowAddForm(false)}>
              취소
            </Button>
          </div>
        </div>
      ) : (
        <Button variant="outline" onClick={() => setShowAddForm(true)}>
          <Plus />
          템플릿 추가
        </Button>
      )}
    </div>
  );
}
