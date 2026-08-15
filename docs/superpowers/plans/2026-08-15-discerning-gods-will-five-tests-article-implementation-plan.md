# 하나님의 뜻 분별 5가지 기준 글 구현 계획

**기준 설계:** `docs/superpowers/specs/2026-08-15-discerning-gods-will-five-tests-article-design.md`

## 목표

`신앙과 소명` 카테고리에 두 번째 장문 글을 추가하고, 이직·퇴사·새 제안을 앞둔 기독교 직장인이 다섯 기준과 선택지 비교표를 사용해 다음 행동을 정하도록 돕는다. 기존 블로그 구조와 CTA 흐름은 변경하지 않는다.

## 구현 순서

### 작업 1 — 기존 글과 구성요소 재확인

**예상:** 2분

**확인 파일**

- `apps/www/src/content/blog/ko/calling-is-more-than-a-job.mdx`
- `apps/www/src/content/blog/ko/should-i-change-jobs.mdx`
- `apps/www/src/content/blog/ko/README.md`
- `apps/www/src/features/blog/components/BlogSummary.tsx`
- `apps/www/src/features/blog/components/BlogChecklist.tsx`
- `apps/www/src/features/blog/components/BlogCallout.tsx`
- `apps/www/src/features/blog/components/CardDeck.tsx`
- `apps/www/src/features/blog/components/InsightCard.tsx`

**실행**

- 첫 신앙 글의 개념 설명을 반복하지 않고 실제 선택 검증 절차에 집중한다.
- 기존 MDX 구성요소의 props와 문체를 그대로 따른다.
- CTA는 `callback` 하나만 사용한다.

**검증**

- 새 구성요소나 레이아웃 변경 없이 설계의 모든 섹션을 표현할 수 있는지 확인한다.

### 작업 2 — 성경 본문과 참고 링크 대조

**예상:** 5분

**대상 본문**

- 로마서 12:2
- 야고보서 1:5
- 빌립보서 2:3–4
- 잠언 15:22
- 마태복음 7:16–20
- 누가복음 14:28–30
- 베드로전서 4:10

**실행**

- 대한성서공회 개역개정 본문을 기본으로 확인한다.
- 이해를 실제로 돕는 구절만 새번역을 보완한다.
- 직접 인용은 짧게 제한하고, 모든 핵심 본문에 책·장·절과 역본을 표기한다.
- `metadata.references`에 HTTPS 공식 링크를 등록한다.

**메타데이터 템플릿**

```ts
export const metadata = {
  title: "하나님의 뜻을 분별할 때 확인해야 할 5가지 기준",
  description: "이직·퇴사·새 제안 앞에서 말씀, 동기, 공동체, 열매와 하나님 나라의 청지기적 책임을 함께 점검하는 실제 분별 방법입니다.",
  slug: "five-tests-for-discerning-gods-will",
  publishedAt: "2026-08-15",
  author: "park-jung-yull",
  category: "faith-and-calling",
  tags: ["소명", "하나님의뜻", "진로분별", "청지기", "이직"],
  featured: false,
  coverAlt: "두 진로 선택지를 하나님의 뜻 안에서 분별하는 다섯 가지 기준",
  cta: "callback",
  status: "published",
  readingMinutes: 8,
  references: [],
};
```

**검증**

- 제목 90자 이하, 설명 180자 이하, slug와 enum 필드가 도메인 검증 규칙에 맞는지 확인한다.
- 인용문과 장·절이 공식 본문과 일치하는지 확인한다.

### 작업 3 — MDX 원고 작성

**예상:** 5분

**생성 파일**

- `apps/www/src/content/blog/ko/five-tests-for-discerning-gods-will.mdx`

**구조 템플릿**

