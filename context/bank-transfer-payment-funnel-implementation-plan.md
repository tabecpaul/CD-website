# 무통장입금 결제 퍼널 구현 계획

확정 명세: `context/bank-transfer-payment-funnel-spec.md`  
상세 설계: `docs/superpowers/specs/2026-08-09-bank-transfer-payment-funnel-design.md`

## 구현 원칙과 순서

1. 공개된 옛 가격·카드결제 화면의 노출 위험을 먼저 제거한다.
2. 스키마와 가격/상태 도메인을 만든 뒤 관리자 API와 UI를 연결한다.
3. 이메일은 DB 기록과 분리해 실패해도 결제 상태가 거짓으로 바뀌지 않게 한다.
4. 모든 금액은 원 단위 정수로 저장하고 서버 상수에서 계산한다.
5. 운영 DB 마이그레이션 전에는 신규 UI를 배포하지 않는다.
6. 각 Phase 종료 시 lint/type/build와 상태 전이 시나리오를 검증한다.

---

## Phase 0. 기준과 공개 화면 정리

### Task 0.1 — 작업 기준 고정

- 확인:
  - `git status --short`
  - `git remote -v`
  - 배포 원격 `cdkorea`, 브랜치 `main`
- 사용자 소유 미추적 파일(`.superpowers/`, 로고 원본, `output/`, `tmp/`)은 건드리지 않는다.
- 검증: 기준 커밋과 변경 예정 파일을 기록한다.

### Task 0.2 — Next.js 16 규칙 확인

- 읽기:
  - `apps/www/AGENTS.md`
  - `apps/www/node_modules/next/dist/docs/01-app/01-getting-started/15-route-handlers.md`
  - `apps/www/node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/route.md`
- 적용:
  - 동적 `params`는 `await`한다.
  - 관리자 변경 Route Handler는 캐시하지 않는다.
  - 공개 페이지와 API segment 충돌을 점검한다.
- 검증: 계획된 라우트 목록과 실제 App Router 구조 대조.

### Task 0.3 — 임시 체크아웃 비활성화

- 수정: `apps/www/src/app/checkout/page.tsx`
- 임시 카드결제 폼과 390,000/590,000/890,000원 가격을 제거한다.
- `/checkout`은 공개 주문을 받지 않고 `/assessment-consultation`으로 영구 리디렉션하거나, 콜백 상담을 먼저 신청해야 한다는 안내만 제공한다.
- 공개 내비게이션·CTA에서 `/checkout` 참조를 `rg 'checkout|390000|590000|890000' apps/www/src`로 찾아 제거한다.
- 검증:
  - 옛 가격과 신용카드 문구 0건
  - `/checkout`에서 주문 제출 불가
  - 콜백 신청 경로 정상

---

## Phase 1. 데이터 모델과 마이그레이션

### Task 1.1 — 결제 테이블 정의

- 수정: `packages/db/src/schema.ts`
- 추가 테이블: `assessment_callback_payments`
- 식별·연결:
  - `id`, `callbackRequestId` FK, `version`, `isActive`
- 상품 가격 스냅샷:
  - `productCode`, `productName`
  - `supplyAmount`, `vatAmount`, `totalAmount`
  - `assessmentAmount`, `consultationAmount`
- 결제:
  - `paymentStatus`, `instructionSentAt`, `paymentDueAt`, `paidAt`, `cancelledAt`
  - `depositorName`은 필요한 경우에만 저장하고 길이를 제한한다.
- 증빙:
  - `evidenceType`, `evidenceStatus`, `evidenceIssuedAt`
- 평가·컨설팅:
  - `serviceStatus`
  - `assessmentLinkIssuedAt`, `assessmentRegisteredAt`, `assessmentStartedAt`, `assessmentCompletedAt`
  - `consultationStartAt`, `consultationEndAt`, `consultationChangeCount`, `consultationStartedAt`, `consultationCompletedAt`
