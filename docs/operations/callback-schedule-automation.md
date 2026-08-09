# 콜백 일정 확정 자동화 운영 안내

## 최초 적용 순서

1. `packages/db/drizzle/0006_eager_tiger_shark.sql`을 Supabase SQL Editor에서 실행한다.
2. `callback_schedule_email_jobs`, `callback_schedule_tokens` 테이블과 `assessment_callback_requests`의 일정 컬럼을 확인한다.
3. 두 신규 테이블에 RLS가 활성화되어 있는지 확인한다.
4. 최신 `CDKorea/main` 커밋을 Vercel Production에 캐시 없이 배포한다.
5. `packages/db/operations/schedule-callback-reminder-cron.sql`을 실행한다.
6. 테스트 신청으로 일정 확정 이메일과 크론 HTTP 200을 확인한다.

## 크론 상태 확인

```sql
select jobid, jobname, schedule, active
from cron.job
where jobname = 'career-direct-callback-reminders';
```

최근 호출은 다음과 같이 상태 코드만 확인한다.

```sql
select id, status_code, created
from net._http_response
order by created desc
limit 10;
```

## 크론 중지

```sql
select cron.alter_job(jobid, active := false)
from cron.job
where jobname = 'career-direct-callback-reminders';
```

## 이메일 실패 확인

```sql
select id, callback_request_id, schedule_version, status, attempts, last_error_code, scheduled_at
from callback_schedule_email_jobs
where status in ('pending', 'failed')
order by scheduled_at asc;
```

확정 이메일 실패는 관리자 콜백 상세 화면에서 `확정 이메일 재발송`을 사용한다. DB에서 토큰 해시를 조회하거나 수정하지 않는다.

## 변경 요청 처리

1. 콜백 목록의 `일정 변경 요청` 표시를 확인한다.
2. 상세 화면에서 새 희망 날짜·시간대·메시지를 확인한다.
3. 새 정확한 시각을 입력해 재확정하거나 `기존 일정 유지`를 선택한다.
4. 재확정 시 고객에게 새 이메일이 발송되고 이전 알림 작업은 자동으로 건너뛴다.
