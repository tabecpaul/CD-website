# 콜백 일정 확정 자동화 구현 계획

설계 기준: `docs/superpowers/specs/2026-08-09-callback-schedule-confirmation-design.md`

## 구현 순서

1. 기존 기준과 Next.js 16 규칙 확인
2. 일정·작업·토큰 데이터 모델과 마이그레이션
3. 한국시간·토큰·캘린더 도메인 모듈
4. 일정 확정 서버 서비스와 관리자 API
5. 확정 이메일·캘린더 링크·재발송
6. 고객 일정 변경 요청
7. 24시간 전 알림 크론
8. 관리자 CRM UI
9. 분석·개인정보·운영 문서
10. 전체 검증·배포·운영 DB와 크론 적용

각 단계는 기존 콜백 퍼널을 계속 사용할 수 있는 작은 변경으로 구성한다. DB 저장이 필요한 기능은 마이그레이션 적용 전 운영 UI에 노출하지 않는다.

---

## Phase 0. 변경 전 기준 확인

### Task 0.1 — 저장소와 작업 기준 고정

- 확인:
  - `git status --short`
  - `git remote -v`
  - 배포 대상이 `tabecpaul/CDKorea`의 `main`인지 확인
- 사용자 소유 미추적 파일과 `output/`, `tmp/`는 변경하거나 커밋하지 않는다.
- 검증: 기준 커밋과 수정 대상 파일 목록 기록.

### Task 0.2 — Next.js 16 규칙 재확인

- 읽기:
  - `apps/www/AGENTS.md`
  - `node_modules/next/dist/docs/01-app/01-getting-started/15-route-handlers.md`
  - `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/route.md`
  - 동적 페이지와 Route Handler의 Promise 기반 `params` 규칙
- 원칙:
  - Route Handler는 Web `Request`/`Response`를 사용한다.
  - 동적 `params`는 반드시 `await`한다.
  - 관리자 변경 요청은 캐시하지 않는다.
- 검증: 계획된 모든 라우트가 `page.tsx`와 같은 segment에 충돌하지 않는지 확인.

### Task 0.3 — 현재 콜백·이메일·크론 구조 확인

- 읽기:
  - `packages/db/src/schema.ts`
  - `apps/www/src/features/assessment-callback/server/admin.ts`
  - `apps/www/src/features/assessment-callback/server/emails.ts`
  - `apps/www/src/app/api/admin/callbacks/[id]/route.ts`
  - `apps/www/src/app/api/cron/lead-emails/route.ts`
- 재사용:
  - 관리자 `hasAdminSession()`
  - Origin 검증 패턴
  - Resend 발신자·답장 설정
  - `CRON_SECRET`
- 검증: 신규 필수 환경변수가 없음을 확인. 현재 설계는 기존 환경변수만 사용한다.

---

## Phase 1. 데이터베이스

### Task 1.1 — 일정 필드 추가

- 수정: `packages/db/src/schema.ts`
- `assessmentCallbackRequests`에 추가:
  - `scheduleStatus`, 기본 `unconfirmed`
  - `confirmedStartAt`, `confirmedEndAt`
  - `scheduleVersion`, 기본 0
  - 확정 이메일 상태·ID·오류·발송 시각
  - 24시간 알림 발송 시각
  - 변경 요청 시각·희망 날짜·시간대·메시지
- 인덱스:
  - `(schedule_status, confirmed_start_at)`
- 검증:
  - 기존 신청 행이 `unconfirmed`, 버전 0으로 안전하게 채워지는지 확인
  - 기존 CRM `status` 컬럼을 변경하지 않았는지 확인

### Task 1.2 — 일정 이메일 작업 테이블

- 수정: `packages/db/src/schema.ts`
- 추가: `callbackScheduleEmailJobs`
- 필드:
  - `id`, `callbackRequestId`, `scheduleVersion`, `kind`
  - `scheduledAt`, `status`, `attempts`, `lastErrorCode`
  - `providerMessageId`, `sentAt`, `createdAt`, `updatedAt`