- 환불:
  - `refundReasonCode`, `refundReasonNote`
  - `refundCalculatedAmount`, `refundAdjustmentAmount`, `refundFinalAmount`
  - `refundRequestedAt`, `refundCompletedAt`
- 이메일 추적:
  - 입금 안내·입금 확인·환불 접수·환불 완료별 status, provider ID, error, sentAt
- 공통: `createdAt`, `updatedAt`
- 제약/인덱스:
  - `(callback_request_id, version)` unique
  - `callback_request_id WHERE is_active = true` partial unique
  - `(payment_status, payment_due_at)`
  - `(service_status, updated_at)`
- 검증: 한 콜백에 활성 결제 2건 생성이 DB에서 거부되고 과거 버전은 보존되는지 확인.

### Task 1.2 — 분석 이벤트 상품 코드 추가

- 수정: `packages/db/src/schema.ts`
- `analytics_events`에 nullable `productCode`(최대 32자) 추가.
- `(event_name, product_code, occurred_at)` 인덱스 추가.
- 공개 분석 요청 parser는 `productCode`를 받지 않게 유지하고, 서버 결제 이벤트만 값을 기록한다.
- 검증: 브라우저가 임의 상품 코드를 주입할 수 없고 기존 이벤트 insert가 계속 동작하는지 확인.

### Task 1.3 — 마이그레이션 생성과 RLS

- 실행: `npm run db:generate --workspace=@newland/db`
- 예상 파일: `packages/db/drizzle/0007_*.sql`, snapshot, journal.
- 생성 SQL 보강:
  - 신규 결제 테이블 RLS 활성화
  - 공개 RLS 정책은 생성하지 않음
  - partial unique index 확인
- 검증:
  - 기존 테이블/컬럼 삭제 없음
  - `npx tsc --noEmit -p packages/db/tsconfig.json`
  - 빈 테스트 DB에서 마이그레이션 적용
  - 기존 데이터가 있는 DB에서 nullable/default 호환 확인

---

## Phase 2. 상품·상태·환불 도메인

### Task 2.1 — 상품 카탈로그를 서버 상수로 고정

- 새 파일: `apps/www/src/features/callback-payment/domain.ts`
- 코드 계약:
  - `youth_integrated`: 만 15~28세, 385,000원
  - `adult_integrated`: 만 29세 이상, 495,000원
  - 각 상품의 공급가·VAT·평가 배분·컨설팅 배분
- 제공 함수:
  - 상품 코드 검증
  - 가격 스냅샷 생성
  - 원화 표시
  - 상태와 한국어 라벨
- 클라이언트가 보낸 금액은 무시하고 상품 코드만 받는다.
- 검증: 두 상품의 `공급가 + VAT = 총액`, `평가 + 컨설팅 = 총액` 불변식.

### Task 2.2 — 상태 전이 규칙

- 새 파일: `apps/www/src/features/callback-payment/server/transitions.ts`
- 허용 전이 표:
  - 결제: 시작 → 대기 → 완료/취소 → 환불대기 → 환불완료
  - 서비스: 미발급 → 링크발급 → 등록 → 평가중 → 평가완료 → 컨설팅예정 → 컨설팅완료
- 예외:
  - 오입력 정정은 별도 관리자 action과 운영 메모를 요구한다.
  - 환불 완료 결제는 다시 활성화하지 않고 새 version을 만든다.
- 검증: 정상 전이, 단계 건너뛰기, 역방향 전이, 중복 요청.

### Task 2.3 — 환불 계산기

- 새 파일: `apps/www/src/features/callback-payment/server/refunds.ts`
- 입력 계약:
  - 상품 스냅샷
  - 본부 등록 여부/시각
  - 컨설팅 예정·시작·완료 시각
  - 변경 횟수, 취소 시각, 사유 코드
  - 불가항력 면제 여부, 제공자 미제공 30분 단위 수
- 출력:
  - 기준액, 차감 항목, 추천 환불액, 설명 코드
