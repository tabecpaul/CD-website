# Living By Design 워크숍 우선 전환 구현 계획

작성일: 2026-08-14  
상태: 설계 승인 완료, 구현 전  
기준 설계: `docs/superpowers/specs/2026-08-14-living-by-design-workshop-first-design.md`

## 1. 구현 목표

Career Direct Korea의 기존 무료 자가진단 → 콜백 → 결제 → 평가 운영 흐름을 보존하면서, 다음 네 유입 경로를 하나의 신청·관리·분석 체계로 연결한다.

1. 무료 12페이지 진로 방향 자가진단
2. 일반 청년 직장인 진로 특강
3. 기독 대학·교회 진로 특강
4. Living By Design 워크숍

사용자의 준비도에 따라 다음 행동을 다르게 제시한다.

- 탐색 초기: 무료 자가진단
- 문제 인식 단계: 진로 특강
- 자기이해와 실행 설계 단계: Living By Design 워크숍
- 평가 의향 형성 단계: 전화 15분, Zoom 20분, 또는 상담 없이 평가 신청

이번 구현의 성공 기준은 “새로운 별도 시스템”을 만드는 것이 아니라, 현재 검증된 `assessment_callback_requests` 중심 운영 흐름을 출처와 상담 방식에 맞게 확장하는 것이다.

## 2. 이번 릴리스 범위

### 포함

- 전화 15분 / Zoom 20분 / 바로 평가 신청의 3가지 신청 방식
- 유입 출처, 프로그램 기수, 기관명 저장
- 전화·Zoom만 일정 입력을 요구하고 바로 평가 신청은 일정 없이 접수
- 관리자 상세 화면에서 신청 방식과 프로그램 문맥 표시
- 기존 결제·평가 링크 발급 흐름으로 바로 평가 신청 연결
- 신청 방식에 맞춘 고객·관리자 이메일 문구
- 유입 출처와 신청 방식별 전환 분석
- 일반 특강, 기독 특강, 워크숍 운영 문서
- 기존 무료 자가진단 및 광고 유입의 하위 호환

### 제외하고 다음 단계로 연기

- 실시간 예약 가능 시간 계산
- 하루 최대 4건 및 일정 사이 10분 버퍼의 자동 차단
- Zoom API를 통한 회의 링크 자동 발급
- 상담 방식별 자동 리마인드·일정 변경
- AI 사전 분류, FAQ 답변, 상담 요약
- 결제 자동 승인 및 본부 평가 링크 자동 발급

이 항목들은 이번 데이터 구조와 상태 모델을 그대로 확장해 추가할 수 있도록 인터페이스만 준비한다.

## 3. 변경 후 사용자 흐름

### 3.1 공통 진입

모든 프로그램 CTA는 `/assessment-consultation`으로 연결하되 쿼리 파라미터로 문맥을 전달한다.

```text
/assessment-consultation
  ?source=living_by_design_workshop
  &program_cohort=2026-08-seoul-01
  &institution=기관명
  &utm_source=...
  &utm_medium=...
  &utm_campaign=...
  &utm_content=...
```

허용 출처:

```ts
type CallbackSource =
  | "lead_magnet"
  | "general_lecture"
  | "christian_lecture"
  | "living_by_design_workshop"
  | "direct";
```

### 3.2 신청 방식 선택

연락처 입력 전 또는 직후에 세 가지 카드를 제공한다.

| 방식 | 사용자 문구 | 일정 입력 | 운영 결과 |
|---|---|---:|---|
| `phone` | 전화로 15분 상담 | 필수 | 기존 일정 확정 흐름 사용 |
| `zoom` | Zoom으로 20분 상담 | 필수 | 이번 릴리스는 관리자가 수동으로 Zoom 링크 안내 |
| `direct_assessment` | 상담 없이 평가 신청 | 없음 | 기존 결제 안내 및 평가 링크 발급 운영으로 연결 |

### 3.3 신청 완료 문구

