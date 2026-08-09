import { Resend } from "resend";
import { and, eq, lte } from "drizzle-orm";
import { db, leadMagnetEmailJobs, leadMagnetLeads } from "@newland/db";

export type EmailKind = "delivery" | "coaching-1" | "coaching-2" | "coaching-3";

const schedule: Array<{ kind: EmailKind; days: number }> = [
  { kind: "delivery", days: 0 },
  { kind: "coaching-1", days: 2 },
  { kind: "coaching-2", days: 4 },
  { kind: "coaching-3", days: 6 },
];

const content: Record<EmailKind, { subject: string; eyebrow: string; title: string; body: string; action?: string }> = {
  delivery: {
    subject: "진로방향 자가진단 PDF가 도착했습니다",
    eyebrow: "CAREER DIRECT KOREA",
    title: "좋은 질문을 시작할 준비가 되었습니다.",
    body: "요청하신 12페이지 진로방향 자가진단을 보내드립니다. 정답을 빨리 찾기보다 지금의 일과 나 사이에서 무엇이 잘 맞고 무엇이 어긋나는지 천천히 표시해 보세요. 링크는 발급 후 24시간 동안 유효합니다.",
    action: "PDF 다운로드",
  },
  "coaching-1": {
    subject: "[광고] 진로 불안이 커지는 순간을 한 문장으로 적어보세요",
    eyebrow: "2일 차 · 현실 인식",
    title: "불안을 해결하기 전에 먼저 관찰해 보세요.",
    body: "최근 진로 불안이나 에너지 소진이 가장 강해졌던 순간은 언제였나요? 그 순간의 상황, 감정, 반복된 생각을 각각 한 문장으로 적어보세요.",
  },
  "coaching-2": {
    subject: "[광고] 지금 가장 어긋난 나침반은 무엇인가요?",
    eyebrow: "4일 차 · 네 가지 나침반",
    title: "가장 낮은 한 영역부터 살펴보세요.",
    body: "성격·흥미·재능·가치관 가운데 현재 업무와 가장 어긋난 영역은 무엇인가요? 하나를 고르고, 한 단계 나아지려면 무엇이 달라져야 하는지 적어보세요.",
  },
  "coaching-3": {
    subject: "[광고] 결론보다 30일의 작은 실험을 시작하세요",
    eyebrow: "6일 차 · 실행",
    title: "방향은 작은 실험을 통해 선명해집니다.",
    body: "앞으로 30일 동안 무엇을 확인하면 다음 방향이 조금 더 분명해질까요? 관심 직무 종사자 인터뷰, 작은 프로젝트처럼 되돌릴 수 있는 실험 하나와 시작 날짜를 정해보세요.",
    action: "Career Direct 온라인 평가 알아보기",
  },
};

function htmlEscape(value: string) {
  return value.replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character]!);
}

function config() {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from = process.env.RESEND_FROM_EMAIL?.trim();
  const replyTo = process.env.RESEND_REPLY_TO_EMAIL?.trim() ?? from;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.careerdirect.kr";
  if (!apiKey || !from || !replyTo) throw new Error("RESEND_CONFIG_MISSING");
  return { apiKey, from, replyTo, siteUrl: siteUrl.replace(/\/$/, "") };
}

export async function replaceLeadEmailSchedule(leadId: number, coachingAgreed: boolean, now = new Date()) {
  await db.delete(leadMagnetEmailJobs).where(and(eq(leadMagnetEmailJobs.leadId, leadId), eq(leadMagnetEmailJobs.status, "pending")));
  const selected = schedule.filter((item) => item.kind === "delivery" || coachingAgreed);
  await db.insert(leadMagnetEmailJobs).values(
    selected.map(({ kind, days }) => ({ leadId, kind, scheduledAt: new Date(now.getTime() + days * 86_400_000) })),
  ).onConflictDoNothing();
}

