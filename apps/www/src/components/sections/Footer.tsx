import Image from "next/image";
import Link from "next/link";
import { Phone, Mail } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-navy px-6 py-14 sm:px-10">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8">
        <div className="flex flex-col items-center gap-3 text-center sm:flex-row sm:items-center sm:justify-between sm:text-left">
          <div className="flex items-center gap-3">
            <div className="flex items-center rounded-xl bg-cream px-3 py-2">
              <Image
                src="/career-direct-logo.png"
                alt="Career Direct"
                width={150}
                height={42}
                className="h-[30px] w-auto"
              />
            </div>
            <span className="text-lg font-black tracking-tight text-gold">
              Korea
            </span>
          </div>

          <div className="flex flex-col items-center gap-1.5 sm:items-end">
            <a
              href="tel:010-5231-1059"
              className="flex items-center gap-2 text-sm text-cream/70 hover:text-cream"
            >
              <Phone className="size-3.5" strokeWidth={2} />
              010-5231-1059
            </a>
            <a
              href="mailto:dulospaul@gmail.com"
              className="flex items-center gap-2 text-sm text-cream/70 hover:text-cream"
            >
              <Mail className="size-3.5" strokeWidth={2} />
              dulospaul@gmail.com
            </a>
          </div>
        </div>

        <div className="h-px w-full bg-cream/10" />

        <div className="flex flex-col items-center gap-3 text-center sm:flex-row sm:items-center sm:justify-between sm:text-left">
          <span className="text-xs font-bold tracking-[0.2em] text-gold">
            DISCOVER · GUIDE · LIVE BY DESIGN
          </span>
          <div className="flex items-center gap-4 text-xs text-cream/60">
            <Link href="/terms" className="hover:text-cream">
              이용약관
            </Link>
            <Link href="/privacy" className="hover:text-cream">
              개인정보처리방침
            </Link>
            <Link href="/refund-policy" className="hover:text-cream">
              결제 및 환불정책
            </Link>
          </div>
        </div>

        <div className="flex flex-col items-center gap-1 text-center sm:items-start sm:text-left">
          <span className="text-xs text-cream/40">
            Career Direct Korea · 대표 박정열 · 사업자등록번호 128-26-97778
          </span>
          <span className="text-xs text-cream/40">
            © 2026 Career Direct Korea. All rights reserved.
          </span>
        </div>
      </div>
    </footer>
  );
}