- 전화: “영업일 기준 1일 이내에 연락드려 15분 전화 상담 시간을 확정하겠습니다.”
- Zoom: “영업일 기준 1일 이내에 연락드려 20분 Zoom 상담 시간을 확정하겠습니다.”
- 바로 평가: “결제와 평가 진행 절차를 확인한 뒤 영업일 기준 1일 이내에 안내드리겠습니다.”

세 방식 모두 신청만으로 결제되거나 평가가 시작되지 않는다는 문구를 유지한다.

## 4. 데이터 모델

대상: `packages/db/src/schema.ts`

### 4.1 신규 필드

```ts
contactMethod: varchar("contact_method", { length: 32 })
  .notNull()
  .default("phone"),
programCohort: varchar("program_cohort", { length: 128 }),
institutionName: varchar("institution_name", { length: 160 }),
```

### 4.2 기존 필드 변경

```ts
preferredDate: date("preferred_date"),
timeSlot: varchar("time_slot", { length: 32 }),
```

기존 레코드는 `contact_method = 'phone'`으로 해석한다. `preferred_date`와 `time_slot`은 전화·Zoom에는 필요하지만 `direct_assessment`에는 `NULL`이어야 한다.

### 4.3 인덱스

분석 및 관리자 필터 비용을 낮추기 위해 다음 인덱스를 추가한다.

```sql
create index ... on assessment_callback_requests (contact_method, created_at desc);
create index ... on assessment_callback_requests (source, created_at desc);
```

### 4.4 마이그레이션 안전성

- 기존 행은 기본값 `phone`으로 채운다.
- 일정 필드의 `NOT NULL`만 제거하며 기존 값은 변경하지 않는다.
- 마이그레이션은 GitHub Actions의 수동 `db-migrate.yml`로 실행한다.
- 실행 전 SQL 편집기에서 대상 테이블과 최근 Drizzle 이력을 확인한다.
- 실행 후 신규 열, nullable 상태, 인덱스 존재 여부를 각각 조회한다.

## 5. 도메인 규칙

대상: `apps/www/src/features/assessment-callback/domain.ts`

```ts
export const contactMethodOptions = [
  { value: "phone", label: "전화로 15분 상담", durationMinutes: 15 },
  { value: "zoom", label: "Zoom으로 20분 상담", durationMinutes: 20 },
  { value: "direct_assessment", label: "상담 없이 평가 신청", durationMinutes: null },
] as const;

export const callbackSourceOptions = [
  "lead_magnet",
  "general_lecture",
  "christian_lecture",
  "living_by_design_workshop",
  "direct",
] as const;
```

규칙:

- `phone`과 `zoom`은 `preferredDate`, `timeSlot` 필수
- `direct_assessment`는 두 일정 필드를 `null`로 정규화
- 기존 링크에서 연락 방식을 전달하지 않으면 `phone`
- 알 수 없는 `source`는 저장하지 않고 `direct`로 정규화
- `programCohort`, `institutionName`은 표시 문맥일 뿐 권한이나 가격을 결정하지 않음
- 운영 상태·결제 상태·평가 진행 상태는 기존 모델을 그대로 사용

## 6. 화면 명세

### 6.1 신청 페이지

파일:

- `apps/www/src/app/assessment-consultation/page.tsx`
- `apps/www/src/features/assessment-callback/components/CallbackForm.tsx`

구성:

1. 유입 출처별 상단 안내
2. 신청 방식 3개 카드
3. 공통 연락처·인구통계·상담 주제
4. 전화·Zoom 선택 시 희망 날짜와 시간대
5. 바로 평가 선택 시 결제·평가 링크 절차 안내
6. 개인정보 및 선택 마케팅 동의
7. 방식에 맞춘 버튼 문구

버튼 문구:

```text
phone              → 15분 무료 전화 상담 신청하기
zoom               → 20분 무료 Zoom 상담 신청하기
direct_assessment  → Career Direct 평가 안내 요청하기
```

