import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import archiver from "archiver";
import { Readable } from "stream";
import { readdir, readFile } from "fs/promises";
import path from "path";

const TEMPLATE_DIR = path.join(process.cwd(), "templates", "local-mvp");

async function addDirToArchive(
  archive: archiver.Archiver,
  dirPath: string,
  entryPrefix: string
): Promise<void> {
  const entries = await readdir(dirPath, { withFileTypes: true });
  for (const ent of entries) {
    const fullPath = path.join(dirPath, ent.name);
    const entryName = entryPrefix ? `${entryPrefix}/${ent.name}` : ent.name;
    if (ent.isDirectory()) {
      await addDirToArchive(archive, fullPath, entryName);
    } else {
      const buf = await readFile(fullPath);
      archive.append(buf, { name: entryName });
    }
  }
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const { id: projectId } = await params;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: project, error: projectError } = await supabase
    .from("projects")
    .select(
      "id, name, template_id, supabase_url, supabase_anon_key, template:templates(id, slug, name), project_blocks(block_slug)"
    )
    .eq("id", projectId)
    .eq("user_id", user.id)
    .single();

  if (projectError || !project) {
    return NextResponse.json(
      { error: "Project not found or access denied" },
      { status: 404 }
    );
  }

  const VALID = new Set(["todo", "blog", "crm", "booking"]);
  const fromBlocks = (project.project_blocks as Array<{ block_slug: string }> | null)
    ?.map((b) => b.block_slug)
    .filter((s) => VALID.has(s)) ?? [];
  const blockSlugs =
    fromBlocks.length > 0
      ? [...new Set(fromBlocks)].sort()
      : [(project.template as { slug?: string } | null)?.slug ?? "todo"];
  const templateSlug = blockSlugs[0];
  const blockSlugsEnv = blockSlugs.join(",");

  const supabaseUrl =
    project.supabase_url ?? process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const supabaseAnonKey =
    project.supabase_anon_key ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

  if (!supabaseUrl || !supabaseAnonKey) {
    return NextResponse.json(
      { error: "Supabase configuration missing" },
      { status: 500 }
    );
  }

  const envContent = [
    `NEXT_PUBLIC_SUPABASE_URL=${supabaseUrl}`,
    `NEXT_PUBLIC_SUPABASE_ANON_KEY=${supabaseAnonKey}`,
    `NEXT_PUBLIC_PROJECT_ID=${project.id}`,
    `NEXT_PUBLIC_TEMPLATE_SLUG=${templateSlug}`,
    `NEXT_PUBLIC_BLOCK_SLUGS=${blockSlugsEnv}`,
  ].join("\n");

  const safeName = (project.name ?? "mvp")
    .replace(/[^a-zA-Z0-9가-힣-_]/g, "-")
    .slice(0, 50);
  const filename = `mvp-${safeName}.zip`;

  try {
    const archive = archiver("zip", { zlib: { level: 9 } });
    archive.append(envContent, { name: ".env.local" });

    try {
      await addDirToArchive(archive, TEMPLATE_DIR, "");
    } catch (dirErr) {
      console.error("Template dir read error:", dirErr);
      return NextResponse.json(
        { error: "Template not available" },
        { status: 500 }
      );
    }

    archive.finalize();

    const headers = new Headers({
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(filename)}`,
    });

    const webStream = Readable.toWeb(archive) as ReadableStream<Uint8Array>;
    return new Response(webStream, { headers });
  } catch (err) {
    console.error("Download zip error:", err);
    return NextResponse.json(
      { error: "Failed to create download" },
      { status: 500 }
    );
  }
}
