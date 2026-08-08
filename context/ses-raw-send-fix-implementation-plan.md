# SES Raw 이메일 발송 오류 수정 구현 계획

## 입력 사양

- 설계: `docs/superpowers/specs/2026-08-08-ses-raw-send-fix-design.md`
- 대상: `apps/www/src/features/lead-magnet/server/emailAutomation.ts`
- 성공 조건: SES 인증 수신 주소로 발송한 `delivery` 작업이 `sent`가 되고 실제 이메일과 PDF 링크가 정상 동작한다.

## 구현 순서

### 1. SES 메시지 반환값에 envelope 주소 포함

예상 시간: 2–5분

파일:

- `apps/www/src/features/lead-magnet/server/emailAutomation.ts`

작업:

- `buildMessage`가 Raw MIME 데이터뿐 아니라 `from`, `replyTo`, `recipient`를 반환하도록 한다.
- MIME의 `From`, `To`, `Reply-To`와 API envelope가 동일한 구성값을 사용하게 한다.
- 이메일 콘텐츠, 링크, 제목, 수신거부 헤더는 변경하지 않는다.

검증:

- TypeScript가 반환 타입을 올바르게 추론하는지 확인한다.
- 민감정보가 새 로그나 반환 객체에 불필요하게 추가되지 않았는지 확인한다.

### 2. SES v2 SendEmail 요청 보완

예상 시간: 2–5분

파일:

- `apps/www/src/features/lead-magnet/server/emailAutomation.ts`

작업:

- `SendEmailCommand`에 다음 필드를 추가한다.
  - `FromEmailAddress`
  - `Destination.ToAddresses`
  - `ReplyToAddresses`
  - 기존 `Content.Raw.Data`
- AWS 공식 SES v2 Raw 요청 구조와 일치하는지 대조한다.

검증:

- 발신 주소가 `SES_FROM_EMAIL`, 회신 주소가 `SES_REPLY_TO_EMAIL`, 수신 주소가 해당 리드 이메일에서 오는지 확인한다.
- 기존 SES v2 클라이언트와 리전 설정을 유지하는지 확인한다.

### 3. 안전한 상세 오류 로깅 추가

예상 시간: 2–5분

파일:

- `apps/www/src/features/lead-magnet/server/emailAutomation.ts`

작업:

- 발송 `catch`에서 작업 ID, 이메일 종류, 오류명, 오류 메시지, AWS 메타데이터의 HTTP 상태만 구조적으로 기록한다.
- 수신 이메일, AWS 자격증명, DB URL, Cron Secret은 로그에 포함하지 않는다.
- DB에는 기존처럼 80자 이하 오류명만 기록한다.

검증:

- 로그 객체에 금지된 민감정보가 없는지 코드 리뷰한다.
- 재시도 횟수와 `pending`/`failed` 전환 로직이 바뀌지 않았는지 확인한다.

### 4. 정적 검증 및 프로덕션 빌드

예상 시간: 3–10분

명령:

```bash
npm run lint:www
npm run build:www
```

검증:

- ESLint 오류가 없어야 한다.
- Next.js 프로덕션 빌드가 성공해야 한다.
- `/api/cron/lead-emails` 라우트가 빌드 과정에서 정상 수집돼야 한다.

### 5. 변경 범위 검토 및 커밋

예상 시간: 2–5분

작업:

- `git diff --check`를 실행한다.
- 사용자 소유의 관련 없는 미추적 파일은 스테이징하지 않는다.
- SES 수정 파일만 커밋한다.

검증:

- diff가 설계 범위를 벗어나지 않아야 한다.
- DB 스키마와 이메일 콘텐츠에는 변경이 없어야 한다.

### 6. 배포 및 테스트 작업 재설정

예상 시간: 5–10분 + 배포 시간

작업:

- 현재 `main` 브랜치의 수정 커밋을 `cdkorea/main`에 푸시한다.
- Vercel Production 배포가 `Ready`와 `Current`가 될 때까지 확인한다.
- SES에서 인증된 테스트 수신 주소의 `delivery` 작업 하나만 `pending`, `attempts = 0`, `last_error_code = null`로 재설정한다.
- Cron이 활성화된 상태에서 최대 5분 기다린다.

검증 SQL:

```sql
select
  j.id,
  l.email,
  j.kind,
  j.status,
  j.attempts,
  j.last_error_code,
  j.sent_at
from public.lead_magnet_email_jobs j
join public.lead_magnet_leads l on l.id = j.lead_id
where j.kind = 'delivery'
order by j.id desc;
```

성공 조건:

- 대상 작업이 `sent`
- `sent_at` 기록
- 실제 받은편지함에서 이메일 수신
- 발신자와 회신 주소 정상
- PDF 링크가 `https://start.careerdirect.kr`를 사용하고 다운로드 성공

## 실패 시 분기

- `BadRequestException` 지속: Vercel 상세 로그의 새 오류 메시지로 MIME 또는 API 필드 문제를 수정한다.
- `MessageRejected`: SES 발신/수신 Identity와 서울 리전 샌드박스 조건을 확인한다.
- `AccessDeniedException`: IAM의 `ses:SendEmail` 권한과 identity ARN 리전을 확인한다.
- `CredentialsProviderError`: Vercel AWS 자격증명 환경변수를 확인한다.
- `sent`지만 미수신: 스팸함, SES 발송 이벤트, 수신 서버 정책을 확인한다.

## 롤백

- Cron Job 1을 일시 중지한다.
- SES 수정 커밋을 되돌린다.
- DB 변경은 없으므로 데이터 마이그레이션 롤백은 수행하지 않는다.
