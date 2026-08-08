# SES 반송·불만 자동 처리 설계

## 배경

Career Direct Korea의 리드 이메일은 AWS SES 서울 리전에서 발송되며, Supabase PostgreSQL이 리드 동의와 이메일 작업 상태의 원본이다. 자료 전달과 코칭 발송 및 수신거부 흐름은 검증됐지만, SES가 전달·반송·불만 이벤트를 반환했을 때 이를 데이터베이스에 반영하고 후속 발송을 억제하는 기능은 아직 없다.

## 목표

- SES의 Delivery, Bounce, Complaint 이벤트를 자동 수신한다.
- 영구 반송과 불만 주소에 대한 후속 발송을 즉시 중단한다.
- 일시 반송은 중복 없이 누적하고 3회째 후속 발송을 중단한다.
- 전달 완료 시각과 공급자 메시지 ID를 이메일 원장에 기록한다.
- SNS 재전송에도 상태가 한 번만 변경되도록 보장한다.
- 샌드박스 상태에서도 SES Mailbox Simulator로 검증한다.

## 비목표

- 대규모 캠페인 관리 UI
- 억제 주소 자동 복구
- 원본 SNS payload 장기 보관
- Open/Click 추적
- EventBridge, Lambda 또는 별도 메시지 큐 도입

## 선택한 아키텍처

SES Configuration Set에서 Delivery, Bounce, Complaint 이벤트를 서울 리전 SNS Topic으로 발행한다. SNS는 HTTPS 구독을 통해 Vercel의 전용 웹훅에 알림을 전달한다.

```text
SES SendEmail
  → Configuration Set: career-direct-production
  → SNS Topic: career-direct-email-events
  → POST https://start.careerdirect.kr/api/webhooks/ses
  → SNS 서명·Topic 검증
  → 이벤트 중복 제거
  → Supabase 상태 반영
```

Configuration Set을 사용해 Career Direct Korea 애플리케이션의 이벤트를 같은 발신 도메인의 다른 시스템과 분리한다.

## AWS 리소스

- 리전: `ap-northeast-2`
- SES Configuration Set: `career-direct-production`
- SNS Topic: `career-direct-email-events`
- 이벤트 유형: Delivery, Bounce, Complaint
- HTTPS Endpoint: `https://start.careerdirect.kr/api/webhooks/ses`

환경변수:

- `SES_CONFIGURATION_SET=career-direct-production`
- `SES_SNS_TOPIC_ARN=<서울 리전 Topic ARN>`

## 데이터 모델

### lead_magnet_email_jobs

추가 필드:

- `provider_message_id varchar(128)`: SES SendEmail 응답의 메시지 ID
- `delivered_at timestamptz`: 수신 서버가 메시지를 받아들인 시각
- `bounced_at timestamptz`: 최종 반송 이벤트 시각
- `complained_at timestamptz`: 불만 이벤트 시각

`provider_message_id`에는 고유 인덱스를 둔다. 공급자 메시지 ID가 없는 기존 작업은 null로 유지한다.

### lead_magnet_leads

추가 필드:

- `email_suppressed_at timestamptz`
- `email_suppression_reason varchar(32)`
- `transient_bounce_count integer not null default 0`

억제 사유는 `permanent_bounce`, `complaint`, `transient_bounce_limit` 중 하나다.

### lead_magnet_email_events

추가 테이블:

- `id serial primary key`
- `sns_message_id varchar(128) unique not null`
- `provider_message_id varchar(128)`
- `job_id integer null`
- `lead_id integer null`
- `event_type varchar(32) not null`
- `event_subtype varchar(64)`
- `event_at timestamptz not null`
- `processed_at timestamptz not null default now()`

원본 SNS payload와 이메일 주소는 이벤트 원장에 복제하지 않는다.

## 발송 흐름 변경

1. 발송 전 리드의 `email_suppressed_at`을 확인한다.
2. 억제된 리드는 해당 작업을 `skipped`로 바꾸고 SES를 호출하지 않는다.
3. SES SendEmail 요청에 `ConfigurationSetName`을 포함한다.
4. SES 이벤트 연결용 비식별 태그로 내부 `job_id`를 포함한다.
5. SES 응답의 `MessageId`를 해당 이메일 작업의 `provider_message_id`로 저장한다.
6. Configuration Set 환경변수가 없으면 운영 오구성으로 처리하고 발송을 재시도 정책에 따른다.

## 웹훅 보안

웹훅은 SNS envelope를 JSON으로 수신하며, 처리 전에 다음을 모두 검증한다.

