const navLinks = [
  { href: "#part-1", label: "현실 인식" },
  { href: "#part-2", label: "자기이해" },
  { href: "#part-3", label: "4가지 요소" },
  { href: "#part-4", label: "프로세스" },
  { href: "#part-5", label: "검증된 변화" },
];

type Stat = { value: string; label: string; source: string };
type ListItem = { title: string; desc: string };

type Part = {
  id: string;
  num: string;
  dark: boolean;
  eyebrow: string;
  title: string;
  intro: string;
} & (
  | { kind: "stats"; stats: Stat[] }
  | { kind: "list"; items: ListItem[] }
);

const parts: Part[] = [
  {
    id: "part-1",
    num: "01",
    dark: true,
    eyebrow: "PART 01 · 현실 진단",
    title: "지금, 우리는 어디에 서 있는가",
    intro:
      "한국 청년들의 진로 현실을 통계로 마주합니다. 나만의 문제가 아닌 세대 전체의 구조적 문제임을 이해하는 것이 여정의 첫 걸음입니다.",
    kind: "stats",
    stats: [
      {
        value: "32.2%",
        label:
          "청년 3명 중 1명이 최근 1년간 번아웃(육체적·정신적 소진)을 경험했습니다.",
        source: "국가데이터처 『청년 삶의 질 2025』",
      },
      {
        value: "39.1%",
        label:
          "번아웃의 최대 원인은 '진로 불안'. 19~24세는 54.8%가 이를 원인으로 꼽았습니다.",
        source: "국무조정실 『2024 청년의 삶 실태조사』",
      },
      {
        value: "60%",
        label: "신입사원 10명 중 6명이 입사 1~3년 이내 조기 퇴사를 경험합니다.",
        source: "인크루트 2025년 5월 조사",
      },
      {
        value: "58.9%",
        label:
          "조기 퇴사의 주된 이유는 '직무 불일치' — 자신과 맞지 않는 일이었다는 뜻입니다.",
        source: "인크루트 2025",
      },
    ],
  },
  {
    id: "part-2",
    num: "02",
    dark: false,
    eyebrow: "PART 02 · 자기이해의 절대적 필요성",
    title: "결정을 바꾸기 전에, 나를 먼저 알아야 합니다",
    intro:
      "옳은 진로 결정은 정보의 양이 아니라 자기 이해의 깊이에서 시작됩니다. 문제의 뿌리는 대부분 '자기이해 없이 시작하는 진로'라는 구조적 관행에 있습니다.",
    kind: "stats",
    stats: [
      {
        value: "50%",
        label: "한국의 전공-직업 불일치율. OECD 회원국 중 최상위권입니다.",
        source: "OECD 통계",
      },
      {
        value: "39%",
        label: "세계 청소년 10명 중 4명이 진로 목표조차 명확하지 않다고 답했습니다.",
        source: "OECD",
      },
      {
        value: "57.9%",
        label: "이직·구직 시 '임금'을 1순위로 고려한다고 답한 청년의 비율.",
        source: "국무조정실 『2024 청년의 삶 실태조사』",
      },
      {
        value: "5.4%",
        label: "반면 '장기적 진로설계'를 1순위로 꼽은 청년은 20명 중 1명뿐입니다.",
        source: "국무조정실 『2024 청년의 삶 실태조사』",
      },
    ],
  },
  {
    id: "part-3",
    num: "03",
    dark: true,
    eyebrow: "PART 03 · 네 가지 진로결정 나침반",
    title: "나를 아는 것이 먼저다",
    intro:
      "성격·흥미·재능·가치관 — 이 네 가지 나침반이 정렬될 때 AI 시대에도 흔들리지 않는 나만의 길이 열립니다.",
    kind: "list",
    items: [
      {
        title: "① 성격 Personality",
        desc: "어떤 방식으로 일할 때 편안한가? 성격에 맞지 않는 직무는 번아웃과 조기 퇴사의 주요 원인입니다.",
      },
      {
        title: "② 흥미 Interest",
        desc: "어떤 활동에 자연스럽게 끌리는가? 흥미는 동기와 몰입의 원천입니다.",
      },
      {
        title: "③ 재능·적성 Talent",
        desc: "무엇을 잘할 수 있는가? AI 시대, 나만의 차별화된 재능이 대체 불가 영역을 만듭니다.",
      },
      {
        title: "④ 가치관 Values",
        desc: "무엇을 위해 일하고 싶은가? 가치관이 어긋나면 '의미 없는 일'이라는 회의감이 남습니다.",
      },
    ],
  },
  {
    id: "part-4",
    num: "04",
    dark: false,
    eyebrow: "PART 04 · CareerDirect 프로세스",
    title: "진단에서 실행까지, 하나의 시스템 안에서",
    intro:
      "30년 이상 검증되어 전 세계 40만 명 이상이 활용한 CareerDirect(careerdirect.org)는 네 가지 요소를 하나의 시스템에서 통합 분석합니다.",
    kind: "list",
    items: [
      {
        title: "Discover Your Design",
        desc: "4요소 통합 진단으로 '고유하게 디자인된 나'를 발견합니다.",
      },
      {
        title: "Guided Journey",
        desc: "공인 컨설턴트가 결과를 해석하고 개인 맞춤 실행 계획을 세웁니다.",
      },
      {
        title: "Live by Design",
        desc: "전공 선택, 취업, 경력 전환에서 확신 있는 결정을 실행합니다.",
      },
    ],
  },
  {
    id: "part-5",
    num: "05",
    dark: true,
    eyebrow: "PART 05 · 검증된 변화",
    title: "이미 40만 명이 확인한 변화",
    intro:
      "CareerDirect를 경험한 사람들의 응답입니다. 스스로에 대한 확신은 숫자로도 증명됩니다.",
    kind: "stats",
    stats: [
      {
        value: "94%",
        label: "성장과 번영에 도움이 되었다고 응답했습니다.",
        source: "CareerDirect 이용자 조사",
      },
      {
        value: "90%",
        label: "진로·교육 방향에 대한 확신을 얻었다고 응답했습니다.",
        source: "CareerDirect 이용자 조사",
      },
      {
        value: "88%",
        label: "진로 방향이 명확해졌다고 응답했습니다.",
        source: "CareerDirect 이용자 조사",
      },
    ],
  },
];