- 제약:
  - 요청 ID FK `onDelete: cascade`
  - `(callback_request_id, schedule_version, kind)` unique
  - `(status, scheduled_at)` index
- 검증: 같은 일정 버전의 `reminder_24h` 중복 insert가 거부되는지 SQL 검토.

### Task 1.3 — 일정 링크 토큰 테이블

- 수정: `packages/db/src/schema.ts`
- 추가: `callbackScheduleTokens`
- 필드:
  - `id`, `callbackRequestId`, `scheduleVersion`
  - `tokenHash` 64자, `expiresAt`, `revokedAt`, `createdAt`
- 제약:
  - 토큰 해시 unique
  - `(callback_request_id, schedule_version)` index
  - 요청 ID FK `onDelete: cascade`
- 원칙: 토큰 원문은 반환 직후 이메일 링크 생성에만 사용하고 DB·로그에 남기지 않는다.
- 검증: 해시 길이와 unique/index 확인.

### Task 1.4 — Drizzle 마이그레이션 생성·보강

- 실행: `npm run db:generate --workspace=@newland/db`
- 예상: `packages/db/drizzle/0006_*.sql` 및 meta 갱신
- 생성 SQL에 세 테이블의 RLS 활성화를 추가한다.
- 공개 정책은 만들지 않는다.
- 검증:
  - 기존 테이블/컬럼 삭제 없음
  - 새 컬럼·테이블·FK·unique·index만 존재
  - 마이그레이션 재실행 전 기존 journal 순서 유지
  - `npx tsc --noEmit -p packages/db/tsconfig.json`

---

## Phase 2. 일정 도메인 모듈

### Task 2.1 — 일정 상태와 입력 타입

- 수정: `apps/www/src/features/assessment-callback/domain.ts`
- 추가:
  - `scheduleStatuses`, `ScheduleStatus`
  - 한국어 라벨
  - `CALLBACK_DURATION_MINUTES = 20`
  - `CALLBACK_TIME_ZONE = "Asia/Seoul"`
- 기존 `callbackStatuses`와 별도 타입으로 유지한다.
- 검증: 상태값 중복 없음, 라벨 누락 없음, 타입검사.

### Task 2.2 — 한국시간 파싱과 표시

- 새 파일: `apps/www/src/features/assessment-callback/server/scheduleTime.ts`
- 함수 책임:
  - `YYYY-MM-DD`와 `HH:mm` 허용 형식 검증
  - 한국시간 입력을 UTC `Date`로 변환
  - 종료 시각을 20분 후로 계산
  - 한국어 이메일·관리자 화면용 날짜 포맷
  - `datetime-local` 기본값 생성
  - 두 일정의 겹침 판단
- 시스템 로컬 시간대에 의존하지 않고 `Asia/Seoul`의 UTC+09:00을 명시한다.
- 검증 벡터:
  - 자정 경계
  - 월말·연말
  - 잘못된 날짜와 시각
  - 과거 시각
  - 정확히 맞닿고 겹치지 않는 20분 일정

### Task 2.3 — 토큰 발급과 검증

- 새 파일: `apps/www/src/features/assessment-callback/server/scheduleTokens.ts`
- 구현 책임:
  - `randomBytes(32)` 이상 무작위 토큰
  - SHA-256 해시 저장
  - 현재 버전 토큰 조회·만료·폐기 확인
  - 새 이메일 발송용 토큰 발급
  - 재확정·완료·취소 시 관련 토큰 폐기
- 만료: 콜백 종료 후 24시간.
- 검증: 정상·변조·만료·폐기·구버전 토큰.

### Task 2.4 — 캘린더 생성기

- 새 파일: `apps/www/src/features/assessment-callback/server/calendar.ts`
- 함수:
  - Google Calendar 표준 URL 생성
  - RFC 5545 `.ics` 문자열 생성
  - ICS text escape와 CRLF 적용
