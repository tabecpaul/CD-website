# Career Direct Korea 블로그 구현 계획

> 설계 기준: `docs/superpowers/specs/2026-08-11-career-direct-korea-blog-design.md`

## 1. 구현 목표

`www.careerdirect.kr` 공식 사이트에 저장소 기반 MDX 블로그를 추가한다. 검색 가능한 장문 글, 코드로 렌더링되는 카드뉴스, 카테고리 탐색, 작성자 신뢰 요소, 글별 CTA, SEO와 기존 전환 분석을 하나의 흐름으로 연결한다.

첫 구현 범위는 다음과 같다.

- `/blog`, `/blog/[slug]`, `/blog/category/[slug]`
- 공식 사이트 헤더·푸터의 블로그 메뉴
- Markdown/MDX 글 모델, 검증과 발행 상태 처리
- 검색 글 + HTML/CSS 카드뉴스 혼합형 글 화면
- 작성자 프로필, 관련 글과 글별 맞춤 CTA
- 글별 metadata, canonical, BlogPosting JSON-LD, OG 이미지와 sitemap
- 글 조회, 카드뉴스, 관련 글과 CTA 분석
- 관리자 전환 분석의 블로그 성과 영역
- 초기 핵심 글 6편

CMS, 댓글, 회원, 고객 후기, SNS API 자동 게시와 새로운 CRM·결제 흐름은 만들지 않는다.

## 2. 구현 전제와 안전 규칙

- 구현은 최신 `origin/main`을 fetch한 뒤 새 `codex/blog-foundation` 브랜치에서 시작한다.
- 설계 커밋 `d1a6853`이 최신 main에 없으면 설계 파일만 새 브랜치로 가져온다.
- 현재 작업공간의 `.superpowers/`, EPS, `output/`, `tmp/`는 사용자 소유 미추적 파일이므로 수정·스테이징하지 않는다.
- `apps/www/AGENTS.md`의 지시에 따라 구현 시 설치된 Next.js 16.3 문서를 기준으로 한다.
- MDX 설정은 `node_modules/next/dist/docs/01-app/02-guides/mdx.md`, 동적 metadata는 `01-app/03-api-reference/04-functions/generate-metadata.md`, 동적 경로는 `generate-static-params.md`를 따른다.
- 현재 `start.careerdirect.kr`의 리드, 이메일, 콜백, 결제, 관리자 및 cron 경로는 회귀시키지 않는다.
- 공개 글은 빌드 시 확정되는 정적 콘텐츠로 제공한다. 초안 또는 미래 발행 글을 공개하려면 새 배포가 필요하다.
- 분석은 기존 `analytics_events` 테이블의 `event_name`, `path`, `cta_location`을 사용하므로 DB 마이그레이션을 추가하지 않는다.
- 외부 연구와 통계는 각 글 작성 시 최신 원 출처를 다시 확인하며, 출처가 불분명한 수치는 사용하지 않는다.

## 3. 채택할 기술 구조

### 공개 URL과 내부 경로

| 공개 URL | 내부 App Router 경로 |
| --- | --- |
| `/blog` | `/official/blog` |
| `/blog/[slug]` | `/official/blog/[slug]` |
| `/blog/category/[slug]` | `/official/blog/category/[slug]` |

기존 `src/proxy.ts`가 `www` 공개 경로를 `/official` 아래로 rewrite한다. 블로그는 고정 경로 목록에 모든 slug를 추가하지 않고 `/blog` prefix를 공식 경로로 인식하도록 확장한다.

### MDX 콘텐츠

`@next/mdx`를 사용해 저장소의 로컬 MDX 파일을 Server Component로 빌드한다. 파일 자동 탐색 대신 명시적인 registry를 사용해 발행 대상, 타입과 빌드 결과를 예측 가능하게 유지한다.

```text
apps/www/src/content/blog/ko/*.mdx
              ↓
features/blog/content/registry.ts
              ↓
목록·카테고리·글·sitemap·OG
```

각 MDX 모듈은 `metadata`와 기본 콘텐츠 컴포넌트를 export한다. registry는 metadata를 검증하고 `draft`, 미래 발행일, 중복 slug, 잘못된 category/CTA를 차단한다.

### 분석

새 공개 이벤트는 다음 세 개만 추가한다.

- `blog_article_viewed`
- `blog_card_engaged`
- `blog_related_clicked`

