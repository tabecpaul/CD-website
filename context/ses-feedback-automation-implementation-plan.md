# SES 반송·불만 자동 처리 구현 계획

## 입력 사양

- 설계: `docs/superpowers/specs/2026-08-08-ses-feedback-automation-design.md`
- AWS 리전: `ap-northeast-2`
- 웹훅: `POST /api/webhooks/ses`
- 성공 조건: SES Simulator의 Delivery, Bounce, Complaint 이벤트가 서명 검증 후 중복 없이 DB에 반영되고 후속 작업 억제 정책이 작동한다.

## 구현 순서

### 1. Drizzle 스키마와 마이그레이션

파일:

- `packages/db/src/schema.ts`
- `packages/db/drizzle/0003_*.sql`
- `packages/db/drizzle/meta/*`

작업:

- 리드 억제 필드와 일시 반송 카운트를 추가한다.
- 이메일 작업에 SES message ID와 전달·반송·불만 시각을 추가한다.
- 중복 방지용 `lead_magnet_email_events` 테이블을 추가한다.
- SES message ID와 SNS message ID에 고유 인덱스를 생성한다.

검증:

- 마이그레이션이 기존 데이터에 안전한 nullable/default 구조인지 확인한다.
- `npm run build:www`의 TypeScript 단계가 스키마를 정상 인식해야 한다.

### 2. SNS envelope 검증 모듈

파일:

- `apps/www/src/features/lead-magnet/server/snsVerification.ts`

작업:

- SNS Notification 및 SubscriptionConfirmation 타입을 파싱한다.
- Topic ARN, AWS SNS 인증서 URL, 서명 버전과 서명을 검증한다.
- SNS 규칙에 맞는 canonical string을 생성하고 Node crypto로 RSA 서명을 확인한다.
- 인증서 및 SubscribeURL 호스트를 서울 SNS 공식 호스트로 제한한다.

검증:

- 잘못된 JSON, Topic, 인증서 URL, 서명 버전을 거부한다.
- 민감한 payload를 로그에 출력하지 않는다.

### 3. SES 이벤트 처리 서비스

파일:

- `apps/www/src/features/lead-magnet/server/sesFeedback.ts`

작업:

- SES Delivery, Bounce, Complaint payload를 최소 스키마로 파싱한다.
- SNS MessageId를 선점해 중복 처리를 방지한다.
- SES message ID로 작업과 리드를 찾는다.
- 정책에 따라 전달 시각, 반송/불만 시각, 억제 상태와 남은 작업을 갱신한다.
- 알 수 없는 작업도 이벤트 ID를 기록해 반복 처리를 막는다.

검증:

- Permanent와 Complaint는 즉시 억제한다.
- Transient는 중복 없이 증가하고 3회째 억제한다.
- Delivery는 리드 동의 상태를 변경하지 않는다.

### 4. HTTPS 웹훅 라우트

파일:

- `apps/www/src/app/api/webhooks/ses/route.ts`

작업:

- body 크기를 제한하고 SNS envelope를 파싱한다.
- 서명과 Topic을 검증한 뒤에만 구독 확인 또는 이벤트 처리를 수행한다.
- SubscriptionConfirmation은 검증된 서울 SNS URL만 호출한다.
- 중복 이벤트에도 200을 반환한다.

검증:

- 인증 실패는 401/403, 잘못된 payload는 400, 성공은 200을 반환한다.
- 공개 GET 요청은 제공하지 않는다.

### 5. 발송 흐름 연결

파일:

- `apps/www/src/features/lead-magnet/server/emailAutomation.ts`

작업:

- 억제된 리드는 SES 호출 전에 작업을 `skipped` 처리한다.
- `SES_CONFIGURATION_SET`을 필수 발송 구성으로 읽는다.
- SendEmail 요청에 `ConfigurationSetName`을 전달한다.
- 응답 `MessageId`를 이메일 작업에 저장한다.

검증:

- 기존 일정, 본문, 수신거부, 재시도 로직은 유지한다.
- Configuration Set 오구성은 상세 로그와 기존 재시도 정책으로 처리한다.

### 6. 정적 검증과 코드 리뷰

명령:

```bash
npm run lint:www
npx next build --webpack
git diff --check
```

검증:

- 린트와 TypeScript가 통과한다.
- 웹훅 및 Cron 동적 라우트가 프로덕션 빌드에 포함된다.
- 사용자 소유의 관련 없는 파일은 변경하거나 스테이징하지 않는다.

### 7. 커밋·푸시·DB 적용

작업:

- 구현 파일과 생성된 마이그레이션만 커밋한다.
- `cdkorea/main`에 푸시한다.
- Supabase 운영 DB에 0003 마이그레이션을 적용한다.
- Vercel Production 배포를 확인한다.

검증:

- 새 컬럼과 이벤트 테이블이 운영 DB에 존재한다.
- 기존 자료 전달 및 Cron API가 계속 200을 반환한다.

### 8. AWS 리소스와 환경변수

작업:

- 서울 SNS Topic `career-direct-email-events`를 생성한다.
- Vercel에 `SES_SNS_TOPIC_ARN`과 `SES_CONFIGURATION_SET`을 등록한다.
- SES Configuration Set `career-direct-production`과 SNS event destination을 생성한다.
- HTTPS 구독을 생성하고 Confirmed 상태를 확인한다.

검증:

- 잘못된 Topic에서 온 요청은 거부된다.
- 실제 SubscriptionConfirmation만 승인된다.

### 9. Mailbox Simulator 통합 검증

작업:

- success, bounce, complaint simulator 주소별 테스트 리드와 작업을 만든다.
- 각 작업을 한 번씩 발송한다.
- DB 이벤트 원장과 억제 상태를 확인한다.

성공 조건:

- success: `delivered_at` 기록
- bounce: `permanent_bounce`, 남은 작업 `skipped`
- complaint: `complaint`, 남은 작업 `skipped`
- SNS 재전송: 이벤트 행과 카운트가 증가하지 않음

## 롤백

- SES event destination을 비활성화한다.
- SNS HTTPS 구독을 중지한다.
- 필요 시 발송 요청에서 Configuration Set만 제거한다.
- 추가 DB 컬럼과 이벤트 원장은 보존한다.
