import type { Metadata } from "next";
import Image from "next/image";
import { ExternalLink, FileText } from "lucide-react";
import BrandTagline from "@/features/official-site/components/BrandTagline";
import OfficialCtaLink from "@/features/official-site/components/OfficialCtaLink";
import { Eyebrow, FinalCta, Section } from "@/features/official-site/components/OfficialPageShell";
import { ctas } from "@/features/official-site/content";

export const metadata: Metadata = {
  title: "박정열 마스터 공인 컨설턴트 | Career Direct Korea",
  description: "Career Direct 마스터 공인 컨설턴트 박정열의 공식 자격, 전문 영역, 주요 경력과 컨설팅 원칙을 소개합니다.",
  alternates: { canonical: "/consultant" },
};

const credentials = [
  "Career Direct Master Certified Consultant",
  "2011년부터 Career Direct 컨설팅",
  "2014년 Career Direct 국제 마스터 트레이너 인증",
  "한국·해외 교포·외국인 컨설팅 경험",
  "성결대학교 신학대학원 M.Div. · 현직 목사",
];

const specialties = [
  ["청소년·대학생", "전공과 진로 방향을 자기이해에서 출발해 구체화합니다."],
  ["취업을 앞둔 청년", "강점과 직무 적합성을 살펴 현실적인 첫 선택을 돕습니다."],
  ["직장인", "이직, 번아웃과 경력 전환의 기준을 함께 정리합니다."],
  ["경력단절 이후", "재취업과 새로운 역할을 현재 여건에 맞게 재설계합니다."],
  ["신앙·일·소명", "신앙을 강요하지 않고 삶의 자리에서 책임 있게 분별하도록 돕습니다."],
  ["보고서와 실행계획", "Career Direct 보고서를 해석하고 다음 행동으로 연결합니다."],
];

const career = [
  "성결대학교 신학대학원 M.Div.",
  "전) 두란노서원 제주지사 대표",
  "현) 타베크(TABEC) 대표",
  "현) 한국청지기아카데미 사역이사",
  "현) 목사(KAICAM · 한국독립교회선교단체연합회)",
];

const principles = [
  "평가 결과를 정답이나 운명처럼 절대화하지 않습니다.",
  "고객의 결정을 대신하지 않고 선택 기준을 분명하게 합니다.",
  "경력·관계·재정 등 현실 조건을 함께 검토합니다.",
  "신앙을 강요하지 않으며 상담 내용과 개인정보를 보호합니다.",
];

