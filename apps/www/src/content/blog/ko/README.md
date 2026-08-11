# Career Direct Korea 블로그 작성 가이드

## 새 글 추가

1. 이 폴더에 영문 소문자 kebab-case 이름의 `.mdx` 파일을 만듭니다.
2. 기존 글과 같은 `metadata` 필드를 모두 채웁니다.
3. `src/features/blog/content/registry.ts`에 글 컴포넌트와 metadata를 등록합니다.
4. 근거가 필요한 수치·정의·연구 주장은 공식 원문을 `references`에 넣습니다.
5. 진단이나 치료를 단정하지 않고, 위험 신호가 있으면 전문기관 이용을 안내합니다.

## 게시 상태

- `status: "draft"`: 배포되어도 공개 목록과 상세 경로에서 제외됩니다.
- `status: "published"`: `publishedAt`이 오늘 또는 과거일 때 공개됩니다.
- 수정 시 의미 있는 변경이면 `updatedAt`을 추가합니다.

## CTA

- `self-check`: 무료 진로 방향 자가진단
- `callback`: 20분 무료 콜백 신청

글의 독자가 바로 실행할 수 있는 다음 단계와 일치하는 CTA 하나만 선택합니다.
