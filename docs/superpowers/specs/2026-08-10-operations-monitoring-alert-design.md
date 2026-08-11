# 운영 장애 모니터링 및 알림 설계

## 목적

Career Direct Korea의 1인 운영자가 관리자 화면을 계속 확인하지 않아도 결제·이메일·환불·Cron 이상을 업무 시작 전에 발견하도록 한다. 매일 오전 9시(한국시간)에 점검하되 문제가 있을 때만 관리자 이메일을 한 번 발송한다.

## 범위

### 포함

- 실제 고객 운영 예외 집계
- 매일 오전 9시 KST 점검
- 문제 발생 시 Resend 관리자 요약 이메일
- 동일 날짜 중복 발송 방지
- 주요 Cron 실행 상태 기록
- 관리자 화면의 마지막 점검 시각과 이상 건수
- 실행 결과와 안전한 오류 코드 보존

### 제외

- 테스트 데이터 알림
- 상태 자동 수정·자동 취소·자동 환불
- SMS·카카오 알림
- 외부 uptime 서비스
- DB나 전체 플랫폼이 중단된 경우의 독립 외부 경보

## 아키텍처

Supabase `pg_cron`이 매일 `00:00 UTC`(한국시간 09:00)에 `GET /api/cron/operations-monitor`를 호출한다. 요청은 기존 `CRON_SECRET` Bearer 인증을 사용한다.

API는 예외 집계, 당일 발송 여부 확인, 이메일 발송, 실행 결과 기록을 수행한다. 이메일은 기존 Resend 발송 모듈과 관리자 수신 주소를 사용한다. 관리자 링크는 `NEXT_PUBLIC_SITE_URL`을 기준으로 생성한다.

## 데이터 모델

### `system_job_runs`

주요 서버 작업의 실행 상태를 저장한다.

- `id`
- `job_name` 최대 64자
- `started_at`
- `completed_at` nullable
- `status`: `running | succeeded | failed`
- `summary` JSONB nullable — 고객 식별정보 없이 건수만 저장
- `error_code` 최대 80자 nullable
- `created_at`

인덱스:

- `(job_name, started_at)`
- `(status, started_at)`

RLS를 활성화하며 공개 정책은 만들지 않는다.

기록 대상 작업:

- `lead-emails`
- `callback-reminders`
- `operations-monitor`

### `operations_alert_deliveries`

중복 알림 방지를 위한 발송 기록이다.

- `id`
- `alert_date` — 한국 날짜
- `fingerprint` 최대 64자
- `status`: `sending | sent | failed`
- `issue_count`
- `provider_message_id` nullable
- `error_code` nullable
- `sent_at` nullable
- `created_at`, `updated_at`

`(alert_date, fingerprint)` unique 인덱스로 같은 날짜의 같은 요약을 한 번만 발송한다. RLS를 활성화하고 공개 정책은 만들지 않는다.

## 이상 판정 기준

모든 고객·결제 항목은 `assessment_callback_requests.is_test = false`인 데이터만 포함한다.

- 입금기한 초과: active 결제가 `awaiting_payment`이고 `payment_due_at < now()`
- 결제 이메일 실패: 입금 안내·입금 확인·환불 접수·환불 완료 이메일 상태가 `failed`
- 콜백 이메일 실패: 관리자·고객·일정 확정 이메일 상태가 `failed`
- 증빙 처리 대기: active 결제의 `evidence_status = requested`
- 환불 처리 대기: active 결제의 `payment_status = refund_pending`
- 리드 이메일 지연: `pending` 작업의 `scheduled_at`이 현재보다 30분 이상 과거
- 콜백 알림 지연: `pending` 작업의 `scheduled_at`이 현재보다 30분 이상 과거
- Cron 이상: 기록 대상 작업이 예상 주기의 2배 이상 성공 기록이 없음

Cron 기준:

- `lead-emails`: 10분 주기이므로 20분 이상 성공 없음
- `callback-reminders`: 10분 주기이므로 20분 이상 성공 없음
- `operations-monitor`: 직전 36시간 이내 성공 없음. 현재 실행 자체는 판정에서 제외한다.

신규 배포 직후 실행 기록이 전혀 없는 작업은 `기록 없음`으로 표시하되 첫 30분의 준비 유예를 둔다.

## 점검·발송 흐름

