# Career Direct Korea 청년 직장인 리드 마그넷 구현 계획

- 기준 설계: `docs/superpowers/specs/2026-08-05-young-professional-lead-magnet-design.md`
- 계획 작성일: 2026-08-05
- 구현 대상: `apps/www`
- 원칙: 한 번에 하나의 작은 변경을 구현하고 해당 검증을 통과한 뒤 다음 작업으로 이동한다.
- 현재 문서는 구현 계획이며 제품 코드를 포함하지 않는다.

## 0. 구현 전 게이트

### 0.1 개인정보와 동의 결정

- 생성: `docs/decisions/lead-magnet-consent.md`
- 결정: PDF 전달을 위한 개인정보 처리의 근거, 코칭 이메일의 선택 동의 여부, 정책 버전, 보유기간, 철회와 삭제 방법
- 완료 조건: 서비스 이메일과 마케팅 이메일 목적이 분리되고 실제 폼 문구가 승인됨
- 검증: 동의, 거부, 철회, 재동의 사례 리뷰

### 0.2 공급자 결정

- 생성: `docs/decisions/lead-magnet-providers.md`
- 결정: Supabase 프로젝트·리전, 이메일 공급자, n8n 운영 방식, 분석 도구, 공개 도메인
- 완료 조건: 환경변수 이름, 웹훅 기능, 삭제 기능, 비용, 데이터 위치가 표로 확정됨
- 검증: 개발·스테이징·운영 환경별 연결 책임자 확인

### 0.3 콘텐츠 사실 검증

- 생성: `docs/content/career-check-evidence.md`
- 작업: 통계 원문 링크, 조사 시점·표본, Career Direct 공식 수치, 상표 문구를 검증
- 완료 조건: 랜딩페이지에 사용하는 모든 수치가 발행 가능한 상태임
- 검증: 검증되지 않은 수치는 콘텐츠 목록에서 제외

### 0.4 무료 PDF 확정

- 목표 파일: `apps/www/private-assets/career-direction-check-ko-v1.pdf`
- 생성: `docs/content/career-check-pdf-manifest.md`
- 작업: 8~12페이지 요약본의 제목, 버전, 페이지 구성, 파일 해시, 공개 가능 범위 승인
- 완료 조건: 전체 46페이지 워크숍 워크북과 무료 PDF가 명확히 구분됨
- 검증: PDF 전체 페이지 시각 검토, 링크·맞춤법·저작권 확인

## Phase 1. 프로젝트 계약과 테스트 기반

### 1.1 Next.js 16 로컬 문서 확인

- 읽기: `apps/www/node_modules/next/dist/docs/` 또는 루트에 설치된 동일 버전 문서
- 확인 주제: App Router, Metadata, Route Handler, Server Actions 선택 기준, robots, sitemap, error boundary
- 산출물: 계획 수행 메모에 사용 API와 사용하지 않을 deprecated API 기록
- 검증: Next.js 16.3.0 문서와 구현 방식 일치

### 1.2 환경변수 계약

- 생성: `apps/www/.env.example`
- 생성: `apps/www/src/lib/env/server.ts`
- 생성: `apps/www/src/lib/env/public.ts`
- 책임: 서버 전용 Supabase·이메일·웹훅 값과 공개 사이트 URL·분석 ID 분리
- 완료 조건: 누락된 필수 값은 시작 시 명확한 오류를 냄
- 검증: 비밀 키가 Client Component 번들에 포함되지 않음

### 1.3 테스트 명령과 디렉터리

- 수정: `apps/www/package.json`
- 생성: `apps/www/vitest.config.ts`
- 생성: `apps/www/src/test/setup.ts`
- 생성: `apps/www/e2e/`
- 책임: 단위·통합·핵심 브라우저 흐름 테스트 명령 제공
- 완료 조건: 빈 테스트 스위트가 아니라 첫 계약 테스트가 실행됨
- 검증: lint, typecheck, unit, build 명령을 독립 실행

### 1.4 도메인 타입

- 생성: `apps/www/src/features/lead-magnet/domain/types.ts`
- 생성: `apps/www/src/features/lead-magnet/domain/events.ts`
- 생성: `apps/www/src/features/lead-magnet/domain/errors.ts`
- 책임: 입력, 동의, 유입정보, 등록 결과, 도메인 오류, 이벤트 이름과 버전 정의
- 완료 조건: UI, DB, 자동화 계층이 동일한 계약 사용
- 검증: 타입 검사와 이벤트 fixture 테스트

