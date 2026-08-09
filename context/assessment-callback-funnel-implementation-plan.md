# 검사 20분 무료 콜백 퍼널 구현 계획

설계 기준: `docs/superpowers/specs/2026-08-09-assessment-callback-funnel-design.md`

## 구현 순서 요약

1. DB와 마이그레이션
2. 서버 검증·이메일·접수 API
3. 공개 콜백 신청 페이지
4. PDF·웹·코칭 이메일 CTA 라우팅
5. 관리자 CRM
6. 분석 대시보드
7. 개인정보·운영 문서
8. 전체 검증·배포·운영 DB 적용

각 작업은 한 가지 책임과 즉시 실행할 검증을 갖는다.

---

## Phase 0. 변경 전 기준 확인

### Task 0.1 — Next.js 16 규칙 확인

- 읽기:
  - `apps/www/AGENTS.md`
  - `node_modules/next/dist/docs/01-app/01-getting-started/15-route-handlers.md`
  - `node_modules/next/dist/docs/01-app/03-api-reference/04-functions/redirect.md`
  - `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/page.md`
- 목적: Next.js 16의 Promise 기반 라우트 인자와 서버 렌더링 규칙을 따른다.
- 검증: 계획한 각 라우트 파일 convention이 현재 문서와 일치함을 확인한다.

### Task 0.2 — 기존 운영 데이터·환경 확인

- 읽기:
  - `packages/db/src/schema.ts`
  - `packages/db/drizzle/meta/_journal.json`
  - `apps/www/src/features/lead-magnet/server/emailAutomation.ts`
  - `apps/www/src/features/admin/server/auth.ts`
