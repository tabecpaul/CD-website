# Meta Pixel 동의 기반 전환 측정 구현 계획

## 목표

방문자의 선택적 동의 이후에만 Meta Pixel을 로드하고 `PageView`, `Lead`, `Schedule`을 측정한다. 동의 여부나 Meta 장애가 기존 자가진단·콜백·자체 분석 흐름에 영향을 주지 않게 한다.

## 작업 1: 동의 상태와 Meta 이벤트 기반 모듈 추가

**새 파일:** `apps/www/src/features/meta-pixel/consent.ts`

1. 저장 키 `cdk_consent_v1`과 `essential | all` 타입을 정의한다.
2. 저장된 값 읽기, 쓰기, 변경 이벤트 발행 함수를 만든다.
3. 브라우저가 아닌 환경에서는 안전하게 미선택 상태를 반환한다.

**새 파일:** `apps/www/src/features/meta-pixel/client.ts`

1. `window.fbq` 최소 타입을 선언한다.
2. `NEXT_PUBLIC_META_PIXEL_ID`가 있고 동의가 `all`일 때만 Meta 스크립트를 한 번 삽입한다.
3. 초기화 후 `PageView`를 보내는 함수와 표준 이벤트를 보내는 헬퍼를 만든다.
4. 미동의, 누락된 Pixel ID, 스크립트 차단 상황에서는 예외 없이 종료한다.

**검증:** 서버 렌더링 중 브라우저 전역을 참조하지 않으며, 여러 번 호출해도 스크립트와 초기화가 중복되지 않는다.

## 작업 2: 전역 동의 배너와 Pixel 로더 추가

**새 파일:** `apps/www/src/features/meta-pixel/components/ConsentBanner.tsx`

1. 저장된 동의가 없을 때만 하단 배너를 표시한다.
2. `필수 항목만`, `모두 허용`, `자세히 보기`를 제공한다.
3. 선택 즉시 상태를 저장하고 배너를 닫는다.
4. 주요 CTA를 가리지 않도록 데스크톱은 작은 플로팅 바, 모바일은 압축된 하단 카드로 구현한다.

**새 파일:** `apps/www/src/features/meta-pixel/components/MetaPixelLoader.tsx`

1. 동의 변경을 구독한다.
2. `all`일 때 Pixel을 초기화한다.
3. `usePathname`과 검색 파라미터 변화를 감지해 후속 `PageView`를 기록한다.
4. 동일 URL의 중복 기록을 방지한다.

**수정 파일:** `apps/www/src/app/layout.tsx`

1. 전역 레이아웃에 `MetaPixelLoader`와 `ConsentBanner`를 추가한다.
2. 기존 페이지 레이아웃과 자체 `PageViewTracker`는 변경하지 않는다.

**검증:** 미선택 상태에서 배너가 보이고 Meta 요청은 없으며, 두 선택 모두 사이트 탐색을 막지 않는다.

## 작업 3: PDF 신청 성공을 `Lead`로 연결

**수정 파일:** `apps/www/src/features/lead-magnet/components/LeadCaptureForm.tsx`

1. `/api/lead-magnet`가 성공하고 다운로드 토큰을 반환한 뒤 `Lead`를 호출한다.
2. 라우팅 직전에 호출하되 Meta 함수 결과를 기다리지 않는다.
3. 실패 응답·네트워크 오류에는 이벤트를 보내지 않는다.

**검증:** 성공 제출 한 번당 `Lead`가 한 번 발생하고, 미동의 상태에서는 Meta 호출 없이 감사 페이지로 이동한다.

## 작업 4: 콜백 신청 성공을 `Schedule`로 연결

**수정 파일:** `apps/www/src/features/assessment-callback/components/CallbackForm.tsx`

1. `/api/assessment-callback` 성공 응답 직후 `Schedule`을 호출한다.
2. 고객 입력값은 이벤트 매개변수로 전달하지 않는다.
3. 실패 응답·유효성 오류에는 이벤트를 보내지 않는다.

**검증:** 성공 제출 한 번당 `Schedule`이 한 번 발생하며 Meta 실패와 무관하게 접수 완료 화면이 표시된다.

## 작업 5: 개인정보처리방침과 동의 변경 기능 추가

**새 파일:** `apps/www/src/features/meta-pixel/components/ConsentSettingsButton.tsx`

1. 현재 선택을 초기화하거나 `essential`/`all`로 다시 선택할 수 있는 간단한 버튼 UI를 제공한다.
2. 철회 시 이후 이벤트 전송을 중단한다.

**수정 파일:** `apps/www/src/app/privacy/page.tsx`

1. 선택적 Meta Pixel의 목적, 제공 데이터, 동의하지 않아도 서비스 이용이 가능함을 명시한다.
2. Meta Platforms를 선택적 광고 성과 측정 제공자로 고지한다.
3. `쿠키 설정 변경` 버튼을 추가한다.
4. 시행일을 실제 배포일 기준으로 갱신한다.

**검증:** 개인정보처리방침에서 선택을 바꾸면 새로고침 없이 전역 동의 상태에 반영된다.

## 작업 6: 로컬 품질 검증

1. `npm run lint --workspace=www`
2. `npm exec --workspace=www tsc -- --noEmit`
3. `npm run build --workspace=www`
4. `NEXT_PUBLIC_META_PIXEL_ID`가 없는 상태에서도 빌드와 핵심 기능이 정상인지 확인한다.
5. 사용자 EPS·출력·임시 파일은 커밋하지 않는다.

## 작업 7: Preview 환경 검증

1. Vercel Preview에 `NEXT_PUBLIC_META_PIXEL_ID=1580352023792023`을 등록한다.
2. 캐시 없이 Preview를 배포한다.
3. 브라우저 저장소와 네트워크 탭으로 미선택·필수 전용 상태에서 Meta 요청이 없는지 확인한다.
4. `모두 허용` 후 Meta Events Manager 테스트 이벤트에서 `PageView`, `Lead`, `Schedule`을 확인한다.
5. 모바일에서 배너가 제목·폼·CTA를 가리지 않는지 확인한다.

## 작업 8: 운영 반영

1. 검증 완료 브랜치로 PR을 생성한다.
2. 사용자 승인 후 병합한다.
3. Production에도 `NEXT_PUBLIC_META_PIXEL_ID`를 등록하고 새 배포를 생성한다.
4. 실제 도메인에서 세 이벤트와 동의 철회를 다시 점검한다.
5. Meta 이벤트 수치와 자체 분석 수치가 동의율 때문에 다를 수 있음을 운영 기준에 기록한다.