- 포함 정보:
  - `Career Direct Korea 20분 콜백`
  - 시작·종료 한국시간
  - 간단한 전화 콜백 설명
- 제외: 전화번호 전체, 이메일, 운영 메모, 상담 주제, 인구통계.
- 검증:
  - `BEGIN:VCALENDAR`/`END:VCALENDAR`
  - UID, DTSTAMP, DTSTART, DTEND
  - 20분 차이와 `.ics` MIME/파일명

---

## Phase 3. 일정 확정 서버 서비스

### Task 3.1 — 관리자 일정 입력 검증

- 새 파일: `apps/www/src/features/assessment-callback/server/scheduleValidation.ts`
- 입력:
  - `date`, `startTime`, `conflictConfirmed`
- 검증:
  - 허용 키만 처리
  - 미래 일시
  - 날짜·시각 길이와 형식
  - boolean override
- 안전한 오류 코드:
  - `SCHEDULE_INPUT_INVALID`
  - `SCHEDULE_IN_PAST`
  - `SCHEDULE_CONFLICT`
- 검증: 정상, 과거, 잘못된 날짜, 잘못된 override.

### Task 3.2 — 충돌 조회

- 새 파일 또는 확장: `apps/www/src/features/assessment-callback/server/scheduleAdmin.ts`
- 현재 요청을 제외하고 다음 일정을 조회한다.
  - 상태 `confirmed` 또는 `reschedule_requested`
  - 기존 시작 < 새 종료, 기존 종료 > 새 시작
- 충돌 정보는 관리자에게 이름을 노출하지 않고 시각과 요청 번호만 반환한다.
- `conflictConfirmed`가 false이면 409, true이면 진행한다.
- 검증: 겹침·맞닿음·취소 일정·자기 자신 제외.

### Task 3.3 — 확정 트랜잭션

- 수정/추가: `apps/www/src/features/assessment-callback/server/scheduleAdmin.ts`
- 단일 DB 트랜잭션에서:
  1. 요청 존재와 현재 버전 조회
  2. 새 버전 계산
  3. 일시·상태·CRM 조건부 상태 저장
  4. 이전 pending 작업 `skipped`
  5. 이전 토큰 폐기
  6. 시작 24시간 이전일 때 reminder job upsert
- 트랜잭션 후 새 토큰을 발급하고 확정 이메일을 보낸다.
- 이메일 결과를 같은 일정 버전 조건으로 업데이트해 늦은 응답이 새 일정 상태를 덮지 않게 한다.
- 검증: 첫 확정, 재확정, 중복 요청, 이메일 실패, 버전 경쟁.

### Task 3.4 — 관리자 확정 API

- 새 파일: `apps/www/src/app/api/admin/callbacks/[id]/schedule/route.ts`
- `POST`:
  - 관리자 세션
  - `NEXT_PUBLIC_SITE_URL`과 Origin 일치
  - Promise `params` await
  - JSON 크기·형식 검증
  - 성공 200, 충돌 409, 잘못된 입력 400, 없음 404, 저장 불가 503
- 응답에 개인정보나 토큰을 포함하지 않는다.
- 검증: 인증 없음 401, Origin 불일치 403, 충돌 409, 정상 200.

### Task 3.5 — 완료·취소 API

- 새 파일: `apps/www/src/app/api/admin/callbacks/[id]/schedule/status/route.ts`
- `PATCH` 허용 action: `complete`, `cancel`, `keep_existing`.
- 완료/취소:
  - 일정 상태 갱신
  - pending 알림 skip
  - 활성 토큰 폐기
- `keep_existing`:
  - 변경 요청 데이터 정리
  - 일정 상태를 `confirmed`로 복귀
  - 현재 일정과 알림은 유지
- CRM 상태는 완료 시 현재가 `scheduled`일 때만 `callback_completed`로 전진시킨다. 취소는 자동으로 영업 상태를 되돌리지 않는다.
- 검증: 허용 action 외 400, 구버전 상태 경쟁 방지.

