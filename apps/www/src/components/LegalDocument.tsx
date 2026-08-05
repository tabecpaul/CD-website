import type { ReactNode } from "react";

export default function LegalDocument({
  title,
  effectiveDate,
  children,
}: {
  title: string;
  effectiveDate: string;
  children: ReactNode;
}) {
  return (
    <article className="mx-auto w-full max-w-3xl px-6 py-16 sm:px-10 sm:py-20">
      <div className="flex flex-col gap-2 border-b border-navy/10 pb-8">
        <h1 className="text-3xl font-bold tracking-tight text-navy sm:text-4xl">
          {title}
        </h1>
        <p className="text-sm text-navy/50">시행일 {effectiveDate}</p>
      </div>
      <div className="legal-prose flex flex-col pt-10 text-sm leading-7 text-navy/80 sm:text-base">
        {children}
      </div>
    </article>
  );
}
