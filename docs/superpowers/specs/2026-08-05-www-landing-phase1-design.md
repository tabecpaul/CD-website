# www 랜딩페이지 Phase 1 설계

## 배경

Career Direct Korea는 코어 플랫폼(www + admin), AI 마케팅 엔진, 상담 자동화 세 서브시스템으로 확장할 계획이다. 이 문서는 `docs/roadmap.md`의 Phase 1(랜딩 페이지)만 다룬다. 나머지 서브시스템/Phase는 각자 별도 스펙으로 다룬다.

## 목표

`PROJECT_RULES.md`와 `docs/content.md`의 톤(따뜻함·희망·비압박, 직업 단정 추천 금지)을 지키면서, 방문자를 "무료 진로 상담 신청" CTA로 자연스럽게 유도하는 정적 랜딩페이지를 만든다.

## 접근 방식

정적 컴포넌트 방식을 채택한다. 섹션마다 컴포넌트를 만들고 콘텐츠는 컴포넌트 안에 타입 있는 상수로 둔다. 별도 CMS나 콘텐츠 분리 레이어는 만들지 않는다 (YAGNI — Phase 3에서 블로그/AI 라이팅이 실제로 필요해지면 그때 콘텐츠를 분리한다).

## 구조

`apps/www/src/components/sections/`에 아래 컴포넌트를 순서대로 만들고 `page.tsx`에서 조합한다 (`docs/prompts.md` 섹션 목록 기준):

1. Hero
2. Empathy
3. CareerDirect (Solution)
4. Process
5. Testimonials
6. FAQ
7. ContactForm
8. Footer

섹션은 콘텐츠가 준비되는 대로 하나씩 채운다. 이번 스펙에서는 Hero까지만 구체화하고, 나머지는 각 섹션 프롬프트가 주어질 때 이어서 채운다.

## 디자인 시스템 적용

- 컬러: Navy / White / Light Gray / Accent Blue (`docs/design.md`)
- 폰트: Pretendard (`pretendard` npm 패키지), 보조로 Inter
- 애니메이션: Framer Motion — Fade Up, Scroll Reveal
- 아이콘: lucide-react, 라인 아이콘만 사용, 무거운 일러스트 금지
- 스타일: Apple 스타일 — 미니멀, 여백 우선, 둥근 모서리, 은은한 그림자

## Hero 섹션 콘텐츠

- 메인 타이틀: "Discover God's Design"
- 부제: "진로는 직업을 찾는 것이 아니라 하나님이 지으신 나를 발견하고 소명을 분별하는 과정입니다."
- 설명: 성격·흥미·재능·가치관을 통합적으로 분석해 하나님이 주신 방향을 이해하도록 돕는다는 내용 (직업을 단정적으로 추천하지 않는 어조 유지)
- Primary CTA: "무료 진로 상담 신청"
- Secondary CTA: "프로그램 알아보기"

## CTA / Contact Form 처리 (Phase 1 범위)

Phase 2(예약 시스템/CRM)가 아직 없으므로, Phase 1의 모든 CTA는 우선 `#contact`의 문의/상담 신청 폼 섹션으로 스크롤 이동한다. ContactForm 섹션 자체는 UI만 구현하고 제출 로직은 스텁으로 남긴다 — 실제 예약·CRM 연동은 Phase 2에서 별도 스펙으로 설계한다.

## 테스트

별도 유닛 테스트는 두지 않는다. 각 섹션 추가 후 브라우저 프리뷰로 데스크톱/모바일 반응형과 콘솔 에러 유무를 확인한다.

## 범위 밖

- 실제 상담 예약/이메일 자동화/CRM 연동 (Phase 2)
- 블로그, SEO 콘텐츠, AI 라이팅 (Phase 3)
- 마케팅 대시보드, 커뮤니티 (Phase 4)
- admin 앱 변경
