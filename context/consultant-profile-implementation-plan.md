# 컨설턴트 프로필 및 브랜드 캐치프레이즈 구현 계획

작성일: 2026-08-11
기준 설계: `docs/superpowers/specs/2026-08-11-consultant-profile-design.md`

## 목표

박정열 컨설턴트의 본부 공식 사진, 검증된 자격·경력, 마스터 공인 인증서와 컨설팅 원칙을 균형형 프로필 페이지로 구현한다. 동시에 공식 사이트 핵심 접점에 다음 캐치프레이즈를 정확하게 적용하고, 사람의 타고난 특성을 뜻하는 `고유한 설계`를 `고유한 디자인`으로 통일한다.

`Discover Your Design. Discern Your Calling. Drive Your Journey.`

## 구현 원칙

- 기존 `/official` 호스트 분기와 URL 구조를 유지한다.
- 기존 `OfficialCtaLink`를 사용해 콜백 전환 추적을 보존한다.
- 공식 프로필 사진은 본부 페이지의 원본을 로컬에 저장하고 AI 보정하지 않는다.
- 인증서 PDF는 원본 바이트를 변경하지 않고 공개 자산으로 복사한다.
- 평점, 리뷰, 확인되지 않은 경력과 최상급 표현은 추가하지 않는다.
- 기존 미추적 EPS, `output/`, `tmp/`, `.superpowers/` 파일은 커밋하지 않는다.

## Task 1. 공식 자산을 출처와 함께 준비한다

예상 소요: 5분

### 대상 파일

- 생성: `apps/www/public/consultant/park-jung-yull-official-profile.png`
- 생성: `apps/www/public/consultant/career-direct-master-consultant-certificate-ko.pdf`
- 생성: `apps/www/public/consultant/career-direct-master-consultant-certificate-ko.png`

### 작업

1. `https://careerdirect.org/consultant/29034`에서 공식 프로필 사진 원본을 추출한다.
2. 사진이 박정열 컨설턴트 공식 프로필에 표시된 이미지인지 육안으로 확인한다.
3. 사용자 제공 원본 인증서 `/Users/m4pro/Downloads/Consultant_Certification-KO (1).pdf`를 공개 자산 경로에 복사한다.
4. Poppler로 인증서 1페이지를 PNG 미리보기로 렌더링한다. PDF 원본 자체는 재저장하거나 변형하지 않는다.

### 검증

```bash
file apps/www/public/consultant/park-jung-yull-official-profile.png
pdfinfo apps/www/public/consultant/career-direct-master-consultant-certificate-ko.pdf
file apps/www/public/consultant/career-direct-master-consultant-certificate-ko.png
```

사진과 인증서 미리보기를 각각 육안으로 열어 인물, 글자 방향, 잘림, 비율을 확인한다.

## Task 2. 공식 캐치프레이즈를 공통 콘텐츠로 정의한다

예상 소요: 3분

### 대상 파일

- 수정: `apps/www/src/features/official-site/content.ts`
- 생성: `apps/www/src/features/official-site/components/BrandTagline.tsx`

### 작업

`content.ts`에 하나의 공식 원본을 둔다.

```ts
export const brand = {
  tagline: "Discover Your Design. Discern Your Calling. Drive Your Journey.",
  taglineKo: "나의 디자인을 발견하고, 부르심을 분별하며, 나만의 여정을 주도하세요.",
} as const;
```

`BrandTagline`은 위치별 스타일만 주입받고 문자열은 `brand.tagline`을 사용한다.

```tsx
export default function BrandTagline({ className = "" }: { className?: string }) {
  return <p className={className}>{brand.tagline}</p>;
}
```

### 검증

```bash
rg -n "Discover Your Design" apps/www/src
```

문구 원본 정의가 한 곳이며 각 화면은 공통 구성요소를 사용해야 한다.

## Task 3. 공통 푸터에 브랜드 시그니처를 적용한다

예상 소요: 3분

### 대상 파일

- 수정: `apps/www/src/features/official-site/components/OfficialFooter.tsx`

### 작업

- 로고 아래에 `BrandTagline`을 추가한다.
- 기존 한국어 설명의 `고유한 설계`를 `고유한 디자인`으로 수정한다.
- 영문 캐치프레이즈는 작은 대문자 계열의 브랜드 서명으로 표시하되 모바일에서 자연스럽게 줄바꿈되도록 한다.

예시 구조:

