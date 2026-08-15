# 운영 DB 단일 마이그레이션 실행 설계

## 목적

운영 사이트가 사용하는 데이터베이스에 `packages/db/drizzle/0013_small_puma.sql`만 적용해 콘텐츠 운영 테이블을 생성한다. 기존 Drizzle 이력은 운영 DB의 실제 스키마와 일치하지 않으므로 전체 `drizzle-kit migrate`는 사용하지 않는다.

## 접근 방식

기존 수동 GitHub Actions 워크플로가 `PRODUCTION_DATABASE_URL` 비밀값을 사용해 지정된 SQL 파일을 `psql`로 실행하도록 변경한다. 이번 워크플로는 `0013_small_puma.sql`만 허용하며 임의 파일 경로나 SQL 입력은 받지 않는다.

워크플로는 다음 순서로 동작한다.

1. 저장소를 체크아웃한다.
2. PostgreSQL 클라이언트를 준비한다.
3. 운영 DB에서 `content_operation_items` 존재 여부를 확인한다.
4. 테이블이 없으면 `psql -v ON_ERROR_STOP=1`로 `0013_small_puma.sql`을 적용한다.
5. 테이블이 이미 있으면 성공으로 종료해 재실행을 안전하게 처리한다.
6. 네 개 콘텐츠 테이블의 존재 여부를 검증한다.

## 안전성과 오류 처리

- GitHub 비밀값은 로그에 출력하지 않는다.
- SQL 오류가 한 건이라도 발생하면 즉시 실패한다.
- 기존 테이블이나 데이터를 삭제·변경하지 않는다.
- 파일 경로는 워크플로에 고정해 입력값 주입 가능성을 제거한다.
- `dev` Supabase 프로젝트에 잘못 등록된 Cron은 해제된 상태를 유지한다.

## 완료 조건

- GitHub Actions의 단일 마이그레이션 실행이 성공한다.
- `https://www.careerdirect.kr/admin/content`가 로그인 상태에서 정상 표시된다.
- 콘텐츠 9개와 채널 작업 36개가 자동 초기화된다.
- 운영 Cron이 10분 간격으로 활성화되고 인증된 호출이 성공한다.
- `system_job_runs`에 `content-reminders` 실행 결과가 기록된다.

