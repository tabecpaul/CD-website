# 청년 직장인 진로 방향 파일럿 캠페인 키트 구현 계획

명세: `context/career-direction-pilot-campaign-kit-spec.md`  
설계: `docs/superpowers/specs/2026-08-10-career-direction-pilot-campaign-kit-design.md`

`utm_content` DB 마이그레이션을 운영 DB에 적용하기 전에는 기능 코드를 Production에 푸시하지 않는다. 광고 소재는 코드 배포와 독립적으로 제작하되 최종 링크 검증은 배포 후 수행한다.

## Phase 0. 기준과 자산 확인

### Task 0.1 — 저장소 상태와 브랜드 자산

- 확인: Git 상태, 최근 배포 커밋, 사용자 미추적 파일.
- 읽기:
  - 기존 Career Direct 로고 파일
  - 완성된 12페이지 PDF
  - 랜딩페이지 색상·폰트 토큰
  - 확정 캠페인 설계
- 사용자 소유 EPS, `.superpowers/`, `output/`, `tmp/`를 수정하지 않는다.
- 캠페인 산출물은 `campaigns/career-direction-pilot-2026q3/`에 새로 만든다.
- 검증: 로고 출처, PDF 경로, 브랜드 색상 기록.

## Phase 1. `utm_content` 스키마

### Task 1.1 — DB 컬럼과 인덱스

- 수정: `packages/db/src/schema.ts`.
- 추가:
  - `lead_magnet_leads.utm_content varchar(128)`
  - `analytics_events.utm_content varchar(128)`
  - `assessment_callback_requests.utm_content varchar(128)`
- analytics UTM 인덱스에 content를 포함한다.
- 검증: 기존 insert와 null 데이터 호환.

### Task 1.2 — Drizzle 마이그레이션

- 실행: `npm run db:generate --workspace=@newland/db`.
- 예상: `packages/db/drizzle/0010_*.sql`과 meta 갱신.
- 삭제·rename 없음과 인덱스 변경을 확인한다.
- DB 패키지 타입검사를 실행한다.

## Phase 2. UTM 수집과 전파

### Task 2.1 — Attribution 타입

- 수정: `apps/www/src/features/analytics/server/events.ts`.
- `Attribution`, public event parser, first attribution에 `utmContent`를 추가한다.
- 기존 길이 제한·민감정보 검사를 재사용한다.
- 검증: 정상, 128자 초과, 이메일·전화번호 포함, null.

### Task 2.2 — 클라이언트 추적

- 확인·수정:
  - page view tracker
  - tracked links와 이벤트 payload
  - URLSearchParams UTM helper
- URL의 `utm_content`를 읽어 landing event에 저장한다.
- 후속 이벤트가 첫 attribution을 상속한다.
- 검증: query 있음/없음, 새로고침, 직접 유입.

### Task 2.3 — PDF 리드 저장

- 수정:
  - lead magnet validation/API
  - lead insert
  - 관련 attribution 타입
- PDF 신청 row에 `utmContent`를 저장한다.
- 클라이언트가 임의 개인정보를 UTM에 넣지 못하도록 서버 검증한다.
- 검증: 정상 신청, 기존 폼, 중복 신청.

### Task 2.4 — 콜백 저장

- 수정:
  - assessment callback validation/API
  - attribution fallback
- 콜백 row에 `utmContent`를 저장한다.
- 익명 ID 연결과 테스트 제외 로직을 유지한다.
- 검증: URL attribution, first attribution fallback, null.

## Phase 3. 분석 대시보드

### Task 3.1 — UTM query 확장

- 수정: `apps/www/src/features/analytics/server/dashboard.ts`.
- UTM 집계를 source·medium·campaign·content로 그룹화한다.
- null/빈 content는 `(none)`으로 표시한다.
- 테스트 익명 ID 제외 조건을 그대로 적용한다.
- 검증: content A/B 분리, 기존 데이터 합계, 테스트 제외.

### Task 3.2 — 소재 열 UI

- 수정: `apps/www/src/app/admin/analytics/page.tsx`.
- 유입 성과 표에 `소재` 열을 추가한다.
- 모바일 가로 스크롤과 긴 content 말줄임을 확인한다.
- 검증: `(none)`, A/B 행, 전환율 계산.

## Phase 4. 캠페인 링크와 QR

### Task 4.1 — 링크 manifest

- 새 파일: `campaigns/career-direction-pilot-2026q3/links/campaign-links.csv`.
- 각 행에 channel, distribution, creative, source, medium, campaign, content, full_url, qr_filename을 기록한다.
- 무료·유료 Meta와 네이버, Threads, 교회, 대학을 모두 포함한다.
- URL encoding과 중복 content를 검증한다.

### Task 4.2 — 생성 스크립트