## Phase 2. 콘텐츠와 페이지 구조

### 2.1 라우트 셸

- 생성: `apps/www/src/app/career-check/page.tsx`
- 생성: `apps/www/src/app/career-check/loading.tsx`
- 생성: `apps/www/src/app/career-check/error.tsx`
- 생성: `apps/www/src/app/career-check/thank-you/page.tsx`
- 생성: `apps/www/src/app/privacy/page.tsx`
- 생성: `apps/www/src/app/unsubscribe/page.tsx`
- 책임: 승인된 공개 경로와 기본 서버 렌더링 구조 제공
- 완료 조건: 모든 경로가 직접 접근과 새로고침에서 정상 응답
- 검증: 라우트별 status, title, heading 테스트

### 2.2 랜딩페이지 조립 경계

- 생성: `apps/www/src/features/lead-magnet/components/CareerCheckLanding.tsx`
- 생성: `apps/www/src/features/lead-magnet/content/ko.ts`
- 책임: 섹션 순서와 한국어 콘텐츠를 한 곳에서 관리하되 인터랙션은 필요한 컴포넌트에만 격리
- 완료 조건: 페이지 자체는 Server Component로 유지
- 검증: JavaScript 실패 시에도 핵심 콘텐츠가 HTML에 존재

### 2.3 Hero와 폼 레이아웃

- 생성: `apps/www/src/features/lead-magnet/components/HeroSection.tsx`
- 생성: `apps/www/src/features/lead-magnet/components/LeadCaptureForm.tsx`
- 책임: 승인된 질문형 제목, 부제, 이메일 한 필드, 동의, CTA, 보조 문구 구현
- 완료 조건: 모바일에서 제목 직후 폼이 보이고 데스크톱에서 2열 구성
- 검증: 360px, 768px, 1280px 시각·접근성 확인

### 2.4 현실 인식과 근거

- 생성: `apps/www/src/features/lead-magnet/components/RealitySection.tsx`
- 생성: `apps/www/src/features/lead-magnet/content/evidence.ts`
- 책임: 승인된 통계 3개와 출처 링크, 조사 시점, 필요한 표본 정보 표시
- 완료 조건: 근거 없는 수치가 컴포넌트 안에 하드코딩되지 않음
- 검증: 모든 외부 링크와 표시 문구 대조

### 2.5 PDF 미리보기

- 생성: `apps/www/src/features/lead-magnet/components/WorkbookPreviewSection.tsx`
- 생성: `apps/www/public/images/career-check/`
- 책임: 무료 PDF 표지·샘플 페이지와 얻는 결과 3개 표시
- 완료 조건: 무료 요약본과 전체 워크숍 워크북이 오인되지 않음
- 검증: 이미지 선명도, alt text, 모바일 용량 확인

### 2.6 네 나침반

- 이동·수정 또는 재사용: `apps/www/src/components/sections/CareerDirect.tsx`
- 권장 생성: `apps/www/src/features/lead-magnet/components/FourCompassesSection.tsx`
- 책임: 기존 시각 강점을 유지하면서 성격·흥미·재능·가치관 질문을 청년 직장인 맥락으로 표현
- 완료 조건: 기존 컴포넌트와 중복 데이터 정의가 없음
- 검증: 작은 화면에서 카드 겹침과 잘림 없음

### 2.7 6단계 여정

- 생성: `apps/www/src/features/lead-magnet/components/JourneySection.tsx`
- 책임: 현실 인식 → 자가진단 → 평가 → 보고서·코칭 → 인터랙티브 실행계획 → 이후 코칭 표시
- 완료 조건: 무료 제공 범위와 유료·후속 여정 구분
- 검증: 단계 순서와 CTA 대상이 설계 문서와 일치

### 2.8 신뢰·후기·FAQ·최종 CTA

- 생성: `apps/www/src/features/lead-magnet/components/TrustSection.tsx`
- 생성: `apps/www/src/features/lead-magnet/components/FaqSection.tsx`
- 생성: `apps/www/src/features/lead-magnet/components/FinalCtaSection.tsx`
- 조건부 생성: `apps/www/src/features/lead-magnet/components/TestimonialsSection.tsx`
- 책임: 검증된 신뢰 요소, 승인된 FAQ, 동일 이메일 CTA 반복
- 완료 조건: 승인된 실제 후기가 없으면 후기 섹션 렌더링 안 함
- 검증: Hero와 최종 CTA의 폼 목적·동의·이벤트 일치

