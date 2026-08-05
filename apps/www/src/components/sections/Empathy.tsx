"use client";

import { motion } from "framer-motion";
import { Brain, Users, Coins, Compass, Search } from "lucide-react";
import type { LucideIcon } from "lucide-react";

type Point = { icon: LucideIcon; title: string; desc: string };

const points: Point[] = [
  {
    icon: Brain,
    title: "나를 잘 모릅니다.",
    desc: "성격, 강점, 재능을 객관적으로 모른 채 고민합니다.",
  },
  {
    icon: Users,
    title: "다른 사람의 기대를 따릅니다.",
    desc: "부모, 친구, 사회의 시선이 앞섭니다.",
  },
  {
    icon: Coins,
    title: "돈과 안정만 기준이 됩니다.",
    desc: "적성과 소명보다 조건이 먼저가 됩니다.",
  },
  {
    icon: Compass,
    title: "정보는 넘치는데 더 혼란스럽습니다.",
    desc: "직업은 많은데 나에게 맞는 길은 안 보입니다.",
  },
  {
    icon: Search,
    title: "하나님의 뜻을 알고 싶지만 막막합니다.",
    desc: "신앙과 진로를 연결하는 구체적 방법이 없습니다.",
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
          {points.map(({ icon: Icon, title, desc }, i) => (
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
              className="flex flex-col items-center gap-4 rounded-2xl bg-white px-6 py-8 text-center shadow-sm"
            >
              <Icon className="size-7 text-accent-blue" strokeWidth={1.75} />
              <div className="flex flex-col gap-1.5">
                <p className="text-sm font-semibold leading-6 text-navy">
                  {title}
                </p>
                <p className="text-xs leading-5 text-navy/55">{desc}</p>
              </div>
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
            진로는 더 많이 고민한다고 답이 나오는 문제가 아닙니다.
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
