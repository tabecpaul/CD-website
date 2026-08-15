# 콘텐츠 배포 고도화 및 관리자 운영·알림 시스템 구현 계획

## 목표

기존 일반 블로그 6편에 카드뉴스 48장·대체 텍스트·검수된 UTM·ZIP을 추가하고, 운영 중인 공식 사이트 관리자 영역에 9편의 채널별 게시 일정·상태·문안·성과와 이메일 알림을 관리하는 `/admin/content` 기능을 구축한다.

기준 설계: `docs/superpowers/specs/2026-08-15-content-operations-and-distribution-upgrade-design.md`

## 구현 순서

작업은 두 단계로 분리한다.

1. 배포 자료 고도화: 콘텐츠 파일만 수정·검수·ZIP 제작
2. 관리자 운영 시스템: DB → 도메인 → 초기 데이터 → API → UI → 알림 → 모니터링 → 배포 검증

각 단계는 별도 커밋으로 남긴다. 기존 사용자 변경사항과 `campaigns/faith-calling-series-2026q3`는 수정하지 않는다.

## 1단계: 기존 6편 배포 자료 고도화

### 작업 1. 공식 원문·기존 파생 원고·CTA 대조

**읽을 파일**

- `apps/www/src/content/blog/ko/why-career-anxiety-and-burnout.mdx`
- `apps/www/src/content/blog/ko/four-career-compasses.mdx`
- `apps/www/src/content/blog/ko/should-i-change-jobs.mdx`
- `apps/www/src/content/blog/ko/ai-job-anxiety-checklist.mdx`
- `apps/www/src/content/blog/ko/what-i-like-vs-what-i-do-well.mdx`
- `apps/www/src/content/blog/ko/before-career-transition.mdx`
- `campaigns/blog-launch-2026q3/copy/naver-blog/*.md`
- `campaigns/blog-launch-2026q3/copy/instagram-facebook.md`
- `campaigns/blog-launch-2026q3/copy/threads.md`
- `campaigns/blog-launch-2026q3/links/campaign-links.csv`

**수행**

각 글의 핵심 주장, 근거, 발행일, CTA 종류, 공식 원문 경로를 표로 대조한다. 기존 파생 원고에 현재 원문과 충돌하는 문장이나 CTA가 있는지 표시한다.

**검증**

- 6편 각각 하나의 CTA가 공식 metadata와 일치한다.
- 실재 고객 개인정보나 확인되지 않은 사례가 없다.

### 작업 2. 카드뉴스 48장·캡션·대체 텍스트 작성

**수정 파일**

- `campaigns/blog-launch-2026q3/copy/instagram-facebook.md`

**수행**

각 콘텐츠 섹션에 8장 카드뉴스 문안을 추가한다. 흐름은 표지 → 문제 → 관점 전환 → 핵심 기준 → 적용 → 단일 CTA로 구성한다. 기존 캡션은 공식 원문과 다시 대조하고 편당 대체 텍스트를 추가한다.

**검증**

```bash
test "$(rg -c '^\*\*[1-8]장' campaigns/blog-launch-2026q3/copy/instagram-facebook.md)" = 48
```

캡션 6개와 대체 텍스트 6개가 있으며 각 카드의 문안이 한 화면에 적합한 길이인지 수동 검토한다.

### 작업 3. 네이버·Threads·UTM 통합 검수

**검수 후 필요한 경우만 수정할 파일**

- `campaigns/blog-launch-2026q3/copy/naver-blog/*.md`
- `campaigns/blog-launch-2026q3/copy/threads.md`
- `campaigns/blog-launch-2026q3/links/campaign-links.csv`
- `campaigns/blog-launch-2026q3/checklist.md`
- `campaigns/blog-launch-2026q3/launch-plan.md`

**수행**

공식 원문과 CTA 변경이 확인된 부분만 수정한다. 체크리스트에 카드 8장, 대체 텍스트, 단일 CTA와 모바일 검수 항목을 추가한다. 링크 CSV의 모든 URL을 파싱해 UTM 필드와 목적지를 검증한다.