접근성:

- 카드는 실제 radio input으로 구성
- 선택 상태를 색상뿐 아니라 테두리·체크 아이콘·텍스트로 구분
- 일정 영역은 숨길 때 DOM에서도 제거하여 불필요한 required 검증 방지
- 오류 메시지는 `role="alert"` 유지

### 6.2 관리자 목록

파일: `apps/www/src/app/admin/callbacks/page.tsx`

추가 열/표시:

- 신청 방식 배지: 전화 / Zoom / 바로 평가
- 출처 배지: 자가진단 / 일반 특강 / 기독 특강 / 워크숍 / 직접
- 프로그램 기수 또는 기관명은 보조 텍스트로 표시

기존 필터 구조를 과도하게 복잡하게 만들지 않는다. 이번 릴리스에서는 방식과 출처를 목록에 표시하고, 필터는 분석 화면에 우선 제공한다.

### 6.3 관리자 상세

파일:

- `apps/www/src/app/admin/callbacks/[id]/page.tsx`
- `apps/www/src/features/assessment-callback/components/AdminCallbackEditor.tsx`
- `apps/www/src/features/assessment-callback/components/AdminCallbackScheduleEditor.tsx`

표시 규칙:

- 공통: 출처, 기관, 기수, 신청 방식, UTM
- 전화: 15분 일정 카드
- Zoom: 20분 일정 카드와 “Zoom 링크 수동 안내” 운영 메모
- 바로 평가: 일정 카드 숨김, 기존 유료 서비스 관리 카드로 바로 이동할 수 있는 안내

기존 스케줄 함수는 일정 필드가 null인 레코드를 처리할 때 예외를 내지 않아야 한다.

## 7. API와 검증

### 7.1 입력 검증

파일: `apps/www/src/features/assessment-callback/server/validation.ts`

추가 검증:

```ts
contactMethod ∈ phone | zoom | direct_assessment
source ∈ approved source list
programCohort.length <= 128
institutionName.length <= 160
```

조건부 검증:

```ts
if (contactMethod === "phone" || contactMethod === "zoom") {
  // 기존 60일 범위 날짜와 timeSlot 검증
} else {
  preferredDate = null;
  timeSlot = null;
}
```

### 7.2 접수 API

파일: `apps/www/src/app/api/assessment-callback/route.ts`

변경:

- 신규 필드를 정규화된 입력에서 받아 저장
- 중복 방지 키는 기존 이메일+전화+10분을 유지
- `callback_submitted` 분석 이벤트에 개인정보 없이 `contactMethod`, `source`, `programCohort`만 허용된 속성으로 추가
- 이메일 함수에 전체 정규화 입력을 전달
- `direct_assessment`도 201을 반환하며 일정 자동화는 호출하지 않음

보안:

- 기관명과 기수는 이메일/관리 화면에 출력되므로 HTML escape 적용 여부를 확인
- 이벤트에는 이름, 이메일, 전화, 기관 담당자 정보 저장 금지
- body 크기 제한과 same-origin 검증 유지

## 8. 이메일 명세

파일: `apps/www/src/features/assessment-callback/server/emails.ts`

### 고객 메일

| 방식 | 제목 | 핵심 내용 |
|---|---|---|
| 전화 | 15분 무료 전화 상담 신청이 접수되었습니다 | 1영업일 내 일정 확정 |
| Zoom | 20분 무료 Zoom 상담 신청이 접수되었습니다 | 일정 확정 후 링크 별도 안내 |
| 바로 평가 | Career Direct 평가 안내 요청이 접수되었습니다 | 결제·등록·14일 취소 조건 안내 |

### 관리자 메일

제목에 방식 배지를 포함한다.

```text
[전화 상담] 신규 신청 · 이름
[Zoom 상담] 신규 신청 · 이름
[평가 안내] 신규 신청 · 이름
```