1. 요청 본문의 필수 SNS 필드 존재 여부
2. `TopicArn`이 `SES_SNS_TOPIC_ARN`과 정확히 일치하는지
3. `SigningCertURL`이 HTTPS이고 AWS SNS 공식 호스트인지
4. SNS 서명이 인증서 공개키로 검증되는지
5. SNS 메시지 타입이 허용된 값인지

서명 검증 전에는 구독 확인 URL 호출이나 DB 변경을 하지 않는다. 인증서 URL 및 SubscribeURL은 호스트 허용목록 검증 후 사용한다.

### SubscriptionConfirmation

- 서명과 Topic ARN을 검증한다.
- SubscribeURL이 서울 리전 SNS HTTPS 호스트인지 확인한다.
- 확인 URL을 호출하고 2xx를 반환한다.

### Notification

- SNS envelope의 `Message`를 SES 이벤트 JSON으로 파싱한다.
- SNS `MessageId` 고유값으로 이벤트를 중복 제거한다.
- 이미 처리된 이벤트는 추가 상태 변경 없이 200을 반환한다.

## 이벤트 정책

### Delivery

- `mail.messageId`로 이메일 작업을 찾는다.
- `delivered_at`을 SES 이벤트 시각으로 기록한다.
- 리드의 반송 카운트나 억제 상태는 변경하지 않는다.

### Permanent Bounce

- 작업의 `bounced_at`을 기록한다.
- 리드에 `email_suppressed_at`과 `permanent_bounce`를 기록한다.
- `coaching_agreed=false`로 변경한다.
- 해당 리드의 남은 `pending` 이메일 작업을 `skipped`로 변경한다.

### Complaint

- 작업의 `complained_at`을 기록한다.
- 리드에 `email_suppressed_at`과 `complaint`를 기록한다.
- `coaching_agreed=false`로 변경한다.
- 해당 리드의 남은 `pending` 이메일 작업을 `skipped`로 변경한다.

### Transient Bounce

- 작업의 `bounced_at`을 기록한다.
- 중복 제거 후 `transient_bounce_count`를 1 증가시킨다.
- 누적 1~2회에는 리드를 억제하지 않는다.
- 누적 3회에는 `transient_bounce_limit` 사유로 억제하고 남은 작업을 중단한다.

### 알 수 없는 이벤트 또는 작업

- 허용되지 않은 이벤트 종류는 상태를 변경하지 않고 기록 가능한 최소 메타데이터만 남긴다.
- 공급자 메시지 ID와 일치하는 작업이 없어도 SNS 이벤트 ID를 기록해 무한 재전송을 방지한다.
- 구조가 잘못된 메시지는 400, 서명 또는 Topic 검증 실패는 401/403을 반환한다.

## 개인정보와 로그

- 원본 SNS payload를 애플리케이션 로그나 DB에 저장하지 않는다.
- 수신 이메일 주소를 서버 로그에 기록하지 않는다.
- 운영 로그에는 SNS MessageId, SES MessageId, 이벤트 유형, 연결된 내부 job ID만 기록한다.
- 억제 해제는 별도 운영 절차를 통해서만 수행한다.

## 테스트

### 정적 테스트

- SNS Notification 및 SubscriptionConfirmation 서명 문자열 생성
- 잘못된 Topic ARN, 인증서 URL, 서명 거부
- SES 이벤트 파싱과 이벤트 ID 중복 처리
- Permanent, Complaint, Transient 누적 정책

### 통합 테스트

SES Mailbox Simulator를 사용한다.

- `success@simulator.amazonses.com`: Delivery 기록
- `bounce@simulator.amazonses.com`: Permanent Bounce와 즉시 억제
- `complaint@simulator.amazonses.com`: Complaint와 즉시 억제

시뮬레이터 전용 테스트 리드를 사용하며 실제 사용자 작업은 변경하지 않는다.

## 배포 순서

1. DB 마이그레이션 배포
2. 웹훅 코드 및 발송 코드 배포
3. Vercel 환경변수 등록
4. 서울 리전 SNS Topic 생성
5. SES Configuration Set 및 SNS Event Destination 생성
6. HTTPS 구독 생성과 서명된 SubscriptionConfirmation 처리 확인
7. Mailbox Simulator 통합 테스트
8. 운영 모니터링 확인

웹훅 코드와 DB가 준비되기 전에 SES 이벤트 발행을 활성화하지 않는다.

## 롤백

- SES Configuration Set의 Event Destination을 비활성화한다.
- SNS HTTPS 구독을 비활성화한다.
- 발송에서 Configuration Set 지정만 제거해 기존 발송을 유지한다.
- 추가 DB 필드는 보존하며 기존 발송 기능에는 영향을 주지 않는다.
