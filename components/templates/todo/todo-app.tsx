"use client";

import { useState, useOptimistic, useTransition } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Plus, Trash2, CheckCircle2, Circle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { TodoItem } from "@/types";

interface TodoAppProps {
  projectId: string;
  initialTodos: TodoItem[];
}

export function TodoApp({ projectId, initialTodos }: TodoAppProps) {
  const supabase = createClient();
  const [todos, setTodos] = useState<TodoItem[]>(initialTodos);
  const [newTitle, setNewTitle] = useState("");
  const [adding, setAdding] = useState(false);
  const [, startTransition] = useTransition();

  const completedCount = todos.filter((t) => t.completed).length;

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    const title = newTitle.trim();
    if (!title) return;

    setAdding(true);
    setNewTitle("");

    const { data, error } = await supabase
      .from("todo_items")
      .insert({
        project_id: projectId,
        title,
        sort_order: todos.length,
      })
      .select()
      .single();

    if (!error && data) {
      setTodos((prev) => [...prev, data]);
    }
    setAdding(false);
  }

  async function handleToggle(todo: TodoItem) {
    const next = !todo.completed;
    // 낙관적 업데이트
    startTransition(() => {
      setTodos((prev) =>
        prev.map((t) => (t.id === todo.id ? { ...t, completed: next } : t))
      );
    });

    await supabase
      .from("todo_items")
      .update({ completed: next })
      .eq("id", todo.id);
  }

  async function handleDelete(todoId: string) {
    startTransition(() => {
      setTodos((prev) => prev.filter((t) => t.id !== todoId));
    });

    await supabase.from("todo_items").delete().eq("id", todoId);
  }

  return (
    <div className="max-w-lg mx-auto">
      {/* 헤더 */}
      <div className="mb-6">
        <h2 className="text-xl font-bold">할 일 목록</h2>
        <p className="text-sm text-muted-foreground mt-1">
          {todos.length > 0
            ? `${completedCount}/${todos.length}개 완료`
            : "아직 할 일이 없습니다. 첫 번째 항목을 추가해보세요."}
        </p>
        {todos.length > 0 && (
          <div className="mt-2 h-1.5 w-full bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-300"
              style={{ width: `${(completedCount / todos.length) * 100}%` }}
            />
          </div>
        )}
      </div>

      {/* 입력 폼 */}
      <form onSubmit={handleAdd} className="flex gap-2 mb-6">
        <Input
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          placeholder="새 할 일을 입력하세요..."
          disabled={adding}
          className="flex-1"
        />
        <Button type="submit" disabled={adding || !newTitle.trim()}>
          {adding ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
        </Button>
      </form>

      {/* 할 일 목록 */}
      <ul className="space-y-2">
        {todos.map((todo) => (
          <li
            key={todo.id}
            className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-muted/30 transition-colors group"
          >
            <button
              onClick={() => handleToggle(todo)}
              className="shrink-0 text-muted-foreground hover:text-primary transition-colors"
              aria-label={todo.completed ? "완료 취소" : "완료 표시"}
            >
              {todo.completed ? (
                <CheckCircle2 className="h-5 w-5 text-primary" />
              ) : (
                <Circle className="h-5 w-5" />
              )}
            </button>
            <span
              className={cn(
                "flex-1 text-sm",
                todo.completed && "line-through text-muted-foreground"
              )}
            >
              {todo.title}
            </span>
            <button
              onClick={() => handleDelete(todo.id)}
              className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all"
              aria-label="삭제"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </li>
        ))}
      </ul>

      {todos.length === 0 && (
        <div className="text-center py-16 border-2 border-dashed rounded-xl">
          <CheckCircle2 className="mx-auto h-10 w-10 text-muted-foreground/30 mb-3" />
          <p className="text-sm text-muted-foreground">
            할 일을 추가하면 여기에 표시됩니다.
          </p>
        </div>
      )}
    </div>
  );
}