- 운영자가 조정할 때 `refundAdjustmentAmount`와 사유를 필수로 기록한다.
- 환불액 범위는 `0 <= 최종액 <= 결제액`으로 제한한다.
- 검증 벡터:
  - 등록 전 전액
  - 등록 후 48시간 초과/이내/노쇼
  - 첫 변경 무료, 두 번째 변경 차감, 불가항력 면제
  - 제공자 미제공 청년 1~6단위와 성인 1~6단위
  - 청년 6단위 합계가 220,000원을 초과하지 않는 반올림 보정

### Task 2.4 — 관리자 입력 검증

- 새 파일: `apps/www/src/features/callback-payment/server/validation.ts`
- 허용 키와 길이를 명시하고 unknown key를 버린다.
- 날짜는 ISO 문자열로 받은 뒤 서버에서 검증·변환한다.
- 자유 메모에는 결제·환불 계좌, 주민번호, 카드정보를 기록하지 말라는 UI/서버 제한을 둔다.
- 오류 코드는 안전한 enum으로 반환한다.
- 검증: 잘못된 상품, 음수 금액, 과거/잘못된 일정, 과도한 메모, 임의 상태.

---

## Phase 3. 결제 서버 서비스와 관리자 API

### Task 3.1 — 결제 조회·생성 서비스

- 새 파일: `apps/www/src/features/callback-payment/server/admin.ts`
- 기능:
  - 콜백 상세와 활성/과거 결제 조회
  - 서버 상품 상수로 snapshot 생성
  - 이전 활성 결제를 명시적으로 취소한 경우에만 새 version 생성
  - 72시간 기한을 서버 시각에서 계산
- 트랜잭션:
  - 콜백 row 잠금 또는 조건부 갱신
  - 기존 active 해제와 새 결제 insert를 원자 처리
- 검증: 이중 클릭/동시 요청에도 활성 결제 1건.

### Task 3.2 — 관리자 공통 보안 가드 재사용

- 수정 또는 재사용:
  - `apps/www/src/features/admin/server/auth.ts`
  - 기존 `apps/www/src/app/api/admin/callbacks/[id]/route.ts`의 Origin 패턴
- 모든 신규 API:
  - 관리자 세션 필수
  - `NEXT_PUBLIC_SITE_URL` 기준 Origin 일치
  - 동적 params await
  - 개인정보·환경변수·계좌 전체를 로그에 출력하지 않음
- 검증: 401, 403, 400, 404, 409, 503 응답 구분.

### Task 3.3 — 입금 안내 생성·발송 API

- 새 파일: `apps/www/src/app/api/admin/callbacks/[id]/payment/route.ts`
- `POST` 입력: `productCode`, 선택적 `depositorName`, `evidenceType`.
- 처리:
  1. 콜백과 활성 결제 확인
  2. 결제 snapshot/72시간 기한 저장
  3. 입금 안내 이메일 발송
  4. 결과 status/provider ID/error 갱신
  5. 서버 분석 이벤트 `payment_instruction_sent`
- 이메일 실패 시 결제는 `awaiting_payment`로 보존하고 UI에서 재발송 가능하게 한다.
- 검증: 정상 201, 중복 활성 409, 잘못된 상품 400, 환경변수 누락 503.

### Task 3.4 — 입금 안내 재발송 API

- 새 파일: `apps/www/src/app/api/admin/callbacks/[id]/payment/resend/route.ts`
- 기존 결제 snapshot과 기존 기한을 사용하며 기한을 자동 연장하지 않는다.
- 연장이 필요하면 별도 명시 action으로 새 dueAt을 저장한 뒤 발송한다.
- 검증: 금액/기한 불변, provider 결과 기록, 중복 클릭 처리.

### Task 3.5 — 입금 확인 API

- 새 파일: `apps/www/src/app/api/admin/callbacks/[id]/payment/confirm/route.ts`
- `POST`는 `awaiting_payment`에서만 허용한다.
- 서버가 총액을 다시 확인하고 `paidAt`을 기록한다.
- 입금 확인 이메일 발송 후 `payment_confirmed` 이벤트 기록.
- 입금 이메일 실패는 `paid` 상태를 되돌리지 않고 재발송 상태만 실패로 기록한다.
- 검증: 미입금 상태 외 요청 409, 두 번 확인 idempotent, 결제액 조작 불가.

