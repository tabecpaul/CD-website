"use client";

import { motion } from "framer-motion";
import {
  MessageCircle,
  ClipboardList,
  Users,
  ListChecks,
  HeartHandshake,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

type Step = { icon: LucideIcon; title: string; desc: string };

const steps: Step[] = [
  {
    icon: MessageCircle,
    title: "20분 무료 상담",
    desc: "먼저 편안한 대화로 시작합니다. 지금의 고민을 나누고, Career Direct가 도움이 될지 함께 확인해요.",
  },
  {
    icon: ClipboardList,
    title: "Career Direct 온라인 진단 (약 60~90분 소요)",
    desc: "성격, 흥미, 재능, 가치관 4요소를 통합적으로 평가하는 공인 진단을 진행합니다.",
  },
  {
    icon: Users,
    title: "보고서 해석 컨설팅",
    desc: "공인 컨설턴트와 함께 진단 결과를 깊이 있게 해석하고, 나에게 어떤 의미인지 이해합니다.",
  },
  {
    icon: ListChecks,
    title: "맞춤 실행 계획",
    desc: "해석을 바탕으로 나만의 구체적인 진로 액션 플랜을 함께 수립합니다.",
  },
  {
    icon: HeartHandshake,
    title: "코칭",
    desc: "실행 계획을 실제 삶에 적용할 수 있도록 지속적으로 동행합니다.",
  },
];

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0 },
};

export default function Process() {
  return (
    <section className="bg-light-gray px-6 py-24 sm:px-10 sm:py-28">
      <div className="mx-auto flex w-full max-w-2xl flex-col items-center gap-14">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.6 }}
          variants={fadeUp}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-col items-center gap-4 text-center"
        >
          <h2 className="text-3xl font-bold tracking-tight text-navy sm:text-4xl">
            다섯 단계로 완성되는 여정
          </h2>
          <p className="max-w-md text-base leading-7 text-navy/60 sm:text-lg">
            부담 없는 대화에서 시작해 나만의 실행 계획까지, 함께 걸어갑니다.
          </p>
        </motion.div>

        <div className="relative flex w-full flex-col gap-10">
          <div
            aria-hidden
            className="absolute top-2 bottom-2 left-5 w-px bg-navy/15"
          />
          {steps.map(({ icon: Icon, title, desc }, i) => (
            <motion.div
              key={title}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.6 }}
              variants={fadeUp}
              transition={{
                duration: 0.6,
                delay: i * 0.08,
                ease: [0.16, 1, 0.3, 1],
              }}
              className="relative flex items-start gap-5"
            >
              <div className="relative z-10 flex size-10 shrink-0 items-center justify-center rounded-full bg-accent-blue text-sm font-bold text-white shadow-md">
                {i + 1}
              </div>
              <div className="flex flex-col gap-1.5 pt-1.5">
                <div className="flex items-center gap-2">
                  <Icon className="size-4 text-accent-blue" strokeWidth={2} />
                  <span className="text-base font-bold text-navy">
                    {title}
                  </span>
                </div>
                <p className="text-sm leading-6 text-navy/60">{desc}</p>
              </div>
            </motion.div>
          ))}
        </div>

        <motion.a
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.8 }}
          variants={fadeUp}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          href="#contact"
          className="flex h-12 items-center justify-center rounded-full bg-accent-blue px-8 text-sm font-semibold text-white transition-colors hover:bg-accent-blue/90"
        >
          무료 진로 상담 신청
        </motion.a>
      </div>
    </section>
  );
}