---

## Phase 4. 확정 이메일과 캘린더 엔드포인트

### Task 4.1 — 일정 이메일 템플릿

- 수정: `apps/www/src/features/assessment-callback/server/emails.ts`
- 공통 Resend `send`와 HTML shell을 재사용한다.
- 추가 함수:
  - 확정/재확정 이메일
  - 24시간 전 알림 이메일
  - 관리자 변경 요청 알림
- 확정 이메일 입력:
  - 이름, 마스킹 전화, 정확한 일정
  - Google Calendar URL
  - `.ics` URL
  - 변경 요청 URL
- 모든 고객값 HTML escape.
- 이메일 태그에 callback request ID 원문 대신 일정 작업 추적에 필요한 제한된 provider metadata만 사용한다.
- 검증: 필수 문구, 링크, 마스킹, escape, 비결제 안내 유지.

### Task 4.2 — 캘린더 다운로드 API

- 새 파일: `apps/www/src/app/api/callback-schedule/calendar/[token]/route.ts`
- `GET`:
  - 토큰 해시·만료·폐기·버전 확인
  - 현재 확정 일시 조회
  - `text/calendar; charset=utf-8`
  - 안전한 attachment 파일명과 `Cache-Control: private, no-store`
- 실패는 존재 여부를 구분하지 않는 404형 응답.
- 검증: 정상 파일, 구버전·취소·만료 토큰 거부.

### Task 4.3 — 확정 이메일 재발송 API

- 새 파일: `apps/www/src/app/api/admin/callbacks/[id]/schedule/resend/route.ts`
- 현재 일정 버전에 새 토큰을 발급해 이메일을 다시 보낸다.
- 같은 버전의 기존 정상 토큰은 폐기하지 않는다.
- 현재 일정 미확정·완료·취소는 409.
- 발송 결과를 확정 이메일 상태에 기록한다.
- 검증: 관리자 인증, Origin, 현재 버전 조건, 실패 상태.

---

## Phase 5. 고객 일정 변경 요청

### Task 5.1 — 변경 요청 페이지

- 새 파일:
  - `apps/www/src/app/callback-schedule/change/[token]/page.tsx`
  - `apps/www/src/features/assessment-callback/components/RescheduleRequestForm.tsx`
- 페이지:
  - noindex metadata
  - 현재 확정 일시 표시
  - 새 희망 날짜·기존 `timeSlots` 선택
  - 선택 메시지 최대 500자
  - “요청만으로 일정이 변경되지 않음” 안내
- 토큰 원문을 화면이나 로그에 출력하지 않는다.
- 검증: 모바일·키보드·라벨·오류 focus·완료 화면.

### Task 5.2 — 공개 변경 요청 API

- 새 파일: `apps/www/src/app/api/callback-schedule/change/[token]/route.ts`
- `POST` 처리:
  1. 사이트 Origin과 JSON 크기 확인
  2. 토큰 검증
  3. 날짜·시간대·메시지 검증
  4. 일정 버전 조건부로 요청 저장
  5. 상태 `reschedule_requested`
  6. 관리자 알림 발송
  7. 서버 분석 이벤트 기록
- 동일 내용 반복 제출은 성공 형태를 유지하되 관리자 이메일을 중복 발송하지 않는다.
- 검증: 정상, 만료, 변조, 구버전, 중복, 잘못된 입력.

---

## Phase 6. 24시간 전 알림 크론

### Task 6.1 — 작업 처리기

- 새 파일: `apps/www/src/features/assessment-callback/server/scheduleAutomation.ts`
- 최대 40건 처리:
  - due pending 작업 조회
  - 원자적으로 processing 확보
  - 요청 상태·버전·미래 일시 재확인
  - 현재 버전 새 토큰 발급
  - 알림 이메일 발송
  - sent/failed/skipped와 시각 기록