**검증**

- 네이버 6편과 Threads 6세트가 있다.
- CSV 모든 행의 열 수와 UTM 4개 필드가 정확하다.
- `git diff --check`가 통과한다.

### 작업 4. 일반 블로그 배포 ZIP 제작

**생성 파일**

- `output/career-direct-korea-blog-launch-2026q3.zip`

**수행**

`campaigns/blog-launch-2026q3` 폴더만 ZIP에 포함한다. `.DS_Store`, 임시 파일과 다른 캠페인은 제외한다.

**검증**

```bash
unzip -t output/career-direct-korea-blog-launch-2026q3.zip
unzip -l output/career-direct-korea-blog-launch-2026q3.zip
```

## 2단계: 관리자 콘텐츠 운영 시스템

### 작업 5. 콘텐츠 운영 도메인 정의

**생성 파일**

- `apps/www/src/features/content-operations/domain.ts`
- `apps/www/src/features/content-operations/server/time.ts`

**수행**

- 채널: `naver_blog`, `instagram`, `facebook`, `threads`
- 저장 상태: `draft`, `ready`, `published`, `performance_checked`
- 계산 상태: `due`, `overdue`
- 알림 종류: `day_before`, `publish_soon`, `performance_followup`
- 한국어 라벨과 상태 전환 규칙
- KST 발행 시각을 UTC로 변환하고 표시하는 함수
- 게시 URL과 음수 없는 성과 값 검증 함수

**검증**

잘못된 채널·상태·URL·음수 성과를 거부하고, 8월 일정이 기대한 UTC 시각으로 변환되는지 확인한다.

### 작업 6. DB 스키마와 마이그레이션 추가

**수정 파일**

- `packages/db/src/schema.ts`

**생성 파일**

- `packages/db/drizzle/0013_content_operations.sql`
- `packages/db/drizzle/meta/0013_snapshot.json`

**테이블**

- `content_operation_items`
- `content_channel_tasks`
- `content_notification_deliveries`
- `content_performance_snapshots`

**핵심 제약**

- 콘텐츠 slug unique
- 콘텐츠와 채널 조합 unique
- 알림 중복 키 unique
- 채널 작업과 성과는 부모 삭제 시 cascade
- 조회용 발행 시각·상태·알림 상태 인덱스
- 성과 수치에 음수 방지 check constraint

**수행**

Drizzle 생성 명령으로 SQL과 metadata를 만들고, 생성된 SQL을 수동 검토한다. 기존 마이그레이션을 수정하지 않는다.

**검증**

- DB 패키지 TypeScript 검사가 통과한다.
- 새 SQL이 네 테이블과 필요한 unique/index/check를 포함한다.

### 작업 7. 9편 초기 데이터 모듈과 반복 안전 초기화

**생성 파일**

- `apps/www/src/features/content-operations/server/seedData.ts`
- `apps/www/src/features/content-operations/server/seed.ts`

**수행**

두 캠페인의 검수된 콘텐츠를 9개 마스터·36개 채널 작업 데이터로 명시한다. 발행 일정, 원문 URL, CTA, 게시 문안, 카드 문안, 대체 텍스트와 UTM 링크를 포함한다. slug와 콘텐츠·채널 unique 키를 사용해 upsert하며 반복 실행해도 중복되지 않게 한다.

**검증**

- 데이터 정의에 마스터 9개와 채널 작업 36개가 있다.
- 일반 6편과 신앙 3편의 날짜·시간이 승인 일정과 일치한다.
- 각 채널 작업에 문안과 추적 URL이 있다.

### 작업 8. 관리자 조회·수정 서버 계층

**생성 파일**

- `apps/www/src/features/content-operations/server/admin.ts`
- `apps/www/src/features/content-operations/server/input.ts`

**수행**

- 요약·목록·상세 조회
- `ready` 상태 저장
- 게시 URL과 `published` 저장
- 성과 수치와 `performance_checked` 저장
- 운영 메모 저장
- 계산된 due/overdue 상태 제공
- 테스트 콘텐츠를 요약·성과 집계에서 제외

