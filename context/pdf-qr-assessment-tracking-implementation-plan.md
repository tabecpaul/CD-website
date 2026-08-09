# PDF QR 평가 CTA 추적 구현 계획

설계 기준: `docs/superpowers/specs/2026-08-09-pdf-qr-assessment-tracking-design.md`

## 1. 추적 리다이렉트 경로

### 1.1 서버 라우트 추가

- 파일: `apps/www/src/app/go/assessment/route.ts`
- `GET` 요청에서 `source=pdf_qr`를 허용한다.
- `recordAnalyticsEventSafely`로 `assessment_cta_clicked`를 기록한다.
- `ctaLocation=pdf_qr`, `path=/go/assessment`, UTM은 `pdf / qr / career_direction_check`로 고정한다.
- 방문 쿠키가 있으면 익명 방문 ID만 재사용한다.
- DB 기록 성공 여부와 관계없이 `https://careerdirect.org/?language_code=KO`로 307 리다이렉트한다.
- 외부 목적지를 요청 파라미터로 받지 않는다.

### 1.2 검증

- TypeScript 검사로 라우트 타입을 검증한다.
- 로컬 또는 배포 환경에서 Location 헤더와 상태 코드를 확인한다.
- 이벤트 행과 관리자 대시보드 집계를 확인한다.

## 2. 기존 평가 링크의 한국어 목적지 통일

### 2.1 랜딩페이지

- 파일: `apps/www/src/features/lead-magnet/components/CareerCheckLanding.tsx`
- 평가 관련 CTA 목적지를 `https://careerdirect.org/?language_code=KO`로 변경한다.
- `TrackedExternalLink` 추적은 유지한다.

### 2.2 후속 코칭 이메일

- 파일: `apps/www/src/features/lead-magnet/server/emailAutomation.ts`
- 3회차 평가 CTA 목적지를 같은 한국어 URL로 변경한다.

### 2.3 검증

- 저장소에서 구형 `https://www.careerdirect.org/` 운영 링크가 남아 있지 않은지 검색한다.
- 랜딩 CTA와 이메일 템플릿의 링크를 확인한다.

## 3. PDF QR 및 링크 교체

### 3.1 PDF 제작 원본 수정

- 파일: `tmp/pdfs/build_career_direction_workbook.py`
- QR 데이터와 클릭 링크를 `https://start.careerdirect.kr/go/assessment?source=pdf_qr`로 변경한다.
- 인쇄용 표기 `www.careerdirect.org`는 유지한다.

### 3.2 PDF 재생성

- PDF 스킬의 제작·렌더링·검증 절차를 따른다.
- 운영 산출물:
  - `apps/www/private-assets/career-direction-check-ko-v1.0.pdf`
  - `output/pdf/career-direction-check-ko-v1.0.pdf`
- 기존 12페이지와 페이지 크기를 유지한다.

### 3.3 PDF 검증

- PDF를 페이지 이미지로 렌더링해 마지막 CTA 페이지의 QR과 레이아웃을 확인한다.
- PDF 링크 주석의 목적지를 검사한다.
- QR을 디코딩해 자체 경유 주소와 정확히 일치하는지 확인한다.

## 4. 매니페스트 갱신

- 파일: `docs/content/career-check-pdf-manifest.md`
- QR 및 링크 목적지를 자체 경유 주소로 변경한다.
- 새 운영 PDF의 SHA-256을 기록한다.
- 온라인 평가 최종 목적지가 한국어 Career Direct 페이지임을 기록한다.

## 5. 품질 검증과 배포

1. `npx tsc --noEmit -p apps/www/tsconfig.json`
2. `npm run lint --workspace=www`
3. `npx next build --webpack` 또는 저장소의 검증된 웹 빌드 명령
4. 변경 파일만 커밋하고 `cdkorea/main`에 푸시
5. Vercel 배포 완료 후 다음 운영 검증
   - QR 경유 주소의 한국어 페이지 리다이렉트
   - 대시보드 CTA +1
   - UTM 표의 `pdf / qr / career_direction_check`
   - 새 신청 이메일에서 내려받은 PDF가 새 QR을 포함

## 완료 조건

- 웹 평가 CTA, 후속 이메일 평가 CTA, PDF QR이 모두 한국어 Career Direct 페이지로 연결된다.
- PDF QR 스캔이 익명 CTA 이벤트로 집계된다.
- 추적 실패가 외부 평가 페이지 이동을 막지 않는다.
- PDF 디자인, 다운로드 보안 및 기존 전환 흐름에 회귀가 없다.
