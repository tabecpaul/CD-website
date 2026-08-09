# 전환 분석 대시보드 구현 계획

기준 설계: `docs/superpowers/specs/2026-08-09-conversion-analytics-dashboard-design.md`

## 구현 순서

### 1. 분석 이벤트 데이터 모델

**파일**

- `packages/db/src/schema.ts`
- `packages/db/src/index.ts`
- `packages/db/drizzle/0004_conversion_analytics.sql`

**작업**

- `analytics_events` 테이블과 `event_id` unique index, 기간·이벤트·UTM 조회 index를 추가한다.
- 컬럼은 `event_id`, `anonymous_id`, `event_name`, `occurred_at`, `path`, `cta_location`, UTM 3종, `created_at`만 허용한다.
- 이메일·전화번호·리드 ID 외래키는 두지 않는다.

**핵심 형태**

```ts
export const analyticsEvents = pgTable("analytics_events", {
  id: serial("id").primaryKey(),
  eventId: varchar("event_id", { length: 36 }).notNull(),
  anonymousId: varchar("anonymous_id", { length: 64 }),
  eventName: varchar("event_name", { length: 40 }).notNull(),
  occurredAt: timestamp("occurred_at", { withTimezone: true }).notNull(),
  path: varchar("path", { length: 160 }),
  ctaLocation: varchar("cta_location", { length: 64 }),
  utmSource: varchar("utm_source", { length: 128 }),
  utmMedium: varchar("utm_medium", { length: 128 }),
  utmCampaign: varchar("utm_campaign", { length: 128 }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});
```

**검증**

- TypeScript schema export 확인
- migration SQL에 unique/index/NOT NULL 확인

### 2. 서버 분석 모듈과 공개 이벤트 API

**파일**

- `apps/www/src/features/analytics/server/events.ts`
- `apps/www/src/app/api/analytics/events/route.ts`

**작업**

- 이벤트 이름 allowlist와 UUID·경로·CTA·UTM 검증기를 만든다.
- `cdk_vid`가 없으면 서버가 `randomUUID()`로 생성하고 HttpOnly 30일 쿠키를 발급한다.
- `Origin`이 `NEXT_PUBLIC_SITE_URL`과 일치하는 POST만 허용한다.
- 같은 `event_id`는 `onConflictDoNothing`으로 성공 처리한다.
- 서버 이벤트용 `recordAnalyticsEventSafely()`는 오류를 로깅하고 핵심 사용자 흐름에는 예외를 전달하지 않는다.
- UTM이 없는 서버 이벤트는 같은 방문 ID의 최초 랜딩 이벤트 UTM을 조회해 사용한다.

**핵심 인터페이스**

```ts
type AnalyticsEventName =
  | "landing_viewed"
  | "lead_submitted"
  | "pdf_downloaded"
  | "assessment_cta_clicked"
  | "consultation_submitted";

recordAnalyticsEventSafely(input: {
  eventName: AnalyticsEventName;
  anonymousId?: string | null;
  path?: string | null;
  ctaLocation?: string | null;
  utm?: Attribution;
}): Promise<void>;
```

**검증**

- 잘못된 Origin/이벤트/UUID/과도한 길이 `400` 또는 `403`
- 동일 이벤트 ID 두 번 요청 시 한 행
- 응답 쿠키 속성 확인

### 3. 공개 퍼널 연결

**파일**

- `apps/www/src/features/analytics/components/PageViewTracker.tsx`
- `apps/www/src/features/analytics/components/TrackedExternalLink.tsx`
- `apps/www/src/features/lead-magnet/components/CareerCheckLanding.tsx`
- `apps/www/src/app/api/lead-magnet/route.ts`
- `apps/www/src/app/api/career-check/download/route.ts`
- `apps/www/src/app/api/consultation/route.ts`

**작업**

- 랜딩 로드 시 `landing_viewed` 전송
- 평가 CTA 두 위치를 `assessment_cta_clicked`로 구분
- 리드 저장 성공 후 `lead_submitted`
- PDF 파일 준비 성공 후 `pdf_downloaded`; 토큰·리드 ID 미저장
- 상담 저장 성공 후 `consultation_submitted`; 연락처 미복제
- 분석 실패가 공개 API 성공을 변경하지 않게 분리

**검증**

- CTA 외부 이동이 추적 응답을 기다리지 않음
- PDF 응답 헤더·파일 유지
- 신청·상담 기존 성공 응답 유지

### 4. 1인용 관리자 인증

**파일**

- `apps/www/src/features/admin/server/auth.ts`
- `apps/www/src/app/admin/login/page.tsx`
- `apps/www/src/app/api/admin/login/route.ts`
- `apps/www/src/app/api/admin/logout/route.ts`
- `scripts/hash-admin-password.mjs`

**작업**

- `scrypt$<salt>$<hash>` 포맷 검증
- HMAC-SHA256 8시간 세션 쿠키 발급·검증
- 로그인 실패를 해시한 메모리 키로 제한
- 설정 누락 시 닫힌 상태로 실패
- 로그인/관리자 페이지 noindex

**환경변수**

- `ADMIN_DASHBOARD_PASSWORD_HASH`
- `ADMIN_DASHBOARD_SESSION_SECRET`

**검증**

- 올바른/잘못된 비밀번호
- 변조·만료 쿠키
- 로그아웃 후 접근 차단

### 5. 집계 쿼리와 대시보드

**파일**

- `apps/www/src/features/analytics/server/dashboard.ts`
- `apps/www/src/app/admin/analytics/page.tsx`
- `apps/www/src/app/admin/analytics/loading.tsx`

**작업**

- `period=7|30|90`, 기본 30일
- KST 자정 기준 시작 시각 계산
- 퍼널, 이메일 상태, UTM 조합 집계
- 0 분모는 `0%`로 표시
- 개인 이벤트·연락처는 쿼리와 UI에서 제외
- 비로그인 사용자는 `/admin/login`으로 이동

**검증**

- fixture 기준 집계 수치
- `(direct)` 그룹
- 기간 파라미터 변조 시 30일 fallback
- 모바일 표 가로 스크롤과 접근성

### 6. 보존과 개인정보 고지

**파일**

- `apps/www/src/app/api/cron/lead-emails/route.ts`
- `apps/www/src/features/analytics/server/retention.ts`
- `apps/www/src/app/privacy/page.tsx`

**작업**

- 한국시간 오전 3시 첫 Cron 호출에서만 13개월 이전 이벤트 삭제
- 개인정보처리방침에 자사 분석, 익명 방문 ID, UTM, 30일 쿠키, 13개월 보존 추가

**검증**

- 다른 시간에는 삭제 미실행
- 경계 이전 데이터만 삭제
- 공개 고지와 구현 일치

### 7. 전체 검증·배포 준비

**명령**

```bash
npx tsc --noEmit -p apps/www/tsconfig.json
npm run lint -w www
npx next build --webpack
```

**운영 검증**

- migration 적용
- 관리자 해시와 32바이트 이상 세션 비밀값 등록
- 무캐시 Vercel 배포
- 방문→신청→다운로드→CTA→상담 테스트
- `/admin/analytics` 수치 및 이메일 상태 확인

## 구현 경계

- 외부 분석 SDK를 추가하지 않는다.
- 기존 리드·상담·이메일 개인정보를 분석 테이블로 복제하지 않는다.
- 관리자 UI에서 원시 이벤트 목록을 제공하지 않는다.
- 기존 사용자 파일과 무관한 리팩터링을 하지 않는다.