export default function ConsultantPage() {
  return (
    <>
      <section className="bg-cream px-5 py-16 sm:px-8 sm:py-24">
        <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[.72fr_1.28fr] lg:items-center">
          <div className="rounded-[2rem] bg-navy p-6 shadow-2xl sm:p-8">
            <div className="mx-auto overflow-hidden rounded-[1.5rem] border-4 border-gold/70 bg-white aspect-square w-full max-w-[250px]">
              <Image
                src="/consultant/park-jung-yull-official-profile.png"
                alt="Career Direct 마스터 공인 컨설턴트 박정열"
                width={250}
                height={250}
                priority
                className="h-full w-full object-cover"
              />
            </div>
            <p className="mt-5 text-center text-sm font-bold text-white/65">박정열 · Paul J. Park</p>
          </div>

          <div>
            <Eyebrow>MASTER CONSULTANT</Eyebrow>
            <BrandTagline className="mt-4 text-sm font-bold leading-6 text-teal" />
            <h1 className="mt-5 text-4xl font-black leading-tight tracking-tight text-navy sm:text-6xl">
              Career Direct 마스터 공인 컨설턴트 박정열
            </h1>
            <p className="mt-6 max-w-3xl text-lg leading-8 text-navy/70">
              평가 결과를 넘어, 당신의 고유한 디자인을 현실의 선택과 실행으로 연결합니다.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
              <OfficialCtaLink
                href={ctas.callback.href}
                eventName={ctas.callback.eventName}
                ctaLocation="consultant_hero_primary"
                className="rounded-full bg-gold px-7 py-4 text-center font-bold text-navy"
              >
                {ctas.callback.label}
              </OfficialCtaLink>
              <a
                href="https://careerdirect.org/consultant/29034"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center gap-2 rounded-full border border-navy/15 bg-white px-7 py-4 text-center font-bold text-navy"
              >
                본부 공식 프로필 확인 <ExternalLink className="size-4" aria-hidden="true" />
              </a>
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-navy/10 bg-white px-5 py-10 sm:px-8">
        <div className="mx-auto grid max-w-6xl gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {credentials.map((credential) => (
            <div key={credential} className="rounded-2xl bg-cream px-5 py-4 text-sm font-bold leading-6 text-navy">
              {credential}
            </div>
          ))}
        </div>
      </section>

      <Section eyebrow="PROFILE" title="한 사람의 결과표가 아니라, 한 사람의 삶을 봅니다">
        <div className="grid gap-8 text-lg leading-9 lg:grid-cols-2">
          <p>
            2011년부터 한국과 해외의 청소년, 대학생, 직장인과 진로 전환자를 만나왔습니다. 성격·흥미·재능·가치관을 통합적으로 해석하고, 보고서가 실제 진로 선택과 실행계획으로 이어지도록 돕습니다.
          </p>
          <p>
            Career Direct의 전문적인 평가 체계와 신학·목회적 이해를 함께 갖추되, 정답을 대신 결정하거나 신앙을 강요하지 않습니다. 고객이 자신의 삶과 현실 안에서 더 분명하고 책임 있게 선택하도록 동행합니다.
          </p>
        </div>
      </Section>

      <Section eyebrow="CONSULTING AREAS" title="이런 진로 과제를 함께 다룹니다" dark>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {specialties.map(([title, description], index) => (
            <article key={title} className="rounded-3xl border border-white/10 bg-white/5 p-6">
              <span className="text-xs font-black text-gold">AREA 0{index + 1}</span>
              <h3 className="mt-4 text-xl font-black text-white">{title}</h3>
              <p className="mt-3 leading-7 text-white/70">{description}</p>
            </article>
          ))}
        </div>
      </Section>

      <Section eyebrow="BACKGROUND" title="학력 및 주요 경력">
        <ul className="grid gap-4 md:grid-cols-2">
          {career.map((item) => (
            <li key={item} className="flex items-start gap-4 rounded-2xl bg-cream p-6 font-bold leading-7 text-navy">
              <span className="mt-2 size-2 shrink-0 rounded-full bg-teal" aria-hidden="true" />
              {item}
            </li>
          ))}
        </ul>
      </Section>

      <section className="bg-cream px-5 py-16 sm:px-8 sm:py-24">
        <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[1.25fr_.75fr] lg:items-center">
          <a
            href="/consultant/career-direct-master-consultant-certificate-ko.pdf"
            target="_blank"
            rel="noreferrer"
            className="group block overflow-hidden rounded-3xl border border-navy/10 bg-white shadow-xl"
            aria-label="Career Direct 마스터 공인 컨설턴트 자격증 원본 PDF 새 창에서 보기"
          >
            <Image
              src="/consultant/career-direct-master-consultant-certificate-ko.png"
              alt="박정열 Career Direct 마스터 공인 컨설턴트 자격증"
              width={1685}
              height={1191}
              className="h-auto w-full transition-transform duration-300 group-hover:scale-[1.01]"
            />
          </a>
          <div>
            <Eyebrow>MASTER CERTIFICATION</Eyebrow>
            <h2 className="mt-4 text-3xl font-black leading-tight text-navy sm:text-4xl">Career Direct 마스터 공인 컨설턴트 자격증</h2>
            <p className="mt-5 leading-8 text-navy/65">Career Direct 본부의 마스터 레벨 갱신 요건을 충족하고, 전문 컨설팅 분야의 지속적인 탁월함과 헌신적인 서비스를 인정받은 공인 자격입니다.</p>
            <dl className="mt-6 grid gap-2 text-sm text-navy/70">
              <div className="flex gap-3"><dt className="font-black text-navy">발행일</dt><dd>2026. 2. 28.</dd></div>
              <div className="flex gap-3"><dt className="font-black text-navy">만료일</dt><dd>2027. 2. 28.</dd></div>
            </dl>
            <a
              href="/consultant/career-direct-master-consultant-certificate-ko.pdf"
              target="_blank"
              rel="noreferrer"
              className="mt-7 inline-flex items-center gap-2 rounded-full bg-navy px-6 py-4 font-bold text-white"
            >
              <FileText className="size-4" aria-hidden="true" /> 인증서 원본 PDF 보기
            </a>
          </div>
        </div>
      </section>

      <Section eyebrow="OUR PRINCIPLES" title="컨설팅 원칙">
        <div className="grid gap-4 md:grid-cols-2">
          {principles.map((principle, index) => (
            <div key={principle} className="rounded-2xl bg-cream p-6">
              <span className="text-sm font-black text-gold">0{index + 1}</span>
              <p className="mt-3 font-semibold leading-7 text-navy">{principle}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section eyebrow="FAITH & CALLING" title="신앙과 일을 통합하는 관점" dark>
        <blockquote className="max-w-4xl text-2xl font-black leading-relaxed text-white sm:text-3xl">
          “모든 사람이 자신의 고유한 디자인을 이해하고, 삶과 신앙 안에서 책임 있게 선택하며, 맡겨진 자리에서 의미 있게 기여하도록 돕습니다.”
        </blockquote>
        <p className="mt-7 max-w-3xl text-lg leading-9 text-white/70">
          일은 단지 생계를 유지하는 수단만이 아니라, 고유한 성품과 재능으로 이웃과 세상에 기여하는 자리일 수 있습니다. 평가 결과로 하나님의 뜻을 단정하지 않고, 고객이 자신의 삶과 신앙 안에서 책임 있게 분별하도록 돕습니다.
        </p>
      </Section>

      <FinalCta primary="callback" title="당신의 이야기를 먼저 듣겠습니다" />
    </>
  );
}