자가진단과 콜백은 기존 `official_site_clicked`, `callback_cta_clicked`를 유지한다. 원문 slug는 이미 저장되는 `path`에서 식별하고, `cta_location`에는 `blog_end_self_check`처럼 64자 이하의 위치만 기록한다.

## 4. 작업 단위

### Task 1 — 최신 기준선과 회귀 상태 고정

**읽을 파일**

- `apps/www/AGENTS.md`
- `apps/www/package.json`
- `apps/www/src/proxy.ts`
- `apps/www/src/features/site-routing/paths.ts`
- `apps/www/src/features/official-site/content.ts`
- 위에 명시한 설치된 Next.js 문서

**절차**

1. 최신 원격 상태를 fetch한다.
2. 최신 main에서 `codex/blog-foundation`을 만든다.
3. 구현 전 lint, TypeScript와 production build 결과를 기록한다.
4. `www` 공식 페이지, `start` 자가진단·콜백과 관리자 주요 경로의 HTTP 상태를 기록한다.

**검증**

```bash
npm run lint --workspace=www
npx tsc --noEmit -p apps/www/tsconfig.json
npm run build --workspace=www
```

완료 기준: 기존 실패가 있다면 블로그 변경과 섞지 않고 별도로 기록한다.

---

### Task 2 — MDX 빌드 설정 추가

**수정**

- `apps/www/package.json`
- `package-lock.json`
- `apps/www/next.config.ts`

**생성**

- `apps/www/src/mdx-components.tsx`
- `apps/www/src/types/mdx.d.ts`

**의존성**

- `@next/mdx`
- `@mdx-js/loader`
- `@mdx-js/react`

**설정 골격**

```ts
import createMDX from "@next/mdx";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  pageExtensions: ["ts", "tsx", "md", "mdx"],
};

const withMDX = createMDX({});
export default withMDX(nextConfig);
```

`mdx-components.tsx`는 전역 기본 태그를 허용하되 블로그 전용 카드뉴스 구성요소는 글에서 명시적으로 import하도록 한다. `.mdx` 모듈 선언은 default component와 `metadata: unknown` export만 선언해 registry 검증을 우회하지 않게 한다.

**검증**

```bash
npm install
npx tsc --noEmit -p apps/www/tsconfig.json
```

완료 기준: 빈 테스트 MDX import가 Server Component build에서 처리된다.

---

### Task 3 — 블로그 도메인 타입과 metadata 검증 구현

**생성**

- `apps/www/src/features/blog/domain.ts`
- `apps/www/src/features/blog/content/registry.ts`

**핵심 타입**

```ts
export const blogCategories = [
  { slug: "career-reality", label: "현실 진로" },
  { slug: "self-understanding", label: "자기이해" },
  { slug: "career-transition", label: "이직·경력전환" },
  { slug: "ai-and-work", label: "AI와 일" },
  { slug: "faith-and-calling", label: "신앙과 소명" },
] as const;

export type BlogCta = "self-check" | "callback";
export type BlogStatus = "draft" | "published";

export type BlogPostMetadata = {
  title: string;
  description: string;
  slug: string;
  publishedAt: string;
  updatedAt?: string;
  author: "park-jung-yull";
  category: (typeof blogCategories)[number]["slug"];
  tags: readonly string[];
  featured: boolean;
  coverAlt: string;
  cta: BlogCta;
  status: BlogStatus;
  references: readonly { title: string; url: string }[];
};
```

**registry 인터페이스**

```ts
export function getPublishedPosts(now?: Date): readonly BlogPost[];
export function getPostBySlug(slug: string, now?: Date): BlogPost | null;
export function getPostsByCategory(category: string, now?: Date): readonly BlogPost[];
export function getRelatedPosts(post: BlogPost, limit?: number): readonly BlogPost[];
export function getReadingMinutes(post: BlogPost): number;
```

**검증 규칙**

- slug는 영문 소문자, 숫자와 하이픈만 허용
- 필수 문자열 공백 금지 및 제목·설명 길이 제한
- ISO 날짜 검증과 `updatedAt >= publishedAt`
- category, author, CTA와 status allowlist
- 태그 중복 제거 및 빈 태그 금지
- HTTPS reference만 허용
- 모든 registry 항목의 slug 중복 차단
- draft와 미래 발행 글은 공개 getter에서 제외

검증 실패 메시지는 파일 또는 slug와 필드명을 포함한다.

**검증**

```bash
npx tsc --noEmit -p apps/www/tsconfig.json
```

완료 기준: 잘못된 category, 중복 slug와 미래 글이 각각 명확히 처리된다.

---