본문 상단에 출처, 기관, 기수, 신청 방식을 표시한다. 바로 평가 신청에는 일정 미입력이 정상임을 명시한다.

## 9. 분석 이벤트와 관리자 분석

파일:

- `apps/www/src/features/analytics/server/events.ts`
- `apps/www/src/features/analytics/server/dashboard.ts`
- `apps/www/src/app/admin/analytics/page.tsx`

### 이벤트 속성

```ts
{
  source,
  contactMethod,
  programCohort,
  ctaLocation,
  utmSource,
  utmMedium,
  utmCampaign,
  utmContent,
}
```

### 관리자 지표

- 전체 신청 수
- 전화 상담 신청 수
- Zoom 상담 신청 수
- 바로 평가 신청 수
- 출처별 신청 수
- 프로그램 기수별 신청 수
- 출처 → 신청 방식 분포

초기 표본이 작으므로 퍼센트만 단독 표시하지 않고 항상 원시 건수를 함께 표시한다.

## 10. 콘텐츠 및 운영 문서

신규 파일:

- `docs/programs/general-career-lecture-outline.md`
- `docs/programs/christian-career-lecture-outline.md`
- `docs/programs/living-by-design-workshop-runbook.md`
- `docs/programs/program-conversion-routing.md`

### 공통 70%

- 진로 불안과 직무 불일치의 현실
- 방향보다 자기이해가 먼저라는 핵심 메시지
- 성격, 흥미, 재능, 가치관의 4가지 나침반
- 평가와 커리어 컨설팅의 역할
- 실행계획으로 연결하는 방법

### 일반 특강 30%

- 직무 불일치, 번아웃, 이직·진로변경
- 일과 나 사이의 적합성
- Career Direct 평가 및 컨설팅 CTA

### 기독 특강 30%

- 소명, 청지기직, 고유한 디자인
- 신앙 언어를 과잉 약속이나 결과 보장으로 사용하지 않기
- Career Direct 평가 및 컨설팅 CTA

### 워크숍

- 2시간 40분~3시간
- 현실 인식 → 자기 발견 → 통합 해석 → 실행계획
- 별도 4페이지 미니 워크시트 없음
- 완료 CTA는 무료 자가진단으로 돌아가지 않고 평가·컨설팅 또는 20분 Zoom/15분 전화로 연결

## 11. 구현 작업 목록

각 항목은 한 번에 확인 가능한 2~5분 단위로 쪼갠다.

### Phase 0 — 구현 전 확인

1. `node_modules/next/dist/docs`에서 App Router, route handler, search params 관련 문서를 읽는다.
2. `git status --short`로 사용자 소유 변경과 구현 대상 변경을 구분한다.
3. `packages/db/drizzle`의 마지막 마이그레이션 번호와 저널 상태를 확인한다.
4. 현재 Production/Preview의 `DATABASE_URL`이 같은 Supabase 프로젝트를 가리키는지 값 노출 없이 확인한다.

검증: 확인 결과를 작업 로그에 기록하고 사용자 파일은 staging하지 않는다.

### Phase 1 — DB와 도메인

1. `packages/db/src/schema.ts`에 `contactMethod`를 기본값 `phone`으로 추가한다.
2. 같은 파일에 `programCohort`, `institutionName`을 nullable로 추가한다.
3. `preferredDate`, `timeSlot`의 not-null 제약을 제거한다.
4. 출처·방식 인덱스를 schema 정의에 추가한다.
5. Drizzle 마이그레이션 파일을 생성한다.
6. 생성 SQL이 기존 데이터 삭제나 테이블 재생성을 포함하지 않는지 검토한다.
7. `domain.ts`에 출처와 연락 방식 상수·타입을 추가한다.
8. 방식별 상담 시간 helper를 추가한다.
9. 기존 `CALLBACK_DURATION_MINUTES` 사용 위치를 찾아 방식별 helper로 교체할 목록을 만든다.

검증:

