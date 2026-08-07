import { and, eq, ne } from "drizzle-orm";
import { db, leadMagnetEmailJobs, leadMagnetLeads } from "@newland/db";

export async function POST(request: Request) {
  const token = new URL(request.url).searchParams.get("token");
  if (!token || !/^[a-f0-9]{48}$/.test(token)) {
    return Response.json({ error: "유효하지 않은 수신 거부 링크입니다." }, { status: 400 });
  }
  const [lead] = await db.update(leadMagnetLeads).set({ coachingAgreed: false, marketingUnsubscribedAt: new Date(), updatedAt: new Date() }).where(eq(leadMagnetLeads.unsubscribeToken, token)).returning({ id: leadMagnetLeads.id });
  if (!lead) return Response.json({ error: "수신 거부 정보를 찾을 수 없습니다." }, { status: 404 });
  await db.update(leadMagnetEmailJobs).set({ status: "skipped", updatedAt: new Date() }).where(and(eq(leadMagnetEmailJobs.leadId, lead.id), ne(leadMagnetEmailJobs.kind, "delivery"), eq(leadMagnetEmailJobs.status, "pending")));
  return Response.json({ ok: true });
}
