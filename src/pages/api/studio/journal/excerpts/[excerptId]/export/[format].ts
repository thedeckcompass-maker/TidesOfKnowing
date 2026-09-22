import type { APIRoute } from "astro";
import { studioAccessResponse } from "../../../../../../../lib/studio/access";

export const prerender = false;
export const GET: APIRoute = async ({ locals, params }) => {
  const access = studioAccessResponse(locals.user, locals.profile);
  if (access) return access;
  if (!locals.supabase || !params.excerptId || !["md", "json"].includes(params.format ?? "")) return new Response("Not found", { status: 404 });
  const { data } = await locals.supabase.from("studio_journal_excerpts").select("title,purpose,excerpt_text,created_at").eq("id", params.excerptId).maybeSingle();
  if (!data) return new Response("Not found", { status: 404 });
  const filename = `studio-excerpt-${params.excerptId}.${params.format}`;
  const body = params.format === "json"
    ? JSON.stringify({ title: data.title, purpose: data.purpose, excerpt: data.excerpt_text, created_at: data.created_at }, null, 2)
    : `# ${data.title}\n\nPurpose: ${data.purpose.replaceAll("_", " ")}\n\n${data.excerpt_text}\n`;
  return new Response(body, { headers: { "Content-Type": params.format === "json" ? "application/json; charset=utf-8" : "text/markdown; charset=utf-8", "Content-Disposition": `attachment; filename="${filename}"`, "Cache-Control": "private, no-store" } });
};