function StatCard({ value, label, source, dark }: Stat & { dark: boolean }) {
  return (
    <div
      className={`flex flex-col gap-2 border-l-4 border-tan py-5 pl-6 pr-4 ${
        dark ? "bg-white/5" : "bg-cream"
      }`}
    >
      <span
        className={`text-5xl font-black tracking-tight sm:text-6xl ${
          dark ? "text-white" : "text-teal"
        }`}
      >
        {value}
      </span>
      <p
        className={`text-sm font-bold leading-6 ${
          dark ? "text-cream/90" : "text-teal"
        }`}
      >
        {label}
      </p>
      <span
        className={`text-xs ${dark ? "text-cream/45" : "text-teal/45"}`}
      >
        출처 · {source}
      </span>
    </div>
  );
}

function ContactBand({ text }: { text: string }) {
  return (
    <section className="bg-tan px-6 py-10 sm:px-10">
      <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-5 text-center sm:flex-row sm:text-left">
        <p className="text-base font-bold text-teal sm:text-lg">{text}</p>
        <a
          href="#contact"
          className="shrink-0 rounded-full bg-teal px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-teal/90"
        >
          문의하기
        </a>
      </div>
    </section>
  );
}

export default function Home() {
  return (
    <div className="flex flex-1 flex-col bg-white">
      <header className="sticky top-0 z-10 border-b border-line bg-white/95 backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-5 sm:px-10">
          <span className="shrink-0 text-lg font-black tracking-tight text-teal">
            진로<span className="text-tan">.</span>solution
          </span>
          <nav className="hidden items-center gap-6 text-sm font-medium text-teal/70 lg:flex">
            {navLinks.map((link) => (
              <a key={link.href} href={link.href} className="hover:text-teal">
                {link.label}
              </a>
            ))}
          </nav>
          <a
            href="#contact"
            className="shrink-0 rounded-full bg-teal px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-teal/90"
          >
            문의하기
          </a>
        </div>
      </header>

      <main className="flex flex-1 flex-col">
        <section className="bg-teal px-6 py-20 sm:px-10 sm:py-28">
          <div className="mx-auto flex w-full max-w-3xl flex-col items-center gap-8 text-center">
            <span className="text-xs font-bold tracking-[0.3em] text-tan">
              WORKSHOP INSIGHT
            </span>
            <h1 className="text-4xl font-black leading-tight tracking-tight text-white sm:text-5xl">
              AI 시대, 나만의 길을 찾는
              <br />
              <span className="text-tan">4가지 나침반</span>
            </h1>
            <p className="max-w-xl text-base leading-7 text-cream/70 sm:text-lg">
              청년 번아웃의 40%는 진로불안에서, 조기 퇴사의 60%는 직무
              불일치에서 시작됩니다. 성격·흥미·재능·가치관 — 네 나침반이
              정렬될 때 흔들리지 않는 진로가 열립니다.
            </p>

            <div className="w-full max-w-md rounded-2xl border border-tan/40 px-8 py-8">
              <span className="text-2xl font-black text-tan">&ldquo;</span>
              <p className="text-lg font-bold leading-8 text-white">
                이력서 스펙보다
                <br />
                나 자신을 아는 것이 먼저입니다.
              </p>
            </div>

            <div className="flex flex-col gap-3 pt-2 sm:flex-row">
              <a
                href="#part-1"
                className="flex h-12 items-center justify-center rounded-full bg-tan px-7 text-sm font-bold text-teal transition-colors hover:bg-tan/90"
              >
                지금 시작하기
              </a>
              <a
                href="#contact"
                className="flex h-12 items-center justify-center rounded-full border-2 border-white/25 px-7 text-sm font-bold text-white transition-colors hover:bg-white/10"
              >
                문의하기
              </a>
            </div>
          </div>
        </section>

        {parts.map((part) => {
          const wrap = part.dark ? "bg-teal text-white" : "bg-white text-teal";
          const introBox = part.dark
            ? "bg-white/5 border-tan"
            : "bg-cream border-tan";
          const introText = part.dark ? "text-cream/85" : "text-teal/80";

          return (
            <section
              key={part.id}
              id={part.id}
              className={`${wrap} scroll-mt-20 px-6 py-20 sm:px-10 sm:py-24`}
            >
              <div className="mx-auto flex w-full max-w-6xl flex-col gap-10">
                <div className="flex flex-col gap-4">
                  <div className="flex items-baseline gap-4">
                    <span className="text-5xl font-black text-tan sm:text-6xl">
                      {part.num}
                    </span>
                    <span className="text-xs font-bold tracking-[0.15em] text-tan">
                      {part.eyebrow}
                    </span>
                  </div>
                  <h2 className="max-w-2xl text-3xl font-black leading-snug tracking-tight sm:text-4xl">
                    {part.title}
                  </h2>
                  <div
                    className={`max-w-2xl border-l-4 px-6 py-4 text-sm leading-7 sm:text-base ${introBox} ${introText}`}
                  >
                    {part.intro}
                  </div>
                </div>

                {part.kind === "stats" ? (
                  <div className="grid gap-x-8 gap-y-10 sm:grid-cols-2">
                    {part.stats.map((stat) => (
                      <StatCard key={stat.value + stat.label} {...stat} dark={part.dark} />
                    ))}
                  </div>
                ) : (
                  <div className="grid gap-6 sm:grid-cols-2">
                    {part.items.map((item) => (
                      <div
                        key={item.title}
                        className={`flex flex-col gap-2 border-l-4 border-tan py-5 pl-6 pr-4 ${
                          part.dark ? "bg-white/5" : "bg-cream"
                        }`}
                      >
                        <span className="text-lg font-black">
                          {item.title}
                        </span>
                        <p
                          className={`text-sm leading-6 ${
                            part.dark ? "text-cream/80" : "text-teal/75"
                          }`}
                        >
                          {item.desc}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </section>
          );
        })}

        <ContactBand text="자기 발견, 어디서부터 시작해야 할지 막막하신가요?" />

        <section
          id="contact"
          className="scroll-mt-20 bg-teal px-6 py-20 text-center sm:px-16 sm:py-24"
        >
          <div className="mx-auto flex w-full max-w-2xl flex-col items-center gap-6">
            <h2 className="text-2xl font-black leading-snug text-white sm:text-3xl">
              지금, 당신의 진로에 확신을 더할 시간
            </h2>
            <p className="text-sm text-cream/70 sm:text-base">
              CareerDirect 자기발견 프로세스에 대해 궁금한 점이 있다면 편하게
              문의해주세요. 첫 상담은 무료예요.
            </p>
            <a
              href="mailto:hello@careersolution.kr"
              className="rounded-full bg-tan px-8 py-3.5 text-sm font-bold text-teal transition-colors hover:bg-tan/90"
            >
              문의하기
            </a>
          </div>
        </section>
      </main>

      <footer className="border-t border-line py-8">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-2 px-6 text-xs text-teal/50 sm:px-10">
          <span className="font-bold tracking-[0.2em] text-tan">
            DISCOVER · GUIDE · LIVE BY DESIGN
          </span>
          <span>
            통계 출처: 국가데이터처, 국무조정실, 인크루트, OECD 외 · 프로그램
            정보 출처: CareerDirect(www.careerdirect.org)
          </span>
          <span>© 2026 진로.solution. All rights reserved.</span>
        </div>
      </footer>
    </div>
  );
}