- 확인할 환경변수 이름만 점검하고 값은 출력하지 않는다.
- 신규 운영 변수: `CALLBACK_NOTIFICATION_EMAIL`
- 운영값: `dulospaul@gmail.com`
- 검증: `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, `RESEND_REPLY_TO_EMAIL`이 기존 발송 코드와 호환됨을 확인한다.

---

## Phase 1. 데이터베이스

### Task 1.1 — 검사 콜백 테이블 스키마 추가

- 파일: `packages/db/src/schema.ts`
- 새 테이블: `assessment_callback_requests`
- 주요 필드:
  - `id` serial PK
  - `name` text not null
  - `email` varchar(256) not null
  - `phone` varchar(32) not null
  - `preferred_date` date not null
  - `time_slot` varchar(24) not null
  - `gender` varchar(24) not null default `prefer_not_to_say`
  - `age_range` varchar(24) not null default `prefer_not_to_say`
  - `marital_status` varchar(24) not null default `prefer_not_to_say`
  - `topics` text array not null
  - `other_topic` varchar(300)
  - `privacy_agreed` boolean not null
  - `marketing_agreed` boolean not null default false
  - `consent_version` varchar(32) not null
  - `source`, `cta_location`, `utm_source`, `utm_medium`, `utm_campaign`
  - `status` varchar(32) not null default `new`
  - `status_updated_at` timestamptz not null default now
  - `admin_note` text
  - `admin_email_status`, `customer_email_status` varchar(16) default `pending`
  - `admin_email_error`, `customer_email_error` varchar(80)
  - `admin_email_id`, `customer_email_id` varchar(128)
  - `created_at`, `updated_at` timestamptz
- 인덱스:
  - `(status, created_at)`
  - `(preferred_date, time_slot)`
  - `(email, created_at)`
- 기존 `consultation_requests`는 변경하지 않는다.
- 검증: `npx tsc --noEmit -p packages/db/tsconfig.json` 또는 루트 타입검사.

### Task 1.2 — Drizzle 마이그레이션 생성

- 명령: `npm run db:generate --workspace=@newland/db`
- 예상 파일: `packages/db/drizzle/0005_*.sql` 및 meta 갱신
- 마이그레이션에 테이블·인덱스·RLS 활성화를 포함한다.
- 공개 Supabase API 정책은 만들지 않는다. 서버 DB 연결만 접근한다.
- 검증:
  - 생성 SQL 수동 검토
  - 기존 테이블 삭제·변경이 없는지 확인
  - `assessment_callback_requests`만 생성되는지 확인

### Task 1.3 — 허용값 상수와 타입 정의

- 새 파일: `apps/www/src/features/assessment-callback/domain.ts`
- 정의:
  - `callbackStatuses`
  - `timeSlots`
  - `genderOptions`
  - `ageRangeOptions`
  - `maritalStatusOptions`
  - `callbackTopics`
  - `CALLBACK_CONSENT_VERSION`
- 라벨과 저장값을 한 곳에서 관리해 폼·서버·관리자 화면이 같은 값을 사용한다.
- 검증: 허용값에 설계된 모든 옵션이 있고 중복이 없는지 타입검사.

---

## Phase 2. 서버 접수와 이메일

### Task 2.1 — 입력 파서·검증기

- 새 파일: `apps/www/src/features/assessment-callback/server/validation.ts`
- 입력 허용목록 방식으로 다음을 검증한다.
  - 이름 2–60자
  - 이메일 정규화 및 최대 256자
  - 국내 휴대전화 형식 정규화
  - 한국시간 기준 오늘부터 60일 이내 날짜
  - 허용된 시간대·성별·연령대·혼인 상태
  - 상담 주제 1개 이상, 허용된 복수값, 중복 제거
  - 기타 선택 시 1–300자, 기타 미선택 시 내용 거부
  - 개인정보 동의 true
  - UTM·CTA 위치 길이 제한 및 이메일·전화번호 같은 민감값 거부
- 반환: 정규화된 DB 입력 또는 필드별 안전한 오류 코드
- 검증: 대표 정상값, 잘못된 선택값, 과거 날짜, 61일 이후, 기타 불일치 테스트 벡터를 함수 수준에서 실행한다.

### Task 2.2 — 콜백 이메일 발송 모듈

- 새 파일: `apps/www/src/features/assessment-callback/server/emails.ts`
- 기존 Resend 구성 패턴을 재사용한다.
- 관리자 이메일:
  - 수신자 `CALLBACK_NOTIFICATION_EMAIL`
  - 이름·전화번호·희망 날짜·시간대·주제·관리자 상세 링크
- 고객 이메일:
  - 접수 완료
  - 영업일 기준 1일 이내 연락
  - 신청만으로 결제·검사가 시작되지 않음
- 발신자·답장 주소는 기존 `RESEND_FROM_EMAIL`, `RESEND_REPLY_TO_EMAIL`을 사용한다.
- HTML에는 입력값을 HTML escape해 삽입한다.
- 반환: Resend ID 또는 분류된 안전한 오류 코드. API 키나 원문 응답을 DB에 저장하지 않는다.
- 검증: 발송 없이 HTML 생성 결과에 필수 문구와 escape가 적용되는지 확인한다.

### Task 2.3 — 공개 접수 API

- 새 파일: `apps/www/src/app/api/assessment-callback/route.ts`
- 처리 순서:
  1. JSON 크기 제한 및 Origin 확인
  2. 입력 파싱·정규화
  3. 최근 10분 내 동일 정규화 이메일+전화번호 중복 확인
  4. 새 신청 저장
  5. `callback_submitted` 익명 분석 이벤트 저장
  6. 관리자·고객 이메일 발송
  7. 각 발송 상태와 Resend ID 또는 오류 코드 갱신
  8. `201` 성공 응답
- 이메일 한쪽 또는 양쪽이 실패해도 신청은 성공으로 유지한다.
- DB 저장 실패는 5xx로 처리하고 성공 응답을 보내지 않는다.
- 중복은 기존 신청 ID를 노출하지 않고 동일한 성공 형태를 반환한다.
- 검증: 타입·린트, 허용되지 않은 Origin, 동의 누락, 중복, 이메일 실패 분기 확인.

### Task 2.4 — 개인정보 동의 문구 결정 기록

- 새 파일: `docs/decisions/assessment-callback-consent.md`
- 필수·선택 수집 항목, 이용 목적, 3년 보유, 거부 권리, 마케팅 별도 동의를 기록한다.
- UI 문구와 API의 `CALLBACK_CONSENT_VERSION`을 일치시킨다.
- 검증: 개인정보처리방침과 문구 대조.

---

## Phase 3. 공개 콜백 신청 페이지

### Task 3.1 — 페이지 메타데이터와 서버 페이지

- 새 파일: `apps/www/src/app/assessment-consultation/page.tsx`
- SEO 제목·설명, canonical, no misleading diagnosis language.
- 구성:
  - 검사 관심을 콜백으로 연결하는 Hero
  - 20분 콜백에서 안내하는 4가지
  - 평가→보고서→해석 컨설팅 과정
  - 결제·검사 자동 시작 아님 안내
  - 신청 폼
  - 본부 한국어 공식 정보 보조 링크
- 모바일 우선, 기존 cream/navy/teal/gold 브랜드 토큰 사용.
- 검증: 서버 렌더링, 모바일 폭, 제목 계층, 링크 accessible name.

### Task 3.2 — 신청 폼

- 새 파일: `apps/www/src/features/assessment-callback/components/CallbackForm.tsx`
- 입력:
  - 이름·휴대전화·이메일
  - 희망 날짜(오늘~60일)·시간대
  - 성별·연령대·혼인 여부
  - 상담 주제 체크박스
  - 조건부 기타 입력
  - 필수 개인정보 동의·선택 마케팅 동의
- 제출 중 중복 클릭 방지.
- 서버 오류 코드를 사용자 친화적인 필드 오류로 표시.
- 완료 화면은 영업일 1일 이내 연락과 비결제 안내를 표시.
- 개인정보처리방침 링크 제공.
- 검증: 키보드만으로 입력·제출, 오류 focus, 모바일 레이아웃.

### Task 3.3 — 본부 공식 정보 보조 CTA

- 페이지 내 링크: `https://careerdirect.org/?language_code=KO`
- 클릭 시 `official_site_clicked`를 익명 기록한다.
- 주 CTA보다 낮은 시각적 우선순위를 사용하고 새 탭으로 연다.
- 검증: 본부 한국어 페이지와 추적 API 이벤트 확인.

