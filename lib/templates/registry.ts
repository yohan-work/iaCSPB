import {
  CheckSquare,
  FileText,
  Users,
  CalendarDays,
  type LucideIcon,
} from "lucide-react";
import type { TemplateSlug } from "@/types";

export interface TemplateConfig {
  slug: TemplateSlug;
  name: string;
  description: string;
  icon: LucideIcon;
  color: string;
  features: string[];
  navItems: Array<{
    label: string;
    href: string;
  }>;
}

export const TEMPLATE_REGISTRY: Record<TemplateSlug, TemplateConfig> = {
  todo: {
    slug: "todo",
    name: "할 일 관리",
    description: "팀이나 개인 프로젝트의 할 일을 체계적으로 관리하세요.",
    icon: CheckSquare,
    color: "bg-blue-500",
    features: ["할 일 추가/완료", "우선순위 정렬", "진행 상황 한눈에 보기"],
    navItems: [{ label: "할 일 목록", href: "" }],
  },
  blog: {
    slug: "blog",
    name: "블로그",
    description: "글을 쓰고, 발행하고, 독자와 소통하세요.",
    icon: FileText,
    color: "bg-green-500",
    features: ["글 작성 및 발행", "임시저장", "발행/비공개 관리"],
    navItems: [
      { label: "글 목록", href: "" },
      { label: "새 글 쓰기", href: "/new" },
    ],
  },
  crm: {
    slug: "crm",
    name: "고객 관리 (CRM)",
    description: "고객 정보와 거래를 체계적으로 관리하세요.",
    icon: Users,
    color: "bg-purple-500",
    features: ["고객 정보 관리", "상태별 분류", "메모 기록"],
    navItems: [{ label: "고객 목록", href: "" }],
  },
  booking: {
    slug: "booking",
    name: "예약 관리",
    description: "예약을 받고, 확인하고, 일정을 관리하세요.",
    icon: CalendarDays,
    color: "bg-orange-500",
    features: ["예약 등록", "상태 관리", "날짜별 조회"],
    navItems: [{ label: "예약 목록", href: "" }],
  },
};

export function getTemplateConfig(slug: TemplateSlug): TemplateConfig {
  return TEMPLATE_REGISTRY[slug];
}

export const ALL_TEMPLATES = Object.values(TEMPLATE_REGISTRY);
