"use client";

import { useState, useMemo } from "react";
import { createClient, createClientWithCredentials } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { cn, formatDate } from "@/lib/utils";
import {
  Plus,
  ArrowLeft,
  Save,
  Loader2,
  Trash2,
  CalendarDays,
  Clock,
} from "lucide-react";
import type { Booking, BookingStatus } from "@/types";

interface BookingAppProps {
  projectId: string;
  initialBookings: Booking[];
  supabaseUrl?: string;
  supabaseAnonKey?: string;
}

type View = "list" | "form";

const STATUS_CONFIG: Record<
  BookingStatus,
  { label: string; color: string; dot: string }
> = {
  pending: {
    label: "대기중",
    color: "bg-yellow-100 text-yellow-800 border-yellow-200",
    dot: "bg-yellow-400",
  },
  confirmed: {
    label: "확정",
    color: "bg-green-100 text-green-800 border-green-200",
    dot: "bg-green-400",
  },
  cancelled: {
    label: "취소됨",
    color: "bg-red-100 text-red-800 border-red-200",
    dot: "bg-red-400",
  },
};

const STATUS_OPTIONS: BookingStatus[] = ["pending", "confirmed", "cancelled"];

export function BookingApp({
  projectId,
  initialBookings,
  supabaseUrl,
  supabaseAnonKey,
}: BookingAppProps) {
  const supabase = useMemo(
    () =>
      supabaseUrl && supabaseAnonKey
        ? createClientWithCredentials(supabaseUrl, supabaseAnonKey)
        : createClient(),
    [supabaseUrl, supabaseAnonKey]
  );
  const [bookings, setBookings] = useState<Booking[]>(initialBookings);
  const [view, setView] = useState<View>("list");
  const [editingBooking, setEditingBooking] = useState<Booking | null>(null);
  const [saving, setSaving] = useState(false);

  // 폼 상태
  const [title, setTitle] = useState("");
  const [bookingDate, setBookingDate] = useState("");
  const [status, setStatus] = useState<BookingStatus>("pending");
  const [notes, setNotes] = useState("");

  // 필터
  const [filterStatus, setFilterStatus] = useState<BookingStatus | "all">("all");

  function startNew() {
    setEditingBooking(null);
    setTitle("");
    setBookingDate("");
    setStatus("pending");
    setNotes("");
    setView("form");
  }

  function startEdit(booking: Booking) {
    setEditingBooking(booking);
    setTitle(booking.title);
    setBookingDate(booking.booking_date ?? "");
    setStatus(booking.status);
    setNotes(booking.notes ?? "");
    setView("form");
  }

  async function handleSave() {
    if (!title.trim()) return;
    setSaving(true);

    const payload = {
      title: title.trim(),
      booking_date: bookingDate || null,
      status,
      notes: notes.trim() || null,
    };

    if (editingBooking) {
      const { data, error } = await supabase
        .from("bookings")
        .update(payload)
        .eq("id", editingBooking.id)
        .select()
        .single();
      if (!error && data) {
        setBookings((prev) => prev.map((b) => (b.id === data.id ? data : b)));
      }
    } else {
      const { data, error } = await supabase
        .from("bookings")
        .insert({ project_id: projectId, ...payload })
        .select()
        .single();
      if (!error && data) {
        setBookings((prev) => [data, ...prev]);
      }
    }

    setSaving(false);
    setView("list");
  }

  async function handleDelete(bookingId: string) {
    if (!confirm("이 예약을 삭제하시겠습니까?")) return;
    await supabase.from("bookings").delete().eq("id", bookingId);
    setBookings((prev) => prev.filter((b) => b.id !== bookingId));
  }

  async function handleStatusChange(booking: Booking, nextStatus: BookingStatus) {
    const { data } = await supabase
      .from("bookings")
      .update({ status: nextStatus })
      .eq("id", booking.id)
      .select()
      .single();
    if (data) {
      setBookings((prev) => prev.map((b) => (b.id === data.id ? data : b)));
    }
  }

  const filtered =
    filterStatus === "all"
      ? bookings
      : bookings.filter((b) => b.status === filterStatus);

  const counts = {
    all: bookings.length,
    pending: bookings.filter((b) => b.status === "pending").length,
    confirmed: bookings.filter((b) => b.status === "confirmed").length,
    cancelled: bookings.filter((b) => b.status === "cancelled").length,
  };

  // 날짜 기준 정렬 (날짜 있는 것 먼저, 오래된 순)
  const sorted = [...filtered].sort((a, b) => {
    if (!a.booking_date && !b.booking_date) return 0;
    if (!a.booking_date) return 1;
    if (!b.booking_date) return -1;
    return a.booking_date.localeCompare(b.booking_date);
  });

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
            {editingBooking ? "예약 수정" : "새 예약 등록"}
          </h2>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="booking-title">예약 제목 *</Label>
            <Input
              id="booking-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="예: 김철수 헤어컷, 박지수 상담 등"
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="booking-date">예약 날짜</Label>
            <Input
              id="booking-date"
              type="date"
              value={bookingDate}
              onChange={(e) => setBookingDate(e.target.value)}
            />
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
            <Label htmlFor="booking-notes">메모</Label>
            <textarea
              id="booking-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="요청 사항이나 특이사항을 입력하세요..."
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
              disabled={saving || !title.trim()}
              className="flex-1"
            >
              {saving ? <Loader2 className="animate-spin" /> : <Save />}
              {editingBooking ? "저장" : "예약 등록"}
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
          <h2 className="text-xl font-bold">예약 관리</h2>
          <p className="text-sm text-muted-foreground mt-1">
            총 {bookings.length}건의 예약
          </p>
        </div>
        <Button onClick={startNew}>
          <Plus />
          예약 등록
        </Button>
      </div>

      {/* 상태 필터 */}
      <div className="flex gap-1 mb-5 border-b pb-1">
        {(["all", "pending", "confirmed", "cancelled"] as const).map((s) => (
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

      {/* 예약 목록 */}
      {sorted.length === 0 ? (
        <div className="text-center py-16 border-2 border-dashed rounded-xl">
          <CalendarDays className="mx-auto h-10 w-10 text-muted-foreground/30 mb-3" />
          <p className="text-sm text-muted-foreground mb-4">
            {filterStatus === "all"
              ? "아직 등록된 예약이 없습니다."
              : `${STATUS_CONFIG[filterStatus].label} 상태의 예약이 없습니다.`}
          </p>
          {filterStatus === "all" && (
            <Button onClick={startNew}>
              <Plus />
              첫 예약 등록하기
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {sorted.map((booking) => {
            const cfg = STATUS_CONFIG[booking.status];
            return (
              <Card
                key={booking.id}
                className="cursor-pointer hover:shadow-sm transition-shadow"
                onClick={() => startEdit(booking)}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-base font-semibold leading-snug">
                      {booking.title}
                    </CardTitle>
                    {/* 상태 빠른 변경 */}
                    <div
                      className="flex gap-1 shrink-0"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {STATUS_OPTIONS.map((s) => (
                        <button
                          key={s}
                          onClick={() => handleStatusChange(booking, s)}
                          className={cn(
                            "px-2 py-0.5 rounded text-xs border transition-colors",
                            booking.status === s
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
                    {booking.booking_date && (
                      <p className="text-sm text-muted-foreground flex items-center gap-1.5">
                        <CalendarDays className="h-3.5 w-3.5 shrink-0" />
                        {new Date(booking.booking_date).toLocaleDateString(
                          "ko-KR",
                          { year: "numeric", month: "long", day: "numeric", weekday: "short" }
                        )}
                      </p>
                    )}
                    {booking.notes && (
                      <p className="text-sm text-muted-foreground flex items-start gap-1.5">
                        <Clock className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                        <span className="line-clamp-1">{booking.notes}</span>
                      </p>
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-muted-foreground">
                      {formatDate(booking.created_at)} 등록
                    </p>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(booking.id);
                      }}
                      className="text-muted-foreground hover:text-destructive transition-colors p-1 rounded"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
