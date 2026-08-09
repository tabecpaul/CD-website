# Resend Tokyo 이메일 전환 설계

## 목적

Career Direct Korea의 PDF 전달 및 격일 3회 코칭 이메일을 AWS SES/SNS에서 Resend Tokyo 발송 리전으로 전환한다. 기존 일정, 수신 거부, 발송 억제, 이벤트 이력은 유지하고 운영 복잡도만 낮춘다.

## 승인된 운영 조건

- 발송 리전은 Resend Tokyo(`ap-northeast-1`)를 사용한다.
- Resend 계정 데이터, 이메일 메타데이터, 로그 및 API 기록이 미국에 저장되는 것을 수용한다.
- 개인정보처리방침에 Resend 처리위탁 및 미국 국외 이전을 공개한다.
- 이메일 본문에는 진로 상담 상세 기록, 평가 원본 결과 등 민감정보를 넣지 않는다.
- PDF는 기존 24시간 제한 다운로드 링크로 제공한다.

## 발송 구조

1. Supabase Cron이 기존 `/api/cron/lead-emails`를 호출한다.
2. 처리기는 만료되지 않은 pending 작업을 선점한다.
3. Resend API로 HTML/텍스트 이메일을 발송하고 반환된 이메일 ID를 `provider_message_id`에 저장한다.
4. Resend는 `/api/webhooks/resend`로 전달·지연·실패·반송·불만 이벤트를 전송한다.
5. 웹훅은 원문과 `svix-*` 헤더를 Resend SDK로 검증하고 `svix-id`로 중복을 방지한다.
6. 영구 반송 및 불만 주소는 기존 억제 로직으로 후속 이메일을 중단한다.

## 데이터 모델

- 기존 `lead_magnet_email_jobs.provider_message_id`를 그대로 재사용한다.
- `lead_magnet_email_events.sns_message_id`는 DB 호환성을 위해 이번 전환에서 물리 이름을 유지하지만 애플리케이션에서는 범용 이벤트 ID로 취급한다.
- 별도 마이그레이션 없이 기존 전달·반송·불만 필드를 재사용한다.

## 환경 변수

- `RESEND_API_KEY`: Resend 발송 API 키
- `RESEND_FROM_EMAIL`: 인증 도메인의 발신 주소
- `RESEND_REPLY_TO_EMAIL`: 회신 주소, 없으면 발신 주소 사용
- `RESEND_WEBHOOK_SECRET`: Resend 웹훅 서명 비밀값
- `NEXT_PUBLIC_SITE_URL`: `https://start.careerdirect.kr`

기존 AWS/SES/SNS 환경 변수는 Resend 실발송 검증 후 제거한다.

## 개인정보 고지

개인정보처리방침에 수탁자 Plus Five Five, Inc.(Resend), 이전 국가 미국, 이전 항목, 목적, 시점·방법, 보유기간 및 거부 방법을 명시한다. 가입 폼의 개인정보 동의는 개인정보처리방침 링크를 통해 이 내용을 확인할 수 있어야 한다.

## 전환 안전장치

- Resend 설정이 빠진 배포에서는 명시적인 `RESEND_CONFIG_MISSING` 오류를 기록하고 재시도한다.
- 발송 성공 전 SES/SNS 리소스는 삭제하지 않는다.
- 실발송, 전달 웹훅, 반송 테스트, 수신 거부를 모두 확인한 뒤 SES/SNS를 비활성화한다.

## 완료 기준

- 빌드와 린트가 성공한다.
- Resend Tokyo 도메인이 인증된다.
- PDF 전달 이메일이 수신되고 DB에 Resend 이메일 ID가 저장된다.
- 전달 또는 테스트 반송 웹훅이 서명 검증 후 DB에 반영된다.
- 불만/영구 반송 시 후속 작업이 중단된다.
- 개인정보처리방침에서 미국 국외 이전 내용을 확인할 수 있다.