### Task 4 — 블로그 경로를 공식 호스트 라우팅에 추가

**수정**

- `apps/www/src/features/site-routing/paths.ts`
- `apps/www/src/proxy.ts`
- `apps/www/src/features/official-site/content.ts`
- `apps/www/src/features/official-site/components/OfficialHeader.tsx`
- `apps/www/src/features/official-site/components/OfficialFooter.tsx`

**라우팅 골격**

```ts
export const officialPublicPrefixes = ["/blog"] as const;

export function isOfficialPublicPath(pathname: string) {
  return officialPublicPaths.includes(/* exact */) ||
    officialPublicPrefixes.some(
      (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
    );
}
```

navigation 마지막에 `{ href: "/blog", label: "블로그" }`를 추가해 컨설턴트 소개 다음에 표시한다. Proxy matcher는 API와 정적 파일 제외 정책을 유지한다.

**검증**

```bash
curl -I -H 'Host: www.careerdirect.kr' http://localhost:3000/blog
curl -I -H 'Host: start.careerdirect.kr' http://localhost:3000/blog
curl -I -H 'Host: www.careerdirect.kr' http://localhost:3000/blog/example
```

완료 기준: www에서는 내부 rewrite, start에서는 www로 308 이동하며 공개 주소에 `/official`이 보이지 않는다.

---

### Task 5 — 블로그 공통 UI와 코드형 카드뉴스 구현

**생성**

- `apps/www/src/features/blog/components/BlogCard.tsx`
- `apps/www/src/features/blog/components/BlogCover.tsx`
- `apps/www/src/features/blog/components/BlogAuthor.tsx`
- `apps/www/src/features/blog/components/BlogSummary.tsx`
- `apps/www/src/features/blog/components/BlogChecklist.tsx`
- `apps/www/src/features/blog/components/BlogCallout.tsx`
- `apps/www/src/features/blog/components/CardDeck.tsx`
- `apps/www/src/features/blog/components/InsightCard.tsx`
- `apps/www/src/features/blog/components/BlogCta.tsx`
- `apps/www/src/features/blog/components/RelatedPosts.tsx`

**수정**

- `apps/www/src/app/globals.css`

**구성 원칙**

- `BlogCard`, `BlogCover`, 본문 구성요소는 Server Component 유지
- 탐색 이벤트가 필요한 `CardDeck`의 최소 부분만 Client Component로 분리
- 카드뉴스는 `ol`/`li` 의미 구조를 유지하고 CSS scroll snap은 보조 기능으로만 사용
- 모바일에서 가로 넘김과 세로 전체 읽기가 모두 가능
- 카드 번호는 `현재/전체`로 표시
- `prefers-reduced-motion` 존중
- 본문 최대 너비, 제목 계층, 링크 밑줄과 포커스 링을 명확히 표시

**CardDeck 사용 예**

```mdx
<CardDeck>
  <InsightCard number="01" title="먼저 불안을 관찰하세요">
    불안을 없애려 하기 전에 반복되는 상황과 생각을 기록합니다.
  </InsightCard>
  <InsightCard number="02" title="나의 기준을 분리하세요">
    타인의 기대와 내가 중요하게 여기는 가치를 구분합니다.
  </InsightCard>
</CardDeck>
```

**검증**

- 360px에서 본문 및 카드 가로 overflow 없음
- 키보드 Tab과 화살표 탐색 시 초점 손실 없음
- 자바스크립트 비활성 상태에서도 카드 문장 전체 노출

---

### Task 6 — 공개 분석 이벤트와 추적 컴포넌트 확장

**수정**

- `apps/www/src/features/analytics/server/events.ts`
- `apps/www/src/app/api/analytics/events/route.ts`
- `apps/www/src/features/analytics/components/PageViewTracker.tsx`
- `apps/www/src/features/official-site/components/OfficialCtaLink.tsx`

**생성**

- `apps/www/src/features/blog/components/BlogEventTracker.tsx`
- `apps/www/src/features/blog/components/TrackedBlogLink.tsx`

**이벤트 정책**

```ts
"blog_article_viewed"
"blog_card_engaged"
"blog_related_clicked"
```

공개 API allowlist에 위 이벤트를 추가한다. payload는 기존 `path`, `ctaLocation`, UTM만 사용한다. 이메일, 전화번호, 카드 본문과 검색어는 보내지 않는다. 카드 이벤트는 한 글 방문에서 최초 의미 있는 탐색 한 번만 기록해 이벤트 폭증을 막는다.