```bash
npm run lint:www
npx tsc --noEmit -p apps/www/tsconfig.json
```

### Phase 2 — 입력 검증과 API

1. `validation.ts`에 연락 방식 allowlist parser를 추가한다.
2. 출처 allowlist parser를 추가한다.
3. 기관명·기수 길이 및 공백 정규화를 추가한다.
4. 전화·Zoom의 일정 필수 검증을 유지한다.
5. 바로 평가의 일정 값을 null로 강제한다.
6. API insert에 신규 필드를 연결한다.
7. 분석 이벤트 metadata에 허용된 신규 차원을 연결한다.
8. 같은 연락처의 중복 접수 동작이 그대로인지 확인한다.
9. 세 방식에 대해 curl 또는 브라우저 요청으로 201/400 조건을 확인한다.

검증 사례:

```text
phone + 일정 있음             → 201
phone + 일정 없음             → 400 date_invalid
zoom + 일정 있음              → 201
zoom + 일정 없음              → 400 date_invalid
direct_assessment + 일정 없음 → 201
알 수 없는 contactMethod      → 400 selection_invalid
```

### Phase 3 — 신청 UI

1. `page.tsx`에서 source, cohort, institution 쿼리를 읽어 길이를 제한한다.
2. `CallbackForm` Props에 프로그램 문맥을 추가한다.
3. 연락 방식 카드 3개를 radio group으로 추가한다.
4. 기본 선택을 `phone`으로 설정해 기존 유입 경험을 보존한다.
5. phone 선택 시 15분 문구를 표시한다.
6. zoom 선택 시 20분과 링크 추후 안내 문구를 표시한다.
7. direct 선택 시 일정 입력 DOM을 제거한다.
8. 방식별 submit 버튼 문구를 적용한다.
9. 방식별 완료 화면 문구를 적용한다.
10. 모바일 320px, 390px와 데스크톱에서 레이아웃을 확인한다.
11. 키보드만으로 카드 선택·제출이 되는지 확인한다.

검증:

```bash
npm run lint:www
npx tsc --noEmit -p apps/www/tsconfig.json
npm run build:www
```

### Phase 4 — 이메일과 운영 화면

1. 고객 메일 제목/본문을 신청 방식별 함수로 분리한다.
2. 관리자 메일에 출처·기관·기수·방식을 표시한다.
3. 바로 평가 신청 메일에서 일정 문구를 제거한다.
4. 관리자 목록에 방식 및 출처 배지를 추가한다.
5. 관리자 상세에 기관과 기수를 추가한다.
6. 일정 카드가 direct 레코드에서 렌더링되지 않게 한다.
7. 전화 일정 종료 시간을 15분으로 계산한다.
8. Zoom 일정 종료 시간을 20분으로 계산한다.
9. 기존 레코드가 phone으로 표시되는지 확인한다.
10. 기존 결제 안내 버튼이 direct 레코드에서도 정상 작동하는지 확인한다.

검증:

- 세 방식 각각 테스트 신청 1건
- 관리자·고객 이메일 수신
- 관리자 상세 페이지 로드
- 전화/Zoom 일정 확정
- 바로 평가 결제 안내 발송

### Phase 5 — 분석

1. 분석 query에 contact method 집계를 추가한다.
2. source별 집계를 추가한다.
3. cohort 집계는 null/빈 문자열을 제외한다.
4. 관리자 분석에 건수 카드를 추가한다.
5. source × method 표를 추가한다.
6. 연결 테스트 데이터 제외 조건을 유지한다.
7. 기간 필터 7/30/90일을 각각 확인한다.

검증:

- 테스트 신청 3건이 방식별 1건으로 집계
- 개인정보가 분석 표에 노출되지 않음
- 기존 PDF/콜백/결제 지표가 변하지 않음

### Phase 6 — 프로그램 문서와 링크