업데이트는 상태 규칙과 입력 검증을 서버에서 다시 확인한다. 게시 URL 없는 `published` 요청은 거부한다.

**검증**

정상·잘못된 상태 전환, URL 누락, 음수 성과, 존재하지 않는 ID 처리 결과를 확인한다.

### 작업 9. 관리자 API 구성

**생성 파일**

- `apps/www/src/app/api/admin/content/[id]/route.ts`
- `apps/www/src/app/api/admin/content/[id]/performance/route.ts`

**수행**

PATCH 요청의 크기와 JSON 형태를 제한하고 `hasAdminSession()`을 모든 경로에서 확인한다. 서버 계층의 안전한 오류 코드를 400·401·404·409·500으로 매핑한다. 내부 오류와 환경 변수는 응답에 노출하지 않는다.

**검증**

- 인증 없는 요청 401
- 잘못된 입력 400
- 없는 항목 404
- 정상 업데이트 200
- oversized 요청 413

### 작업 10. 관리자 목록 화면

**생성 파일**

- `apps/www/src/app/admin/content/page.tsx`
- `apps/www/src/app/admin/content/loading.tsx`
- `apps/www/src/features/content-operations/components/ContentStatusBadge.tsx`

**수정 파일**

- `apps/www/src/app/admin/analytics/page.tsx`
- `apps/www/src/app/admin/callbacks/page.tsx`

**수행**

기존 인증과 cream/navy/teal 디자인을 재사용한다. 상단 요약 네 개와 9편 목록을 표시한다. 데스크톱 표에서는 날짜 아래 시간을 두고 네 채널 상태를 끝까지 보이게 한다. 모바일에서는 콘텐츠별 카드로 바꿔 가로 스크롤 없이 상태를 확인한다. 기존 관리자 화면에 콘텐츠 운영 링크를 추가한다.

**검증**

- 비로그인 접근 시 `/admin/login`으로 이동한다.
- 9편·채널별 상태·지연 경고가 표시된다.
- 375px와 데스크톱 폭에서 상태가 잘리지 않는다.

### 작업 11. 관리자 상세·편집 화면

**생성 파일**

- `apps/www/src/app/admin/content/[id]/page.tsx`
- `apps/www/src/features/content-operations/components/ContentTaskEditor.tsx`
- `apps/www/src/features/content-operations/components/CopyButton.tsx`
- `apps/www/src/features/content-operations/components/PerformanceEditor.tsx`

**수행**

한 화면의 채널별 접이식 섹션에 발행 시각, 문안, 카드뉴스 문안, 대체 텍스트, UTM 링크를 표시한다. 복사 버튼, 준비 완료, 게시 URL 입력·발행 완료, 성과 입력·확인 완료, 운영 메모 저장 기능을 제공한다. 저장 결과를 접근 가능한 상태 메시지로 알린다.

**검증**

- 복사 대상이 화면의 원문과 정확히 일치한다.
- URL 없이 완료할 수 없다.
- API 오류 후 사용자가 입력한 값이 사라지지 않는다.
- 성과 미제공 필드는 비워 둘 수 있다.

### 작업 12. 콘텐츠 알림 이메일과 발송 처리

**생성 파일**

- `apps/www/src/features/content-operations/server/email.ts`
- `apps/www/src/features/content-operations/server/notifications.ts`

**수행**

Resend 패턴을 재사용해 관리자용 이메일을 만든다. 수신자는 `CONTENT_NOTIFICATION_EMAIL`을 우선하고 없으면 `tabecpaul@gmail.com`을 사용한다. 이메일에는 제목, 채널, KST 예정 시각, 행동과 관리자 상세 링크만 넣는다.

알림 대상 조회 후 unique 중복 키로 delivery를 선점하고 발송 결과를 기록한다. 개별 실패가 다른 알림 발송을 막지 않게 한다.

**검증**

