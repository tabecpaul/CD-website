import type { Metadata } from "next";
import { CheckCircle2, MessageCircle, ShieldCheck, Waypoints } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import Footer from "@/components/sections/Footer";
import TrackedExternalLink from "@/features/analytics/components/TrackedExternalLink";
import CallbackForm from "@/features/assessment-callback/components/CallbackForm";
import { callbackDateBounds } from "@/features/assessment-callback/server/validation";

export const metadata: Metadata = {
  title: "Career Direct 검사 20분 무료 콜백 | Career Direct Korea",
  description: "Career Direct 검사 적합성, 진행 과정과 비용을 컨설턴트에게 20분 무료 콜백으로 안내받으세요.",
  alternates: { canonical: "/assessment-consultation" },
};

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function AssessmentConsultationPage({ searchParams }: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const query = await searchParams;
  const bounds = callbackDateBounds();
  const attribution = {
    source: first(query.source),
    ctaLocation: first(query.cta_location),
    utmSource: first(query.utm_source),
    utmMedium: first(query.utm_medium),
    utmCampaign: first(query.utm_campaign),
    utmContent: first(query.utm_content),
  };
  const benefits = [
    ["검사 적합성", "현재 고민에 Career Direct 검사가 적합한지 함께 확인합니다."],
    ["진행 과정", "평가, 보고서, 해석 컨설팅이 어떻게 이어지는지 설명합니다."],
    ["일정과 비용", "가능한 진행 일정과 선택할 수 있는 서비스 범위를 안내합니다."],
    ["다음 단계", "진행을 원할 때만 결제와 평가 시작 방법을 별도로 안내합니다."],
  ];
  return <><main className="min-h-screen bg-white text-navy"><PageHeader /><section className="bg-cream px-5 py-16 sm:px-8 sm:py-24"><div className="mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-[1fr_.9fr]"><div><p className="text-xs font-black tracking-[.17em] text-teal">CAREER DIRECT ASSESSMENT</p><h1 className="mt-5 text-4xl font-black leading-tight tracking-tight sm:text-6xl">검사를 결정하기 전에,<br />20분 먼저 이야기하세요.</h1><p className="mt-6 max-w-xl text-lg leading-8 text-navy/65">Career Direct 검사 적합성, 진행 과정과 비용을 1:1로 안내해 드립니다. 신청만으로 결제되거나 검사가 시작되지 않습니다.</p><a href="#callback-form" className="mt-8 inline-flex rounded-xl bg-navy px-6 py-4 font-black text-white">20분 무료 콜백 신청하기</a></div><div className="rounded-[2rem] bg-navy p-7 text-white sm:p-9"><Waypoints className="size-8 text-teal" /><h2 className="mt-5 text-2xl font-black">콜백 이후의 흐름</h2><ol className="mt-6 space-y-4 text-sm leading-6 text-white/70">{["희망 일정 확인 및 20분 통화 확정", "검사와 컨설팅 범위 안내", "진행을 원할 때 고객별 결제 안내", "결제 확인 후 공식 평가 진행"].map((item, index) => <li key={item} className="flex gap-3"><span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-teal text-xs font-black text-navy">{index + 1}</span>{item}</li>)}</ol></div></div></section>
      <section className="px-5 py-16 sm:px-8 sm:py-24"><div className="mx-auto max-w-6xl"><div className="text-center"><p className="text-xs font-black tracking-[.17em] text-teal">YOUR 20-MINUTE CALLBACK</p><h2 className="mt-4 text-3xl font-black sm:text-5xl">짧은 통화에서 확인할 네 가지</h2></div><div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{benefits.map(([title, description]) => <article key={title} className="rounded-2xl border border-navy/10 bg-white p-6"><CheckCircle2 className="size-6 text-teal" /><h3 className="mt-5 text-lg font-black">{title}</h3><p className="mt-3 text-sm leading-6 text-navy/60">{description}</p></article>)}</div></div></section>
      <section id="callback-form" className="bg-[#eaf5f5] px-5 py-16 sm:px-8 sm:py-24"><div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[.75fr_1.1fr]"><div><MessageCircle className="size-8 text-teal" /><h2 className="mt-5 text-3xl font-black sm:text-4xl">편한 시간대를 남겨주세요.</h2><p className="mt-5 leading-8 text-navy/65">영업일 기준 1일 이내에 연락드려 실제 통화 시간을 확정합니다.</p><div className="mt-7 flex gap-3 rounded-2xl bg-white/70 p-5 text-sm leading-6 text-navy/65"><ShieldCheck className="mt-0.5 size-5 shrink-0 text-teal" />응답하지 않음을 선택할 수 있으며, 입력한 정보는 콜백과 상담 운영에만 사용합니다.</div><div className="mt-8 border-t border-navy/10 pt-6"><p className="text-sm text-navy/55">Career Direct의 공식 정보를 먼저 확인하고 싶으신가요?</p><TrackedExternalLink eventName="official_site_clicked" ctaLocation="assessment_consultation" href="https://careerdirect.org/?language_code=KO" target="_blank" rel="noreferrer" className="mt-3 inline-flex font-bold text-teal underline underline-offset-4">공식 한국어 사이트 둘러보기</TrackedExternalLink></div></div><CallbackForm minDate={bounds.min} maxDate={bounds.max} attribution={attribution} /></div></section></main><Footer /></>;
}
