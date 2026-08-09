# 청년 직장인 리드 마그넷 공급자 결정

- 상태: 승인·운영 검증 완료
- 최초 승인일: 2026-08-05
- 변경 승인일: 2026-08-09
- 적용 범위: 청년 직장인 무료 진로방향 자가진단 MVP

## 결정

MVP는 `Supabase PostgreSQL + Supabase Cron + Vercel Next.js + Resend Tokyo` 조합으로 운영한다. AWS SES/SNS 직접 연동 결정은 반복되는 샌드박스·자격증명·SNS 구독 운영 문제로 폐기한다.

| 책임 | 선택 | 비고 |
| --- | --- | --- |
| 리드·동의·발송 원장 | Supabase PostgreSQL | 발송 상태의 유일한 원본 |
| 예약 실행 | Supabase Cron | 즉시, 2일, 4일, 6일 작업 실행 |
| 발송 처리 | Vercel Next.js Route Handler | 최신 동의·억제 상태 확인 후 발송 |
| 이메일 전송 | Resend Tokyo (`ap-northeast-1`) | 인증 도메인 `careerdirect.kr` 사용 |
| 전달·반송·불만 | Resend 서명 웹훅 | `/api/webhooks/resend`에서 Svix 서명 검증 |
| PDF 전달 | 24시간 제한 다운로드 링크 | 이메일에 민감한 평가 원본을 첨부하지 않음 |

## 데이터 위치와 개인정보

Tokyo 선택은 이메일의 발송 경로를 제어한다. Resend 계정 데이터, 이메일 메타데이터, 로그 및 API 기록은 미국에 저장된다. 개인정보처리방침에 Plus Five Five, Inc.(Resend), 미국 국외 이전 항목·목적·시점·방법·보유기간·거부 방법을 공개한다.

이메일 본문에는 상담 상세 기록, 종교적 신념에 관한 개인별 정보, 심리·건강 상태, 평가 원본 결과, 주민등록번호 또는 결제정보를 넣지 않는다.

## 데이터 흐름

1. Next.js가 이메일과 동의를 검증하고 Supabase에 리드와 발송 작업을 기록한다.
2. 신청 직후 처리기와 5분 간격 Cron이 기한이 된 작업을 선점한다.
3. Resend Tokyo가 이메일을 발송하고 반환한 이메일 ID를 원장에 저장한다.
4. Resend가 전달·지연·실패·반송·불만 이벤트를 서명된 웹훅으로 전송한다.
5. 웹훅은 `svix-id`로 중복을 차단하고 Resend 이메일 ID 또는 작업 태그로 원장과 매칭한다.
6. 영구 반송 또는 불만 발생 시 해당 리드를 억제하고 예약된 코칭 이메일을 중단한다.

## 운영 환경변수

| 변수 | 공개 여부 | 용도 |
| --- | --- | --- |
| `NEXT_PUBLIC_SITE_URL` | 공개 | `https://start.careerdirect.kr` |
| `DATABASE_URL` | 서버 전용 | Supabase PostgreSQL 연결 |
| `CRON_SECRET` | 서버 전용 | Cron 엔드포인트 인증 |
| `RESEND_API_KEY` | 서버 전용 | Resend 발송 API 인증 |
| `RESEND_FROM_EMAIL` | 서버 전용 | `guide@careerdirect.kr` |
| `RESEND_REPLY_TO_EMAIL` | 서버 전용 | 운영 회신 주소 |
| `RESEND_WEBHOOK_SECRET` | 서버 전용 | Resend 웹훅 서명 검증 |

## 운영 검증 결과

- 실제 Gmail 수신 및 PDF 다운로드 링크 정상
- `Reply-To` 개인 Gmail 전달 정상
- `email.delivered` 이벤트 작업 매칭 정상
- 동일 이벤트 Replay 시 중복 차단 정상
- Resend 공식 테스트 주소의 `email.bounced` 자동 억제 정상
- Resend 공식 테스트 주소의 `email.complained` 자동 억제 정상

## AWS 폐기 범위

Resend 운영 검증 후 다음 AWS 직접 연동 자원을 제거한다.

- SES Configuration Set 및 SNS 이벤트 목적지
- SNS HTTP(S) 구독 및 Topic
- SES 전용 IAM 액세스 키 또는 사용자
- Vercel의 `AWS_*`, `SES_*` 환경변수

발신 도메인의 기존 웹·메일 DNS는 유지하고, AWS 자원 삭제 전 Resend DKIM·SPF·DMARC 레코드가 정상인지 재확인한다.

## 재검토 조건

복수 리드 마그넷, CRM 자동 배정, 상담 예약, 결제·워크숍 관리, 장기 행동 기반 고객 여정 중 두 가지 이상이 실제 범위에 포함되면 n8n 또는 별도 작업 큐 도입을 재검토한다.

## 공식 근거

- Resend 리전과 데이터 위치: <https://resend.com/docs/dashboard/domains/regions>
- Resend 웹훅 검증: <https://resend.com/docs/webhooks/verify-webhooks-requests>
- Resend 테스트 주소: <https://resend.com/docs/knowledge-base/what-email-addresses-to-use-for-testing>
- Supabase Cron: <https://supabase.com/docs/guides/cron>
