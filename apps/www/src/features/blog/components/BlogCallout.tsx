import type { ReactNode } from "react";

export default function BlogCallout({ title, children }: { title: string; children: ReactNode }) {
  return <aside className="mt-8 rounded-2xl border-l-4 border-gold bg-cream p-6"><p className="font-black text-navy">{title}</p><div className="mt-2 leading-7 text-navy/70">{children}</div></aside>;
}
