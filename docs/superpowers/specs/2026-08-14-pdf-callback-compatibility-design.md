# PDF 콜백 링크 호환 설계

## 문제

현재 배포된 진로 방향 자가진단 PDF 12페이지의 CTA는 `/callback`으로
연결되어 있습니다. 그러나 실제 콜백 신청 양식은
`/assessment-consultation`에서 제공되기 때문에 기존 주소를 클릭하면
404 오류가 발생합니다. 인쇄된 QR 코드 역시 같은 이전 주소를 사용하는
것으로 보고 함께 호환 처리합니다.

## 설계

`/callback`에 공개 호환 경로를 추가합니다. 이 경로는 사용자를
`/assessment-consultation`으로 영구 리디렉션하며, UTM을 포함한 전체 쿼리
문자열을 그대로 보존합니다.

호환 경로에는 별도의 신청 양식이나 중복된 업무 로직을 만들지 않습니다.
기존 `/assessment-consultation` 페이지를 유일한 실제 콜백 신청 페이지로
유지합니다.

다음에 PDF를 다시 내보낼 때는 버튼과 QR 코드가
`/assessment-consultation`을 직접 가리키도록 수정합니다. 이미 배포된 PDF를
위해 `/callback` 호환 경로는 계속 유지합니다.

## 경로 동작

- `/callback`은 `/assessment-consultation`으로 이동합니다.
- `/callback?utm_source=pdf&...`는 UTM을 삭제하거나 변경하지 않고
  `/assessment-consultation?utm_source=pdf&...`로 이동합니다.
- 이 경로는 전환 사이트인 `start.careerdirect.kr` 소유 경로로 처리합니다.
- 기존 호스트 분리 규칙 때문에 공식 사이트 홈으로 잘못 이동하지 않도록
  합니다.

## 검증

- `/callback`이 전환 사이트 소유 경로로 인식되는지 확인합니다.
- 린트 및 TypeScript 검사를 실행합니다.
- 웹 애플리케이션 빌드를 실행합니다.
- PDF 12페이지에 사용된 UTM을 포함하여 요청했을 때, 같은 UTM을 유지한
  `/assessment-consultation` 주소로 정상 이동하는지 확인합니다.

## 이번 작업에 포함하지 않는 항목

- Canva 또는 PDF 원본의 시각 디자인 수정과 재출력
- 콜백 신청 양식이나 신청 처리 절차 변경
- PDF 12페이지의 공식 사이트 링크 변경
