"use client";

import { motion } from "framer-motion";

type Stat = { value: string; desc: string; source: string };

const stats: Stat[] = [
  {
    value: "32.2%",
    desc: "청년 3명 중 1명이 최근 1년간 번아웃을 경험했습니다.",
    source: "국가데이터처 『청년 삶의 질 2025』",
  },
  {
    value: "39.1%",
    desc: "번아웃의 가장 큰 원인은 '진로 불안'입니다.",
    source: "국무조정실 『2024 청년의 삶 실태조사』",
  },
  {
    value: "60%",
    desc: "신입사원 10명 중 6명이 입사 1~3년 내 조기 퇴사를 경험합니다.",
    source: "인크루트 2025년 5월 조사",
  },
  {
    value: "58.9%",
    desc: "조기 퇴사의 주된 이유는 '직무 불일치'였습니다.",
    source: "인크루트 2025",
  },
  {
    value: "45%",
    desc: "청년 10명 중 4~5명이 AI로 인해 취업 가능성이 낮아진다고 느낍니다.",
    source: "매일신문 2025.06",
  },
];

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0 },
};

export default function Empathy() {
  return (
    <section className="bg-light-gray px-6 py-24 sm:px-10 sm:py-28">
      <div className="mx-auto flex w-full max-w-4xl flex-col items-center gap-14">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.6 }}
          variants={fadeUp}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-col items-center gap-4 text-center"
        >
          <h2 className="text-3xl font-bold tracking-tight text-navy sm:text-4xl">
            왜 진로를 결정하는 것이 이렇게 어려울까요?
          </h2>
          <p className="max-w-xl text-base leading-7 text-navy/60 sm:text-lg">
            많은 사람들은 진로를 선택하기 전에 자신을 제대로 이해하지 못한
            채 중요한 결정을 내립니다.
          </p>
        </motion.div>

        <div className="grid w-full grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-5">
          {stats.map(({ value, desc, source }, i) => (
            <motion.div
              key={value + desc}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.6 }}
              variants={fadeUp}
              transition={{
                duration: 0.6,
                delay: i * 0.08,
                ease: [0.16, 1, 0.3, 1],
              }}
              className="flex flex-col items-center gap-3 rounded-2xl bg-white px-5 py-8 text-center shadow-sm"
            >
              <span className="text-4xl font-bold tracking-tight text-accent-blue">
                {value}
              </span>
              <p className="text-xs font-medium leading-5 text-navy/80">
                {desc}
              </p>
              <span className="text-[11px] text-navy/40">출처 · {source}</span>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.8 }}
          variants={fadeUp}
          transition={{ duration: 0.6, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-col items-center gap-3 text-center"
        >
          <p className="max-w-xl text-lg font-semibold leading-8 text-navy">
            이 숫자는 당신만의 문제가 아니라, 자기이해 없이 시작한 진로가
            만드는 세대 전체의 문제입니다.
            <br className="hidden sm:block" />
            먼저 하나님이 지으신 &lsquo;나&rsquo;를 이해하는 것에서
            시작해야 합니다.
          </p>
          <p className="text-sm text-navy/50">
            Career Direct는 바로 이 지점에서, 하나님이 디자인하신 당신을
            발견하도록 돕습니다.
          </p>
        </motion.div>
      </div>
    </section>
  );
}