```tsx
<BrandTagline className="mt-5 max-w-lg text-sm font-bold leading-6 text-teal" />
<p className="mt-3 max-w-md text-sm leading-7 text-cream/65">
  자기이해에서 평가·컨설팅·실행계획까지, 고유한 디자인을 발견하고 삶의 방향을 세우도록 돕습니다.
</p>
```

### 검증

- 공식 사이트의 모든 페이지 하단에서 캐치프레이즈가 보인다.
- 360px 화면에서 푸터에 가로 스크롤이 생기지 않는다.

## Task 4. 공식 홈페이지 히어로에 캐치프레이즈와 용어를 적용한다

예상 소요: 4분

### 대상 파일

- 수정: `apps/www/src/app/official/page.tsx`

### 작업

- 히어로의 적절한 위치에 `BrandTagline`을 한 번 노출한다.
- 아래 사용자 노출 문구를 문맥에 맞게 바꾼다.
  - `고유한 설계를 현실의 선택과 실행으로 연결합니다` → `고유한 디자인을 현실의 선택과 실행으로 연결합니다`
  - `자녀의 고유한 설계 이해` → `자녀의 고유한 디자인 이해`
  - `개인의 고유한 설계를 발견하고` → `개인의 고유한 디자인을 발견하고`
  - `고유한 설계를 통합적으로 이해합니다` → `고유한 디자인을 통합적으로 이해합니다`
- `선택과 실행계획을 함께 설계합니다`처럼 일반 명사인 표현은 유지한다.

### 검증

```bash
rg -n "고유한 설계|Discover Your Design" apps/www/src/app/official/page.tsx
```

결과에는 `고유한 설계`가 없어야 하고 캐치프레이즈는 한 번만 표시되어야 한다.

## Task 5. 컨설턴트 프로필 페이지를 균형형 구조로 개편한다

예상 소요: 5분씩 세 개의 하위 작업

### 대상 파일

- 수정: `apps/www/src/app/official/consultant/page.tsx`

### 작업

페이지를 다음 순서로 구성한다.

#### Task 5A. 히어로와 신뢰 배지 — 5분

- 공식 사진, `MASTER CONSULTANT`, 직함, 핵심 문장, 캐치프레이즈, 콜백 CTA와 본부 링크를 구현한다.
- 공식 자격과 경험 요약 배지를 구현한다.

#### Task 5B. 소개, 전문 영역과 경력 — 5분

- 임팩트 소개와 여섯 개 전문 영역을 구현한다.
- 사용자가 확정한 학력 및 주요 경력 다섯 항목만 구현한다.

#### Task 5C. 인증서, 원칙, 신앙 관점과 CTA — 5분

- 인증서 미리보기 및 원본 PDF 링크를 구현한다.
- 기존 네 가지 컨설팅 원칙과 신앙·소명 영역을 배치한다.
- 기존 공통 최종 CTA를 사용한다.

최종 페이지 순서는 다음과 같다.

1. 공식 사진, `MASTER CONSULTANT`, 직함, 핵심 문장, 캐치프레이즈, 콜백 CTA, 본부 프로필 링크
2. 공식 자격과 경험 요약 배지
3. `한 사람의 결과표가 아니라, 한 사람의 삶을 봅니다` 소개
4. 여섯 개 커리어 컨설팅 전문 영역
5. 확정된 학력 및 주요 경력 다섯 항목
6. 인증서 미리보기, 유효기간, 원본 PDF 보기 링크
7. 기존 네 가지 컨설팅 원칙
8. 신앙과 일을 통합하는 관점
9. `당신의 이야기를 먼저 듣겠습니다` 최종 CTA

히어로의 핵심 골격:

```tsx
<section className="bg-cream px-5 py-16 sm:px-8 sm:py-24">
  <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[.75fr_1.25fr] lg:items-center">
    <Image
      src="/consultant/park-jung-yull-official-profile.png"
      alt="Career Direct 마스터 공인 컨설턴트 박정열"
      width={250}
      height={250}
      priority
    />
    <div>
      <Eyebrow>MASTER CONSULTANT</Eyebrow>
      <h1>Career Direct 마스터 공인 컨설턴트 박정열</h1>
      <p>평가 결과를 넘어, 당신의 고유한 디자인을 현실의 선택과 실행으로 연결합니다.</p>
      <BrandTagline />
      {/* 기존 OfficialCtaLink와 본부 공식 프로필 링크 */}
    </div>
  </div>
</section>
```

인증서 링크:

