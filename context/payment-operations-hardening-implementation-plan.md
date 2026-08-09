# 결제 운영 안정화 구현 계획

확정 명세: `context/payment-operations-hardening-spec.md`  
상세 설계: `docs/superpowers/specs/2026-08-10-payment-operations-hardening-design.md`

## 구현 순서

1. 테스트 표시와 운영 이력 스키마
2. 트랜잭션 기반 상태 변경 서비스
3. 테스트 분류·운영 필터 API
4. 위험 작업 확인·환불 미리보기 UI
5. 운영 이력 UI
6. 테스트 제외 분석
7. 전체 검증·수동 마이그레이션·배포

DB 마이그레이션을 Supabase에서 적용하기 전에는 신규 코드를 Production에 푸시하지 않는다.

---

## Phase 0. 기준 확인

### Task 0.1 — 저장소 상태 고정

- 확인: `git status --short`, `git log -5 --oneline`, `git remote -v`.
- 배포 원격은 `cdkorea`, 브랜치는 `main`으로 유지한다.
- 사용자 소유 미추적 로고, `.superpowers/`, `output/`, `tmp/`는 변경하지 않는다.
- 검증: 기준 커밋 `6ead7f4` 이후 대상 파일만 변경되는지 확인.

### Task 0.2 — Next.js와 기존 보안 패턴 확인

- 읽기:
  - `apps/www/AGENTS.md`
  - Next.js 16 Route Handler 문서
  - `apps/www/src/features/callback-payment/server/request.ts`
  - `apps/www/src/features/admin/server/auth.ts`
- 신규 관리자 API도 세션, Origin, Promise params, 안전한 오류 코드를 그대로 사용한다.
- 검증: 공개 API에서 테스트 여부나 운영 이력을 수정할 경로가 없는지 확인.

---

## Phase 1. DB 스키마와 마이그레이션

### Task 1.1 — 테스트 데이터 컬럼

- 수정: `packages/db/src/schema.ts`
- `assessmentCallbackRequests`에 `isTest boolean not null default false` 추가.
- `anonymousId varchar(64) nullable` 추가.
- 인덱스 `(is_test, created_at)`와 `(anonymous_id, created_at)` 추가.
- 기존 행은 모두 실제 고객으로 호환되도록 `false`로 채운다.
- 검증: 기존 콜백 insert가 변경 없이 성공하고 신규 신청이 기본 `false`인지 확인.

### Task 1.2 — 콜백과 익명 방문 연결

- 수정: `apps/www/src/app/api/assessment-callback/route.ts`.
- 이미 읽고 있는 `visitorIdFromRequest(request)` 결과를 콜백 insert의 `anonymousId`에 저장한다.
- 클라이언트 body에서 anonymous ID를 받지 않고 HttpOnly `cdk_vid` 쿠키만 신뢰한다.
- 중복 신청 응답은 기존 콜백을 유지하며 ID를 임의로 덮어쓰지 않는다.
- 검증: 정상 쿠키, 쿠키 없음, 변조된 쿠키, 중복 신청.

### Task 1.3 — 운영 이력 테이블

- 수정: `packages/db/src/schema.ts`
- 추가: `callbackPaymentAuditLogs` / `callback_payment_audit_logs`.
- 필드:
  - `id`, `callbackRequestId`, nullable `paymentId`
  - `action` 최대 64자
  - nullable `previousStatus`, `nextStatus`
  - nullable `amount` 정수
  - nullable `reason` 최대 500자
  - `createdAt`
- FK:
  - 콜백 삭제 시 cascade
  - 결제 삭제 시 set null
- 인덱스:
  - `(callback_request_id, created_at)`
  - `(payment_id, created_at)`
  - `(action, created_at)`
- 수정·삭제용 API나 UI는 만들지 않는다.
- 검증: 금액은 정수만, reason 500자 제한, PII 전용 필드 없음.

### Task 1.4 — Drizzle 마이그레이션

- 실행: `npm run db:generate --workspace=@newland/db`.
- 예상: `packages/db/drizzle/0008_*.sql`과 meta 갱신.
- SQL 보강:
  - 신규 이력 테이블 RLS 활성화
  - 공개 RLS 정책 없음
- 검증:
  - 삭제·rename 없음
  - `is_test default false not null`
  - FK·인덱스·RLS 확인
  - `npx tsc --noEmit -p packages/db/tsconfig.json`

---

## Phase 2. 운영 이력과 트랜잭션 서비스