### 2.9 실제 브랜드 Footer

- 수정 또는 분기: `apps/www/src/components/sections/Footer.tsx`
- 생성: `apps/www/public/brand/`
- 책임: 승인 로고, 공식 문의처, 개인정보처리방침, 수신 거부, 상표 표시
- 완료 조건: 임시 `CD` 문자 로고 제거
- 검증: 로고 자산 승인과 접근성 이름 확인

## Phase 3. SEO와 접근성

### 3.1 페이지 메타데이터

- 수정: `apps/www/src/app/layout.tsx`
- 수정: `apps/www/src/app/career-check/page.tsx`
- 생성: `apps/www/src/app/opengraph-image.tsx` 또는 승인된 정적 이미지
- 책임: 고유 title, description, canonical, Open Graph, 공유 카드
- 완료 조건: 기본 브랜드 페이지와 캠페인 페이지 메타데이터가 구분됨
- 검증: 렌더된 head와 공유 이미지 확인

### 3.2 검색 엔진 파일

- 생성: `apps/www/src/app/robots.ts`
- 생성: `apps/www/src/app/sitemap.ts`
- 책임: 공개 페이지 인덱싱과 감사·수신 거부 페이지 제외 정책
- 완료 조건: 환경별 도메인이 정확함
- 검증: 생성 XML·robots 내용 확인

### 3.3 구조화 데이터

- 생성: `apps/www/src/features/lead-magnet/components/StructuredData.tsx`
- 책임: 실제 페이지와 일치하는 Organization, WebPage, FAQ 정보만 제공
- 완료 조건: 보이지 않는 주장이나 허위 리뷰 마크업 없음
- 검증: 구조화 데이터 validator용 JSON 검사

### 3.4 접근성과 모션

- 수정: `apps/www/src/app/globals.css`
- 수정: 모든 새 인터랙티브 컴포넌트
- 책임: focus-visible, 오류 연결, 충분한 대비, reduced motion, 키보드 흐름
- 완료 조건: 애니메이션 없이 콘텐츠 접근 가능
- 검증: axe, 키보드 수동 테스트, 색상 대비 점검

## Phase 4. 데이터와 리드 등록

### 4.1 데이터베이스 마이그레이션

- 생성: `supabase/migrations/0001_lead_magnet.sql`
- 대상: persons 또는 leads, contact points, consent purposes, consent records, touchpoints, outbox events, download grants
- 책임: 이메일 원본, 동의 버전, 유입, 이벤트를 원자적으로 기록
- 완료 조건: 고유 정규화 이메일과 이벤트 idempotency 제약 존재
- 검증: 신규, 중복, 철회, 재동의 SQL 시나리오

### 4.2 서버 데이터 접근

- 생성: `apps/www/src/lib/supabase/server.ts`
- 생성: `apps/www/src/features/lead-magnet/server/repository.ts`
- 책임: Supabase 서버 클라이언트와 리드 전용 repository 제공
- 완료 조건: Client Component가 DB 또는 service role key에 직접 접근하지 않음
- 검증: 서버 모듈 경계와 mock repository 단위 테스트

### 4.3 입력 검증

- 생성: `apps/www/src/features/lead-magnet/server/schema.ts`
- 책임: 이메일 정규화, 동의 버전, UTM allowlist, honeypot, 요청 크기 검증
- 완료 조건: 브라우저 검증을 우회해도 잘못된 입력이 저장되지 않음
- 검증: 유니코드·공백·대소문자·과도한 길이·누락 입력 테스트

### 4.4 등록 서비스

- 생성: `apps/www/src/features/lead-magnet/server/captureLead.ts`
- 책임: 검증, 중복 처리, 동의 갱신, touchpoint, Outbox를 하나의 사용사례로 조합
- 완료 조건: DB 성공 전 성공 결과를 반환하지 않음
- 검증: 신규, 중복, 수신 거부, DB 장애, 동시 제출 테스트

### 4.5 폼 서버 엔드포인트

