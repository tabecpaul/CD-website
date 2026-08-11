"use client";

import type { ReactNode } from "react";
import { useRef } from "react";
import { sendBlogEvent } from "./BlogEventTracker";

export default function CardDeck({ children, ariaLabel = "핵심 카드 뉴스" }: { children: ReactNode; ariaLabel?: string }) {
  const sent = useRef(false);
  function markEngaged() {
    if (sent.current) return;
    sent.current = true;
    void sendBlogEvent("blog_card_engaged", "blog_card_deck");
  }
  return <section className="mt-12" aria-label={ariaLabel}><div className="flex items-end justify-between gap-4"><div><p className="text-xs font-black tracking-[.16em] text-teal">CARD NEWS</p><h2 className="mt-2 text-3xl font-black text-navy">핵심을 카드로 정리했습니다</h2></div><p className="hidden text-sm text-navy/50 sm:block">가로로 넘기거나 아래로 계속 읽어보세요.</p></div><ol onScroll={markEngaged} onPointerDown={markEngaged} onKeyDown={markEngaged} className="mt-6 grid snap-x snap-mandatory grid-flow-col auto-cols-[88%] gap-4 overflow-x-auto pb-5 sm:auto-cols-[48%] lg:auto-cols-[32%]">{children}</ol></section>;
}