```tsx
<a
  href="/consultant/career-direct-master-consultant-certificate-ko.pdf"
  target="_blank"
  rel="noreferrer"
>
  인증서 원본 PDF 보기
</a>
```

본부 링크에도 `target="_blank" rel="noreferrer"`를 적용하고 외부 링크임을 문구 또는 아이콘으로 알린다.

메타데이터 설명은 공식 자격과 컨설팅 전문성을 반영하도록 수정한다.

### 검증

- 확정된 학력·경력 다섯 개만 노출된다.
- `Master Consultant`와 `International Master Trainer`가 별도 자격으로 표시된다.
- 평점, 리뷰 수, `가장 많은` 같은 표현이 없다.
- 사진이 없더라도 대체 텍스트로 인물과 자격을 이해할 수 있다.
- 본부 링크, PDF 링크와 콜백 CTA가 각각 올바른 목적지로 열린다.

## Task 6. 나머지 공식 페이지의 용어를 통일한다

예상 소요: 4분

### 대상 파일

- 수정: `apps/www/src/app/official/assessment/page.tsx`
- 수정: `apps/www/src/app/official/organizations/page.tsx`
- 필요 시 수정: `apps/www/src/app/official/**/*.tsx`

### 작업

- 사람의 타고난 특성을 뜻하는 모든 `고유한 설계`를 문맥에 맞는 `고유한 디자인`으로 바꾼다.
- 프로그램, 일정, 실행계획을 만든다는 뜻의 일반 명사 `설계`는 유지한다.
- `커리어 코칭`이 컨설턴트 서비스 명칭으로 남아 있으면 `커리어 컨설팅`으로 통일하되, 이메일 후속 프로그램처럼 이미 별도 의미로 확정된 코칭은 변경하지 않는다.

### 검증

```bash
rg -n "고유한 설계" apps/www/src/app/official apps/www/src/features/official-site
```

사람의 고유성을 뜻하는 결과가 0건이어야 한다.

## Task 7. 정적 품질 검사를 수행한다

예상 소요: 5분

### 대상

- 변경된 모든 TypeScript/TSX 파일
- 새 공개 자산

### 작업 및 검증

```bash
npm run lint:www
npx tsc --noEmit -p apps/www/tsconfig.json
npm run build:www
```

추가 검색 검증:

```bash
rg -n "Discover Your Design\. Discern Your Calling\. Drive Your Journey\." apps/www/src
rg -n "고유한 설계" apps/www/src/app/official apps/www/src/features/official-site
rg -n "평점|가장 많은|리뷰" apps/www/src/app/official/consultant/page.tsx
```

빌드에 환경변수가 필요한 경우 현재 프로젝트의 안전한 로컬 검증 환경을 사용하고, 비밀값을 로그에 출력하지 않는다.

## Task 8. 반응형 화면과 링크를 육안 검수한다

예상 소요: 4분씩 두 번의 화면 검수

### 확인 화면

- `/consultant` 데스크톱
- `/consultant` 360px 모바일
- `/` 데스크톱 및 모바일 히어로
- 임의의 공식 하위 페이지 푸터

### 확인 항목

#### Task 8A. 레이아웃 검수 — 4분

1. 프로필 사진이 늘어나거나 찌그러지지 않는다.
2. 히어로 제목과 캐치프레이즈가 모바일에서 겹치거나 잘리지 않는다.
3. 인증서 전체가 잘리지 않고 원본 PDF가 열린다.

#### Task 8B. 링크와 회귀 검수 — 4분

4. 본부 공식 프로필 링크가 새 창에서 열린다.
5. 콜백 CTA가 기존 `start.careerdirect.kr/assessment-consultation` 흐름으로 연결된다.
6. 기존 공식 사이트 색상과 타이포그래피가 유지된다.

## Task 9. 변경 범위를 검토하고 커밋한다

예상 소요: 4분

### 작업

```bash
git status --short
git diff --check
git diff --stat
```

계획에 명시된 파일과 세 개의 새 자산만 스테이징한다. 기존 미추적 EPS, `output/`, `tmp/`, `.superpowers/`는 제외한다.

권장 커밋 메시지:

```text
Expand official consultant profile
```

### 완료 조건

- 정적 검사와 프로덕션 빌드가 통과한다.
- 데스크톱·모바일 육안 검수가 끝난다.
- 공식 캐치프레이즈와 `고유한 디자인` 용어 기준이 반영된다.
- 사진, 인증서와 외부 출처 링크가 정상이다.
- 콜백·분석·결제·이메일 기능에는 회귀가 없다.
