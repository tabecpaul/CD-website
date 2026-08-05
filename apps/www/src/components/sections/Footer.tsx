import { Phone, Mail } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-navy px-6 py-14 sm:px-10">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8">
        <div className="flex flex-col items-center gap-3 text-center sm:flex-row sm:items-center sm:justify-between sm:text-left">
          <div className="flex items-center gap-2.5">
            <span className="flex size-9 items-center justify-center rounded-full bg-gold text-sm font-black text-cream">
              CD
            </span>
            <span className="text-lg font-black tracking-tight text-cream">
              Career Direct<span className="text-gold"> Korea</span>
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

        <div className="flex flex-col items-center gap-2 text-center sm:flex-row sm:items-center sm:justify-between sm:text-left">
          <span className="text-xs font-bold tracking-[0.2em] text-gold">
            DISCOVER · GUIDE · LIVE BY DESIGN
          </span>
          <span className="text-xs text-cream/40">
            © 2026 Career Direct Korea. All rights reserved.
          </span>
        </div>
      </div>
    </footer>
  );
}
