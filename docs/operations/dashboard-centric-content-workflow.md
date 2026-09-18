# Dashboard-Centric 콘텐츠 운영 워크플로우

## 정본 경계

- 관리자 `/admin/content` 대시보드는 상태·승인·일정·Gate·발행 결과의 Single Source of Truth다.
- Google Drive는 원고, 이미지, 카드뉴스, PPTX와 검토 패키지의 자산 저장소다.
- 이메일은 검토 요청과 장애 알림용 fallback이며 상태 원본이 아니다.
- 네이버·Facebook·Instagram·Threads 게시와 최종 승인은 자동화하지 않는다.

## 정상 흐름

1. ChatGPT Work가 기존 콘텐츠와 대시보드 상태를 대조한다.
2. 승인 일정이 없으면 Drive에 주간 제안 패키지를 `제안` 상태로 만든다.
3. 같은 실행에서 각 주제를 대시보드 `제안·승인 흐름`에 멱등 등록한다.
4. 관리자가 Duplicate Gate를 `PASS / REVISE / BLOCKED`로 판정한다.
5. `PASS`인 항목만 대시보드에서 `승인`할 수 있다.
6. 승인 후 ChatGPT Work가 원고·단일 CTA·UTM·카드뉴스를 완성하고 `제작 완료`로 전환한다.
7. 공식 사이트에 먼저 게시하고 실제 Production canonical URL을 read-back한다.
8. Duplicate Gate `PASS`, Site-First `PASS`, canonical URL 확인이 모두 충족되어야 `사이트 선게재 완료`로 전환한다.
9. 사용자가 외부 채널에 수동 게시하고 실제 URL·시각을 채널 발행 원장에 기록한다.
10. 사용자 확인 후에만 `발행 완료`로 전환한다.

## 실패 처리

- Drive 저장이나 Gmail 발송만 성공하고 대시보드 등록이 실패하면 전체 실행을 성공으로 보고하지 않는다.
- 대시보드 등록은 Drive 폴더 ID와 제안 발행일을 조합한 `source_key`로 멱등 처리한다.
- 관리자 세션·DB·권한이 없으면 원본 자산이나 승인 상태를 추정해 변경하지 않고 `Dashboard 등록 실패`로 보고한다.
- Site-First 또는 canonical URL이 불명확하면 외부 채널은 `HOLD`한다.
- 과거 제안은 자동으로 다음 주로 이월하거나 승인하지 않는다.

## 상태 정의

| 상태 | 의미 |
|---|---|
| `proposed` | 제안 등록, 관리자 검토 전 |
| `revision_requested` | 제목·CTA·일정 등의 수정 필요 |
| `approved` | Duplicate Gate PASS 후 관리자 승인 |
| `production_ready` | 승인 범위의 원고·UTM·이미지 제작 완료 |
| `site_published` | 공식 사이트 Production canonical URL 확인 완료 |
| `completed` | 외부 채널 수동 발행과 실제 URL 기록까지 확인 |
| `hold` | 필수 Gate 또는 증거가 충족되지 않음 |

## Production 안전 경계

- `content_workflow_items`는 서버 측 `postgres` 연결만 사용한다.
- RLS를 활성화하고 FORCE RLS는 사용하지 않는다.
- `anon`, `authenticated`, `service_role`의 직접 테이블 권한은 제거한다.
- 공개 RLS 정책을 만들지 않는다.
- 마이그레이션 후 테이블·RLS·직접 권한·복원 행 수를 fail-closed로 검증한다.
