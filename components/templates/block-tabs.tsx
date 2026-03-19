"use client";

import { useState } from "react";
import { TEMPLATE_REGISTRY } from "@/lib/templates/registry";
import { TodoApp } from "@/components/templates/todo/todo-app";
import { BlogApp } from "@/components/templates/blog/blog-app";
import { CrmApp } from "@/components/templates/crm/crm-app";
import { BookingApp } from "@/components/templates/booking/booking-app";
import type { BlockSlug } from "@/types";
import type { TodoItem, BlogPost, Contact, Booking } from "@/types";
import { cn } from "@/lib/utils";

export interface BlockTabItem {
  slug: BlockSlug;
  name: string;
}

export interface BlockTabsData {
  todo?: { initialTodos: TodoItem[] };
  blog?: { initialPosts: BlogPost[] };
  crm?: { initialContacts: Contact[] };
  booking?: { initialBookings: Booking[] };
}

interface BlockTabsProps {
  projectId: string;
  blocks: BlockTabItem[];
  data: BlockTabsData;
  supabaseUrl?: string;
  supabaseAnonKey?: string;
}

const BLOCK_ORDER: BlockSlug[] = ["todo", "blog", "crm", "booking"];

function sortBlocks(blocks: BlockTabItem[]): BlockTabItem[] {
  return [...blocks].sort(
    (a, b) => BLOCK_ORDER.indexOf(a.slug) - BLOCK_ORDER.indexOf(b.slug)
  );
}

export function BlockTabs({
  projectId,
  blocks,
  data,
  supabaseUrl,
  supabaseAnonKey,
}: BlockTabsProps) {
  const sorted = sortBlocks(blocks);
  const [active, setActive] = useState<BlockSlug>(sorted[0].slug);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-1 border-b border-border pb-2">
        {sorted.map(({ slug, name }) => {
          const config = TEMPLATE_REGISTRY[slug];
          const Icon = config?.icon;
          const isActive = active === slug;
          return (
            <button
              key={slug}
              type="button"
              onClick={() => setActive(slug)}
              className={cn(
                "flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              {Icon && <Icon className="h-4 w-4" />}
              {name}
            </button>
          );
        })}
      </div>

      <div className="min-h-[200px]">
        {active === "todo" && data.todo && (
          <TodoApp
            projectId={projectId}
            initialTodos={data.todo.initialTodos}
            supabaseUrl={supabaseUrl}
            supabaseAnonKey={supabaseAnonKey}
          />
        )}
        {active === "blog" && data.blog && (
          <BlogApp
            projectId={projectId}
            initialPosts={data.blog.initialPosts}
            supabaseUrl={supabaseUrl}
            supabaseAnonKey={supabaseAnonKey}
          />
        )}
        {active === "crm" && data.crm && (
          <CrmApp
            projectId={projectId}
            initialContacts={data.crm.initialContacts}
            supabaseUrl={supabaseUrl}
            supabaseAnonKey={supabaseAnonKey}
          />
        )}
        {active === "booking" && data.booking && (
          <BookingApp
            projectId={projectId}
            initialBookings={data.booking.initialBookings}
            supabaseUrl={supabaseUrl}
            supabaseAnonKey={supabaseAnonKey}
          />
        )}
      </div>
    </div>
  );
}