- 재시도:
  - 최대 5회
  - 실패 시 다음 크론에서 재시도 가능하도록 pending 복귀 또는 시도 한도 후 failed
- provider message ID 저장.
- 검증: 동시 실행, 중복 발송, 취소·구버전·지난 일정 skip, 5회 실패.

### Task 6.2 — 크론 Route Handler

- 새 파일: `apps/www/src/app/api/cron/callback-reminders/route.ts`
- 기존과 같은 `Authorization: Bearer ${CRON_SECRET}` 검증.
- 성공 응답: `sent`, `skipped`, `failed` 집계만 반환.
- 개인정보와 토큰은 로그·응답에서 제외.
- 검증: 인증 실패 401, 빈 작업 200, 처리 요약 200.

### Task 6.3 — Supabase 운영 SQL

- 새 파일: `packages/db/operations/schedule-callback-reminder-cron.sql`
- 기존 Vault secret:
  - `career_direct_site_url`
  - `career_direct_cron_secret`
- `cron.schedule`로 5분 간격 호출.
- 기존 리드 이메일 job과 이름·job ID가 충돌하지 않게 별도 job name 사용.
- 검증 SQL 포함:
  - cron job 조회
  - 최근 `net._http_response` 200 확인
- 운영 적용은 Vercel 배포와 DB 마이그레이션 완료 후 사용자가 Supabase SQL Editor에서 실행한다.

---

## Phase 7. 관리자 CRM UI

### Task 7.1 — 상세 조회 확장

- 수정:
  - `apps/www/src/features/assessment-callback/server/admin.ts`
  - `apps/www/src/app/admin/callbacks/[id]/page.tsx`
- 표시:
  - 일정 상태
  - 확정 시작·종료 한국시간
  - 일정 버전
  - 확정 이메일·24시간 알림 상태
  - 변경 요청 내용
- 공개 고객 정보와 운영 일정 정보를 시각적으로 구분한다.
- 검증: 미확정·확정·변경 요청·완료 상태 렌더링.

### Task 7.2 — 일정 관리 컴포넌트

- 새 파일: `apps/www/src/features/assessment-callback/components/AdminCallbackScheduleEditor.tsx`
- 동작:
  - 날짜·시작 시각 입력
  - 자동 종료 시각 표시
  - 확정/재확정
  - 충돌 409 시 세부 경고 후 명시적 override
  - 확정 이메일 재발송
  - 기존 일정 유지, 완료, 취소
- 제출 중 중복 클릭 방지와 `aria-live` 상태 메시지.
- 기존 `AdminCallbackEditor`는 CRM 상태·메모 책임만 유지한다.
- 검증: 각 API 오류 코드별 한국어 메시지와 `router.refresh()`.

### Task 7.3 — 목록 일정 신호

- 수정: `apps/www/src/app/admin/callbacks/page.tsx`
- 최소 추가:
  - 정확한 확정 일시 또는 `미확정`
  - `변경 요청` 강조 badge
- 정렬·검색 같은 신규 CRM 기능은 추가하지 않는다.
- 검증: 모바일 표/카드에서 기존 개인정보 가독성 유지.

---

## Phase 8. 분석과 문서

### Task 8.1 — 서버 전용 분석 이벤트

- 수정: `apps/www/src/features/analytics/server/events.ts`
- 추가:
  - `callback_schedule_confirmed`
  - `callback_reschedule_requested`
  - `callback_schedule_reconfirmed`
  - `callback_reminder_sent`
- 공개 `/api/analytics/events`의 허용목록에서는 네 이벤트를 제외한다. 공개 허용 이벤트 배열과 서버 기록 가능 이벤트 배열을 명시적으로 분리한다.
- 성공한 서버 처리 이후 `recordAnalyticsEventSafely()`로 기록한다.
- 검증: 공개 API 위조 400, 서버 내부 기록 성공.

### Task 8.2 — 개인정보·운영 문서 갱신

