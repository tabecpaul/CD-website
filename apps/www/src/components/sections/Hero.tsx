"use client";

import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (delay: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, delay, ease: [0.16, 1, 0.3, 1] as const },
  }),
};

export default function Hero() {
  return (
    <section className="relative overflow-hidden bg-cream px-6 py-28 sm:px-10 sm:py-36">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[560px] bg-gradient-to-b from-gray/25 to-cream"
      />

      <div className="mx-auto flex w-full max-w-3xl flex-col items-center gap-8 text-center">
        <motion.h1
          initial="hidden"
          animate="visible"
          custom={0}
          variants={fadeUp}
          className="text-5xl font-bold tracking-tight text-navy sm:text-6xl"
        >
          Discover God&apos;s Design
        </motion.h1>

        <motion.p
          initial="hidden"
          animate="visible"
          custom={0.15}
          variants={fadeUp}
          className="max-w-xl text-lg font-medium leading-8 text-navy/80 sm:text-xl"
        >
          진로는 직업을 찾는 것이 아니라 하나님이 지으신 나를 발견하고
          소명을 분별하는 과정입니다.
        </motion.p>

        <motion.p
          initial="hidden"
          animate="visible"
          custom={0.3}
          variants={fadeUp}
          className="max-w-lg text-base leading-7 text-navy/60"
        >
          성격, 흥미, 재능, 가치관을 통합적으로 분석하여 하나님이 주신
          방향을 이해할 수 있도록 돕습니다.
        </motion.p>

        <motion.div
          initial="hidden"
          animate="visible"
          custom={0.45}
          variants={fadeUp}
          className="flex flex-col items-center gap-3 pt-4 sm:flex-row"
        >
          <a
            href="#contact"
            className="group flex h-12 items-center justify-center gap-2 rounded-full bg-gold px-7 text-sm font-semibold text-cream transition-colors hover:bg-gold/90"
          >
            무료 진로 상담 신청
            <ArrowRight
              className="size-4 transition-transform group-hover:translate-x-0.5"
              strokeWidth={2.5}
            />
          </a>
          <a
            href="#process"
            className="flex h-12 items-center justify-center rounded-full border border-navy/15 px-7 text-sm font-semibold text-navy transition-colors hover:bg-gray/20"
          >
            프로그램 알아보기
          </a>
        </motion.div>
      </div>
    </section>
  );
}
