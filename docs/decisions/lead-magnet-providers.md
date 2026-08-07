# 청년 직장인 리드 마그넷 공급자 결정

- 상태: 승인
- 승인일: 2026-08-05
- 결정자: 프로젝트 소유자
- 적용 범위: 청년 직장인 무료 진로방향 자가진단 MVP
- 재검토 시점: 복수 이메일 여정, CRM, 예약, 블로그 자동화 중 2개 이상을 연결할 때

## 결정

MVP는 `Supabase 서울 + Supabase Cron/Edge Functions + AWS SES 서울` 조합으로 운영한다. n8n은 첫 출시 범위에서 제외하고 자동화 복잡도가 증가할 때 서울 리전 자체 호스팅 방식으로 재검토한다.

| 책임 | 선택 | 리전·데이터 위치 | 비용 기준 | 비고 |
| --- | --- | --- | --- | --- |
| 리드·동의·발송 원장 | Supabase PostgreSQL | `ap-northeast-2` 서울 | 개발 Free, 운영 Pro 월 US$25부터 | 운영은 자동 백업과 비일시정지를 위해 Pro 사용 |
| PDF 원본 | Supabase Storage 비공개 버킷 | Supabase 서울 프로젝트 | Supabase 플랜에 포함된 용량 우선 사용 | 공개 고정 URL 금지, 만료 서명 링크 사용 |
| 예약 실행 | Supabase Cron (`pg_cron`) | Supabase 서울 프로젝트 | Supabase 플랜 범위 | 즉시, 2일, 4일, 6일 발송 대상 조회 |
| 발송 처리 | Supabase Edge Functions | Supabase 관리 런타임 | Supabase 플랜 범위 | 발송 직전 최신 동의와 중복 여부 확인 |
| 이메일 전송 | AWS SES | `ap-northeast-2` 서울 | Essentials 기준 1,000건당 US$0.16부터 | 도메인 인증과 샌드박스 해제 필요 |
| 전환 분석 | PostgreSQL의 자사 이벤트 원장 | Supabase 서울 프로젝트 | 추가 공급자 비용 없음 | 이메일 등 직접 식별자를 분석 이벤트에 저장하지 않음 |
| 워크플로 자동화 | 첫 출시에는 사용하지 않음 | 해당 없음 | US$0 | 도입 시 AWS 서울의 자체 호스팅 n8n 우선 검토 |

가격은 2026-08-05 공식 공개 가격을 기준으로 하며 세금, 환율, 초과 사용량, 도메인과 웹 호스팅 비용은 제외한다.

## 선택 이유

현재 자동화는 자료 전달 1회와 2·4·6일 차 코칭 이메일 3회로 고정되어 있다. Supabase Cron은 예약 작업을 실행하고 이력을 남길 수 있으므로 별도 자동화 서버 없이 요구사항을 충족한다. 이 구성은 초기 고정비, 운영 대상, 이메일 주소가 불필요하게 여러 공급자를 통과하는 범위를 줄인다.

AWS SES 서울 리전을 사용해 이메일 전송 경로를 한국 리전에 가깝게 유지한다. 다만 각 공급자의 지원·보안·결제 과정에서 발생할 수 있는 국외 처리 범위는 출시 전 개인정보처리방침과 공급자 약관으로 다시 확인한다. 이 문서는 법률 검토를 대체하지 않는다.

## 데이터 흐름

1. Next.js 서버가 이메일, 동의 버전, 유입정보를 검증한다.
2. Supabase PostgreSQL이 리드·동의·Outbox 이벤트를 한 트랜잭션으로 기록한다.
3. Supabase Cron이 미처리 또는 발송 예정 이벤트를 주기적으로 조회한다.
4. Edge Function이 최신 수신 동의, 수신 거부, 중복 발송 키를 확인한다.
5. Edge Function이 AWS SES 서울 엔드포인트로 이메일을 요청한다.
6. SES 전달·반송·신고 이벤트를 검증된 웹훅으로 받아 발송 원장에 반영한다.
7. 실패 이벤트는 제한된 횟수로 재시도하고 최종 실패는 운영 알림 대상으로 기록한다.

PostgreSQL을 리드, 동의, 발송 상태의 유일한 원본으로 사용한다. Cron, Edge Functions, SES는 원장의 상태를 임의로 최종 결정하지 않는다.

## 조회·철회·삭제 책임

- 수신 거부는 서명된 링크로 즉시 기록하며 이후 예약 발송보다 우선한다.
- 개인정보 열람·삭제 요청은 PostgreSQL의 리드, 동의, 발송 이력과 비공개 다운로드 권한을 하나의 내부 식별자로 조회해 처리한다.
- 법적 보존 의무가 없는 원본 이메일과 연결 데이터는 승인된 보유기간이 끝나면 삭제 또는 비식별화한다.
- SES의 반송·신고 목록에 남겨야 하는 억제 정보와 공급자 로그의 보존기간은 출시 전 개인정보 결정 문서에서 별도로 확정한다.
- 삭제 작업은 감사 가능한 요청번호, 처리 시각, 처리 범위만 남기고 삭제된 이메일 원문을 로그에 복제하지 않는다.