```mdx
import BlogSummary from "@/features/blog/components/BlogSummary";
import BlogChecklist from "@/features/blog/components/BlogChecklist";
import BlogCallout from "@/features/blog/components/BlogCallout";
import CardDeck from "@/features/blog/components/CardDeck";
import InsightCard from "@/features/blog/components/InsightCard";

export const metadata = { /* 작업 2의 확정 메타데이터 */ };

<BlogSummary>...</BlogSummary>

## 왜 하나님의 뜻을 신호로 찾게 될까요?
...

## 선택 전에 확인할 다섯 가지 기준
<CardDeck ariaLabel="하나님의 뜻을 분별하는 다섯 가지 기준">
  <InsightCard eyebrow="01 · 말씀과 성품" title="...">...</InsightCard>
  ...
</CardDeck>

## 결정적 증거로 삼지 말아야 할 것
...

## 두 선택지를 사실·해석·확인할 행동으로 나누세요
<BlogChecklist items={[...]} />

## 평가 이후 30일 작은 실험으로 검증하세요
...
```

**실행**

- 도입에서 독자의 실제 장면을 제시하고 신호 찾기의 한계를 설명한다.
- 다섯 기준을 질문형 카드로 작성한다.
- 마음의 평안·열린 문·우연한 말씀·한 사람의 조언·평가 결과 하나의 한계를 균형 있게 설명한다.
- 선택지 비교 점검표를 `사실·해석·확인할 행동` 구조로 제공한다.
- Career Direct 평가와 보고서 컨설팅 이후 30일 실험을 설계하도록 유도한다.
- 마지막 문단에서 20분 무료 콜백의 역할을 선택지와 검증 질문의 구조화로 한정한다.

**검증**

- 첫 대표 글과 동일한 문단이나 카드 문구가 반복되지 않는지 확인한다.
- 신학적·윤리적 가드레일을 위반하는 표현이 없는지 확인한다.
- 모든 MDX 태그와 JSX 배열 문법이 닫혀 있는지 확인한다.

### 작업 4 — 콘텐츠 레지스트리 등록

**예상:** 2분

**수정 파일**

- `apps/www/src/features/blog/content/registry.ts`

**코드 템플릿**

```ts
import DiscerningGodsWill, {
  metadata as discerningGodsWillMetadata,
} from "@/content/blog/ko/five-tests-for-discerning-gods-will.mdx";
```

`candidates` 배열에 다음 항목을 추가한다.

```ts
[discerningGodsWillMetadata, DiscerningGodsWill],
```

**검증**

- 중복 slug가 없고 `faith-and-calling` 카테고리 조회에 두 글이 포함되는지 확인한다.
- 첫 글의 `featured: true`를 변경하지 않는다.

### 작업 5 — 정적 품질 검사

**예상:** 5분

**실행 명령**

```bash
npm run lint:www
npm run build --workspace=www -- --webpack
```

**검증**

- ESLint와 TypeScript 컴파일이 통과한다.
- 빌드에 필요한 운영 환경변수가 없는 경우, 코드 컴파일과 타입 검사 통과 여부를 분리해 기록하고 Vercel Preview 빌드로 최종 검증한다.
- `git diff --check`가 통과한다.
- 기존 사용자 미추적 파일을 staging하지 않는다.

### 작업 6 — 미리보기와 공개 경로 점검

**예상:** 5분

**확인 경로**

- `/blog/category/faith-and-calling`
- `/blog/five-tests-for-discerning-gods-will`
- `/api/blog/og/five-tests-for-discerning-gods-will`
- `/sitemap.xml`

**검증**

- 카테고리에 첫 글과 두 번째 글이 함께 보인다.
- 제목·설명·카드·점검표·참고문헌·CTA가 모바일과 데스크톱에서 잘리지 않는다.
- CTA가 기존 20분 무료 콜백 경로와 추적 파라미터를 유지한다.
- OG 이미지와 구조화 데이터, 사이트맵에 새 글이 포함된다.

### 작업 7 — 게시

**예상:** 3분

**실행**

- MDX 원고와 레지스트리 파일만 선별 커밋한다.
- 현재 공식 사이트 작업 브랜치를 원격에 푸시한다.
- PR 본문에 글의 목적, 성경 사용 원칙, 검증 결과와 환경변수 제한을 기록한다.
- Vercel Preview 검사가 통과한 뒤 병합하고 Production 배포를 확인한다.

**완료 기준**

- 두 공개 경로가 HTTP 200으로 응답한다.
- `신앙과 소명` 카테고리에 두 글이 표시된다.
- 운영 사이트에서 다섯 기준과 30일 실험 안내가 정상적으로 읽힌다.
- 기존 글과 사용자 변경사항이 보존된다.