`OfficialCtaLink`는 현재 페이지 path와 UTM 보존 동작을 유지한다. 블로그 CTA 위치는 다음 상수로 제한한다.

- `blog_end_self_check`
- `blog_end_callback`
- 필요한 경우 `blog_inline_self_check` 또는 `blog_inline_callback`

**검증**

```bash
curl -i -X POST http://localhost:3000/api/analytics/events \
  -H 'Content-Type: application/json' \
  --data '{"eventId":"00000000-0000-4000-8000-000000000000","eventName":"blog_article_viewed","path":"/blog/test"}'
```

완료 기준: 허용 이벤트는 성공하고 임의 이벤트 및 개인정보 형태 값은 400으로 거부된다.

---

### Task 7 — 블로그 목록 화면 구현

**생성**

- `apps/www/src/app/official/blog/page.tsx`

**구성**

1. `CAREER DIRECT KOREA BLOG` 히어로
2. 편집 방향과 브랜드 캐치프레이즈
3. 추천 글 최대 3편
4. 5개 카테고리 링크
5. 최신 공개 글 카드 목록

**metadata**

```ts
export const metadata: Metadata = {
  title: "블로그 | Career Direct Korea",
  description: "자기이해, 이직, 경력전환, AI 시대의 일과 신앙·소명을 현실적으로 다룹니다.",
  alternates: { canonical: "/blog" },
};
```

추천 글이 3편보다 적으면 있는 글만 표시한다. 공개 글이 없으면 준비 중 안내와 자가진단 CTA만 표시한다.

**검증**

```bash
curl -s -H 'Host: www.careerdirect.kr' http://localhost:3000/blog | rg 'CAREER DIRECT KOREA BLOG|블로그'
```

---

### Task 8 — 카테고리 목록 화면 구현

**생성**

- `apps/www/src/app/official/blog/category/[slug]/page.tsx`

**핵심 함수**

```ts
export function generateStaticParams() {
  return blogCategories.map(({ slug }) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  // category 확인 후 title, description, canonical 반환
}
```

알 수 없는 category는 `notFound()`로 처리한다. 글이 없는 유효 카테고리는 빈 상태와 전체 글 링크를 제공하고, 얇은 목록을 검색 색인할지는 글 수를 확인해 robots metadata로 결정한다.

**검증**

- 5개 카테고리 200
- 임의 카테고리 404
- canonical이 공개 `/blog/category/...` 주소를 가리킴

---

### Task 9 — 개별 글, 관련 글과 구조화 데이터 구현

**생성**

- `apps/www/src/app/official/blog/[slug]/page.tsx`
- `apps/www/src/features/blog/components/BlogArticleJsonLd.tsx`

**핵심 함수**

```ts
export function generateStaticParams() {
  return getPublishedPosts().map(({ metadata }) => ({ slug: metadata.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const post = getPostBySlug((await params).slug);
  if (!post) notFound();
  return {
    title: `${post.metadata.title} | Career Direct Korea`,
    description: post.metadata.description,
    alternates: { canonical: `/blog/${post.metadata.slug}` },
    openGraph: {
      type: "article",
      publishedTime: post.metadata.publishedAt,
      modifiedTime: post.metadata.updatedAt,
      images: [`/api/blog/og/${post.metadata.slug}`],
    },
  };
}
```

페이지는 설계 순서대로 제목·요약·날짜·작성자·본문·카드뉴스·점검표·CTA·작성자·출처·관련 글을 렌더링한다. JSON-LD는 `BlogPosting`, 박정열 author URL `/consultant`, Career Direct Korea publisher, canonical, 날짜와 대표 이미지 정보를 포함한다. JSON 직렬화 결과의 `<` 문자는 `\u003c`로 치환한다.

**검증**

- 공개 글 200, draft/future/임의 slug 404
- 페이지 소스에서 H1 하나, canonical, article metadata와 JSON-LD 확인
- 관련 글은 현재 글을 제외하고 최대 3편

---

### Task 10 — 글별 코드 생성 OG 이미지 구현

**생성**

- `apps/www/src/app/api/blog/og/[slug]/route.ts`

**구조**

```ts
import { createElement } from "react";
import { ImageResponse } from "next/og";

export async function GET(_request: Request, { params }: RouteContext) {
  const post = getPostBySlug((await params).slug);
  if (!post) return new Response("Not found", { status: 404 });
  return new ImageResponse(
    createElement("div", { style: {/* 1200×630 brand card styles */} }, post.metadata.title),
    { width: 1200, height: 630 },
  );
}
```