### Task 2.1 — 이력 action 계약

- 새 파일: `apps/www/src/features/callback-payment/server/audit.ts`.
- `PaymentAuditAction` 허용값:
  - `test_flag_changed`
  - `payment_instruction_created`, `payment_instruction_resent`, `payment_instruction_cancelled`
  - `payment_confirmed`
  - `evidence_changed`
  - `assessment_link_issued`, `assessment_registered`, `assessment_started`, `assessment_completed`
  - `consultation_scheduled`, `consultation_rescheduled`, `consultation_completed`
  - `refund_requested`, `refund_completed`
  - `email_failed`
- helper 입력은 ID, 상태, 금액, 정제된 reason만 받는다.
- 검증: 허용되지 않은 action과 500자 초과 reason 거부.

### Task 2.2 — 결제 생성 트랜잭션

- 수정: `apps/www/src/features/callback-payment/server/admin.ts`.
- 결제 row 생성, 콜백 `payment_sent`, `payment_instruction_created` 이력을 하나의 트랜잭션으로 처리한다.
- 이메일은 트랜잭션 커밋 후 발송한다.
- 이메일 결과 업데이트와 `payment_instruction_resent` 또는 `email_failed` 이력을 별도 짧은 트랜잭션으로 저장한다.
- 결제 생성 동시 요청은 active partial unique와 409로 차단한다.
- 검증: DB 저장 실패 시 이메일 미발송, 이메일 실패 시 결제 상태 보존.

### Task 2.3 — 입금 확인·취소 트랜잭션

- 수정: `apps/www/src/features/callback-payment/server/admin.ts`.
- `awaiting_payment` 조건부 update 반환 행이 있을 때만 콜백 상태와 이력 저장.
- 중복 입금 확인은 idempotent 응답을 주고 이력·분석 이벤트를 추가하지 않는다.
- 입금 안내 취소에는 1~500자 사유를 요구한다.
- 검증: 이중 클릭, 이미 취소, 이미 결제, 빈 사유.

### Task 2.4 — 증빙 상태 트랜잭션

- 수정: `apps/www/src/features/callback-payment/server/admin.ts`.
- 이전 `type/status`와 새 값을 이력 reason에 민감정보 없이 기록한다.
- 같은 값을 다시 저장하면 이력을 만들지 않는다.
- `issued`일 때만 발행 시각을 저장한다.
- 검증: 입금 전 발행 완료 차단, 잘못된 조합, 중복 저장.

### Task 2.5 — 평가·컨설팅 상태 트랜잭션

- 수정: `apps/www/src/features/callback-payment/server/admin.ts`.
- 결제 서비스 상태, 콜백 목록 상태, 운영 이력을 하나의 트랜잭션으로 처리한다.
- `registered` action의 UI·API 명칭은 `고객 본부 등록 확인` 의미로 고정한다.
- 링크 URL 또는 클릭 이벤트를 입력받지 않는다.
- 컨설팅 일정 변경은 변경 횟수와 이전/새 시각을 민감정보 없이 reason에 기록한다.
- 검증: link 발급 전 registered 차단, 역방향 상태 차단, 완료 중복 이력 방지.

### Task 2.6 — 환불 트랜잭션과 미리보기

- 수정:
  - `apps/www/src/features/callback-payment/server/admin.ts`
  - `apps/www/src/features/callback-payment/server/refunds.ts`
- `previewRefund()`는 읽기와 계산만 하고 DB·이메일·분석 이벤트를 변경하지 않는다.
- `requestRefund()`는 같은 계산을 서버에서 재실행하고 상태·계산 근거·이력을 트랜잭션으로 저장한다.
- `completeRefund()`는 실제 이체 확인 boolean과 사유를 요구하고 상태·active·콜백 상태·이력을 트랜잭션으로 저장한다.
- 이메일은 커밋 후 발송하고 실패 이력을 별도로 남긴다.
- 검증: 등록 전/후, 48시간 전/후, 노쇼, 제공자 미제공, 조정액, 0원·초과액.

---

## Phase 3. 관리자 테스트 분류와 운영 필터

### Task 3.1 — 테스트 여부 API

- 새 파일: `apps/www/src/app/api/admin/callbacks/[id]/test-status/route.ts`.
- `PATCH` 입력: `{ isTest: boolean, reason: string }`.
- 관리자 세션·Origin 확인.
- 콜백 변경과 `test_flag_changed` 이력을 같은 트랜잭션으로 저장.
- 같은 값이면 200 idempotent, 신규 이력 없음.
- 검증: 인증 401, Origin 403, 입력 400, 없음 404, 정상 200.