---

## Phase 4. CTA와 PDF 전환

### Task 4.1 — 분석 이벤트 확장

- 파일: `apps/www/src/features/analytics/server/events.ts`
- 추가:
  - `callback_cta_clicked`
  - `callback_submitted`
  - `official_site_clicked`
- 공개 API가 허용하는 이벤트는 클릭 두 종류만 포함하고 `callback_submitted`는 서버 전용으로 유지한다.
- 검증: 공개 API로 서버 전용 이벤트 위조 시 400, 허용 클릭은 200.

### Task 4.2 — 범용 추적 링크

- 파일: `apps/www/src/features/analytics/components/TrackedExternalLink.tsx`를 호환성 있게 일반화하거나 새 `TrackedLink.tsx` 추가
- props: `eventName`, `ctaLocation`, `href`, 내부/외부 링크 속성.
- `fetch(..., keepalive: true)`를 유지한다.
- 랜딩페이지 검사 주 CTA는 `/assessment-consultation`로 이동하며 `callback_cta_clicked` 기록.
- 본부 보조 링크는 `official_site_clicked` 기록.
- 검증: 두 링크가 서로 다른 이벤트를 생성한다.

### Task 4.3 — QR 경유 라우트 변경

- 파일: `apps/www/src/app/go/assessment/route.ts`
- `source=pdf_qr` 요청:
  - `callback_cta_clicked`
  - `cta_location=pdf_qr`
  - `pdf / qr / career_direction_check`
  - `/assessment-consultation`로 리다이렉트하며 UTM을 전달
- 알 수 없는 source는 추적하지 않고 안전하게 콜백 페이지로 이동.
- 분석 DB 장애 시에도 최대 1.2초 뒤 콜백 페이지로 이동.
- 검증: Location, UTM, 이벤트 행.

### Task 4.4 — 3회차 코칭 이메일 CTA

- 파일: `apps/www/src/features/lead-magnet/server/emailAutomation.ts`
- 3회차 주 CTA를 자체 경유 링크로 변경한다.
  - 예: `/go/assessment?source=coaching_3`
- 경유 라우트는 `email / coaching / coaching_3`로 `callback_cta_clicked`를 기록한 뒤 콜백 페이지로 이동한다.
- 이메일 문구를 `Career Direct 검사와 20분 무료 콜백 알아보기`로 변경한다.
- 본부 사이트는 이메일 주 CTA로 사용하지 않는다.
- 검증: 렌더링된 이메일 URL과 문구.

### Task 4.5 — PDF CTA 문구와 QR 재생성

- 제작 원본: `tmp/pdfs/build_career_direction_workbook.py`
- 운영 파일: `apps/www/private-assets/career-direction-check-ko-v1.0.pdf`
- 변경:
  - QR 경유 주소 유지
  - CTA를 `검사가 궁금하다면 QR을 스캔해 20분 무료 콜백을 신청하세요`로 변경
  - 직접 공식 사이트 신청처럼 보이는 문구 제거
- PDF 스킬 절차:
  - 12페이지/A4 유지
  - 마지막 페이지 렌더링·시각 검수
  - 링크 주석 목적지 확인
  - QR 실제 휴대전화 스캔
  - SHA-256 갱신