### Task 3.6 — 증빙 상태 API

- 새 파일: `apps/www/src/app/api/admin/callbacks/[id]/payment/evidence/route.ts`
- `PATCH` 입력: `evidenceType`, `evidenceStatus`, 선택적 `issuedAt`.
- 허용 유형: `none`, `cash_receipt`, `tax_invoice`.
- 사업자등록증 파일/사업자번호/환불계좌는 받지 않는다.
- 검증: 입금 완료 전 발행 완료 처리 경고 또는 차단, 상태 조합 검증.

### Task 3.7 — 평가·컨설팅 진행 API

- 새 파일: `apps/www/src/app/api/admin/callbacks/[id]/payment/service/route.ts`
- `PATCH` action:
  - 평가 링크 발급, 본부 등록, 평가 시작/완료
  - 3시간 컨설팅 일정 설정/변경, 시작/완료
- 링크 발급 action은 URL을 받거나 저장하지 않는다.
- 컨설팅 종료는 시작 + 3시간으로 서버 계산한다.
- 각 주요 단계에 서버 분석 이벤트를 1회만 기록한다.
- 검증: 미결제 상태에서 링크 발급 차단, 단계 건너뛰기 차단, 중복 이벤트 방지.

### Task 3.8 — 환불 API

- 새 파일: `apps/www/src/app/api/admin/callbacks/[id]/payment/refund/route.ts`
- action:
  - `calculate`: 저장 없이 추천액 반환
  - `request`: 계산 근거·조정액·사유를 저장하고 `refund_pending`
  - `complete`: 실제 수동 이체 후 완료 시각 저장, `refunded`, active 해제
- 환불 접수/완료 이메일과 `payment_refunded` 이벤트 처리.
- 환불 계좌는 요청 body·DB·로그 어디에도 저장하지 않는다.
- 검증: 결제 전 환불 차단, 최대액 초과 차단, 완료 전 재완료 idempotent.

---

## Phase 4. 이메일

### Task 4.1 — 결제 이메일 모듈

- 새 파일: `apps/www/src/features/callback-payment/server/emails.ts`
- 기존 `apps/www/src/features/assessment-callback/server/emails.ts`의 Resend 설정·HTML escape·Reply-To 방식을 재사용한다.
- 템플릿:
  - 입금 안내
  - 입금 확인
  - 환불 접수
  - 환불 완료
- 공통 표시:
  - 상품명, 공급가, VAT, 결제액
  - 회사명과 회신 주소
  - `/terms`, `/refund-policy` 절대 링크
- 입금 안내 추가:
  - 은행/계좌/예금주, 정확한 72시간 마감
  - 현금영수증/세금계산서 회신 방법
- 검증: 고객값 escape, 원화 포맷, 한국시간 기한, 환경변수 누락 시 안전한 오류.

### Task 4.2 — 이메일 재발송 상태

- 관리자 상세에서 각 이메일 status, sentAt, error code만 표시한다.
- 원문 이메일/계좌정보/개인정보는 로그에 남기지 않는다.
- provider message ID는 운영 추적용으로만 저장한다.
- 검증: Resend 실패 시 사용자 화면에 재시도 가능한 한국어 메시지.

---

## Phase 5. 1인용 관리자 CRM UI

### Task 5.1 — 결제 편집 컴포넌트

- 새 파일: `apps/www/src/features/callback-payment/components/AdminPaymentEditor.tsx`
- 수정: `apps/www/src/app/admin/callbacks/[id]/page.tsx`
- 섹션:
  1. 상품 선택과 가격표
  2. 입금 안내/재발송/기한
  3. 입금 확인과 증빙
  4. 평가·컨설팅 진행
  5. 환불 계산·확정·완료
  6. 과거 결제 version 이력
