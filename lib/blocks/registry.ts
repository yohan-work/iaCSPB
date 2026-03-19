import type { BlockSlug } from "@/types";
import { TEMPLATE_REGISTRY } from "@/lib/templates/registry";

/** 블록 slug → DB 테이블명 */
export const BLOCK_TABLE: Record<BlockSlug, string> = {
  todo: "todo_items",
  blog: "blog_posts",
  crm: "contacts",
  booking: "bookings",
};

export interface BlockConfig {
  slug: BlockSlug;
  name: string;
  table: string;
  description: string;
}

export function getBlockConfig(slug: BlockSlug): BlockConfig {
  const template = TEMPLATE_REGISTRY[slug];
  return {
    slug,
    name: template.name,
    table: BLOCK_TABLE[slug],
    description: template.description,
  };
}

const BLOCK_SLUGS: BlockSlug[] = ["todo", "blog", "crm", "booking"];

export function getAllBlockConfigs(): BlockConfig[] {
  return BLOCK_SLUGS.map(getBlockConfig);
}

/** 템플릿 slug → 블록 slug (1:1) */
export function templateSlugToBlockSlug(templateSlug: string): BlockSlug | null {
  if (BLOCK_SLUGS.includes(templateSlug as BlockSlug)) {
    return templateSlug as BlockSlug;
  }
  return null;
}

export const VALID_BLOCK_SLUGS = new Set<string>(BLOCK_SLUGS);
