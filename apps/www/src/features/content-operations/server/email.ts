import { Resend } from "resend";
import { contentChannelLabels, type ContentChannel, type ContentNotificationKind } from "../domain";
import { formatKoreaContentDateTime } from "./time";

export type ContentEmailResult = { ok: true; providerMessageId: string } | { ok: false; errorCode: string };

function escapeHtml(value: string) {
  return value.replace(/[&<>'"]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[char] ?? char);
}

const kindCopy: Record<ContentNotificationKind, { eyebrow: string; action: string }> = {
  day_before: { eyebrow: "내일 게시 준비", action: "문안·카드뉴스·대체 텍스트와 링크를 확인하고 준비 완료로 표시하세요." },
  publish_soon: { eyebrow: "30분 뒤 게시", action: "게시 문안과 UTM 링크를 복사해 외부 채널에 게시한 뒤 실제 게시 URL을 저장하세요." },
  performance_followup: { eyebrow: "초기 성과 확인", action: "각 채널의 게시 URL과 조회·반응·링크 클릭을 확인해 기록하세요." },
};

export async function sendContentReminderEmail(input: { itemId: number; title: string; channel: ContentChannel; kind: ContentNotificationKind; scheduledAt: Date; combinedMeta?: boolean }): Promise<ContentEmailResult> {
  try {
    const apiKey = process.env.RESEND_API_KEY?.trim();
    const fromValue = process.env.RESEND_FROM_EMAIL?.trim();
    const replyTo = process.env.RESEND_REPLY_TO_EMAIL?.trim() || fromValue;
    const to = process.env.CONTENT_NOTIFICATION_EMAIL?.trim() || "tabecpaul@gmail.com";
    if (!apiKey || !fromValue || !replyTo) return { ok: false, errorCode: "CONTENT_EMAIL_CONFIG_MISSING" };
    const from = fromValue.includes("<") ? fromValue : `Career Direct Korea <${fromValue}>`;
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://start.careerdirect.kr";
    const detailUrl = `${siteUrl}/admin/content/${input.itemId}`;
    const copy = kindCopy[input.kind];
    const channelLabel = input.combinedMeta ? "인스타그램·페이스북" : input.kind === "publish_soon" ? contentChannelLabels[input.channel] : "전체 채널";
    const scheduledLabel = formatKoreaContentDateTime(input.scheduledAt);
    const html = `<div style="margin:0;background:#f7f3ea;padding:32px 16px;font-family:Arial,'Apple SD Gothic Neo',sans-serif;color:#173b49"><div style="max-width:640px;margin:auto;background:#fff;border-radius:20px;padding:32px"><p style="margin:0;color:#278a96;font-size:12px;font-weight:700;letter-spacing:.12em">${escapeHtml(copy.eyebrow)}</p><h1 style="margin:12px 0 0;font-size:24px;line-height:1.35">${escapeHtml(input.title)}</h1><p style="margin-top:20px;line-height:1.7"><strong>채널:</strong> ${escapeHtml(channelLabel)}<br><strong>발행 예정:</strong> ${escapeHtml(scheduledLabel)}</p><p style="line-height:1.7">${escapeHtml(copy.action)}</p><p style="margin-top:28px"><a href="${escapeHtml(detailUrl)}" style="display:inline-block;background:#173b49;color:#fff;text-decoration:none;padding:13px 18px;border-radius:10px">콘텐츠 운영 화면 열기</a></p><p style="margin-top:24px;font-size:12px;color:#708086">이 이메일은 게시를 대신 수행하지 않으며 고객 개인정보를 포함하지 않습니다.</p></div></div>`;
    const result = await new Resend(apiKey).emails.send({ from, replyTo, to, subject: `[Career Direct Korea] ${copy.eyebrow} · ${input.title}`, html });
    return result.data?.id ? { ok: true, providerMessageId: result.data.id } : { ok: false, errorCode: "RESEND_EMAIL_ID_MISSING" };
  } catch (error) {
    return { ok: false, errorCode: error instanceof Error ? (error.name || error.message).slice(0, 80) : "CONTENT_EMAIL_FAILED" };
  }
}

