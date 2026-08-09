import { Resend } from "resend";
import { formatWon } from "../domain";

export type PaymentEmailResult = { ok: true; providerMessageId: string } | { ok: false; errorCode: string };

function escapeHtml(value: string) {
  return value.replace(/[&<>'"]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[char] ?? char);
}

function configuration() {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from = process.env.RESEND_FROM_EMAIL?.trim();
  const replyTo = process.env.RESEND_REPLY_TO_EMAIL?.trim() ?? from;
  if (!apiKey || !from || !replyTo) throw new Error("PAYMENT_EMAIL_CONFIG_MISSING");
  return { resend: new Resend(apiKey), from: from.includes("<") ? from : `Career Direct Korea <${from}>`, replyTo };
}

function shell(content: string) {
  return `<div style="margin:0;background:#f7f3ea;padding:32px 16px;font-family:Arial,'Apple SD Gothic Neo',sans-serif;color:#173b49"><div style="max-width:620px;margin:auto;background:#fff;border-radius:20px;padding:32px"><p style="margin:0 0 16px;color:#278a96;font-size:12px;font-weight:700;letter-spacing:.12em">CAREER DIRECT KOREA</p>${content}</div></div>`;
}

async function send(to: string, subject: string, html: string): Promise<PaymentEmailResult> {
  try {
    const { resend, from, replyTo } = configuration();
    const result = await resend.emails.send({ from, replyTo, to, subject, html });
    return result.data?.id ? { ok: true, providerMessageId: result.data.id } : { ok: false, errorCode: "RESEND_EMAIL_ID_MISSING" };
  } catch (error) {
    return { ok: false, errorCode: error instanceof Error ? error.message.slice(0, 80) : "PAYMENT_EMAIL_FAILED" };
  }
}

function policyLinks() {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://start.careerdirect.kr";
  return `<p style="margin-top:28px;font-size:13px;line-height:1.7"><a href="${siteUrl}/terms" style="color:#278a96">이용약관</a> · <a href="${siteUrl}/refund-policy" style="color:#278a96">결제 및 환불정책</a></p>`;
}

export async function sendPaymentInstructionEmail(input: { name: string; email: string; productName: string; supplyAmount: number; vatAmount: number; totalAmount: number; dueAt: Date }) {
  const bankName = process.env.PAYMENT_BANK_NAME?.trim();
  const account = process.env.PAYMENT_BANK_ACCOUNT?.trim();
  const holder = process.env.PAYMENT_BANK_HOLDER?.trim();
  if (!bankName || !account || !holder) return { ok: false, errorCode: "PAYMENT_BANK_CONFIG_MISSING" } as const;
  const due = new Intl.DateTimeFormat("ko-KR", { timeZone: "Asia/Seoul", dateStyle: "long", timeStyle: "short" }).format(input.dueAt);
  return send(input.email, `${input.productName} 입금 안내`, shell(`<h1 style="font-size:24px;margin:0 0 20px">${escapeHtml(input.name)}님, 신청하신 서비스의 입금 정보를 안내드립니다.</h1><div style="padding:20px;border-radius:14px;background:#eaf5f5;line-height:1.9"><strong>${escapeHtml(input.productName)}</strong><br>공급가 ${formatWon(input.supplyAmount)} + 부가세 ${formatWon(input.vatAmount)}<br><strong>결제금액 ${formatWon(input.totalAmount)}</strong></div><div style="margin-top:20px;padding:20px;border:1px solid #d7dedf;border-radius:14px;line-height:1.9"><strong>${escapeHtml(bankName)} ${escapeHtml(account)}</strong><br>예금주 ${escapeHtml(holder)}<br>입금기한 ${escapeHtml(due)}</div><p style="line-height:1.7">개인 현금영수증은 등록 휴대전화 번호로 요청할 수 있습니다. 세금계산서가 필요하면 이 이메일에 사업자등록증과 수신 이메일을 회신해 주세요.</p>${policyLinks()}`));
}

export function sendPaymentConfirmedEmail(input: { name: string; email: string; productName: string; totalAmount: number }) {
  return send(input.email, "Career Direct 결제 확인이 완료되었습니다", shell(`<h1 style="font-size:24px;margin:0 0 20px">${escapeHtml(input.name)}님, 입금을 확인했습니다.</h1><p style="line-height:1.8"><strong>${escapeHtml(input.productName)} · ${formatWon(input.totalAmount)}</strong></p><p style="line-height:1.8">Career Direct 본부가 평가 링크를 이메일로 발송하면 안내에 따라 등록해 주세요. 링크 발송 후 14일 이내 등록을 완료해 주세요.</p>${policyLinks()}`));
}

export function sendRefundEmail(input: { name: string; email: string; amount: number; completed: boolean }) {
  return send(input.email, input.completed ? "환불 처리가 완료되었습니다" : "환불 요청이 접수되었습니다", shell(`<h1 style="font-size:24px;margin:0 0 20px">${escapeHtml(input.name)}님, 환불 ${input.completed ? "처리가 완료" : "요청이 접수"}되었습니다.</h1><p style="line-height:1.8">환불금액 <strong>${formatWon(input.amount)}</strong></p><p style="line-height:1.8">${input.completed ? "실제 입금 내역을 확인해 주세요." : "확정 후 3영업일 이내 처리하고 완료 이메일을 보내드립니다."}</p>${policyLinks()}`));
}