- 새 파일: `campaigns/career-direction-pilot-2026q3/source/generate-links-and-qr.py`.
- manifest 또는 단일 설정에서 CSV와 QR PNG·SVG를 재현 가능하게 생성한다.
- QR quiet zone, 1200px PNG, SVG 원본을 보장한다.
- 검증: QR decode 결과와 CSV URL의 바이트 단위 일치.

### Task 4.3 — 운영 README

- 새 파일: `campaigns/career-direction-pilot-2026q3/README.md`.
- 채널별 사용할 링크·소재·문구, 무료/유료 구분, 게시 전 체크리스트를 작성한다.
- 광고 집행이나 게시 자동화가 포함되지 않음을 명시한다.

## Phase 5. 카피 제작

### Task 5.1 — Instagram/Facebook

- 새 파일: `copy/instagram-facebook.md`.
- 무료 게시용 2종과 유료 광고용 primary text·headline·description 각 2종.
- A/B 소재별 `utm_content` 링크를 연결한다.
- 무료 PDF와 유료 평가·컨설팅을 혼동하지 않게 쓴다.

### Task 5.2 — Threads

- 새 파일: `copy/threads.md`.
- 질문·관찰·자가점검·워크북 소개 흐름의 글 6개.
- 복제형 홍보문보다 대화형 문장과 단일 링크를 사용한다.

### Task 5.3 — 네이버 블로그

- 새 파일:
  - `copy/naver-blog-01.md`
  - `copy/naver-blog-02.md`
- 검색 의도, 소제목, 본문, CTA, 이미지 삽입 위치, 메타 설명을 포함한다.
- 과도한 키워드 반복과 확인되지 않은 통계를 피한다.

### Task 5.4 — 교회·대학

- 새 파일:
  - `copy/church.md`
  - `copy/university.md`
- 교회는 하나님이 지으신 나와 소명 분별을 명시한다.
- 대학은 자기이해와 진로불안 중심으로 쓴다.
- 담당자 전달용 짧은 안내문도 포함한다.

## Phase 6. 시각 소재 제작

### Task 6.1 — 공감 인물형 원본

- 이미지 생성 도구를 사용해 한국인 청년 직장인의 자연스러운 장면을 제작한다.
- 과도한 우울, 의료적 번아웃 표현, 특정 회사·브랜드 로고를 피한다.
- 텍스트는 생성 이미지에 직접 포함하지 않고 후편집 레이아웃에 배치한다.
- 검증: 손·얼굴 왜곡, 스톡 워터마크, 브랜드 침해 없음.

### Task 6.2 — 타이포형·워크북형 원본

- 브랜드 팔레트와 랜딩페이지 타이포 위계를 사용한다.
- 워크북형은 실제 PDF 표지를 재사용하거나 정확한 목업으로 만든다.
- 확정된 4가지 나침반 문구를 그대로 사용한다.

### Task 6.3 — Meta·Threads export

- 제작:
  - 1080×1080 피드 A/B
  - 1080×1920 스토리 A/B
  - Threads 타이포 1080×1350 2종
- PNG와 경량 JPG를 export한다.
- 안전 영역과 모바일 가독성을 렌더링 검증한다.

### Task 6.4 — 네이버 이미지

- 제작:
  - 1200×628 대표 이미지
  - 본문 카드 이미지 3개
- 워크북 실물형 CTA를 포함한다.

### Task 6.5 — 교회·대학 포스터

- 제작:
  - A4 세로 PDF 각 1종
  - 1080×1350 모바일 공지 이미지 각 1종
- 공식 로고와 채널별 QR을 배치한다.
- PDF를 이미지로 렌더링해 실제 크기 가독성과 QR 스캔을 확인한다.

## Phase 7. 검증과 운영 적용

### Task 7.1 — 코드 검증

- 실행:
  - DB·웹 TypeScript
  - ESLint
  - Next.js production build
  - `git diff --check`
- 민감정보와 잘못된 UTM 필드를 검색한다.

### Task 7.2 — 수동 DB 적용

- 사용자가 `0010_*.sql`을 Supabase SQL Editor에서 실행한다.
- 확인 전 코드 push 금지.

### Task 7.3 — 배포·추적 검증

- `cdkorea/main`에 push하고 Vercel 배포를 확인한다.
- 각 A/B 테스트 URL을 방문해 대시보드 소재 열을 확인한다.
- 테스트 이벤트는 테스트 콜백 표시 후 분석에서 제외되는지 확인한다.

### Task 7.4 — 파일 검수

- 모든 PNG/JPG의 크기와 색상 확인.
- QR 전수 decode 및 실제 휴대전화 스캔.
- A4 PDF 렌더링 검수.
- 링크 CSV와 README 일치 확인.
- 배포 가능한 캠페인 폴더 목록을 사용자에게 전달한다.
