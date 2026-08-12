# 블로그 운영 분석 요약 구현 계획

## 목표

기존 `/admin/analytics`에 블로그 핵심 수치 네 개를 추가하고, 외부 채널에서 블로그로 바로 유입된 방문을 UTM 방문 집계에 포함한다.

## 작업 1: 분석 반환형과 요약 집계 추가

**파일:** `apps/www/src/features/analytics/server/dashboard.ts`

1. `BlogSummary` 타입을 추가한다.
2. 기존 `blogPerformanceResult`를 숫자로 변환한 뒤 재사용한다.
3. 글별 행을 합산해 `views`, `readers`, `selfCheckClicks`, `callbackClicks`를 반환한다.
4. 추가 DB 쿼리를 만들지 않는다.

**검증:** 0건이면 네 값이 모두 0이고, 데이터가 있으면 글별 표의 합과 일치한다.

## 작업 2: 블로그 직행 유입을 UTM 방문에 포함

**파일:** `apps/www/src/features/analytics/server/dashboard.ts`

1. UTM `visitors` 필터를 `landing_viewed`, `official_page_viewed`, `blog_article_viewed`로 확장한다.
2. 같은 익명 방문자와 UTM 조합은 `count(distinct anonymous_id)`로 한 번만 센다.
3. 신청·다운로드·CTA·콜백 집계는 변경하지 않는다.
4. 테스트 데이터 제외 서브쿼리를 유지한다.

**검증:** 블로그 UTM 방문은 표시되며, 같은 방문자의 중복 페이지 조회는 한 번으로 계산된다.

## 작업 3: 관리자 화면에 요약 카드 표시

**파일:** `apps/www/src/app/admin/analytics/page.tsx`

1. `블로그 성과` 설명 아래에 네 개 카드 그리드를 추가한다.
2. 항목은 `글 조회`, `고유 독자`, `자가진단 클릭`, `콜백 클릭`으로 고정한다.
3. 현재 글별 성과 표는 카드 아래에 유지한다.
4. 모바일 2열, 넓은 화면 4열로 배치한다.

**검증:** 7·30·90일 전환 시 카드와 표가 같은 기간으로 갱신된다.

## 작업 4: 품질 검증

1. `npm run lint --workspace=www`
2. `npm exec --workspace=www tsc -- --noEmit` 또는 Next 빌드 TypeScript 단계
3. `npm exec --workspace=www next -- build --webpack`
4. 로컬 운영 DB 환경변수가 없으면 컴파일·타입 통과 지점과 중단 원인을 분리 기록한다.
5. 변경 파일만 커밋하고 사용자 자료·임시 파일은 제외한다.

## 작업 5: Preview 배포

1. 기능 브랜치를 원격에 푸시한다.
2. Draft PR을 생성한다.
3. Vercel Preview에서 관리자 로그인 후 0건/데이터 보유 화면을 확인한다.
4. 사용자의 명시적 병합 승인을 받은 뒤 Production에 배포한다.
