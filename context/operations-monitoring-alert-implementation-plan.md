# 운영 장애 모니터링 및 알림 구현 계획

정본 명세: `context/operations-monitoring-alert-spec.md`  
상세 설계: `docs/superpowers/specs/2026-08-10-operations-monitoring-alert-design.md`

신규 DB 마이그레이션을 Supabase에 적용하기 전에는 기능 코드를 Production에 푸시하지 않는다.

## Phase 0. 기준 확인

### Task 0.1 — 저장소와 보안 패턴 확인

- 확인: `git status --short`, 최근 커밋, `apps/www/AGENTS.md`.
- 읽기:
  - 기존 `/api/cron/lead-emails`, `/api/cron/callback-reminders`
  - `schedule-*-cron.sql`
  - Resend 이메일 발송 helper
- 사용자 미추적 EPS, `.superpowers/`, `output/`, `tmp/`는 변경하지 않는다.
- 검증: 신규 Cron API도 같은 Bearer 인증과 안전한 로그 형식을 사용한다.

## Phase 1. DB 스키마

### Task 1.1 — 실행 기록 테이블

- 수정: `packages/db/src/schema.ts`.
- 추가: `systemJobRuns`.
- 필드와 인덱스는 설계 문서 그대로 구현한다.
- `summary`는 JSONB이며 건수와 시각만 저장한다.
- 검증: job name, status, error code 길이 제한과 기본 시각 확인.

### Task 1.2 — 알림 발송 기록 테이블

- 수정: `packages/db/src/schema.ts`.
- 추가: `operationsAlertDeliveries`.
- `(alert_date, fingerprint)` unique 인덱스를 추가한다.
- `sending`, `sent`, `failed` 상태만 서버 domain에서 허용한다.
- 검증: 같은 날짜·fingerprint 중복 insert 차단.

### Task 1.3 — 마이그레이션 생성

- 실행: `npm run db:generate --workspace=@newland/db`.
- 예상: `packages/db/drizzle/0009_*.sql`과 meta 갱신.
- SQL에 두 신규 테이블의 RLS 활성화를 추가한다.
- 공개 정책을 만들지 않는다.
- 검증:
  - 기존 테이블 삭제·rename 없음
  - unique/FK/인덱스 확인
  - DB 패키지 타입검사 통과

## Phase 2. 공통 실행 기록

### Task 2.1 — Job run helper

- 새 파일: `apps/www/src/features/operations-monitor/server/jobRuns.ts`.
- 함수:
  - `startJobRun(jobName)`
  - `completeJobRun(id, summary)`
  - `failJobRun(id, errorCode)`
  - `latestSuccessfulRuns(jobNames)`
- 허용 job name을 상수 union으로 제한한다.
- 오류 코드는 최대 80자로 정제한다.
- 검증: 시작→성공, 시작→실패, 다른 job 혼입 없음.

### Task 2.2 — 기존 Cron에 실행 기록 연결

- 수정:
  - `apps/www/src/app/api/cron/lead-emails/route.ts`
  - `apps/www/src/app/api/cron/callback-reminders/route.ts`
- 인증 성공 후 job row를 시작한다.
- 정상 반환 전에 성공 요약을 기록한다.
- catch에서 실패를 기록하고 기존 안전한 오류 응답을 유지한다.
- 검증: 인증 실패는 job row를 만들지 않음, 성공·실패 시각 기록.

## Phase 3. 이상 집계

### Task 3.1 — 모니터링 domain

- 새 파일: `apps/www/src/features/operations-monitor/domain.ts`.
- 정의:
  - issue key와 한국어 label
  - 위험도
  - Cron 허용 지연 시간
  - `OperationsSnapshot` 타입
- fingerprint 입력은 issue key와 count를 key 순으로 정렬한 값만 사용한다.
- 검증: 순서가 달라도 같은 snapshot이면 같은 fingerprint.

### Task 3.2 — DB 집계 service

- 새 파일: `apps/www/src/features/operations-monitor/server/snapshot.ts`.
- 단일 함수 `collectOperationsSnapshot(now)`를 구현한다.
- 실제 고객만 포함하는 SQL 조건을 모든 콜백·결제 쿼리에 적용한다.
- pending job은 30분 지연 기준을 적용한다.
- 최근 Cron 성공 시각과 준비 유예를 판정한다.
- 결과에는 고객 행이나 PII를 반환하지 않고 항목별 count와 last success만 반환한다.
- 검증: 0건, test 제외, 경계 시각, null payment, job 기록 없음.

