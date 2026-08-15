import { Resend } from "resend";
import { operationsIssueDefinitions, type OperationsSnapshot } from "../domain";

export type OperationsEmailResult = { ok: true; providerMessageId: string } | { ok: false; errorCode: string };

function escapeHtml(value: string) {
  return value.replace(/[&<>'"]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[char] ?? char);
}

export async function sendOperationsAlertEmail(snapshot: OperationsSnapshot): Promise<OperationsEmailResult> {
  try {
    const apiKey = process.env.RESEND_API_KEY?.trim();
    const fromValue = process.env.RESEND_FROM_EMAIL?.trim();
    const replyTo = process.env.RESEND_REPLY_TO_EMAIL?.trim() ?? fromValue;
    const to = process.env.CALLBACK_NOTIFICATION_EMAIL?.trim();
    if (!apiKey || !fromValue || !replyTo || !to) return { ok: false, errorCode: "OPERATIONS_EMAIL_CONFIG_MISSING" };
    const from = fromValue.includes("<") ? fromValue : `Career Direct Korea <${fromValue}>`;
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://start.careerdirect.kr";
    const issueRows = snapshot.issues.map((issue) => {
      const definition = operationsIssueDefinitions[issue.key];
      const contentIssue = issue.key.startsWith("content_");
      const link = contentIssue ? `${siteUrl}/admin/content` : definition.filter ? `${siteUrl}/admin/callbacks?operation=${definition.filter}` : `${siteUrl}/admin/callbacks`;
      return `<tr><td style="padding:12px;border-bottom:1px solid #e3e7e8">${escapeHtml(definition.label)}</td><td style="padding:12px;border-bottom:1px solid #e3e7e8;text-align:right;font-weight:700">${issue.count}건</td><td style="padding:12px;border-bottom:1px solid #e3e7e8"><a href="${escapeHtml(link)}" style="color:#278a96">확인</a></td></tr>`;
    }).join("");
    const cronRows = snapshot.lastSuccess.map((run) => `<li style="margin:6px 0">${escapeHtml(run.jobName)}: ${run.completedAt ? escapeHtml(new Date(run.completedAt).toLocaleString("ko-KR", { timeZone: "Asia/Seoul" })) : "성공 기록 없음"}</li>`).join("");
    const checkedAt = new Date(snapshot.checkedAt).toLocaleString("ko-KR", { timeZone: "Asia/Seoul" });
    const html = `<div style="margin:0;background:#f7f3ea;padding:32px 16px;font-family:Arial,'Apple SD Gothic Neo',sans-serif;color:#173b49"><div style="max-width:680px;margin:auto;background:#fff;border-radius:20px;padding:32px"><p style="color:#278a96;font-size:12px;font-weight:700;letter-spacing:.12em">CAREER DIRECT KOREA</p><h1 style="font-size:24px">운영 확인이 필요한 항목 ${snapshot.issueCount}건</h1><p>점검 시각 ${escapeHtml(checkedAt)}</p><table style="width:100%;border-collapse:collapse;margin-top:24px">${issueRows}</table><h2 style="font-size:17px;margin-top:28px">마지막 Cron 성공</h2><ul style="padding-left:20px;line-height:1.7">${cronRows}</ul><p style="margin-top:28px"><a href="${siteUrl}/admin/content" style="display:inline-block;background:#173b49;color:#fff;text-decoration:none;padding:13px 18px;border-radius:10px">콘텐츠 운영 화면 열기</a></p><p style="margin-top:24px;font-size:12px;color:#708086">이 이메일에는 고객 개인정보가 포함되지 않습니다.</p></div></div>`;
    const result = await new Resend(apiKey).emails.send({ from, replyTo, to, subject: `[Career Direct Korea] 운영 확인이 필요한 항목 ${snapshot.issueCount}건`, html });
    return result.data?.id ? { ok: true, providerMessageId: result.data.id } : { ok: false, errorCode: "RESEND_EMAIL_ID_MISSING" };
  } catch (error) {
    return { ok: false, errorCode: error instanceof Error ? (error.name || error.message).slice(0, 80) : "OPERATIONS_EMAIL_FAILED" };
  }
}
