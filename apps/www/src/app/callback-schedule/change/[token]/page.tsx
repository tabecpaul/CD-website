import type { Metadata } from "next";
import { notFound } from "next/navigation";
import RescheduleRequestForm from "@/features/assessment-callback/components/RescheduleRequestForm";
import { getPublicScheduleByToken } from "@/features/assessment-callback/server/reschedule";
import { formatKoreaDateInput, formatKoreaDateTime } from "@/features/assessment-callback/server/scheduleTime";

export const metadata: Metadata = { title: "콜백 일정 변경 요청 | Career Direct Korea", robots: { index: false, follow: false } };

export default async function ReschedulePage({ params }: { params: Promise<{ token: string }> }) {
  const token = (await params).token;
  const schedule = await getPublicScheduleByToken(token);
  if (!schedule?.confirmedStartAt || !schedule.confirmedEndAt) notFound();
  const now = new Date();
  const max = new Date(now.getTime() + 60 * 24 * 60 * 60_000);
  return <main className="min-h-screen bg-cream px-5 py-12 text-navy"><div className="mx-auto max-w-xl rounded-[28px] border border-navy/10 bg-white p-7 shadow-sm sm:p-10"><p className="text-xs font-black tracking-[.16em] text-teal">CAREER DIRECT KOREA</p><h1 className="mt-3 text-3xl font-black">콜백 일정 변경 요청</h1><p className="mt-4 text-sm leading-7 text-navy/60">현재 확정 일정은 <strong className="text-navy">{formatKoreaDateTime(schedule.confirmedStartAt)}</strong>입니다. 새 희망 일정을 남겨주시면 확인 후 다시 연락드립니다.</p><RescheduleRequestForm token={token} minDate={formatKoreaDateInput(now)} maxDate={formatKoreaDateInput(max)} /></div></main>;
}