- 매니페스트: `docs/content/career-check-pdf-manifest.md`
- 검증: 다운로드된 운영 PDF와 생성본 해시 일치.

---

## Phase 5. 관리자 검사 상담 CRM

### Task 5.1 — 서버 조회 모듈

- 새 파일: `apps/www/src/features/assessment-callback/server/admin.ts`
- 함수:
  - 목록 조회: status 필터, 최신순, 제한 100
  - 상세 조회: ID 검증
  - 상태·메모 갱신: 허용값만, `statusUpdatedAt` 갱신
  - 이메일 재발송 후 상태 갱신
- 모든 호출은 관리자 라우트에서 세션 확인 후 사용한다.
- 검증: 잘못된 ID·상태 거부, 신청자 개인정보가 로그에 출력되지 않음.

### Task 5.2 — 관리자 목록 페이지

- 새 파일: `apps/www/src/app/admin/callbacks/page.tsx`
- 관리자 세션이 없으면 `/admin/login`으로 redirect.
- 표시: 신규/미처리 수, 상태 필터, 이름, 연락처, 희망일·시간, 주제, 신청일, 상태.
- 신규 상태를 시각적으로 강조한다.
- `/admin/analytics`와 상호 이동하는 관리자 내비게이션 추가.
- 검증: 빈 상태, 1건, 여러 상태, 모바일 가로 스크롤.

### Task 5.3 — 관리자 상세 페이지

- 새 파일:
  - `apps/www/src/app/admin/callbacks/[id]/page.tsx`
  - `apps/www/src/features/assessment-callback/components/AdminCallbackEditor.tsx`
- 신청 정보, 동의, UTM, 이메일 발송 상태, 상태, 메모 표시.
- 상태·메모 변경 폼과 고객/관리자 이메일 재발송 버튼.
- 민감정보 최소 기록 안내문 표시.
- 검증: 존재하지 않는 ID 404, 상태 저장 후 새로고침 유지.

### Task 5.4 — 관리자 변경 API

- 새 파일:
  - `apps/www/src/app/api/admin/callbacks/[id]/route.ts`
  - `apps/www/src/app/api/admin/callbacks/[id]/resend/route.ts`
- 모든 메서드에서 `hasAdminSession` 확인; 미인증 401.
- PATCH는 status와 adminNote만 허용.
- 재발송은 `admin` 또는 `customer` 허용값만 받는다.
- Origin 검증과 JSON 크기 제한.
- 검증: 미인증, 잘못된 상태, 존재하지 않는 ID, 성공 응답.

---

## Phase 6. 분석 대시보드

### Task 6.1 — 퍼널 쿼리 확장

- 파일: `apps/www/src/features/analytics/server/dashboard.ts`
- 기존 과거 `assessment_cta_clicked` 지표는 별도 보존하거나 화면에서 `과거 평가 링크 클릭`으로 명시한다.
- 추가 집계:
  - callback CTA click
  - callback submitted
  - callback completed
  - payment sent
  - paid
  - assessment in progress
  - new/unprocessed
- 모든 raw SQL 날짜 파라미터는 ISO 문자열 + `timestamptz` 캐스팅 유지.
- 검증: 0건과 샘플 상태별 count, 7/30/90일.

### Task 6.2 — 대시보드 UI 갱신

- 파일: `apps/www/src/app/admin/analytics/page.tsx`
- 핵심 퍼널에 콜백 단계 표시.
- 운영 카드: 신규/미처리, 결제 완료, 평가 진행.
- UTM 표에 callback click/submission을 포함.
- 검사 상담 CRM 링크 제공.
- 검증: 0으로 나누기 방지, 작은 화면 표, 개인정보 미표시.

---

## Phase 7. 개인정보와 공개 문서

### Task 7.1 — 개인정보처리방침

- 파일: `apps/www/src/app/privacy/page.tsx`
- 검사 콜백 신청의 필수·선택 항목, 목적, 3년 보유, Resend 국외이전, 마케팅 별도 동의를 반영한다.
- 기존 일반 상담과 PDF 리드 동의를 혼동하지 않는다.
- 검증: 설계 문서와 항목·기간·목적 대조.

### Task 7.2 — sitemap과 robots

- 파일: `apps/www/src/app/sitemap.ts`, 필요 시 `robots.ts`
- `/assessment-consultation`은 공개 색인 가능.
- `/admin/callbacks`와 API는 색인 금지 기존 정책 유지.
- 검증: sitemap 출력과 관리자 metadata robots noindex.

