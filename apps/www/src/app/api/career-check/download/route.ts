import { readFile } from "node:fs/promises";
import path from "node:path";
import { eq } from "drizzle-orm";
import { leadMagnetLeads, db } from "@newland/db";
import { recordAnalyticsEventSafely, visitorIdFromRequest } from "@/features/analytics/server/events";

export async function GET(request: Request) {
  const token = new URL(request.url).searchParams.get("token");

  if (!token || !/^[a-f0-9]{48}$/.test(token)) {
    return new Response("유효하지 않은 다운로드 링크입니다.", { status: 400 });
  }

  const lead = await db.query.leadMagnetLeads.findFirst({
    where: eq(leadMagnetLeads.downloadToken, token),
    columns: { downloadExpiresAt: true, utmSource: true, utmMedium: true, utmCampaign: true },
  });

  if (!lead || lead.downloadExpiresAt.getTime() < Date.now()) {
    return new Response("다운로드 링크가 만료되었습니다. 자료를 다시 신청해 주세요.", {
      status: 410,
    });
  }

  const pdfPath = path.join(
    process.cwd(),
    "private-assets",
    "career-direction-check-ko-v1.0.pdf",
  );
  const pdf = await readFile(pdfPath);

  await recordAnalyticsEventSafely({
    eventName: "pdf_downloaded",
    anonymousId: visitorIdFromRequest(request),
    path: "/api/career-check/download",
    utm: lead,
  });

  return new Response(pdf, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition":
        'attachment; filename="career-direction-check-ko-v1.0.pdf"',
      "Cache-Control": "private, no-store, max-age=0",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