- 생성: `apps/www/src/app/api/lead-magnet/route.ts`
- 책임: HTTP 경계, CSRF·origin 검증, 속도 제한, 일관된 오류 응답
- 완료 조건: 내부 오류와 PII를 응답에 노출하지 않음
- 검증: status code, 오류 코드, rate limit, 잘못된 origin 테스트

### 4.6 UTM과 익명 세션

- 생성: `apps/www/src/features/lead-magnet/analytics/attribution.ts`
- 생성: `apps/www/src/features/lead-magnet/analytics/session.ts`
- 책임: 허용 UTM, first/latest touch, 개인정보 동의 전 최소 세션 처리
- 완료 조건: 이메일을 분석 식별자로 사용하지 않음
- 검증: 직접 방문, 캠페인 재방문, 잘못된 UTM 테스트

## Phase 5. PDF 전달

### 5.1 비공개 파일 저장

- 작업: 승인 PDF를 비공개 Supabase Storage bucket에 업로드
- 생성: `docs/runbooks/lead-magnet-pdf-publish.md`
- 책임: 버전, 파일 해시, 롤백, 접근 정책 기록
- 완료 조건: 공개 고정 URL로 접근 불가
- 검증: 인증 없는 직접 접근 거부

### 5.2 다운로드 토큰

- 생성: `apps/www/src/features/lead-magnet/server/downloadGrant.ts`
- 생성: `apps/www/src/app/api/lead-magnet/download/route.ts`
- 책임: 리드 등록 결과와 연결된 만료 토큰을 서명 링크로 교환
- 완료 조건: 만료·변조·재사용 정책이 명확함
- 검증: 정상, 만료, 변조, 다른 리드 토큰 테스트

### 5.3 감사 페이지

- 수정: `apps/www/src/app/career-check/thank-you/page.tsx`
- 생성: `apps/www/src/features/lead-magnet/components/DownloadCard.tsx`
- 책임: 즉시 다운로드, 이메일 전달 안내, 다음 일정 설명
- 완료 조건: 직접 URL 접근으로 PDF를 얻지 못함
- 검증: 유효 토큰, 누락 토큰, 만료 토큰 화면

## Phase 6. 이메일과 n8n

### 6.1 이메일 콘텐츠 승인

- 생성: `content/email/lead-magnet/ko/delivery.md`
- 생성: `content/email/lead-magnet/ko/coaching-1.md`
- 생성: `content/email/lead-magnet/ko/coaching-2.md`
- 생성: `content/email/lead-magnet/ko/coaching-3.md`
- 책임: 자료 전달, 2·4·6일 차 질문과 행동, CTA, 수신 거부 문구
- 완료 조건: 각 코칭 메일은 질문 1개와 행동 1개만 포함
- 검증: 모바일·다크모드 이메일 미리보기와 링크 검사

### 6.2 Outbox 전달기

- 생성: `apps/www/src/features/lead-magnet/server/publishOutbox.ts` 또는 선택한 인프라의 예약 작업
- 책임: 미전달 이벤트를 n8n 웹훅으로 전달하고 성공·재시도 상태 기록
- 완료 조건: DB 저장과 n8n 호출의 부분 실패를 복구 가능
- 검증: timeout, 5xx, 중복 응답, 재시도 테스트

### 6.3 n8n 워크플로

- 생성: `automation/n8n/lead-magnet-delivery.json`
- 생성: `automation/n8n/lead-magnet-coaching-sequence.json`
- 생성: `docs/runbooks/n8n-lead-magnet.md`
- 책임: 즉시 자료 전달, 2·4·6일 예약, 발송 전 최신 동의 확인
- 완료 조건: 동일 리드·여정 버전의 중복 발송 없음
- 검증: 시간 가속 테스트, 중도 수신 거부, 재동의, 공급자 장애

### 6.4 이메일 웹훅

- 생성: `apps/www/src/app/api/webhooks/email/route.ts`
- 생성: `apps/www/src/features/lead-magnet/server/emailWebhook.ts`
- 책임: 서명 검증, 전달·반송·열람·클릭·수신 거부 이벤트 처리
- 완료 조건: 수신 거부가 이후 모든 코칭 발송보다 우선함
- 검증: 위조 서명, 중복 이벤트, 순서 역전 테스트

### 6.5 수신 거부

