export default function Home() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center bg-cream px-6">
      <div className="flex w-full max-w-md flex-col items-center gap-4 rounded-3xl border border-gray/60 bg-cream px-10 py-12 text-center">
        <span className="rounded-full bg-navy px-4 py-1.5 text-xs font-bold text-cream">
          ADMIN
        </span>
        <h1 className="text-2xl font-black tracking-tight text-navy">
          진로.solution 관리자
        </h1>
        <p className="text-sm leading-6 text-navy/70">
          대시보드 화면은 준비 중입니다. 곧 회원, 코칭, 콘텐츠 관리 기능이
          이곳에 추가됩니다.
        </p>
      </div>
    </div>
  );
}