### Task 3.2 — 콜백 목록 조회 모델 확장

- 수정: `apps/www/src/features/assessment-callback/server/admin.ts`.
- callback 목록에 active payment 요약을 left join 또는 별도 bounded query로 포함한다.
- 운영 filter enum:
  - `real`, `test`, `overdue`, `email_failed`, `evidence_needed`, `refund_pending`
- 기존 영업 status filter와 운영 filter를 독립 query parameter로 조합한다.
- 기한 초과는 `awaiting_payment AND payment_due_at < now()` 기준.
- 검증: 조합 필터, payment 없는 콜백, cancelled/refunded 과거 버전 제외.

### Task 3.3 — 콜백 목록 UI

- 수정: `apps/www/src/app/admin/callbacks/page.tsx`.
- 기존 상태 필터 아래 운영 필터를 구분해 표시한다.
- 컬럼 추가: 데이터 유형, 결제 상태, 서비스 상태, 운영 경고.
- 테스트 row 배경과 배지, 기한 초과/이메일 실패/증빙 필요 배지.
- 검증: 모바일 가로 스크롤, 빈 상태 문구, query parameter 유지.

---

## Phase 4. 관리자 상세 안전 UX

### Task 4.1 — 테스트 표시 UI

- 새 파일 또는 수정:
  - `apps/www/src/features/callback-payment/components/AdminTestDataControl.tsx`
  - `apps/www/src/app/admin/callbacks/[id]/page.tsx`
- 헤더에 테스트 배지를 표시한다.
- 전환 전 확인창과 사유 입력을 요구한다.
- 테스트 결제 영역에 실제 입금·환불 금지 안내를 고정 표시한다.
- 검증: 전환 성공/실패, 새로고침 유지, 이력 반영.

### Task 4.2 — 결제 편집 컴포넌트 분리

- 현재 큰 파일 `apps/www/src/features/callback-payment/components/AdminPaymentEditor.tsx`를 역할별로 분리한다.
- 새 컴포넌트 후보:
  - `PaymentSummary.tsx`
  - `PaymentActions.tsx`
  - `EvidenceActions.tsx`
  - `ServiceProgressActions.tsx`
  - `RefundActions.tsx`
  - `ConfirmActionDialog.tsx`
- 공통 fetch와 메시지는 `AdminPaymentEditor`가 조정한다.
- 검증: 기존 기능 회귀 없이 각 파일의 단일 책임 유지.

### Task 4.3 — 위험 작업 확인

- 수정: 위 결제 action 컴포넌트와 해당 API.
- 입금 확인: 상품명·총액 확인 checkbox.
- 취소: 사유 필수.
- 고객 본부 등록: 직접 등록 확인 checkbox와 165,000원 비환불 경고.
- 컨설팅 완료: 3시간 제공 확인 checkbox.
- 환불 완료: 실제 이체 완료 checkbox.
- 서버도 boolean 확인 필드를 검증해 UI 우회를 차단한다.
- 검증: checkbox 없는 직접 API 요청 400.

### Task 4.4 — 환불 미리보기 UI/API

- 수정: `apps/www/src/app/api/admin/callbacks/[id]/payment/refund/route.ts`.
- `action: preview` 응답에 기준액, 차감액, 조정액, 최종액, 설명 코드 반환.
- 수정/분리: `RefundActions.tsx`.
- 미리보기 표 확인 후에만 접수 버튼 활성화.
- 입력 변경 시 이전 미리보기를 폐기한다.
- 검증: 미리보기 후 DB 불변, 변경 입력으로 stale quote 접수 불가.

---

## Phase 5. 운영 이력 UI

### Task 5.1 — 이력 조회 서비스

- 새 파일 또는 확장: `apps/www/src/features/callback-payment/server/audit.ts`.
- 콜백 ID별 최신 100건 조회.
- action label, 상태 label, 원화 표시, 한국시간 표시용 view model 반환.
- reason은 이미 정제된 운영 사유만 반환.
- 검증: 다른 콜백 이력 혼입 없음, payment 삭제 후에도 콜백 이력 유지.

### Task 5.2 — 타임라인 컴포넌트

