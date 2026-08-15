# 은사·재능·강점 비교 글 구현 계획

**기준 설계:** `docs/superpowers/specs/2026-08-15-gifts-talents-strengths-article-design.md`

## 목표

`신앙과 소명` 카테고리에 세 번째 장문 글을 추가한다. 영적 은사·재능·기술·강점을 구분하고, Career Direct의 성격·흥미·재능·가치관을 하나님 나라의 청지기 관점에서 이해하고 검증하도록 안내한다. 기존 블로그 구조와 CTA 흐름은 변경하지 않는다.

## 구현 순서

### 작업 1 — 기존 콘텐츠와 MDX 구성요소 확인

**예상:** 2분

**확인 파일**

- `apps/www/src/content/blog/ko/calling-is-more-than-a-job.mdx`
- `apps/www/src/content/blog/ko/five-tests-for-discerning-gods-will.mdx`
- `apps/www/src/content/blog/ko/four-career-compasses.mdx`
- `apps/www/src/content/blog/ko/README.md`
- `apps/www/src/features/blog/components/BlogSummary.tsx`
- `apps/www/src/features/blog/components/BlogChecklist.tsx`
- `apps/www/src/features/blog/components/BlogCallout.tsx`
- `apps/www/src/features/blog/components/CardDeck.tsx`
- `apps/www/src/features/blog/components/InsightCard.tsx`

**실행**

- 앞선 신앙 글의 소명 정의와 분별 기준을 반복하지 않는다.
- 네 가지 자기이해 요소를 다룬 일반 글과 중복되는 설명은 압축하고, 신앙적 개념 구분과 청지기적 적용에 집중한다.
- 기존 구성요소의 props와 문체를 그대로 따른다.

**검증**

- 새 UI 구성요소 없이 비교 카드, 점검표와 30일 실험을 표현할 수 있는지 확인한다.

### 작업 2 — 성경 본문과 참고 링크 대조

**예상:** 5분

**대상 본문**

- 고린도전서 12:4–7
- 로마서 12:3–8
- 베드로전서 4:10–11
- 출애굽기 31:1–5
- 에베소서 2:10
- 골로새서 3:23–24

**실행**

- 대한성서공회 개역개정 본문을 기본으로 확인한다.
- 용어와 문장 구조의 차이가 실제 이해를 돕는 곳만 새번역을 보완한다.
- 직접 인용은 짧게 제한하고 모든 핵심 본문에 책·장·절과 역본을 표기한다.
- `metadata.references`에는 대한성서공회 HTTPS 링크만 등록한다.

**검증**

- 브살렐 본문의 지혜·총명·지식·기술 표현과 문맥을 확인한다.
- 은사의 목적을 공동의 유익과 섬김으로 설명하는 구절의 문맥을 확인한다.

### 작업 3 — MDX 원고 작성

**예상:** 5분

**생성 파일**

- `apps/www/src/content/blog/ko/gifts-talents-strengths.mdx`

**메타데이터 템플릿**

```ts
export const metadata = {
  title: "은사·재능·강점은 어떻게 다른가? 하나님이 맡기신 나를 이해하는 법",
  description: "은사·재능·기술·강점의 차이를 구분하고 성격·흥미·재능·가치관을 하나님 나라의 청지기 관점에서 이해하고 검증하는 방법입니다.",
  slug: "gifts-talents-strengths",
  publishedAt: "2026-08-15",
  author: "park-jung-yull",
  category: "faith-and-calling",
  tags: ["은사", "재능", "강점", "자기이해", "청지기"],
  featured: false,
  coverAlt: "은사와 재능과 기술과 강점을 비교하는 네 가지 카드",
  cta: "self-check",
  status: "published",
  readingMinutes: 8,
  references: [],
};
```

**구조 템플릿**

```mdx
import BlogSummary from "@/features/blog/components/BlogSummary";
import BlogChecklist from "@/features/blog/components/BlogChecklist";
import BlogCallout from "@/features/blog/components/BlogCallout";
import CardDeck from "@/features/blog/components/CardDeck";
import InsightCard from "@/features/blog/components/InsightCard";

export const metadata = { /* 작업 2의 확정 참고문헌 포함 */ };

<BlogSummary>...</BlogSummary>

## 잘하는 일이 곧 소명일까요?
...

## 은사·재능·기술·강점은 이렇게 다릅니다
<CardDeck ariaLabel="은사와 재능과 기술과 강점 비교">
  <InsightCard eyebrow="01 · 영적 은사" title="...">...</InsightCard>
  ...
</CardDeck>

## Career Direct의 네 요소는 무엇을 보여 줄까요?
...

## 평가 이후 30일 작은 실험으로 검증하세요
...
```