Next.js Route Handler 파일 규칙에 맞춰 `route.ts`를 사용하고 JSX 대신 `createElement`로 `ImageResponse` 트리를 만든다. OG 화면은 로고 또는 텍스트 브랜드, 카테고리, 제목, `Career Direct Korea`를 포함하며 navy, cream, gold, teal만 사용한다. API 경로는 Proxy rewrite와 분리되어 두 호스트에서 접근 가능하지만 metadata에는 공식 도메인의 절대 URL이 사용된다.

**검증**

```bash
curl -I http://localhost:3000/api/blog/og/valid-slug
curl -I http://localhost:3000/api/blog/og/not-found
```

완료 기준: 유효 글은 1200×630 이미지, 잘못된 slug는 404를 반환한다.

---

### Task 11 — 초기 핵심 글 6편 작성

**생성**

- `apps/www/src/content/blog/ko/why-career-anxiety-and-burnout.mdx`
- `apps/www/src/content/blog/ko/should-i-change-jobs.mdx`
- `apps/www/src/content/blog/ko/what-i-like-vs-what-i-do-well.mdx`
- `apps/www/src/content/blog/ko/four-career-compasses.mdx`
- `apps/www/src/content/blog/ko/ai-job-anxiety-checklist.mdx`
- `apps/www/src/content/blog/ko/before-career-transition.mdx`

**각 글 공통 구조**

```mdx
export const metadata = { /* validated fields */ };

<BlogSummary>질문에 대한 핵심 답변</BlogSummary>

## 지금 무엇이 문제인가

현실 상황과 과장 없는 사례

## 먼저 확인할 기준

단계별 해설

<CardDeck>{/* 6~10 InsightCard */}</CardDeck>

<BlogChecklist items={[/* 실천 점검 */]} />
```

**편집 기준**

- 글마다 하나의 검색 의도와 하나의 주 CTA
- 실제 인물처럼 오해될 합성 사례 금지
- 연구·통계는 발행일 기준 원 출처 확인
- 직접 인용은 최소화하고 출처의 의미를 정확히 요약
- 일반 글은 현실 해결 중심, 신앙 글은 별도 카테고리 원칙 준수
- `고유한 디자인`, `커리어 컨설팅` 용어 기준 적용
- 글별 6~10개 카드와 실천 점검표 포함

**CTA 배정안**

| 글 | CTA |
| --- | --- |
| 진로 불안과 번아웃 | 자가진단 |
| 이직 결정 기준 | 콜백 |
| 좋아하는 일과 잘하는 일 | 자가진단 |
| 네 가지 나침반 | 자가진단 |
| AI 직업 불안 | 자가진단 |
| 경력 전환 현실 점검 | 콜백 |

**검증**

- 출처 URL 직접 확인
- 모든 글 metadata 검증 통과
- 카드 수 6~10
- H1을 MDX 본문에 중복 작성하지 않음
- 초안과 출처 미확인 글은 `published`로 변경하지 않음

---

### Task 12 — sitemap과 내부 연결 확장

**수정**

- `apps/www/src/app/sitemap.ts`
- 필요 시 `apps/www/src/features/official-site/components/OfficialFooter.tsx`

**구조**

```ts
const blogEntries = getPublishedPosts().map(({ metadata }) => ({
  url: `${officialUrl}/blog/${metadata.slug}`,
  lastModified: new Date(metadata.updatedAt ?? metadata.publishedAt),
  changeFrequency: "monthly" as const,
  priority: 0.75,
}));
```

블로그 목록과 글이 있는 카테고리만 사이트맵에 포함한다. draft, 미래 글과 내부 `/official` 경로는 제외한다.

**검증**

```bash
curl -s http://localhost:3000/sitemap.xml | rg '/blog'
curl -s http://localhost:3000/sitemap.xml | rg '/official' && exit 1 || true
```

---

### Task 13 — 관리자 블로그 전환 분석 추가

**수정**

- `apps/www/src/features/analytics/server/dashboard.ts`
- `apps/www/src/app/admin/analytics/page.tsx`

**서버 집계 타입**

```ts
export type BlogPerformanceRow = {
  path: string;
  views: number;
  cardEngagements: number;
  selfCheckClicks: number;
  callbackClicks: number;
};
```

`analytics_events`에서 기간 내 `path like '/blog/%'`를 기준으로 글별 조회, 카드 탐색, 자가진단과 콜백 클릭을 집계한다. 기존 테스트 사용자 제외 조건을 동일하게 적용한다. 관리자 화면에는 다음 열을 추가한다.