- 위험 action은 확인 단계를 둔다.
- 버튼은 현재 상태에서 가능한 action만 활성화한다.
- 검증: 모바일/데스크톱, 로딩/성공/실패, 새로고침 후 서버 상태 일치.

### Task 5.2 — 기한 초과 표시

- `awaiting_payment`이면서 `paymentDueAt < now`이면 빨간 배지와 경과 시간을 표시한다.
- 자동 취소/자동 이메일은 수행하지 않는다.
- 관리자 목록에도 `입금 대기`, `기한 초과`, `결제 완료`, `환불 중` 필터/배지를 추가한다.
- 수정:
  - `apps/www/src/app/admin/callbacks/page.tsx`
  - 필요 시 `apps/www/src/features/assessment-callback/server/admin.ts`
- 검증: 경계 시각 직전/정확히 기한/기한 후.

### Task 5.3 — 컨설팅 일정·환불 UX

- 20분 콜백 일정과 유료 3시간 컨설팅 일정을 명확히 다른 제목과 색으로 표시한다.
- 변경 시 기존 일정, 새 일정, 변경 횟수, 48시간/60일 기준을 함께 보여준다.
- 환불 계산 결과에 기준액·각 차감·최종액을 표로 표시하고 운영자 조정 사유를 받는다.
- 검증: 두 일정을 혼동할 수 있는 라벨이 없는지 콘텐츠 리뷰.

---

## Phase 6. 공개 정책과 개인정보 문서

### Task 6.1 — 결제 및 환불정책 확정본 반영

- 수정: `apps/www/src/app/refund-policy/page.tsx`
- 제거:
  - PG/신용카드
  - 대괄호 placeholder
  - 임시 100%/50% 표
- 반영:
  - 두 통합 상품과 VAT 포함 가격
  - 무통장입금, 72시간 기한
  - 14일/본부 등록 기준
  - 48시간 취소·노쇼·일정 변경 기준
  - 제공자 미제공 30분 단위와 3영업일 환불
- 법률 확정 표현을 피하고 실제 운영 절차와 고객 고지에 일치시킨다.
- 검증: 설계 금액과 문구 대조표 작성.

### Task 6.2 — 이용약관 정합성

- 수정: `apps/www/src/app/terms/page.tsx`
- 통합 패키지, 제3자 본부 평가 등록, 무통장입금 계약 성립 시점, 컨설팅 제공 범위를 명확히 한다.
- 평가 링크/보고서 지식재산과 등록 후 환불 제한은 환불정책으로 연결한다.
- 검증: 환불정책과 서로 다른 기한·수단·상품이 없는지 검색.

### Task 6.3 — 개인정보처리방침 최소 수정

- 수정: `apps/www/src/app/privacy/page.tsx`
- 추가 처리 항목:
  - 결제 상태, 상품, 금액, 증빙 유형/상태, 서비스 진행 상태
- 명시적 비수집:
  - 사업자등록증 파일, 환불 계좌, 본부 평가 링크 원문
- Resend/DB 위탁·국외 처리 고지가 현재 실제 구성과 맞는지 함께 검토한다.
- 검증: DB 필드와 개인정보 고지 1:1 점검.

---

## Phase 7. 분석 대시보드

### Task 7.1 — 서버 결제 이벤트 기록

- 수정: `apps/www/src/features/analytics/server/events.ts`
- 서버 전용 함수에 `productCode`와 콜백의 UTM snapshot을 전달한다.
- 이벤트:
  - `payment_instruction_sent`
  - `payment_confirmed`
  - `assessment_link_issued`
  - `assessment_registered`
  - `assessment_completed`
  - `consultation_completed`
  - `payment_refunded`
- 동일 결제 version/단계의 이벤트 중복 방지를 위해 상태 변경 성공 시에만 기록한다.
- 검증: API 재시도에도 집계 1회.

### Task 7.2 — 관리자 전환 분석 확장

- 수정:
  - `apps/www/src/features/analytics/server/dashboard.ts`
  - `apps/www/src/app/admin/analytics/page.tsx`