1. `operations-monitor` 실행 row를 `running`으로 생성한다.
2. 예외 항목별 건수를 집계한다.
3. 총 문제가 0건이면 실행 row를 `succeeded`로 완료하고 이메일을 보내지 않는다.
4. 문제가 있으면 날짜와 정렬된 항목·건수로 SHA-256 fingerprint를 만든다.
5. `(alert_date, fingerprint)` 발송 row를 선점한다. 이미 `sent`이거나 최근 15분 이내 `sending`이면 중복 발송 없이 종료한다. `failed` 또는 15분 넘게 멈춘 `sending`은 조건부 update로 다시 `sending` 상태를 선점해 재시도한다.
6. Resend로 관리자 이메일을 보낸다.
7. 발송 결과와 provider message ID 또는 안전한 오류 코드를 저장한다.
8. 모니터링 실행 row를 `succeeded` 또는 `failed`로 완료한다.

동시에 두 요청이 실행돼도 unique 제약과 조건부 상태 변경으로 한 통만 발송한다. 같은 날 문제가 달라져 fingerprint가 바뀌면 다음 정기 또는 수동 실행에서 새 요약을 한 번 발송할 수 있다.

## 이메일 내용

제목 예시: `[Career Direct Korea] 운영 확인이 필요한 항목 6건`

본문에는 다음만 포함한다.

- 점검 시각
- 항목별 건수
- 위험도 표시
- 관리자 콜백 목록의 해당 필터 링크
- 마지막 주요 Cron 성공 시각

이름, 이메일, 전화번호, 계좌정보, 메모 내용은 포함하지 않는다.

## 관리자 화면

콜백 관리 화면 상단에 작은 운영 상태 영역을 표시한다.

- 마지막 점검 성공 시각
- 현재 이상 총건수
- 항목별 필터 바로가기
- 모니터링 실패 또는 36시간 이상 미실행 경고

수동 상태 변경이나 자동 조치 버튼은 이번 범위에 포함하지 않는다.

## 보안과 오류 처리

- Cron API는 `CRON_SECRET`이 없으면 503, 인증 불일치면 401을 반환한다.
- 응답과 서버 로그에 환경변수·고객정보를 포함하지 않는다.
- 집계 DB 오류는 실행 row를 `failed`로 기록할 수 있을 때만 기록한다.
- 이메일 실패는 예외 상태를 변경하지 않고 발송 기록만 `failed`로 남긴다.
- DB 자체 장애나 Vercel 전체 장애는 내부 모니터가 이메일을 보낼 수 없다. 이는 추후 외부 uptime 감시 범위다.

## 운영 적용

- Drizzle 마이그레이션을 생성하고 신규 테이블 RLS를 명시적으로 활성화한다.
- Supabase SQL Editor에서 마이그레이션을 수동 적용한 뒤 코드를 Production에 배포한다.
- `packages/db/operations/schedule-operations-monitor-cron.sql`로 매일 09:00 KST 작업을 등록한다.
- 기존 `career_direct_site_url`, `career_direct_cron_secret` Vault 값을 재사용한다.

## 검증 시나리오

1. 문제가 0건이면 200 응답과 실행 성공만 기록되고 이메일은 없다.
2. 실제 고객 입금기한 초과가 있으면 한 통의 요약 이메일이 발송된다.
3. 테스트 고객의 같은 문제는 집계되지 않는다.
4. 같은 문제로 같은 날 재실행해도 중복 이메일이 없다.
5. 문제 구성이 달라지면 같은 날 새 fingerprint로 한 번 발송된다.
6. 이메일 실패 시 발송 row가 `failed`이고 다음 실행에서 재시도 가능하다.
7. 리드·콜백 pending 작업이 30분 지연되면 경고된다.
8. 주요 Cron 성공 기록이 기준 시간을 넘기면 경고된다.
9. 인증 없는 Cron 호출은 401이다.
10. 이메일과 DB 기록에 고객 식별정보가 없다.
11. 관리자 화면의 건수와 필터 결과가 일치한다.
12. DB·타입검사·lint·production build가 통과한다.

## 완료 기준

- 매일 09:00 KST에 점검한다.
- 실제 운영 문제가 있을 때만 관리자 이메일이 발송된다.
- 중복 이메일이 방지된다.
- 주요 Cron 상태와 지연 작업을 확인할 수 있다.
- 관리자 화면에서 마지막 점검과 현재 문제를 확인할 수 있다.
- 내부 모니터링으로 탐지할 수 없는 전체 장애의 한계가 문서화된다.
