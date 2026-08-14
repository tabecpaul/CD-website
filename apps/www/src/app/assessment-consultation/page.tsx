import type { Metadata } from "next";
import { CheckCircle2, MessageCircle, ShieldCheck, Waypoints } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import Footer from "@/components/sections/Footer";
import TrackedExternalLink from "@/features/analytics/components/TrackedExternalLink";
import CallbackForm from "@/features/assessment-callback/components/CallbackForm";
import { normalizeCallbackSource } from "@/features/assessment-callback/domain";
import { callbackDateBounds } from "@/features/assessment-callback/server/validation";

export const metadata: Metadata = {
  title: "Career Direct 평가·상담 신청 | Career Direct Korea",
  description: "15분 전화 상담, 20분 Zoom 상담 또는 상담 없는 Career Direct 평가 안내 중 편한 시작 방법을 선택하세요.",
  alternates: { canonical: "/assessment-consultation" },
};

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function bounded(value: string | string[] | undefined, max: number) {
  const result = first(value)?.trim();
  return result && result.length <= max ? result : undefined;
}

export default async function AssessmentConsultationPage({ searchParams }: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const query = await searchParams;
  const bounds = callbackDateBounds();
  const programCohort = bounded(query.program_cohort, 128);
  const institutionName = bounded(query.institution, 160);
  const attribution = {
    source: normalizeCallbackSource(bounded(query.source, 64)),
    ctaLocation: bounded(query.cta_location, 64),
    utmSource: bounded(query.utm_source, 128),
    utmMedium: bounded(query.utm_medium, 128),
    utmCampaign: bounded(query.utm_campaign, 128),
    utmContent: bounded(query.utm_content, 128),
  };
  const benefits = [
    ["검사 적합성", "현재 고민에 Career Direct 검사가 적합한지 함께 확인합니다."],
    ["진행 과정", "평가, 보고서, 해석 컨설팅이 어떻게 이어지는지 설명합니다."],
    ["일정과 비용", "가능한 진행 일정과 선택할 수 있는 서비스 범위를 안내합니다."],
    ["다음 단계", "진행을 원할 때만 결제와 평가 시작 방법을 별도로 안내합니다."],
  ];
  return <><main className="min-h-screen bg-white text-navy"><PageHeader /><section className="bg-cream px-5 py-16 sm:px-8 sm:py-24"><div className="mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-[1fr_.9fr]"><div><p className="text-xs font-black tracking-[.17em] text-teal">CAREER DIRECT ASSESSMENT</p><h1 className="mt-5 text-4xl font-black leading-tight tracking-tight sm:text-6xl">평가와 컨설팅,<br />편한 방식으로 시작하세요.</h1><p className="mt-6 max-w-xl text-lg leading-8 text-navy/65">15분 전화 상담, 20분 Zoom 상담 또는 상담 없는 평가 안내 중 지금 필요한 방식을 선택할 수 있습니다. 신청만으로 결제되거나 평가가 시작되지 않습니다.</p><a href="#callback-form" className="mt-8 inline-flex rounded-xl bg-navy px-6 py-4 font-black text-white">시작 방법 선택하기</a></div><div className="rounded-[2rem] bg-navy p-7 text-white sm:p-9"><Waypoints className="size-8 text-teal" /><h2 className="mt-5 text-2xl font-black">신청 이후의 흐름</h2><ol className="mt-6 space-y-4 text-sm leading-6 text-white/70">{["전화·Zoom 상담 또는 직접 평가 안내 선택", "평가와 컨설팅 범위 확인", "진행을 원할 때 고객별 결제 안내", "결제 확인 후 공식 평가 진행"].map((item, index) => <li key={item} className="flex gap-3"><span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-teal text-xs font-black text-navy">{index + 1}</span>{item}</li>)}</ol></div></div></section>
      <section className="px-5 py-16 sm:px-8 sm:py-24"><div className="mx-auto max-w-6xl"><div className="text-center"><p className="text-xs font-black tracking-[.17em] text-teal">YOUR NEXT STEP</p><h2 className="mt-4 text-3xl font-black sm:text-5xl">시작 전에 확인할 네 가지</h2></div><div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{benefits.map(([title, description]) => <article key={title} className="rounded-2xl border border-navy/10 bg-white p-6"><CheckCircle2 className="size-6 text-teal" /><h3 className="mt-5 text-lg font-black">{title}</h3><p className="mt-3 text-sm leading-6 text-navy/60">{description}</p></article>)}</div></div></section>
      <section id="callback-form" className="bg-[#eaf5f5] px-5 py-16 sm:px-8 sm:py-24"><div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[.75fr_1.1fr]"><div><MessageCircle className="size-8 text-teal" /><h2 className="mt-5 text-3xl font-black sm:text-4xl">내게 맞는 시작 방법을 선택하세요.</h2><p className="mt-5 leading-8 text-navy/65">전화와 Zoom은 희망 일정을 남기고, 상담 없이 바로 평가 안내를 요청할 때는 일정 입력 없이 접수할 수 있습니다.</p><div className="mt-7 flex gap-3 rounded-2xl bg-white/70 p-5 text-sm leading-6 text-navy/65"><ShieldCheck className="mt-0.5 size-5 shrink-0 text-teal" />입력한 정보는 평가·상담 운영에만 사용하며, 원하지 않을 경우 이후 안내를 거절할 수 있습니다.</div><div className="mt-8 border-t border-navy/10 pt-6"><p className="text-sm text-navy/55">Career Direct의 공식 정보를 먼저 확인하고 싶으신가요?</p><TrackedExternalLink eventName="official_site_clicked" ctaLocation="assessment_consultation" href="https://careerdirect.org/?language_code=KO" target="_blank" rel="noreferrer" className="mt-3 inline-flex font-bold text-teal underline underline-offset-4">공식 한국어 사이트 둘러보기</TrackedExternalLink></div></div><CallbackForm minDate={bounds.min} maxDate={bounds.max} attribution={attribution} context={{ programCohort, institutionName }} /></div></section></main><Footer /></>;
}
