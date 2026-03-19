export type UserRole = "user" | "admin";

export type ProjectStatus = "active" | "archived";

export type TemplateSlug = "todo" | "blog" | "crm" | "booking";

export interface Profile {
  id: string;
  email: string;
  name: string | null;
  role: UserRole;
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
  template_id: string;
  name: string;
  status: ProjectStatus;
  created_at: string;
  template?: Template;
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
