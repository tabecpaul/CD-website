import type { ReactNode } from "react";

export default function InsightCard({ number, eyebrow, title, children }: { number?: string; eyebrow?: string; title: string; children: ReactNode }) {
  return <li className="min-h-72 snap-start rounded-3xl bg-navy p-7 text-white shadow-xl"><span className="text-sm font-black text-gold">{eyebrow ?? number}</span><h3 className="mt-8 text-2xl font-black leading-tight text-white">{title}</h3><div className="mt-5 leading-8 text-white/70">{children}</div></li>;
}
