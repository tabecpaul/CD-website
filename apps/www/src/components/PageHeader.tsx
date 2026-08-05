import Link from "next/link";
import Image from "next/image";
import { ArrowLeft } from "lucide-react";

export default function PageHeader() {
  return (
    <header className="border-b border-navy/10 bg-cream px-6 py-5 sm:px-10">
      <div className="mx-auto flex w-full max-w-3xl items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <Image
            src="/career-direct-logo.png"
            alt="Career Direct"
            width={120}
            height={34}
            className="h-7 w-auto"
          />
          <span className="text-sm font-black tracking-tight text-navy">
            Korea
          </span>
        </Link>
        <Link
          href="/"
          className="flex items-center gap-1.5 text-sm font-medium text-navy/60 transition-colors hover:text-navy"
        >
          <ArrowLeft className="size-4" strokeWidth={2} />
          홈으로
        </Link>
      </div>
    </header>
  );
}
