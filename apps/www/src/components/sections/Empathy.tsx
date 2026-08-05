"use client";

import { motion } from "framer-motion";
import { Brain, Compass, Users, Coins, Hourglass } from "lucide-react";
import type { LucideIcon } from "lucide-react";

type Point = { icon: LucideIcon; text: string };

const points: Point[] = [
  { icon: Brain, text: "내 성격과 강점을 잘 몰라서" },
  { icon: Compass, text: "무엇을 좋아하는지조차 헷갈려서" },
  { icon: Users, text: "부모님이나 주변 기대에 맞추려다 보니" },
  { icon: Coins, text: "돈이나 안정만 보고 선택하게 되어서" },
  { icon: Hourglass, text: "지금 선택이 평생을 결정할 것 같아 두려워서" },
];

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0 },
};

export default function Empathy() {
  return (
    <section className="bg-light-gray px-6 py-24 sm:px-10 sm:py-28">
      <div className="mx-auto flex w-full max-w-4xl flex-col items-center gap-14">
        <motion.h2
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.6 }}
          variants={fadeUp}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="text-center text-3xl font-bold tracking-tight text-navy sm:text-4xl"
        >
          왜 진로를 결정하기가 이렇게 어려울까요?
        </motion.h2>

        <div className="grid w-full grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-5">
          {points.map(({ icon: Icon, text }, i) => (
            <motion.div
              key={text}
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
              <p className="text-sm font-medium leading-6 text-navy/80">
                {text}
              </p>
            </motion.div>
          ))}
        </div>

        <motion.p
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.8 }}
          variants={fadeUp}
          transition={{ duration: 0.6, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="max-w-xl text-center text-lg font-semibold leading-8 text-navy"
        >
          진로는 더 많이 고민한다고 답이 나오는 문제가 아니라
          <br className="hidden sm:block" />
          나를 이해하는 것에서 시작해야 합니다.
        </motion.p>
      </div>
    </section>
  );
}
