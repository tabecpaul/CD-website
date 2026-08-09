# Resend Tokyo 전환 구현 계획

1. `apps/www/package.json`: AWS SES SDK를 Resend SDK로 교체하고 의존성을 설치한다. 검증: lockfile에 Resend가 반영된다.
2. `apps/www/src/features/lead-magnet/server/emailAutomation.ts`: 기존 템플릿과 일정은 유지하고 Resend API 발송으로 교체한다. 검증: 발송 ID 저장과 재시도 로직이 유지된다.
3. `apps/www/src/features/lead-magnet/server/resendFeedback.ts`: Resend 이벤트 파싱과 기존 억제 규칙을 구현한다. 검증: delivered, bounced, complained, failed/delayed를 구분한다.
4. `apps/www/src/app/api/webhooks/resend/route.ts`: raw body 서명 검증 및 중복 방지 웹훅을 추가한다. 검증: 잘못된 서명은 401/400, 정상 이벤트는 200을 반환한다.
5. `apps/www/src/app/privacy/page.tsx`: Resend 처리위탁과 미국 국외 이전 고지를 추가한다. 검증: 필수 이전 항목이 화면에 모두 나타난다.
6. 프로젝트 전체: TypeScript/Next.js 문서 규칙에 맞춰 린트와 빌드를 실행한다.
7. 운영 설정: Resend에서 Tokyo 도메인, 웹훅, 환경 변수를 설정하고 무캐시 재배포한다.
8. 운영 검증: 인증 수신 주소로 PDF 전달, 전달 이벤트, 반송 테스트 및 수신 거부를 확인한 후 SES/SNS를 비활성화한다.