## Phase 4. 중복 방지와 이메일

### Task 4.1 — Fingerprint와 발송 선점

- 새 파일: `apps/www/src/features/operations-monitor/server/delivery.ts`.
- SHA-256 fingerprint를 생성한다.
- 한국 날짜를 `Asia/Seoul` 기준으로 만든다.
- unique insert 또는 조건부 update로 발송 권한을 선점한다.
- `sent`와 최근 15분 `sending`은 skip한다.
- `failed`와 stale `sending`은 재선점한다.
- 검증: 동시 요청, 실패 재시도, stale 복구, 다음 날짜 발송.

### Task 4.2 — 요약 이메일

- 새 파일: `apps/www/src/features/operations-monitor/server/email.ts`.
- 기존 Resend 발송 설정을 재사용한다.
- 항목별 건수, 관리자 필터 링크, 마지막 Cron 성공 시각만 포함한다.
- 고객 이름·이메일·전화번호·메모를 입력 타입 자체에서 받지 않는다.
- 검증: HTML escaping, 링크 origin, 제목 총건수, PII 문자열 없음.

## Phase 5. 모니터링 API

### Task 5.1 — Cron Route Handler

- 새 파일: `apps/www/src/app/api/cron/operations-monitor/route.ts`.
- 흐름:
  1. `CRON_SECRET` 설정·Bearer 인증 확인
  2. job run 시작
  3. snapshot 수집
  4. 0건이면 성공 기록 후 종료
  5. fingerprint 선점
  6. 이메일 발송
  7. delivery와 job run 결과 기록
- 응답은 `{ ok, issueCount, notified, duplicate }`처럼 건수와 상태만 반환한다.
- 검증: 401, 503, 0건, 발송, 중복, 이메일 실패.

## Phase 6. 관리자 운영 상태

### Task 6.1 — 상태 조회 model

- 새 파일: `apps/www/src/features/operations-monitor/server/admin.ts`.
- 마지막 operations-monitor 성공·실패와 현재 snapshot을 조회한다.
- 상세 고객정보 없이 view model을 반환한다.
- 검증: 실행 기록 없음, 실패, 정상, 현재 이상 0건.

### Task 6.2 — 관리자 UI

- 새 파일: `apps/www/src/features/operations-monitor/components/OperationsStatusPanel.tsx`.
- 수정: `apps/www/src/app/admin/callbacks/page.tsx`.
- 마지막 성공 시각, 이상 총건수, 필터 링크, stale/failed 경고를 표시한다.
- 기존 영업·운영 필터와 query parameter를 보존한다.
- 검증: 모바일, 0건, 복수 경고, 한국시간 표시.

## Phase 7. 운영 SQL

### Task 7.1 — 매일 09:00 Cron 등록 SQL

- 새 파일: `packages/db/operations/schedule-operations-monitor-cron.sql`.
- 기존 같은 이름 job을 안전하게 unschedule한 뒤 `0 0 * * *` UTC로 등록한다.
- Vault의 `career_direct_site_url`, `career_direct_cron_secret`을 사용한다.
- 결과 확인 select를 포함한다.
- 검증: URL null 아님, Authorization null 아님, job active.

## Phase 8. 검증과 배포

### Task 8.1 — 정적 검증

- 실행:
  - `npx tsc --noEmit -p packages/db/tsconfig.json`
  - `npx tsc --noEmit -p apps/www/tsconfig.json`
  - `npm run lint --workspace=www`
  - `npm exec --workspace=www -- next build --webpack`
  - `git diff --check`
- 민감정보와 환경변수 출력 여부를 검색한다.

### Task 8.2 — 수동 DB 적용

- `0009_*.sql`을 Supabase SQL Editor에서 사용자가 실행한다.
- 신규 테이블, RLS, 인덱스 확인 전에는 push하지 않는다.

### Task 8.3 — 배포와 기능 확인

- 구현 커밋을 `cdkorea/main`에 push한다.
- Vercel 배포 후 인증 없는 endpoint 401을 확인한다.
- 인증된 수동 실행으로 0건 또는 문제 요약 결과를 확인한다.
- 관리자 상태 패널과 이메일 링크를 확인한다.

### Task 8.4 — pg_cron 등록

- `schedule-operations-monitor-cron.sql`을 Supabase에서 실행한다.
- 다음 오전 9시 실행 또는 수동 `net.http_get` 결과가 200인지 확인한다.
- 실제 문제가 없으면 이메일이 오지 않는 것이 정상이다.