1. 일반 특강 60~90분 개요를 작성한다.
2. 기독 특강 60~90분 개요를 작성한다.
3. 공통 70%와 변형 30%를 각 문서에 표시한다.
4. Living By Design 2시간 40분~3시간 진행표를 작성한다.
5. 워크숍 후 무료 자가진단으로 되돌아가는 CTA가 없는지 확인한다.
6. 프로그램별 추적 링크 예시를 routing 문서에 작성한다.
7. 실제 QR/링크 생성 시 source와 cohort가 보존되는지 확인한다.

### Phase 7 — 통합 검증과 배포

1. `git diff --check`를 실행한다.
2. lint를 실행한다.
3. TypeScript 검사를 실행한다.
4. production build를 실행한다.
5. 마이그레이션을 수동 실행한다.
6. Preview에서 세 방식 E2E를 확인한다.
7. 관리자 화면과 이메일을 확인한다.
8. Preview 분석 수치를 확인한다.
9. PR을 생성하고 변경 범위·마이그레이션·롤백 절차를 기재한다.
10. PR 병합 후 Production에서 연기 없는 smoke test를 수행한다.

최종 검증 명령:

```bash
git diff --check
npm run lint:www
npx tsc --noEmit -p apps/www/tsconfig.json
npm run build:www
```

## 12. 마이그레이션 후 확인 SQL

민감한 값 없이 구조만 확인한다.

```sql
select
  column_name,
  is_nullable,
  column_default
from information_schema.columns
where table_schema = 'public'
  and table_name = 'assessment_callback_requests'
  and column_name in (
    'contact_method',
    'program_cohort',
    'institution_name',
    'preferred_date',
    'time_slot'
  )
order by column_name;
```

기대값:

- `contact_method`: NOT NULL, 기본값 phone
- `program_cohort`: nullable
- `institution_name`: nullable
- `preferred_date`: nullable
- `time_slot`: nullable

## 13. 롤백 전략

코드 롤백과 데이터 롤백을 분리한다.

1. 문제가 있으면 UI를 기존 phone 기본 흐름만 노출하도록 즉시 되돌린다.
2. 신규 열은 그대로 두어 이미 접수된 문맥을 보존한다.
3. 일정 nullable 변경은 운영에 치명적이지 않으므로 즉시 제약을 복원하지 않는다.
4. API가 불안정하면 `direct_assessment`와 `zoom`을 임시 비활성화하고 phone만 허용한다.
5. 이메일 분기 오류가 있으면 공통 접수 메일로 fallback한다.

## 14. 완료 기준

다음 조건을 모두 만족할 때 이번 릴리스를 완료로 본다.

- 기존 자가진단·광고 콜백 신청이 계속 정상 작동
- 전화 15분, Zoom 20분, 바로 평가 신청이 각각 정상 접수
- 바로 평가 신청에 가짜 일정이 저장되지 않음
- 관리자 화면에서 출처·기관·기수·방식 확인 가능
- 방식별 고객·관리자 메일 정상
- 기존 결제·평가 링크 운영으로 연결 가능
- 분석 화면에서 출처 및 방식별 건수 확인 가능
- 일반 특강·기독 특강·워크숍 운영 문서 완성
- lint, TypeScript, production build 통과
- Production smoke test 완료

## 15. 이후 확장 순서

이번 릴리스의 실제 신청량과 운영 시간을 2~4주 관찰한 뒤 다음 순서로 확장한다.

1. 하루 최대 4건과 10분 버퍼를 반영한 예약 가능 슬롯
2. Zoom 링크 자동 발급
3. 방식별 리마인드 및 일정 변경
4. 무응답·미결제·평가 미등록 운영 알림
5. 사전 질문 자동 분류와 상담 요약
6. 충분한 안전성 검증 후 결제·평가 링크 자동화 검토

자동화의 목적은 상담 품질을 낮추는 것이 아니라, 관리자의 반복 확인 시간을 줄이고 실제 라포 형성과 해석·컨설팅에 시간을 집중하는 것이다.