- 추가 카드:
  - 입금 안내, 결제 완료, 본부 등록, 평가 완료, 컨설팅 완료, 환불
- 상품별·UTM별 집계와 전 단계 대비 전환율 표시.
- 금액 집계는 analytics event가 아니라 결제 테이블의 snapshot을 기준으로 한다.
- 개인정보는 표시하지 않는다.
- 검증: 날짜 필터 7/30/90일, 0 분모, 환불 후 순매출.

---

## Phase 8. 테스트와 운영 적용

### Task 8.1 — 정적 검증

- 실행:
  - `npm run lint --workspace=www`
  - `npx tsc --noEmit -p packages/db/tsconfig.json`
  - `npm run build --workspace=www`
- 검색:
  - 임시 가격, 카드결제, placeholder 환불 문구 0건
  - 비밀값/계좌/본부 링크 로그 출력 0건
- 검증: 기존 랜딩, PDF, 이메일 크론, Resend webhook, 콜백 일정 기능 회귀 없음.

### Task 8.2 — 로컬/Preview 통합 시나리오

- 시나리오 A: 청년 상품 → 안내 → 입금 → 현금영수증 → 링크발급 → 등록 → 평가완료 → 상담완료.
- 시나리오 B: 성인 상품 → 기한 초과 → 수동 재발송 → 입금 확인.
- 시나리오 C: 등록 전 14일 내 전액 환불.
- 시나리오 D: 등록 후 48시간 초과/이내/노쇼 환불.
- 시나리오 E: 첫 변경 무료, 두 번째 10%, 불가항력 면제.
- 시나리오 F: 제공자 사유 30분 단위 부분 환불.
- 시나리오 G: 동시 클릭, 이메일 실패, 잘못된 상태 전이, Origin 불일치.
- 각 시나리오에서 DB 상태, 이메일, 분석 이벤트, 관리자 UI를 함께 확인한다.

### Task 8.3 — 환경변수와 운영 DB 적용

- Vercel Production에 추가:
  - `PAYMENT_BANK_NAME`
  - `PAYMENT_BANK_ACCOUNT`
  - `PAYMENT_BANK_HOLDER`
- 계좌값은 문서·Git·스크린샷에 기록하지 않는다.
- Supabase SQL Editor에서 `0007` 마이그레이션 적용 후 테이블/인덱스/RLS 확인.
- 검증 SQL은 계좌나 고객 개인정보를 출력하지 않고 컬럼·제약·상태 건수만 조회한다.

### Task 8.4 — 배포 순서와 연기 시험

1. 마이그레이션 적용
2. Vercel 환경변수 저장
3. 새 커밋 배포(Build Cache 미사용)
4. 관리자 계정으로 청년 테스트 결제 1건 생성
5. 실제 수신 가능한 내부 이메일로 네 템플릿 확인
6. 테스트 건 환불 완료까지 진행
7. 분석 집계와 공개 정책 확인
8. 테스트 고객 데이터는 운영 보존 기준에 따라 정리

- 롤백:
  - UI/API 배포만 이전 커밋으로 되돌린다.
  - 신규 테이블은 즉시 삭제하지 않고 접근을 중단해 데이터 보존 후 별도 승인으로 정리한다.
- 최종 완료 기준: 확정 명세의 완료 기준 5개와 위 A~G 시나리오 모두 통과.

---

## 구현 커밋 단위

1. `Retire placeholder checkout and finalize payment policies`
2. `Add callback payment schema and domain rules`
3. `Add admin bank transfer payment workflow`
4. `Add payment and refund email automation`
5. `Add callback payment CRM controls`
6. `Add payment funnel analytics`
7. `Verify bank transfer payment funnel`

각 커밋은 독립적으로 lint/type/build가 가능해야 한다. DB 스키마 커밋과 이를 요구하는 UI 커밋 사이에는 운영 마이그레이션 적용 여부를 확인하는 배포 게이트를 둔다.