- 새 파일: `apps/www/src/features/callback-payment/components/PaymentAuditTimeline.tsx`.
- 수정: `apps/www/src/app/admin/callbacks/[id]/page.tsx`.
- 표시: 작업, 이전→이후, 금액, 사유, 한국시간.
- 이메일 실패는 경고색, 테스트 변경은 별도 배지.
- 빈 상태 문구 제공.
- 검증: 긴 사유 줄바꿈, 100건 제한, 모바일 가독성.

---

## Phase 6. 테스트 제외 분석

### Task 6.1 — 결제 집계 제외

- 수정: `apps/www/src/features/analytics/server/dashboard.ts`.
- 결제·상품 집계는 `assessment_callback_payments p JOIN assessment_callback_requests c` 후 `c.is_test = false` 조건 적용.
- 콜백 운영 집계도 `is_test = false` 적용.
- 총 결제액, 환불액, 순액 모두 동일 기준 사용.
- 핵심 퍼널의 `콜백 신청` 수는 analytics event 대신 `assessment_callback_requests`에서 `is_test = false`로 집계한다.
- 검증: 테스트 flag 전후 집계 차이, 실제 고객 불변, 0건 처리.

### Task 6.2 — 퍼널 이벤트 경계

- 수정: `apps/www/src/features/analytics/server/dashboard.ts`의 funnel·UTM 쿼리.
- `NOT EXISTS` 서브쿼리로 `is_test = true` 콜백의 non-null `anonymous_id`와 일치하는 analytics event를 제외한다.
- 콜백 신청 수는 콜백 테이블의 `is_test = false` 집계를 정본으로 사용한다.
- `anonymous_id`가 없는 과거 테스트 콜백은 익명 이벤트에서 제외하지 않는다.
- 동일 익명 ID는 하나의 브라우저 방문 흐름이므로 해당 ID의 기간 내 이벤트 전체를 제외한다.
- 수정: `apps/www/src/app/admin/analytics/page.tsx`.
- `연결된 테스트 데이터 제외`와 과거 미연결 데이터 경계를 표시한다.
- 검증: 테스트 flag 전후 랜딩·PDF·CTA·콜백·결제 수치, UTM 행, 과거 null ID.

---

## Phase 7. 검증과 운영 적용

### Task 7.1 — 정적 검증

- 실행:
  - `npx tsc --noEmit -p packages/db/tsconfig.json`
  - `npx tsc --noEmit -p apps/www/tsconfig.json`
  - `npm run lint --workspace=www`
  - `npm exec --workspace=www -- next build --webpack`
- `git diff --check`와 민감정보 문자열 검색.

### Task 7.2 — Preview 검증 시나리오

- 테스트 flag 실제↔테스트와 통계 제외.
- 새 테스트 콜백의 anonymous ID 연결과 랜딩·PDF·CTA 전체 제외.
- anonymous ID가 없는 과거 테스트 콜백의 익명 이벤트 보존.
- 입금 안내/확인 중복 클릭.
- 취소 사유와 이력.
- 증빙 중복 저장.
- 링크 발급 전 고객 본부 등록 거부.
- 고객 본부 등록 경고와 165,000원 환불 제외.
- 컨설팅 48시간 경계, 노쇼, 제공자 미제공.
- 환불 preview DB 불변, 접수·완료 이력.
- 운영 필터 6종과 조합.

### Task 7.3 — 수동 운영 마이그레이션

- GitHub 자동 DB migration은 사용하지 않는다.
- Supabase SQL Editor에서 `0008` 전체 적용.
- 확인:
  - `is_test` 컬럼/default
  - 이력 테이블/FK/index/RLS
- 기존 테스트 콜백을 UI에서 테스트로 표시한 뒤 분석에서 제외되는지 확인.

### Task 7.4 — 배포 순서

1. 로컬 정적 검증 완료
2. `0008` 운영 DB 수동 적용
3. 코드 커밋·`cdkorea main` push
4. Vercel Production 배포 확인
5. 기존 테스트 건을 테스트로 분류
6. 위험 action과 이력·필터·분석 smoke test

- 롤백은 앱 커밋만 이전 버전으로 되돌리고, 추가 컬럼·이력 테이블은 즉시 삭제하지 않는다.

## 구현 커밋 단위

1. `Add payment operations audit schema`
2. `Make payment state changes transactional`
3. `Add test data and operations filters`
4. `Add payment action safeguards and refund preview`
5. `Add payment operations timeline`
6. `Exclude test records from payment analytics`
7. `Verify payment operations hardening`
