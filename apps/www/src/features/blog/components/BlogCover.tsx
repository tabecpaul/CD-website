import { getBlogCategory, type BlogPostMetadata } from "../domain";

export default function BlogCover({ metadata, compact = false }: { metadata: BlogPostMetadata; compact?: boolean }) {
  const category = getBlogCategory(metadata.category);
  return (
    <div className={`relative overflow-hidden bg-navy text-white ${compact ? "min-h-44 p-6" : "min-h-64 p-8 sm:p-10"}`} role="img" aria-label={metadata.coverAlt}>
      <div className="absolute -right-12 -top-16 size-52 rounded-full border-[34px] border-teal/20" aria-hidden="true" />
      <div className="absolute -bottom-20 -left-12 size-48 rotate-12 rounded-[3rem] border-[28px] border-gold/20" aria-hidden="true" />
      <div className="relative flex h-full flex-col justify-between gap-12">
        <p className="text-xs font-black tracking-[.16em] text-teal">CAREER DIRECT KOREA</p>
        <div>
          <p className="text-xs font-black text-gold">{category?.label}</p>
          <p className={`${compact ? "mt-3 text-xl" : "mt-4 text-2xl sm:text-3xl"} max-w-2xl font-black leading-tight`}>{metadata.title}</p>
        </div>
      </div>
    </div>
  );
}
