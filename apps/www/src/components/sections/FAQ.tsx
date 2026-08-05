"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";

type QA = { q: string; a: string };

const items: QA[] = [
  {
    q: "진단에는 얼마나 걸리나요?",
    a: "온라인 진단은 약 60~90분 정도 소요됩니다. 방해받지 않는 편안한 환경에서 한 번에 완료하는 것을 권장해요.",
  },
  {
    q: "꼭 컨설턴트 해석이 필요한가요?",
    a: "혼자서 결과만 확인할 수도 있지만, 공인 컨설턴트와 함께 해석하면 결과를 훨씬 깊이 있게 이해하고 실제 실행 계획까지 이어갈 수 있어요.",
  },
  {
    q: "이 진단은 신뢰할 수 있나요?",
    a: "30년 이상 검증되고 심리측정학적으로 개발된 시스템으로, 84개국에서 40만 명 이상이 함께해왔습니다.",
  },
  {
    q: "이전에 다른 진로검사를 받아본 적 있는데도 도움이 될까요?",
    a: "네. 대부분의 검사는 한두 가지 요소만 다루지만, Career Direct는 성격·흥미·재능·가치관 네 가지를 통합적으로 분석하기 때문에 이전 검사와는 다른 깊이의 이해를 얻을 수 있어요.",
  },
  {
    q: "제 개인정보와 진단 결과는 안전하게 보호되나요?",
    a: "네, 진단 결과와 개인정보는 안전하게 보호되며 본인의 동의 없이 제3자와 공유되지 않습니다.",
  },
  {
    q: "신앙이 없어도 참여할 수 있나요?",
    a: "물론입니다. 성경적 세계관에 바탕을 두고 있지만 특정 교단 색채를 드러내지 않으며, 신앙 여부와 관계없이 누구나 자신을 이해하는 데 도움을 받을 수 있어요.",
  },
];

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0 },
};

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section className="bg-gray/15 px-6 py-24 sm:px-10 sm:py-28">
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
            자주 묻는 질문
          </h2>
          <p className="max-w-md text-base leading-7 text-navy/60 sm:text-lg">
            시작하기 전에 궁금한 점을 먼저 확인해보세요.
          </p>
        </motion.div>

        <div className="flex w-full flex-col gap-3">
          {items.map(({ q, a }, i) => {
            const open = openIndex === i;
            return (
              <motion.div
                key={q}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.6 }}
                variants={fadeUp}
                transition={{
                  duration: 0.5,
                  delay: i * 0.05,
                  ease: [0.16, 1, 0.3, 1],
                }}
                className="overflow-hidden rounded-2xl border border-navy/10 bg-cream"
              >
                <button
                  type="button"
                  onClick={() => setOpenIndex(open ? null : i)}
                  aria-expanded={open}
                  className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left"
                >
                  <span className="text-sm font-semibold text-navy sm:text-base">
                    {q}
                  </span>
                  <ChevronDown
                    className={`size-5 shrink-0 text-teal transition-transform ${
                      open ? "rotate-180" : ""
                    }`}
                    strokeWidth={2}
                  />
                </button>
                <AnimatePresence initial={false}>
                  {open && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                    >
                      <p className="px-6 pb-5 text-sm leading-7 text-navy/60">
                        {a}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
