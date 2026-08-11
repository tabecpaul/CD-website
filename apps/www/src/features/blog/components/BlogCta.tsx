import OfficialCtaLink from "@/features/official-site/components/OfficialCtaLink";
import { ctas } from "@/features/official-site/content";
import type { BlogCta as BlogCtaType } from "../domain";

export default function BlogCta({ type }: { type: BlogCtaType }) {
  const cta = type === "self-check" ? ctas.careerCheck : ctas.callback;
  const location = type === "self-check" ? "blog_end_self_check" : "blog_end_callback";
  return <section className="mt-14 rounded-[2rem] bg-gold p-7 text-center text-navy sm:p-10"><p className="text-xs font-black tracking-[.16em]">NEXT STEP</p><h2 className="mt-3 text-3xl font-black">{type === "self-check" ? "나를 이해하는 질문부터 시작하세요" : "혼자 결정하기 어렵다면 먼저 이야기해 보세요"}</h2><p className="mx-auto mt-4 max-w-2xl leading-7 text-navy/70">정답을 서두르기보다 현재 상황과 선택 기준을 차분히 확인해 보세요.</p><OfficialCtaLink href={cta.href} eventName={cta.eventName} ctaLocation={location} className="mt-7 inline-flex rounded-full bg-navy px-7 py-4 font-bold text-white">{cta.label}</OfficialCtaLink></section>;
}
