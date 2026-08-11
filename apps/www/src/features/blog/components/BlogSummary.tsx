import type { ReactNode } from "react";

export default function BlogSummary({ children }: { children: ReactNode }) {
  return <section className="mt-10 rounded-3xl border border-teal/25 bg-teal/10 p-6 sm:p-8" aria-label="핵심 답변"><p className="text-xs font-black tracking-[.16em] text-teal">핵심 답변</p><div className="mt-3 text-xl font-bold leading-9 text-navy">{children}</div></section>;
}