**실행**

- 도입에서 네 개념을 혼용할 때 생기는 실제 혼란을 제시한다.
- 기원·목적·발견 방법·성장 방식·사용 범위를 카드와 본문으로 비교한다.
- 브살렐 사례의 의미와 일반화 한계를 함께 설명한다.
- Career Direct의 성격·흥미·재능·가치관을 영적 은사 판정이 아닌 자기이해 자료로 정의한다.
- 반복 경험, 공동체 관찰과 이웃의 유익을 통한 세 가지 검증 방법을 제시한다.
- 평가 이후 개인화된 30일 실험의 관찰 항목과 계속·수정·중단 조건을 안내한다.
- 마지막 CTA는 무료 진로 방향 자가진단 하나만 사용한다.

**검증**

- `은사`, `재능`, `기술`, `강점`이 본문 전체에서 일관되게 사용되는지 확인한다.
- 특정 직업이나 능력을 더 영적으로 평가하는 표현이 없는지 확인한다.
- 모든 MDX 태그와 JSX 배열 문법이 닫혀 있는지 확인한다.

### 작업 4 — 콘텐츠 레지스트리 등록

**예상:** 2분

**수정 파일**

- `apps/www/src/features/blog/content/registry.ts`

**코드 템플릿**

```ts
import GiftsTalentsStrengths, {
  metadata as giftsTalentsStrengthsMetadata,
} from "@/content/blog/ko/gifts-talents-strengths.mdx";
```

`candidates` 배열에 다음 항목을 추가한다.

```ts
[giftsTalentsStrengthsMetadata, GiftsTalentsStrengths],
```

**검증**

- 중복 slug가 없고 `faith-and-calling` 카테고리 조회에 세 글이 포함되는지 확인한다.
- 첫 글의 `featured: true`를 변경하지 않는다.

### 작업 5 — 정적 품질 검사

**예상:** 5분

**실행 명령**

```bash
npm run lint:www
DATABASE_URL=postgresql://build:build@127.0.0.1:5432/build npm run build --workspace=www -- --webpack
git diff --check
```

**검증**

- ESLint와 TypeScript 컴파일이 통과한다.
- 새 상세 경로와 카테고리 경로가 정적 페이지로 생성된다.
- 운영 데이터베이스에는 접속하지 않는다.
- 기존 사용자 미추적 파일을 staging하지 않는다.

### 작업 6 — 미리보기와 공개 경로 점검

**예상:** 5분

**확인 경로**

- `/blog/category/faith-and-calling`
- `/blog/gifts-talents-strengths`
- `/api/blog/og/gifts-talents-strengths`
- `/sitemap.xml`

**검증**

- 카테고리에 신앙과 소명 글 세 편이 표시된다.
- 제목·비교 카드·점검표·참고문헌과 CTA가 모바일과 데스크톱에서 읽기 쉽다.
- CTA가 기존 무료 진로 방향 자가진단 경로와 추적 파라미터를 유지한다.
- OG 이미지와 구조화 데이터, 사이트맵에 새 글이 포함된다.

### 작업 7 — 게시

**예상:** 3분

**실행**

- 설계·계획·MDX 원고와 레지스트리 파일만 선별 커밋한다.
- 최신 `origin/main`에서 새 글 전용 브랜치를 만들고 관련 커밋만 옮긴다.
- GitHub PR을 생성하고 Vercel Preview 검사를 확인한다.
- 검사 통과 후 병합하고 Production 배포를 확인한다.

**완료 기준**

- 상세·카테고리·OG·사이트맵 경로가 HTTP 200으로 응답한다.
- 사이트맵에 새 글 주소가 포함된다.
- 운영 사이트에서 세 글이 정상 노출되고 무료 자가진단 CTA가 작동한다.
- 기존 글과 사용자 변경사항이 보존된다.