- 수정:
  - `docs/decisions/assessment-callback-consent.md`
  - `apps/www/src/app/privacy/page.tsx`
- 일정 확정, 변경 요청, 이메일 알림 목적이 기존 상담 이행 목적 안에 포함되는지 명시한다.
- 새 마케팅 동의를 요구하지 않는다. 일정 이메일은 서비스 메시지다.
- 검증: 보유기간과 수집 항목이 기존 3년 정책에 모순되지 않음.

### Task 8.3 — 운영 안내

- 새 파일: `docs/operations/callback-schedule-automation.md`
- 포함:
  - 마이그레이션 적용 순서
  - 크론 설치·중지·상태 확인 SQL
  - 확정 이메일 실패 재발송
  - 변경 요청 처리
  - 알림 failed 작업 확인 SQL
  - 토큰이나 개인정보를 SQL 결과로 출력하지 않는 조회 예시

---

## Phase 9. 검증과 배포

### Task 9.1 — 정적 검증

- 실행:
  - `npx tsc --noEmit -p packages/db/tsconfig.json`
  - `npx tsc --noEmit -p apps/www/tsconfig.json`
  - `npm run lint --workspace=www`
  - `npm run build --workspace=www`
  - `git diff --check`
- Turbopack가 로컬 권한 제한으로 실패하면 오류가 코드가 아닌 포트 바인딩 제한인지 분리 기록하고 Vercel 빌드로 최종 확인한다.

### Task 9.2 — 변경 범위 검토

- 확인:
  - 기존 자가진단 신청·PDF 다운로드·격일 이메일
  - Resend webhook
  - 관리자 로그인·메모 저장
  - 기존 콜백 접수·상태 변경·이메일 재발송
- 검증: 신규 일정 기능이 기존 이메일 job이나 `lead_magnet_email_jobs`를 변경하지 않음.

### Task 9.3 — 커밋과 배포

- 기능 커밋은 `CDKorea/main`에만 푸시한다.
- Vercel이 정확한 커밋을 Production으로 배포했는지 확인한다.
- DB 마이그레이션이 필요한 UI는 운영 DB 적용 전 사용하지 않는다.
- 환경변수 신규 추가 없음.

### Task 9.4 — 운영 DB·크론 적용

1. Supabase SQL Editor에서 `0006_*.sql` 실행
2. 새 컬럼·테이블·RLS 확인
3. Vercel을 캐시 없이 최신 커밋으로 배포
4. 크론 설치 SQL 실행
5. `net._http_response`에서 200 확인

### Task 9.5 — 종단 테스트

1. 테스트 콜백 신청 생성
2. 관리자에서 48시간 이후 일정 확정
3. 확정 이메일·Google Calendar·ICS 확인
4. 고객 변경 요청 제출
5. 관리자 변경 요청 강조와 알림 확인
6. 새 일정 재확정
7. 이전 일정 버전 작업이 skipped인지 확인
8. 테스트 reminder 작업을 due로 조정해 한 번만 발송되는지 확인
9. 완료·취소 처리 후 링크와 알림 무효화 확인
10. 관리자 메모 저장과 기존 이메일 재발송 회귀 확인

---

## 완료 조건

- 관리자가 정확한 20분 콜백 일정을 확정·재확정할 수 있다.
- 고객이 확정 이메일에서 Google Calendar와 `.ics`로 일정을 추가할 수 있다.
- 고객이 안전한 링크로 변경을 요청하고 관리자가 재확정할 수 있다.
- 24시간 전 알림이 한 번만 발송되며 구버전·취소 일정에는 발송되지 않는다.
- 이메일 실패가 저장된 일정을 삭제하지 않고 관리자 재발송이 가능하다.
- 관리자 인증, Origin, 토큰, RLS, 개인정보 최소화 기준이 유지된다.
- 기존 리드 자석·Resend webhook·CRM 기능에 회귀가 없다.
