"use client";

import { motion } from "framer-motion";
import { Compass, Target, Gem, Star } from "lucide-react";
import type { LucideIcon } from "lucide-react";

type CompassPoint = {
  icon: LucideIcon;
  label: string;
  desc: string;
  position: string;
};

const compassPoints: CompassPoint[] = [
  {
    icon: Compass,
    label: "성격",
    desc: "어떻게 일할 때\n편안한가",
    position:
      "top-2 left-1/2 -translate-x-1/2 sm:top-0 sm:-translate-y-1/2",
  },
  {
    icon: Target,
    label: "흥미",
    desc: "무엇에\n자연스럽게 끌리는가",
    position:
      "right-2 top-1/2 -translate-y-1/2 sm:right-0 sm:translate-x-1/2",
  },
  {
    icon: Gem,
    label: "재능",
    desc: "무엇을\n잘하는가",
    position:
      "bottom-2 left-1/2 -translate-x-1/2 sm:bottom-0 sm:translate-y-1/2",
  },
  {
    icon: Star,
    label: "가치관",
    desc: "왜 그 일을\n하는가",
    position:
      "left-2 top-1/2 -translate-y-1/2 sm:left-0 sm:-translate-x-1/2",
  },
];

const steps = [
  {
    en: "Discover Your Design",
    ko: "디자인 발견",
    desc: "4요소 통합 진단을 통해 고유하게 디자인된 나를 발견합니다.",
  },
  {
    en: "Guided Journey",
    ko: "가이드 동행",
    desc: "공인 컨설턴트가 결과를 해석하고 개인 맞춤 실행 계획을 수립합니다.",
  },
  {
    en: "Live by Design",
    ko: "목적에 따라 살기",
    desc: "얻은 명확함과 확신을 바탕으로 실제 진로의 발걸음을 내딛습니다.",
  },
];

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0 },
};

export default function CareerDirect() {
  return (
    <section id="career-direct" className="bg-white px-6 py-24 sm:px-10 sm:py-28">
      <div className="mx-auto flex w-full max-w-4xl flex-col items-center gap-16">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.6 }}
          variants={fadeUp}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-col items-center gap-4 text-center"
        >
          <h2 className="max-w-xl text-3xl font-bold tracking-tight text-navy sm:text-4xl">
            하나님이 지으신 &lsquo;나&rsquo;를 발견하는
            <br className="hidden sm:block" />
            가장 객관적인 방법
          </h2>
          <p className="max-w-xl text-base leading-7 text-navy/60 sm:text-lg">
            성격, 흥미, 재능, 가치관을 통합적으로 분석해 강점과 하나님이
            주신 방향을 분별하도록 돕습니다.
          </p>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.4 }}
          variants={fadeUp}
          transition={{ duration: 0.7, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          className="relative mx-auto aspect-square w-full max-w-[320px] sm:max-w-[420px]"
        >
          <div
            aria-hidden
            className="absolute inset-10 rounded-full border-2 border-dashed border-navy/15 sm:inset-14"
          />
          <div className="absolute top-1/2 left-1/2 z-10 flex size-10 -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center rounded-full bg-navy text-white shadow-lg sm:size-12">
            <span className="text-base font-bold sm:text-lg">나</span>
          </div>

          {compassPoints.map(({ icon: Icon, label, desc, position }, i) => (
            <motion.div
              key={label}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.6 }}
              variants={fadeUp}
              transition={{
                duration: 0.6,
                delay: 0.2 + i * 0.1,
                ease: [0.16, 1, 0.3, 1],
              }}
              className={`absolute z-10 flex w-28 flex-col items-center gap-1.5 rounded-2xl border border-navy/10 bg-white px-3 py-3.5 text-center shadow-lg sm:w-32 sm:px-4 sm:py-4 ${position}`}
            >
              <Icon className="size-6 text-accent-blue" strokeWidth={1.75} />
              <span className="text-sm font-bold text-navy">{label}</span>
              <span className="whitespace-pre-line text-[11px] leading-tight text-navy/65">
                {desc}
              </span>
            </motion.div>
          ))}
        </motion.div>

        <motion.p
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.8 }}
          variants={fadeUp}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="text-center text-sm font-medium text-navy/60 sm:text-base"
        >
          30년 이상 검증된 시스템 · 84개국 · 21개 언어 사용 중 · 40만+ 명이
          함께한 여정
        </motion.p>

        <div className="grid w-full grid-cols-1 gap-5 sm:grid-cols-3">
          {steps.map((step, i) => (
            <motion.div
              key={step.en}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.6 }}
              variants={fadeUp}
              transition={{
                duration: 0.6,
                delay: i * 0.1,
                ease: [0.16, 1, 0.3, 1],
              }}
              className="flex flex-col gap-2 rounded-2xl bg-light-gray px-6 py-7"
            >
              <span className="text-xs font-semibold tracking-wide text-accent-blue">
                STEP {i + 1}
              </span>
              <span className="text-base font-bold text-navy">
                {step.ko}
                <span className="ml-2 text-xs font-medium text-navy/40">
                  {step.en}
                </span>
              </span>
              <p className="text-sm leading-6 text-navy/60">{step.desc}</p>
            </motion.div>
          ))}
        </div>

        <motion.blockquote
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.7 }}
          variants={fadeUp}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="mx-auto flex max-w-xl flex-col items-center gap-3 rounded-3xl bg-navy px-8 py-10 text-center sm:px-12"
        >
          <span className="text-3xl font-black text-accent-blue">
            &ldquo;
          </span>
          <p className="text-lg font-semibold leading-8 text-white sm:text-xl">
            진로는 직업을 찾는 것이 아니라, 하나님이 지으신 &lsquo;나&rsquo;를
            이해하고 소명을 분별하는 과정입니다.
          </p>
        </motion.blockquote>

        <motion.p
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.8 }}
          variants={fadeUp}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="text-center text-sm text-navy/50"
        >
          그렇다면, 실제로는 어떻게 진행될까요?
        </motion.p>
      </div>
    </section>
  );
}
