import { createElement } from "react";
import { ImageResponse } from "next/og";
import { getPostBySlug } from "@/features/blog/content/registry";
import { getBlogCategory } from "@/features/blog/domain";

export async function GET(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const post = getPostBySlug((await params).slug);
  if (!post) return new Response("Not found", { status: 404 });
  const { metadata } = post;
  const category = getBlogCategory(metadata.category);
  const el = createElement;
  return new ImageResponse(
    el("div", { style: { width: "100%", height: "100%", display: "flex", position: "relative", flexDirection: "column", justifyContent: "space-between", padding: "70px 76px", color: "#fff", background: "#173854", fontFamily: "sans-serif" } },
      el("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center" } },
        el("div", { style: { fontSize: 24, fontWeight: 800, letterSpacing: 3, color: "#91d5dc" } }, "CAREER DIRECT KOREA"),
        el("div", { style: { padding: "12px 20px", borderRadius: 999, background: "#d5aa4e", color: "#173854", fontSize: 22, fontWeight: 800 } }, category?.label ?? "진로 블로그"),
      ),
      el("div", { style: { display: "flex", flexDirection: "column", maxWidth: 1020 } },
        el("div", { style: { fontSize: 62, lineHeight: 1.18, letterSpacing: -2, fontWeight: 900, wordBreak: "keep-all" } }, metadata.title),
        el("div", { style: { marginTop: 28, fontSize: 25, lineHeight: 1.5, color: "rgba(255,255,255,.72)", wordBreak: "keep-all" } }, metadata.description),
      ),
      el("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 22, color: "rgba(255,255,255,.66)" } },
        el("div", null, "박정열 · Career Direct 마스터 공인 컨설턴트"),
        el("div", { style: { color: "#d5aa4e", fontWeight: 800 } }, "careerdirect.kr/blog"),
      ),
      el("div", { style: { position: "absolute", right: -90, bottom: -120, width: 360, height: 360, borderRadius: 999, border: "54px solid rgba(145,213,220,.16)" } }),
    ),
    { width: 1200, height: 630 },
  );
}