- 세 알림 유형의 제목·본문·링크가 정확하다.
- 같은 대상을 반복 처리해도 이메일 한 건만 발송된다.
- 실패 상태와 안전한 오류 코드가 저장된다.

### 작업 13. Cron API와 스케줄 등록 SQL

**생성 파일**

- `apps/www/src/app/api/cron/content-reminders/route.ts`
- `packages/db/operations/schedule-content-reminder-cron.sql`

**수행**

`CRON_SECRET` bearer 인증을 적용하고 기존 `apps/www/src/features/operations-monitor/server/jobRuns.ts` 함수를 재사용해 `content-reminders` 작업 실행 기록을 남긴다. 10분 간격으로 호출해 전날 09:00, 발행 30분 전, 다음 날 09:00 KST의 허용 창에 해당하는 항목을 처리한다. SQL은 기존 pg_cron·pg_net·Vault 패턴을 따른다.

**검증**

- secret 누락 503, 불일치 401
- 대상 없음 200
- 일부 실패 시 성공·실패 수가 요약에 기록됨
- 같은 시간대 반복 호출 시 중복 없음

### 작업 14. 기존 운영 모니터 연동

**수정 파일**

- `apps/www/src/features/operations-monitor/domain.ts`
- `apps/www/src/features/operations-monitor/server/snapshot.ts`
- `apps/www/src/features/operations-monitor/server/email.ts`

**수행**

- 콘텐츠 알림 실패 건수
- 30분 이상 지연된 발행 미완료 건수
- `content-reminders` Cron stale

세 항목을 기존 운영 상태 패널과 운영 경고 이메일에 추가한다. 경고 링크는 `/admin/content`로 연결한다.

**검증**

정상 상태에서는 새 경고가 없고, 실패·지연·Cron stale 조건마다 해당 경고 한 건이 표시된다.

### 작업 15. 환경 변수·운영 문서 갱신

**수정 파일**

- `apps/www/.env.example`
- `apps/www/README.md`

**생성 파일**

- `docs/operations/content-publishing-runbook.md`

**수행**

`CONTENT_NOTIFICATION_EMAIL`, Cron 설치 절차, 초기 데이터 적용, 매일 운영 흐름, 이메일 실패·지연 대응, 2~3개월 후 자동 게시 검토 방법을 기록한다. 비밀값이나 실제 비밀번호는 문서에 넣지 않는다.

**검증**

새 관리자가 파일 경로를 알지 못해도 로그인 → 준비 → 게시 → URL → 성과 입력 흐름을 따라갈 수 있는지 문서만으로 검토한다.

### 작업 16. 통합 검증과 배포 준비

**검증 명령**

```bash
npm run lint:www
npm run build:www
git diff --check
```

**추가 검증**

- 마이그레이션을 검증 DB에 적용
- 초기화 두 번 실행 후 9개 마스터·36개 채널 작업 유지
- 관리자 로그인·목록·상세·수정 수동 점검
- 8월 17일부터 28일까지 시간 이동 시나리오로 due/overdue 확인
- 테스트 이메일로 세 유형과 중복 방지 확인
- 모바일 화면 캡처 검토
- 일반 캠페인 ZIP 무결성 확인
- 기존 콜백·결제·분석·운영 모니터 회귀 확인

프로덕션 DB 마이그레이션, Cron 등록과 배포는 코드 검증 후 별도 승인 범위에서 수행한다.

## 완료 조건

- 기존 일반 6편에 카드뉴스 48장·대체 텍스트·검수된 배포 자료가 있다.
- 일반 블로그 캠페인 ZIP이 정상적으로 열린다.
- 인증된 관리자 화면에서 9편·36개 채널 작업을 관리할 수 있다.
- 게시 URL 없이는 발행 완료할 수 없다.
- 전날·30분 전·다음 날 알림이 중복 없이 동작한다.
- 실패·지연·Cron 이상이 기존 운영 모니터에 표시된다.
- lint, build, DB와 수동 UI 검증이 통과한다.
- 기존 사용자 변경사항과 다른 캠페인 자료가 보존된다.
