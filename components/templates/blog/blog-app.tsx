"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import { formatDate } from "@/lib/utils";
import { Plus, ArrowLeft, Save, Loader2, Trash2, Eye, EyeOff } from "lucide-react";
import type { BlogPost } from "@/types";

interface BlogAppProps {
  projectId: string;
  initialPosts: BlogPost[];
}

type View = "list" | "editor";

export function BlogApp({ projectId, initialPosts }: BlogAppProps) {
  const supabase = createClient();
  const [posts, setPosts] = useState<BlogPost[]>(initialPosts);
  const [view, setView] = useState<View>("list");
  const [editingPost, setEditingPost] = useState<BlogPost | null>(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [saving, setSaving] = useState(false);

  function startNew() {
    setEditingPost(null);
    setTitle("");
    setContent("");
    setView("editor");
  }

  function startEdit(post: BlogPost) {
    setEditingPost(post);
    setTitle(post.title);
    setContent(post.content ?? "");
    setView("editor");
  }

  async function handleSave(status: "draft" | "published") {
    if (!title.trim()) return;
    setSaving(true);

    if (editingPost) {
      const { data, error } = await supabase
        .from("blog_posts")
        .update({ title: title.trim(), content, status })
        .eq("id", editingPost.id)
        .select()
        .single();

      if (!error && data) {
        setPosts((prev) => prev.map((p) => (p.id === data.id ? data : p)));
      }
    } else {
      const { data, error } = await supabase
        .from("blog_posts")
        .insert({ project_id: projectId, title: title.trim(), content, status })
        .select()
        .single();

      if (!error && data) {
        setPosts((prev) => [data, ...prev]);
      }
    }

    setSaving(false);
    setView("list");
  }

  async function handleDelete(postId: string) {
    if (!confirm("이 글을 삭제하시겠습니까?")) return;
    await supabase.from("blog_posts").delete().eq("id", postId);
    setPosts((prev) => prev.filter((p) => p.id !== postId));
  }

  async function handleToggleStatus(post: BlogPost) {
    const nextStatus = post.status === "published" ? "draft" : "published";
    const { data } = await supabase
      .from("blog_posts")
      .update({ status: nextStatus })
      .eq("id", post.id)
      .select()
      .single();
    if (data) {
      setPosts((prev) => prev.map((p) => (p.id === data.id ? data : p)));
    }
  }

  if (view === "editor") {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <Button variant="ghost" size="sm" onClick={() => setView("list")}>
            <ArrowLeft className="h-4 w-4" />
            목록으로
          </Button>
          <Separator orientation="vertical" className="h-4" />
          <h2 className="font-semibold">
            {editingPost ? "글 수정" : "새 글 쓰기"}
          </h2>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="post-title">제목</Label>
            <Input
              id="post-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="글 제목을 입력하세요"
              className="text-lg font-semibold"
              autoFocus
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="post-content">내용</Label>
            <textarea
              id="post-content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="내용을 작성하세요..."
              rows={16}
              className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 resize-none leading-relaxed"
            />
          </div>
          <div className="flex gap-3 pt-2">
            <Button
              variant="outline"
              onClick={() => handleSave("draft")}
              disabled={saving || !title.trim()}
            >
              {saving ? <Loader2 className="animate-spin" /> : <Save />}
              임시저장
            </Button>
            <Button
              onClick={() => handleSave("published")}
              disabled={saving || !title.trim()}
            >
              {saving ? <Loader2 className="animate-spin" /> : <Eye />}
              발행하기
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const publishedPosts = posts.filter((p) => p.status === "published");
  const draftPosts = posts.filter((p) => p.status === "draft");

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold">블로그</h2>
          <p className="text-sm text-muted-foreground mt-1">
            발행 {publishedPosts.length}개 · 임시저장 {draftPosts.length}개
          </p>
        </div>
        <Button onClick={startNew}>
          <Plus />
          새 글
        </Button>
      </div>

      {posts.length === 0 ? (
        <div className="text-center py-16 border-2 border-dashed rounded-xl">
          <p className="text-muted-foreground text-sm mb-4">
            아직 작성된 글이 없습니다.
          </p>
          <Button onClick={startNew}>
            <Plus />
            첫 글 작성하기
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {posts.map((post) => (
            <Card
              key={post.id}
              className="cursor-pointer hover:shadow-sm transition-shadow"
              onClick={() => startEdit(post)}
            >
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-base font-semibold leading-snug line-clamp-1">
                    {post.title}
                  </CardTitle>
                  <Badge
                    variant={post.status === "published" ? "default" : "secondary"}
                    className="shrink-0 text-xs"
                  >
                    {post.status === "published" ? "발행됨" : "임시저장"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="pb-3">
                {post.content && (
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                    {post.content}
                  </p>
                )}
                <div className="flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">
                    {formatDate(post.created_at)}
                  </p>
                  <div
                    className="flex gap-1"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleToggleStatus(post)}
                      className="h-7 px-2 text-xs"
                    >
                      {post.status === "published" ? (
                        <><EyeOff className="h-3 w-3" /> 비공개</>
                      ) : (
                        <><Eye className="h-3 w-3" /> 발행</>
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(post.id)}
                      className="h-7 px-2 text-destructive hover:text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
