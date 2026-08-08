# SES Raw 이메일 발송 오류 수정 설계

## 배경

Career Direct Korea의 리드 이메일 자동화는 Amazon SES v2 `SendEmail` API와 Raw MIME 메시지를 사용한다. Supabase Cron, Vercel API, PostgreSQL 연결은 정상화됐지만 실제 발송 작업은 `BadRequestException`으로 실패했다.

현재 구현은 MIME 메시지 안에 `From`, `To`, `Reply-To` 헤더를 포함하지만 SES v2 API 요청에는 `Content.Raw`만 전달한다. AWS의 SES v2 Raw 발송 예제는 Raw 콘텐츠와 함께 API 수준의 `FromEmailAddress`와 `Destination`을 전달한다.

## 목표

- 기존 HTML·텍스트 이메일과 원클릭 수신거부 헤더를 유지한다.
- SES v2 Raw 요청에 발신자, 수신자, 회신 주소를 명시한다.
- AWS가 반환하는 실패 원인을 Vercel 로그에서 확인할 수 있게 한다.
- 기존 재시도·예약·수신거부 동작은 변경하지 않는다.

## 비목표

- 이메일 콘텐츠나 발송 일정 변경
- SES v1 또는 SMTP로 전환
- 반송·불만 이벤트 자동 처리 추가
- 새로운 이메일 제공자 도입

## 선택한 접근법

기존 SES v2 Raw 방식을 유지하며 `SendEmailCommand` 입력을 보완한다.

- `FromEmailAddress`: `SES_FROM_EMAIL`
- `Destination.ToAddresses`: 작업 대상 리드 이메일
- `ReplyToAddresses`: `SES_REPLY_TO_EMAIL`
- `Content.Raw.Data`: 기존 MIME 바이트

MIME 헤더에도 동일한 발신자·수신자·회신 주소를 유지한다. API envelope와 메시지 헤더의 주소가 서로 일치하도록 단일 구성값에서 생성한다.

## 오류 처리

발송 실패 시 다음 정보를 서버 로그에 구조적으로 기록한다.

- 이메일 작업 ID와 종류
- AWS 오류명
- 오류 메시지
- HTTP 상태 코드(제공되는 경우)

수신자의 전체 이메일 주소, AWS 자격증명, DB 연결 문자열, Cron Secret은 로그에 기록하지 않는다. DB의 `last_error_code`에는 현재처럼 짧은 오류명만 저장한다.

## 데이터 흐름

1. Supabase Cron이 보호된 Vercel 발송 API를 호출한다.
2. 서버가 발송 시각이 지난 `pending` 작업을 가져와 하나씩 선점한다.
3. 리드 동의 및 수신거부 상태를 확인한다.
4. MIME 콘텐츠와 SES API envelope를 동일한 주소 구성으로 생성한다.
5. SES v2 `SendEmail`을 호출한다.
6. 성공하면 작업을 `sent`, 실패하면 기존 정책에 따라 최대 5회 재시도한다.

## 기존 실패 작업 처리

코드 배포 후 테스트 대상의 `delivery` 작업만 다음 상태로 재설정한다.

- `status = 'pending'`
- `attempts = 0`
- `last_error_code = null`
- `updated_at = now()`

다른 사용자나 후속 코칭 작업은 일괄 변경하지 않는다.

## 검증

1. TypeScript 및 Next.js 프로덕션 빌드가 성공해야 한다.
2. SES에서 인증된 수신 주소로 새 리드 또는 재설정한 테스트 작업을 발송한다.
3. 작업이 `sent`로 바뀌고 `sent_at`이 기록되는지 확인한다.
4. 받은편지함에서 제목, 본문, 발신자, 회신 주소를 확인한다.
5. PDF 다운로드 링크가 `https://start.careerdirect.kr`를 사용하고 정상 작동하는지 확인한다.
6. 코칭 이메일의 원클릭 수신거부 헤더와 링크가 유지되는지 확인한다.

## 롤백

문제가 발생하면 해당 코드 커밋을 되돌리고 Cron 작업을 일시 중지한다. DB 스키마 변경은 없으므로 별도의 데이터베이스 롤백은 필요하지 않다.
