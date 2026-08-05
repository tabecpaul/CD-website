"use client";

import { motion } from "framer-motion";
import { Quote } from "lucide-react";

type Testimonial = { quote: string; who: string };

const testimonials: Testimonial[] = [
  {
    quote:
      "막연했던 진로 고민이 처음으로 선명해졌어요. 내가 어떤 사람인지 알고 나니, 전공 선택에 확신이 생겼습니다.",
    who: "대학생, 22세",
  },
  {
    quote:
      "이직을 고민하던 시기에 진단을 받았는데, 조건이 아니라 제 소명을 기준으로 결정할 수 있었어요.",
    who: "직장인, 29세",
  },
  {
    quote:
      "아이의 성격과 재능을 이해하게 되면서, 자녀와의 대화가 완전히 달라졌습니다.",
    who: "학부모",
  },
];

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0 },
};

export default function Testimonials() {
  return (
    <section className="bg-cream px-6 py-24 sm:px-10 sm:py-28">
      <div className="mx-auto flex w-full max-w-5xl flex-col items-center gap-14">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.6 }}
          variants={fadeUp}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-col items-center gap-4 text-center"
        >
          <h2 className="text-3xl font-bold tracking-tight text-navy sm:text-4xl">
            먼저 경험한 사람들의 이야기
          </h2>
          <p className="max-w-md text-base leading-7 text-navy/60 sm:text-lg">
            Career Direct와 함께 자신을 이해하고 방향을 찾은 순간들입니다.
          </p>
        </motion.div>

        <div className="grid w-full grid-cols-1 gap-6 sm:grid-cols-3">
          {testimonials.map(({ quote, who }, i) => (
            <motion.div
              key={who}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.6 }}
              variants={fadeUp}
              transition={{
                duration: 0.6,
                delay: i * 0.1,
                ease: [0.16, 1, 0.3, 1],
              }}
              className="flex flex-col gap-5 rounded-2xl border border-navy/10 bg-gray/15 px-7 py-8 shadow-sm"
            >
              <Quote
                className="size-6 text-teal"
                strokeWidth={1.75}
                fill="currentColor"
                fillOpacity={0.12}
              />
              <p className="flex-1 text-sm leading-7 text-navy/80">
                {quote}
              </p>
              <span className="text-xs font-semibold text-navy/50">
                {who}
              </span>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
