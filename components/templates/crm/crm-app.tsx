"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { formatDate, cn } from "@/lib/utils";
import {
  Plus,
  ArrowLeft,
  Save,
  Loader2,
  Trash2,
  Phone,
  Mail,
  StickyNote,
  Users,
} from "lucide-react";
import type { Contact, ContactStatus } from "@/types";

interface CrmAppProps {
  projectId: string;
  initialContacts: Contact[];
}

type View = "list" | "form";

const STATUS_CONFIG: Record<
  ContactStatus,
  { label: string; variant: "default" | "secondary" | "outline" }
> = {
  lead: { label: "리드", variant: "secondary" },
  active: { label: "활성", variant: "default" },
  closed: { label: "완료", variant: "outline" },
};

const STATUS_OPTIONS: ContactStatus[] = ["lead", "active", "closed"];

export function CrmApp({ projectId, initialContacts }: CrmAppProps) {
  const supabase = createClient();
  const [contacts, setContacts] = useState<Contact[]>(initialContacts);
  const [view, setView] = useState<View>("list");
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [saving, setSaving] = useState(false);

  // 폼 상태
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [status, setStatus] = useState<ContactStatus>("lead");
  const [notes, setNotes] = useState("");

  // 필터
  const [filterStatus, setFilterStatus] = useState<ContactStatus | "all">("all");

  function startNew() {
    setEditingContact(null);
    setName("");
    setEmail("");
    setPhone("");
    setStatus("lead");
    setNotes("");
    setView("form");
  }

  function startEdit(contact: Contact) {
    setEditingContact(contact);
    setName(contact.name);
    setEmail(contact.email ?? "");
    setPhone(contact.phone ?? "");
    setStatus(contact.status);
    setNotes(contact.notes ?? "");
    setView("form");
  }

  async function handleSave() {
    if (!name.trim()) return;
    setSaving(true);

    const payload = {
      name: name.trim(),
      email: email.trim() || null,
      phone: phone.trim() || null,
      status,
      notes: notes.trim() || null,
    };

    if (editingContact) {
      const { data, error } = await supabase
        .from("contacts")
        .update(payload)
        .eq("id", editingContact.id)
        .select()
        .single();
      if (!error && data) {
        setContacts((prev) => prev.map((c) => (c.id === data.id ? data : c)));
      }
    } else {
      const { data, error } = await supabase
        .from("contacts")
        .insert({ project_id: projectId, ...payload })
        .select()
        .single();
      if (!error && data) {
        setContacts((prev) => [data, ...prev]);
      }
    }

    setSaving(false);
    setView("list");
  }

  async function handleDelete(contactId: string) {
    if (!confirm("이 고객을 삭제하시겠습니까?")) return;
    await supabase.from("contacts").delete().eq("id", contactId);
    setContacts((prev) => prev.filter((c) => c.id !== contactId));
  }

  async function handleStatusChange(contact: Contact, nextStatus: ContactStatus) {
    const { data } = await supabase
      .from("contacts")
      .update({ status: nextStatus })
      .eq("id", contact.id)
      .select()
      .single();
    if (data) {
      setContacts((prev) => prev.map((c) => (c.id === data.id ? data : c)));
    }
  }

  const filtered =
    filterStatus === "all"
      ? contacts
      : contacts.filter((c) => c.status === filterStatus);

  const counts = {
    all: contacts.length,
    lead: contacts.filter((c) => c.status === "lead").length,
    active: contacts.filter((c) => c.status === "active").length,
    closed: contacts.filter((c) => c.status === "closed").length,
  };

  if (view === "form") {
    return (
      <div className="max-w-lg mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <Button variant="ghost" size="sm" onClick={() => setView("list")}>
            <ArrowLeft className="h-4 w-4" />
            목록으로
          </Button>
          <Separator orientation="vertical" className="h-4" />
          <h2 className="font-semibold">
            {editingContact ? "고객 정보 수정" : "새 고객 추가"}
          </h2>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="contact-name">이름 *</Label>
            <Input
              id="contact-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="홍길동"
              autoFocus
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="contact-email">이메일</Label>
              <Input
                id="contact-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="hong@example.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contact-phone">전화번호</Label>
              <Input
                id="contact-phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="010-0000-0000"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>상태</Label>
            <div className="flex gap-2">
              {STATUS_OPTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => setStatus(s)}
                  className={cn(
                    "px-3 py-1.5 rounded-md text-sm border transition-colors",
                    status === s
                      ? "bg-primary text-primary-foreground border-primary"
                      : "border-input hover:bg-muted"
                  )}
                >
                  {STATUS_CONFIG[s].label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="contact-notes">메모</Label>
            <textarea
              id="contact-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="고객에 대한 메모를 입력하세요..."
              rows={4}
              className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <Button variant="outline" onClick={() => setView("list")}>
              취소
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving || !name.trim()}
              className="flex-1"
            >
              {saving ? (
                <Loader2 className="animate-spin" />
              ) : (
                <Save />
              )}
              {editingContact ? "저장" : "고객 추가"}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold">고객 관리</h2>
          <p className="text-sm text-muted-foreground mt-1">
            총 {contacts.length}명의 고객
          </p>
        </div>
        <Button onClick={startNew}>
          <Plus />
          고객 추가
        </Button>
      </div>

      {/* 상태 필터 탭 */}
      <div className="flex gap-1 mb-5 border-b pb-1">
        {(["all", "lead", "active", "closed"] as const).map((s) => (
          <button
            key={s}
            onClick={() => setFilterStatus(s)}
            className={cn(
              "px-3 py-1.5 text-sm rounded-md transition-colors flex items-center gap-1.5",
              filterStatus === s
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
            )}
          >
            {s === "all" ? "전체" : STATUS_CONFIG[s].label}
            <span
              className={cn(
                "text-xs px-1.5 py-0.5 rounded-full",
                filterStatus === s
                  ? "bg-primary-foreground/20 text-primary-foreground"
                  : "bg-muted text-muted-foreground"
              )}
            >
              {counts[s]}
            </span>
          </button>
        ))}
      </div>

      {/* 고객 목록 */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 border-2 border-dashed rounded-xl">
          <Users className="mx-auto h-10 w-10 text-muted-foreground/30 mb-3" />
          <p className="text-sm text-muted-foreground mb-4">
            {filterStatus === "all"
              ? "아직 등록된 고객이 없습니다."
              : `${STATUS_CONFIG[filterStatus].label} 상태의 고객이 없습니다.`}
          </p>
          {filterStatus === "all" && (
            <Button onClick={startNew}>
              <Plus />
              첫 고객 추가하기
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((contact) => (
            <Card
              key={contact.id}
              className="cursor-pointer hover:shadow-sm transition-shadow"
              onClick={() => startEdit(contact)}
            >
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-base font-semibold">
                    {contact.name}
                  </CardTitle>
                  {/* 상태 드롭다운 */}
                  <div
                    className="flex gap-1"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {STATUS_OPTIONS.map((s) => (
                      <button
                        key={s}
                        onClick={() => handleStatusChange(contact, s)}
                        className={cn(
                          "px-2 py-0.5 rounded text-xs border transition-colors",
                          contact.status === s
                            ? "bg-primary text-primary-foreground border-primary"
                            : "border-transparent text-muted-foreground hover:border-input hover:text-foreground"
                        )}
                      >
                        {STATUS_CONFIG[s].label}
                      </button>
                    ))}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pb-3">
                <div className="space-y-1 mb-2">
                  {contact.email && (
                    <p className="text-sm text-muted-foreground flex items-center gap-1.5">
                      <Mail className="h-3.5 w-3.5 shrink-0" />
                      {contact.email}
                    </p>
                  )}
                  {contact.phone && (
                    <p className="text-sm text-muted-foreground flex items-center gap-1.5">
                      <Phone className="h-3.5 w-3.5 shrink-0" />
                      {contact.phone}
                    </p>
                  )}
                  {contact.notes && (
                    <p className="text-sm text-muted-foreground flex items-start gap-1.5">
                      <StickyNote className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                      <span className="line-clamp-2">{contact.notes}</span>
                    </p>
                  )}
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">
                    {formatDate(contact.created_at)} 등록
                  </p>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(contact.id);
                    }}
                    className="text-muted-foreground hover:text-destructive transition-colors p-1 rounded"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