## 환경별 운영

| 환경 | Supabase | AWS SES | 책임 |
| --- | --- | --- | --- |
| 로컬 개발 | 별도 개발 프로젝트 또는 로컬 Supabase | SES 호출을 비활성화한 테스트 어댑터 | 개발자가 fixture로 검증하고 실제 주소로 발송하지 않음 |
| 스테이징 | 개발용 Supabase 프로젝트 | SES 샌드박스의 승인된 주소 | 프로젝트 소유자가 계정·결제를 소유하고 개발자가 설정을 검증 |
| 운영 | Pro 서울 프로젝트 | SES 서울 운영 권한 | 프로젝트 소유자가 계정·도메인을 소유하고 운영자가 키 교체와 장애 대응 |

운영 비밀값은 저장소에 커밋하지 않는다. AWS 장기 루트 자격증명을 사용하지 않고 SES 발송에 필요한 최소 권한만 부여한다.

## 확정된 공개 연결 정보

- 공개 사이트 및 canonical 기준 URL: `https://www.careerdirect.kr`
- 리드 마그넷 랜딩페이지 예정 URL: `https://www.careerdirect.kr/career-check`
- Career Direct 온라인 평가 CTA: `https://www.careerdirect.org/`
- 공식 사무실 주소: `경기도 의왕시 오봉산단1로 12, 에이스비전 21 10층 1012호`
- 컨설턴트 상담 CTA: 목적지 URL 확정 전까지 링크를 발행하지 않는다.

공개 전에는 `careerdirect.kr`의 DNS·HTTPS·소유권 연결과 `www`/루트 도메인 리디렉션을 검증한다.

## 환경변수 계약

정확한 이름은 구현 단계의 환경 검증 모듈과 `.env.example`에 다음 기준으로 반영한다.

| 변수 | 공개 여부 | 용도 |
| --- | --- | --- |
| `NEXT_PUBLIC_SITE_URL` | 공개 | `https://www.careerdirect.kr` — canonical, 콜백, 다운로드 링크의 기준 URL |
| `NEXT_PUBLIC_SUPABASE_URL` | 공개 | Supabase 프로젝트 URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | 공개 | RLS가 적용된 공개 클라이언트 요청 |
| `SUPABASE_SERVICE_ROLE_KEY` | 서버 전용 | 리드 원장과 비공개 Storage 관리 |
| `AWS_REGION` | 서버 전용 | `ap-northeast-2` 고정 |
| `AWS_ACCESS_KEY_ID` | 서버 전용 | 최소 권한 SES 발송 자격증명 |
| `AWS_SECRET_ACCESS_KEY` | 서버 전용 | 최소 권한 SES 발송 자격증명 |
| `SES_FROM_EMAIL` | 서버 전용 | 인증된 발신 주소 |
| `SES_REPLY_TO_EMAIL` | 서버 전용 | 승인된 회신 주소 |
| `EMAIL_WEBHOOK_SECRET` | 서버 전용 | 이메일 상태 이벤트 검증 |
| `DOWNLOAD_TOKEN_SECRET` | 서버 전용 | 만료 다운로드 토큰 서명 |

배포 환경이 AWS 역할 기반 자격증명을 지원하면 액세스 키 변수 대신 역할을 사용한다.

## n8n 도입 조건

다음 항목 중 2개 이상이 실제 범위에 들어오면 n8n 도입 결정을 다시 검토한다.

- 복수 리드 마그넷과 대상별 이메일 분기
- CRM 파이프라인과 컨설턴트 자동 배정
- 상담 예약과 리마인더
- 결제·워크숍 참여자 관리
- 블로그·뉴스레터 자동화
- 행동 기반 장기 고객 여정

도입 시 기본 선택은 AWS 서울 리전의 자체 호스팅 n8n Community Edition이다. 운영 책임에는 OS와 n8n 업데이트, TLS, 백업, 장애 감시, 비밀값 교체가 포함된다.

## 계정 생성 체크리스트

- 프로젝트 소유자 명의의 Supabase 조직 생성
- 운영 프로젝트를 `ap-northeast-2`로 생성하고 Pro 전환 시점 승인
- 프로젝트 소유자 명의의 AWS 계정과 결제·MFA 설정
- SES 서울 리전에서 발송 도메인과 DKIM 인증
- SPF와 DMARC DNS 레코드 설정
- SES 샌드박스 해제 신청
- 최소 권한 발송 자격증명 또는 역할 생성
- 반송·신고 이벤트 수신 경로 구성
- 운영 비밀값을 배포 환경의 Secret Store에 등록

## 공식 근거

- Supabase 가격: <https://supabase.com/pricing>
- Supabase 리전: <https://supabase.com/docs/guides/platform/regions>
- Supabase Cron: <https://supabase.com/docs/guides/cron>
- Edge Function 예약 실행: <https://supabase.com/docs/guides/functions/schedule-functions>
- AWS SES 리전: <https://docs.aws.amazon.com/general/latest/gr/ses.html>
- AWS SES 가격: <https://aws.amazon.com/ses/pricing/>