- 글 경로
- 조회
- 카드 탐색
- 자가진단 클릭
- 콜백 클릭
- 조회→CTA 비율

개인정보와 전체 UTM 원문 외의 입력 데이터는 표시하지 않는다.

**검증**

- 이벤트가 없을 때 빈 상태 정상
- 샘플 이벤트에서 경로별 합계 일치
- 기존 핵심 퍼널, 이메일, 결제와 UTM 표 수치 회귀 없음

---

### Task 14 — 편집 운영 문서 작성

**생성**

- `docs/operations/blog-publishing.md`
- `apps/www/src/content/blog/ko/README.md`

**포함 내용**

- 새 글 파일 생성과 registry 등록 방법
- metadata 필드와 category/CTA 값
- draft → 검토 → published 절차
- 출처 확인 체크리스트
- 카드뉴스 6~10장 작성법
- SNS·네이버 블로그 재구성 방법
- 수정일을 바꾸는 기준
- 고객 후기 금지 및 동의 후 도입 원칙
- CMS 재검토 조건: 약 30편 이상 또는 다중 편집자

**검증**

운영자가 문서만 보고 새 draft 글을 추가하고 로컬 Preview를 열 수 있어야 한다.

---

### Task 15 — 전체 품질 검증과 Preview 배포

**정적 검증**

```bash
npm run lint --workspace=www
npx tsc --noEmit -p apps/www/tsconfig.json
npm run build --workspace=www
```

**라우팅 검증**

- www `/blog`, 5개 카테고리, 6개 공개 글 200
- 임의 글과 카테고리 404
- start의 블로그 경로는 www로 308
- www의 자가진단·콜백은 start로 정상 이동
- `/official/blog` 직접 접근은 공개 URL로 정규화

**SEO 검증**

- 글별 title, description, canonical, Open Graph와 BlogPosting JSON-LD
- 공개 글만 sitemap 포함
- OG endpoint 1200×630 정상
- 발행일·수정일 정합성

**접근성·반응형 검증**

- 360px, 768px, 일반 데스크톱 육안 검수
- 키보드만으로 메뉴, 필터, 카드뉴스, CTA와 관련 글 사용
- reduced motion 확인
- 이미지 실패 및 자바스크립트 비활성 상태 확인

**전환·분석 검증**

- 글 조회, 카드 탐색, 관련 글, 자가진단과 콜백 이벤트 200
- UTM과 원문 path 보존
- 관리자 분석에 글별 수치 표시
- 이메일·전화번호 형태 analytics payload 거부

**Preview 절차**

1. 구현 브랜치를 push하고 PR을 생성한다.
2. Vercel Preview가 Ready인지 확인한다.
3. 공식 사이트 Preview 호스트에서 위 수동 검증을 반복한다.
4. 사용자에게 블로그 목록, 대표 글 2편, 모바일과 관리자 분석을 확인받는다.
5. 승인 전 main에 병합하지 않는다.

## 5. 구현 순서와 커밋 경계

1. `Configure repository-based MDX blog`
   - Task 2~3
2. `Route official blog and add navigation`
   - Task 4
3. `Build blog listing and article components`
   - Task 5, 7~10
4. `Track blog engagement and conversions`
   - Task 6, 13
5. `Publish initial Career Direct Korea articles`
   - Task 11~12
6. `Document and verify blog publishing workflow`
   - Task 14~15

각 커밋 전 관련 lint와 TypeScript 검사를 실행하고, 기능 묶음이 끝날 때 production build를 실행한다. 사용자 소유 미추적 파일은 어떤 커밋에도 포함하지 않는다.

## 6. 완료 정의

- 승인 설계의 정보 구조, 카테고리, 작성자, 균형형 신앙 관점과 CTA 규칙이 구현되어 있다.
- 초기 6편이 출처 검토와 편집 검수를 통과한 상태로 공개된다.
- 블로그와 카드뉴스가 검색 가능한 HTML이며 모바일·키보드에서 사용할 수 있다.
- 글별 SEO, sitemap, OG와 관련 글이 정확하다.
- 블로그에서 기존 자가진단·콜백으로 이동한 전환을 관리자 화면에서 확인할 수 있다.
- 기존 공식 사이트, 전환 사이트, 관리자, 이메일, 결제와 cron 동작에 회귀가 없다.
- Preview에서 사용자 승인 후에만 main에 병합한다.
