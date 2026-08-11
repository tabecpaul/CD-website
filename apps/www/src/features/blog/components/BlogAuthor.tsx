import Image from "next/image";
import Link from "next/link";

export default function BlogAuthor({ compact = false }: { compact?: boolean }) {
  return (
    <aside className={`flex items-center gap-4 ${compact ? "" : "rounded-3xl bg-cream p-6 sm:p-8"}`} aria-label="작성자 소개">
      <Image src="/consultant/park-jung-yull-official-profile.png" alt="박정열 Career Direct 마스터 공인 컨설턴트" width={72} height={72} className="size-16 rounded-2xl object-cover" />
      <div>
        <p className="font-black text-navy">박정열 | Career Direct 마스터 공인 컨설턴트</p>
        {!compact ? <p className="mt-1 text-sm leading-6 text-navy/60">Discover Your Design. Discern Your Calling. Drive Your Journey.</p> : null}
        <Link href="/consultant" className="mt-2 inline-block text-sm font-bold text-teal underline underline-offset-4">컨설턴트 프로필 보기</Link>
      </div>
    </aside>
  );
}
