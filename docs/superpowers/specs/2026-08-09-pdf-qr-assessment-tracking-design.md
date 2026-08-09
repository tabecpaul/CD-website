# PDF QR 평가 CTA 추적 설계

## 목적

「진로방향 자가진단」 PDF 하단 QR을 통한 Career Direct 평가 페이지 이동을 개인정보 없이 집계한다. 웹 랜딩페이지 CTA와 PDF QR의 성과를 구분하면서, 추적 장애가 사용자 이동을 막지 않도록 한다.

## 범위

- 자체 경유 주소: `https://start.careerdirect.kr/go/assessment?source=pdf_qr`
- 최종 목적지: `https://careerdirect.org/?language_code=KO`
- 기존 `assessment_cta_clicked` 이벤트와 관리자 전환 대시보드를 재사용한다.
- 운영 PDF의 QR 이미지와 클릭 가능한 QR 링크를 경유 주소로 교체한다.
- PDF 본문의 인쇄용 공식 URL 표기는 `www.careerdirect.org`로 유지한다.
- 랜딩페이지의 평가 CTA와 후속 코칭 이메일의 평가 링크도 같은 한국어 목적지를 사용한다.

## 데이터 흐름

1. 사용자가 PDF QR을 스캔하거나 QR 영역을 클릭한다.
2. Career Direct Korea의 `/go/assessment` 경로가 요청된다.
3. 서버는 허용된 `source=pdf_qr`만 해석한다.
4. 서버는 다음 익명 분석 이벤트를 기록한다.
   - `event_name`: `assessment_cta_clicked`
   - `cta_location`: `pdf_qr`
   - `path`: `/go/assessment`
   - `utm_source`: `pdf`
   - `utm_medium`: `qr`
   - `utm_campaign`: `career_direction_check`
5. 이벤트 기록 성공 여부와 관계없이 사용자를 Career Direct 한국어 페이지로 즉시 리다이렉트한다.

## 개인정보와 보안

- 이메일, 이름, 전화번호, 다운로드 토큰, 리드 ID를 분석 이벤트에 저장하지 않는다.
- 애플리케이션 코드에서 IP 주소와 User-Agent를 수집하거나 저장하지 않는다.
- 기존 13개월 분석 이벤트 보유 정책을 적용한다.
- 리다이렉트 목적지는 서버 코드에 고정해 임의 외부 URL을 받지 않는다. 따라서 오픈 리다이렉트가 되지 않는다.
- 알 수 없는 `source` 값은 추적 출처로 사용하지 않고 안전한 기본 처리 후 공식 평가 페이지로 이동한다.

## 집계 규칙

- QR 요청 1회당 CTA 클릭 1회를 기록한다.
- 같은 사람이 반복 스캔하면 반복 클릭으로 집계한다. 현재 대시보드의 CTA 지표가 총 클릭 수이므로 웹 CTA와 동일한 의미를 유지한다.
- 관리자 대시보드의 전체 `평가 CTA 클릭`에 포함한다.
- 유입 성과 표에는 `pdf / qr / career_direction_check` 행으로 구분한다.

## PDF 변경

- 기존 12페이지 PDF의 시각 디자인과 콘텐츠는 유지한다.
- 하단 QR을 새 경유 주소로 다시 생성한다.
- QR의 PDF 링크 주석도 동일한 경유 주소를 사용한다.
- 앱의 비공개 운영 PDF와 콘텐츠 매니페스트의 목적지·해시를 갱신한다.
- QR 스캔, 클릭 가능한 링크, 페이지 렌더링과 파일 다운로드를 다시 검증한다.

## 오류 처리

- 분석 DB 기록 실패는 서버 로그에 민감정보 없이 남긴다.
- 기록 실패 또는 제한시간 초과가 발생해도 공식 평가 페이지로 이동한다.
- 잘못된 쿼리 파라미터는 외부 목적지 변경에 사용하지 않는다.

## 검증 기준

1. `/go/assessment?source=pdf_qr` 요청이 `https://careerdirect.org/?language_code=KO`로 리다이렉트된다.
2. 요청 후 `assessment_cta_clicked` 이벤트가 `cta_location=pdf_qr`로 1건 생성된다.
3. 대시보드 CTA 수가 1 증가하고 UTM 표에 `pdf / qr / career_direction_check`가 나타난다.
4. 분석 DB 오류를 강제로 발생시켜도 리다이렉트가 동작한다.
5. 새 PDF의 QR을 휴대전화로 스캔할 수 있고 QR 영역 클릭도 같은 주소로 이동한다.
6. 새 PDF의 12개 페이지가 기존 레이아웃을 유지하며 다운로드 링크로 정상 제공된다.
7. 랜딩페이지 평가 CTA와 후속 코칭 이메일의 평가 링크가 한국어 페이지를 연다.

## 제외 범위

- Career Direct 공식 평가 사이트 내부의 결제·평가 시작·완료 추적
- 개인별 QR 또는 리드별 식별
- 외부 URL 단축 서비스
- QR 스캔 고유 사용자 추정