- 수정: `apps/www/src/app/unsubscribe/page.tsx`
- 생성: `apps/www/src/app/api/unsubscribe/route.ts`
- 책임: 로그인 없이 서명 토큰으로 수신 거부하고 증거 기록
- 완료 조건: 한 번의 명확한 행동으로 즉시 처리
- 검증: 정상, 만료, 변조, 반복 요청 테스트

## Phase 7. 분석과 운영 관찰

### 7.1 클라이언트 분석 경계

- 생성: `apps/www/src/features/lead-magnet/analytics/client.ts`
- 생성: `apps/www/src/features/lead-magnet/analytics/events.ts`
- 책임: 설계된 이벤트만 allowlist로 전송하고 PII 금지
- 완료 조건: 이벤트 payload에 이메일·전화번호·자유입력 없음
- 검증: 이벤트 snapshot과 PII 탐지 테스트

### 7.2 서버 이벤트

- 수정: 등록, 다운로드, 웹훅 사용사례
- 책임: 성공·실패·다운로드·수신 거부를 신뢰 가능한 서버 이벤트로 기록
- 완료 조건: 클라이언트 이벤트만으로 전환 성공을 계산하지 않음
- 검증: 브라우저 차단 상태에서도 성공 이벤트 기록

### 7.3 전환 집계

- 생성: `supabase/migrations/0002_lead_magnet_metrics.sql`
- 생성: `docs/analytics/lead-magnet-kpis.md`
- 책임: 고유 방문, 유효 리드, 중복·봇 제외 규칙, 20% KPI 정의
- 완료 조건: 샘플 데이터 수기 계산과 쿼리 결과 일치
- 검증: 중복 방문·재제출·봇 시나리오 fixture

### 7.4 운영 알림

- 생성: `docs/runbooks/lead-magnet-operations.md`
- 책임: DB 오류, Outbox 적체, 이메일 반송 급증, PDF 오류 대응 절차
- 완료 조건: 경보 임계치와 담당자, 재처리 방법이 있음
- 검증: 장애 모의훈련 체크리스트

## Phase 8. 전체 검증과 출시

### 8.1 단위·통합 테스트

- 대상: schema, captureLead, repository, downloadGrant, webhook, attribution
- 완료 조건: 정상뿐 아니라 거부·장애·중복 경로 포함
- 검증: 테스트 커버리지보다 핵심 위험 시나리오 통과를 우선

### 8.2 브라우저 흐름

- 생성: `apps/www/e2e/career-check.spec.ts`
- 시나리오: 방문 → 이메일 입력 → 동의 → 성공 → 감사 페이지 → PDF 다운로드
- 추가: 중복 이메일, 오류 복구, 키보드, 모바일
- 완료 조건: 실제 라우트와 테스트 DB를 사용
- 검증: CI에서 독립 실행

### 8.3 품질 게이트

- 실행: lint, typecheck, unit, e2e, build
- 실행: 접근성, 링크, 메타데이터, robots, sitemap, 구조화 데이터 검사
- 실행: 로그와 분석 이벤트 PII 검사
- 완료 조건: P0·P1 결함 없음

### 8.4 스테이징 실발송

- 대상: 승인된 내부 테스트 이메일
- 작업: 자료 전달과 2·4·6일 코칭을 시간 가속으로 검증
- 완료 조건: 링크, 수신 거부, 모바일 렌더링, 발신자 정보, 반송 처리 확인

### 8.5 제한 출시

- 작업: 한 개 캠페인 또는 제한된 청년 직장인 트래픽으로 시작
- 관찰: 전환율, 오류율, PDF 다운로드, 이메일 반송, 수신 거부, CTA 클릭
- 완료 조건: 데이터 정합성과 발송 안전성이 확인된 뒤 트래픽 확대

## 커밋 단위 권장 순서

1. `docs: decide lead magnet consent and providers`
2. `chore: add lead magnet test and environment contracts`
3. `feat: add career check landing content`
4. `feat: add lead capture persistence and consent`
5. `feat: add secure workbook download`
6. `feat: add lead magnet email automation`
7. `feat: add lead magnet analytics and SEO`
8. `test: cover lead magnet conversion journey`
9. `docs: add lead magnet operations runbook`

각 커밋은 해당 단계의 lint·typecheck·관련 테스트를 통과한 뒤 생성한다. 사용자 소유의 미추적 로고·PDF·마케팅 파일은 명시적인 승인 없이 스테이징하지 않는다.
