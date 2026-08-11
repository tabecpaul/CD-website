export default function BlogChecklist({ title = "실천 점검표", items }: { title?: string; items: readonly string[] }) {
  return <section className="mt-12 rounded-3xl bg-navy p-6 text-white sm:p-8"><h2 className="text-2xl font-black text-white">{title}</h2><ul className="mt-6 space-y-4">{items.map((item) => <li key={item} className="flex gap-3 leading-7 text-white/80"><span className="mt-1 flex size-6 shrink-0 items-center justify-center rounded-full bg-gold text-xs font-black text-navy" aria-hidden="true">✓</span><span>{item}</span></li>)}</ul></section>;
}