### Task 7.3 — 환경 예시와 운영 문서

- 파일:
  - `apps/www/.env.example`
  - `docs/decisions/lead-magnet-providers.md` 또는 별도 운영 문서
- `CALLBACK_NOTIFICATION_EMAIL` 추가.
- Vercel Production 환경에 저장하고 no-cache redeploy해야 함을 기록한다.
- 비밀값을 문서에 기록하지 않는다.

---

## Phase 8. 검증·커밋·배포

### Task 8.1 — 정적 검증

- `npx tsc --noEmit -p apps/www/tsconfig.json`
- `npm run lint --workspace=www`
- `npm run build --workspace=www -- --webpack`
- `git diff --check`는 바이너리 PDF를 제외해 확인한다.

### Task 8.2 — 마이그레이션 운영 적용

- GitHub `PRODUCTION_DATABASE_URL` secret이 현재 실패 이력이 있으므로 자동 Action만 신뢰하지 않는다.
- 생성된 `0005` SQL을 Vercel Production `DATABASE_URL`과 동일한 Supabase 프로젝트 SQL Editor에서 수동 적용한다.
- 확인 SQL:
  - `to_regclass('public.assessment_callback_requests')`
  - 필요한 열·인덱스·RLS 확인
- 운영 데이터 삭제·수정 SQL은 실행하지 않는다.

### Task 8.3 — Vercel 환경·배포

- Production에 `CALLBACK_NOTIFICATION_EMAIL=dulospaul@gmail.com` 추가.
- 기존 Resend 변수 유지.
- Build Cache 없이 재배포.

### Task 8.4 — 운영 E2E

1. UTM 테스트 랜딩 방문
2. 웹 CTA → 콜백 페이지
3. PDF QR → 콜백 페이지
4. 3회차 이메일 경유 링크 → 콜백 페이지
5. 정상 신청 제출
6. 고객 확인 이메일 수신
7. 관리자 Gmail 알림 수신
8. 관리자 목록·상세 확인
9. 상태를 콜백 완료→결제 안내→결제 완료→평가 진행으로 수동 변경
10. 분석 대시보드 7일 퍼널과 UTM 확인
11. 본부 한국어 보조 링크와 `official_site_clicked` 확인

### Task 8.5 — 커밋 범위

- 설계·마이그레이션·공개 흐름·관리자 CRM·PDF·문서 변경만 스테이징한다.
- 기존 미추적 EPS, `.superpowers/`, `output/`, `tmp/` 전체를 일괄 스테이징하지 않는다.
- 필요한 운영 PDF는 `apps/www/private-assets` 파일만 커밋한다.

## 완료 조건

- 구매 의도 CTA가 Career Direct Korea 콜백 신청으로 연결된다.
- 본부 한국어 사이트는 보조 정보 링크로만 제공된다.
- 신청·이메일·1인용 CRM·상태 관리·분석이 하나의 운영 흐름으로 작동한다.
- 결제 전 신청이 평가 진행으로 자동 처리되지 않는다.
- 개인정보·동의·보유기간과 실제 구현이 일치한다.
- PDF QR과 웹·이메일 CTA의 출처별 전환을 관리자 대시보드에서 확인할 수 있다.

---

## 핵심 구현 계약

아래 인터페이스를 기준으로 각 모듈의 책임을 분리한다. 구체적인 UI 마크업은 기존 컴포넌트 스타일을 따르되 이 계약을 변경하지 않는다.

```ts
type CallbackStatus =
  | "new"
  | "scheduled"
  | "callback_completed"
  | "payment_sent"
  | "paid"
  | "assessment_in_progress"
  | "consulting_completed"
  | "on_hold";

type CallbackAttribution = {
  source: string | null;
  ctaLocation: string | null;
  utmSource: string | null;
  utmMedium: string | null;
  utmCampaign: string | null;
};

type CallbackEmailResult =
  | { ok: true; providerMessageId: string }
  | { ok: false; errorCode: string };

type CallbackSubmitResponse =
  | { ok: true }
  | { ok: false; error: "invalid_request"; fields?: Record<string, string> }
  | { ok: false; error: "submission_unavailable" };
```

공개 제출 API는 신청 ID, 이메일 존재 여부, 내부 오류 상세를 반환하지 않는다. 관리자 API만 인증된 세션에서 정수 ID를 사용한다.
