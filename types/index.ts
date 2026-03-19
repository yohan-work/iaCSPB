export type UserRole = "user" | "admin";

export type UserTier = "free" | "pro";

export type ProjectStatus = "active" | "archived";

export type ProvisioningStatus =
  | "pending"
  | "in_progress"
  | "completed"
  | "failed";

export type TemplateSlug = "todo" | "blog" | "crm" | "booking";

/** 블록 slug (템플릿 slug와 1:1 대응) */
export type BlockSlug = TemplateSlug;

export interface ProjectBlock {
  project_id: string;
  block_slug: BlockSlug;
  created_at: string;
}

export interface Profile {
  id: string;
  email: string;
  name: string | null;
  role: UserRole;
  tier: UserTier;
  created_at: string;
}

export interface Template {
  id: string;
  slug: TemplateSlug;
  name: string;
  description: string | null;
  preview_image: string | null;
  schema_version: number;
  is_active: boolean;
  sort_order: number;
  created_at: string;
}

export interface Project {
  id: string;
  user_id: string;
  template_id: string | null;
  name: string;
  status: ProjectStatus;
  created_at: string;
  supabase_project_ref: string | null;
  supabase_url: string | null;
  supabase_anon_key: string | null;
  provisioning_status: ProvisioningStatus | null;
  template?: Template;
  /** 프로젝트에 포함된 블록 목록 (project_blocks). 없으면 template 기준 1블록으로 간주 */
  blocks?: ProjectBlock[];
}

export type ProvisioningJobStatus =
  | "pending"
  | "in_progress"
  | "completed"
  | "failed";

export interface ProvisioningJob {
  id: string;
  project_id: string;
  status: ProvisioningJobStatus;
  supabase_project_ref: string | null;
  error_message: string | null;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

// Todo 템플릿
export interface TodoItem {
  id: string;
  project_id: string;
  title: string;
  completed: boolean;
  sort_order: number;
  created_at: string;
}

// Blog 템플릿
export type BlogPostStatus = "draft" | "published";

export interface BlogPost {
  id: string;
  project_id: string;
  title: string;
  content: string | null;
  status: BlogPostStatus;
  created_at: string;
}

// CRM 템플릿
export type ContactStatus = "lead" | "active" | "closed";

export interface Contact {
  id: string;
  project_id: string;
  name: string;
  email: string | null;
  phone: string | null;
  status: ContactStatus;
  notes: string | null;
  created_at: string;
}

// Booking 템플릿
export type BookingStatus = "pending" | "confirmed" | "cancelled";

export interface Booking {
  id: string;
  project_id: string;
  title: string;
  booking_date: string | null;
  status: BookingStatus;
  notes: string | null;
  created_at: string;
}

// API Response
export interface ApiResponse<T> {
  data: T | null;
  error: string | null;
}
