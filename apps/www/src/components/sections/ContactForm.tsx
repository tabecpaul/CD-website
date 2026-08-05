"use client";

import { useState, type FormEvent } from "react";
import { motion } from "framer-motion";

const timeSlots = ["오전 (9시~12시)", "오후 (12시~6시)", "저녁 (6시~9시)"];

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0 },
};

export default function ContactForm() {
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitted(true);
  }

  return (
    <section id="contact" className="bg-cream px-6 py-24 sm:px-10 sm:py-28">
      <div className="mx-auto flex w-full max-w-md flex-col items-center gap-10">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.6 }}
          variants={fadeUp}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-col items-center gap-4 text-center"
        >
          <h2 className="text-3xl font-bold tracking-tight text-navy sm:text-4xl">
            지금, 첫 걸음을 시작하세요
          </h2>
          <p className="max-w-sm text-base leading-7 text-navy/60">
            20분 무료 상담으로 시작합니다. 편하게 남겨주시면 곧
            연락드릴게요.
          </p>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.6 }}
          variants={fadeUp}
          transition={{ duration: 0.6, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          className="w-full rounded-3xl border border-navy/10 bg-gray/15 px-7 py-8 sm:px-9 sm:py-9"
        >
          {submitted ? (
            <div className="flex flex-col items-center gap-2 py-8 text-center">
              <span className="text-lg font-bold text-navy">
                신청이 접수되었습니다
              </span>
              <p className="text-sm leading-6 text-navy/60">
                남겨주신 연락처로 빠르게 연락드리겠습니다.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="name"
                  className="text-xs font-semibold text-navy/70"
                >
                  이름
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  required
                  placeholder="이름을 입력해주세요"
                  className="h-11 rounded-xl border border-navy/15 bg-cream px-4 text-sm text-navy placeholder:text-navy/30 focus:border-gold focus:outline-none"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="phone"
                  className="text-xs font-semibold text-navy/70"
                >
                  연락처
                </label>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  required
                  placeholder="010-0000-0000"
                  className="h-11 rounded-xl border border-navy/15 bg-cream px-4 text-sm text-navy placeholder:text-navy/30 focus:border-gold focus:outline-none"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="timeSlot"
                  className="text-xs font-semibold text-navy/70"
                >
                  희망 상담 시간대
                </label>
                <select
                  id="timeSlot"
                  name="timeSlot"
                  required
                  defaultValue=""
                  className="h-11 rounded-xl border border-navy/15 bg-cream px-4 text-sm text-navy focus:border-gold focus:outline-none"
                >
                  <option value="" disabled>
                    시간대를 선택해주세요
                  </option>
                  {timeSlots.map((slot) => (
                    <option key={slot} value={slot}>
                      {slot}
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="submit"
                className="mt-2 flex h-12 items-center justify-center rounded-full bg-gold text-sm font-semibold text-cream transition-colors hover:bg-gold/90"
              >
                무료 진로 상담 신청
              </button>
            </form>
          )}
        </motion.div>
      </div>
    </section>
  );
}