function buildMessage(kind: EmailKind, email: string, downloadToken: string, unsubscribeToken: string | null) {
  const { apiKey, from, replyTo, siteUrl } = config();
  const item = content[kind];
  const coaching = kind !== "delivery";
  const actionUrl = kind === "delivery"
    ? `${siteUrl}/api/career-check/download?token=${downloadToken}`
    : kind === "coaching-3" ? "https://www.careerdirect.org/" : `${siteUrl}/career-check`;
  const unsubscribeUrl = unsubscribeToken ? `${siteUrl}/unsubscribe?token=${unsubscribeToken}` : `${siteUrl}/privacy`;
  const oneClickUnsubscribeUrl = unsubscribeToken ? `${siteUrl}/api/unsubscribe?token=${unsubscribeToken}` : unsubscribeUrl;
  const action = item.action
    ? `<a href="${actionUrl}" style="display:inline-block;background:#c9a24e;color:#17324d;text-decoration:none;font-weight:700;padding:15px 22px;border-radius:10px;margin-top:24px">${htmlEscape(item.action)}</a>`
    : "";
  const footer = coaching
    ? `이 메일은 무료 자가진단 신청 시 선택 동의한 격일 코칭 이메일입니다. <a href="${unsubscribeUrl}">수신 거부</a>`
    : "이 메일은 사용자가 요청한 자료를 전달하는 서비스 메시지입니다.";
  const html = `<!doctype html><html lang="ko"><body style="margin:0;background:#f7f3eb;color:#17324d;font-family:Arial,'Apple SD Gothic Neo',sans-serif"><div style="max-width:620px;margin:0 auto;padding:32px 18px"><div style="background:#17324d;border-radius:22px;padding:38px 34px"><p style="margin:0 0 18px;color:#76c7d2;font-size:12px;font-weight:700;letter-spacing:.12em">${htmlEscape(item.eyebrow)}</p><h1 style="margin:0;color:#fff;font-size:28px;line-height:1.35">${htmlEscape(item.title)}</h1><p style="margin:22px 0 0;color:#dce6e9;font-size:16px;line-height:1.8">${htmlEscape(item.body)}</p>${action}</div><p style="margin:24px 8px 0;color:#68777d;font-size:12px;line-height:1.7">${footer}<br>Career Direct Korea · 경기도 의왕시 오봉산단1로 12, 에이스비전 21 10층 1012호</p></div></body></html>`;
  const text = `${item.title}\n\n${item.body}${item.action ? `\n\n${item.action}: ${actionUrl}` : ""}\n\n${coaching ? `수신 거부: ${unsubscribeUrl}` : "이 메일은 사용자가 요청한 자료를 전달하는 서비스 메시지입니다."}`;
  return {
    apiKey,
    from: `Career Direct Korea <${from}>`,
    replyTo,
    recipient: email,
    subject: item.subject,
    html,
    text,
    headers: coaching ? {
      "List-Unsubscribe": `<${oneClickUnsubscribeUrl}>`,
      "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
    } : undefined,
  };
}

export async function processDueEmailJobs(limit = 20) {
  const jobs = await db.query.leadMagnetEmailJobs.findMany({
    where: and(eq(leadMagnetEmailJobs.status, "pending"), lte(leadMagnetEmailJobs.scheduledAt, new Date())),
    orderBy: (table, { asc }) => [asc(table.scheduledAt)],
    limit,
  });
  const summary = { sent: 0, skipped: 0, failed: 0 };

  for (const job of jobs) {
    const claimed = await db.update(leadMagnetEmailJobs).set({ status: "processing", updatedAt: new Date() }).where(and(eq(leadMagnetEmailJobs.id, job.id), eq(leadMagnetEmailJobs.status, "pending"))).returning({ id: leadMagnetEmailJobs.id });
    if (!claimed.length) continue;
    const lead = await db.query.leadMagnetLeads.findFirst({ where: eq(leadMagnetLeads.id, job.leadId) });
    const kind = job.kind as EmailKind;
    if (!lead || lead.emailSuppressedAt || (kind !== "delivery" && (!lead.coachingAgreed || lead.marketingUnsubscribedAt))) {
      await db.update(leadMagnetEmailJobs).set({ status: "skipped", updatedAt: new Date() }).where(eq(leadMagnetEmailJobs.id, job.id));
      summary.skipped++;
      continue;
    }
    try {
      const message = buildMessage(kind, lead.email, lead.downloadToken, lead.unsubscribeToken);
      const response = await new Resend(message.apiKey).emails.send({
        from: message.from,
        to: message.recipient,
        replyTo: message.replyTo,
        subject: message.subject,
        html: message.html,
        text: message.text,
        headers: message.headers,
        tags: [{ name: "job_id", value: String(job.id) }],
      });
      if (response.error) {
        const error = new Error(response.error.message);
        error.name = response.error.name;
        throw error;
      }
      if (!response.data?.id) throw new Error("RESEND_EMAIL_ID_MISSING");
      await db.update(leadMagnetEmailJobs).set({
        status: "sent",
        sentAt: new Date(),
        providerMessageId: response.data.id,
        updatedAt: new Date(),
        lastErrorCode: null,
      }).where(eq(leadMagnetEmailJobs.id, job.id));
      summary.sent++;
    } catch (error) {
      const attempts = job.attempts + 1;
      const code = error instanceof Error ? error.name.slice(0, 80) : "UNKNOWN";
      console.error("Lead magnet email send failed", {
        jobId: job.id,
        kind,
        errorName: error instanceof Error ? error.name : "UNKNOWN",
        errorMessage: error instanceof Error ? error.message : "Unknown email send error",
      });
      await db.update(leadMagnetEmailJobs).set({ status: attempts >= 5 ? "failed" : "pending", attempts, lastErrorCode: code, updatedAt: new Date() }).where(eq(leadMagnetEmailJobs.id, job.id));
      summary.failed++;
    }
  }
  return summary;
}
