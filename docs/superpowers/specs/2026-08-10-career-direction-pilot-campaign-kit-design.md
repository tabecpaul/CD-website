# 청년 직장인 진로 방향 파일럿 캠페인 키트 설계

## 목적

Career Direct Korea의 첫 실제 고객 파일럿을 위해 무료·유료 광고에 함께 사용할 수 있는 채널별 소재와 추적 링크를 제작한다. 모든 채널의 1차 CTA를 무료 12페이지 진로 방향 자가진단 PDF로 통일하고, 방문부터 콜백 신청까지 채널·소재별 전환을 비교한다.

## 대상과 제안

- 핵심 대상: 진로 불안, 이직 고민, 번아웃을 경험하는 청년 직장인
- 확장 대상: 기독 청년, 대학생·취업준비생
- 핵심 제안: 무료 12페이지 진로 방향 자가진단 PDF
- 연결 페이지: `https://start.careerdirect.kr/career-check`
- 후속 흐름: PDF 신청 → 격일 3회 코칭 이메일 → 20분 무료 콜백 → 유료 평가·컨설팅

## 포함 범위

- 6개 배포 채널용 광고·게시물 소재
- 공감 인물형과 강한 타이포형 A/B 세트
- 워크북 실물형 보조 소재
- 무료 게시용·유료 광고용 문구
- 채널·배포 방식·소재별 UTM 링크
- QR 코드 PNG·SVG
- A4 PDF 포스터
- 게시 문구 Markdown, 링크 CSV, 운영 README
- 웹사이트 `utm_content` 수집·저장·분석 표시

## 제외 범위

- 광고 계정 생성·연결
- 실제 광고 캠페인 등록
- 광고비 결제·집행
- 게시물 직접 업로드
- 타사 자동 게시 도구 연동
- 성과가 확인되기 전의 대량 소재 변형

## 크리에이티브 전략

### 중심 방향

전환 집중형을 전체 캠페인의 중심으로 사용한다. 문제 인식 질문, 짧은 공감 문장, 한 개의 CTA로 구성한다.

### A/B 소재

#### A — 공감 인물형

- 담백한 한국인 청년 직장인 이미지
- 과도하게 우울하거나 연출된 표정은 피한다.
- 질문과 인물을 함께 보여 감정적 연결을 만든다.
- 핵심 문구: `왜 열심히 사는데 진로 불안과 번아웃을 느끼나요?`

#### B — 강한 타이포형

- 네이비 배경, 큰 질문, 골드 또는 라이트블루 강조
- 작은 모바일 화면에서 1초 안에 핵심 질문을 읽을 수 있게 한다.
- 핵심 문구: `열심히 사는데도 불안한 이유, 방향보다 자기이해가 먼저일 수 있습니다.`

#### 보조 — 워크북 실물형

- 실제로 받게 될 PDF 워크북을 시각적으로 보여준다.
- 네이버 블로그, 리타게팅, 기관 배포에 사용한다.
- 확정 문구: `성격, 흥미, 재능, 가치관, 4가지 나침반으로 진로 방향을 점검하세요.`

### 교회·청년부 변형

- 신앙 언어를 분명하게 사용한다.
- 핵심 문구: `하나님이 지으신 나를 발견하고 일과 소명의 방향을 분별하세요.`
- 일반 직장인·대학 채널에는 신앙 언어를 전면에 사용하지 않는다.

## 브랜드 원칙

- Career Direct Korea 네이비·라이트블루·골드·크림 팔레트
- 공식 Career Direct 로고의 비율과 여백 유지
- 공포·실패를 과장하는 표현 금지
- 검사만으로 직업이나 소명이 결정된다는 표현 금지
- “무료”는 PDF 자가진단에만 적용하고 본부 평가와 컨설팅이 유료임을 혼동시키지 않는다.
- 통계는 출처와 적용 범위를 확인한 경우에만 사용한다.

## 채널별 제작물

### 인스타그램·페이스북

- 1080×1080 피드 A/B
- 1080×1920 스토리 A/B
- 무료 게시용 본문 2종
- 유료 광고용 기본 문구·헤드라인·설명 각 2종
- Instagram과 Facebook은 같은 원본을 사용하되 UTM 링크는 분리한다.

### Threads

- 대화형 짧은 글 6개
- 타이포 이미지 2개
- Threads 전용 링크
- Instagram 자동 복제보다 Threads에 맞는 질문·대화 형식으로 다시 쓴다.

### 네이버 블로그

- 검색형 장문 글 2개
- 대표 이미지 1200×628
- 본문 카드 이미지 3개
- 워크북 실물형 CTA
- 글 주제:
  1. 열심히 일하는데 진로가 불안한 이유
  2. 성격·흥미·재능·가치관으로 진로 방향을 점검하는 방법

### 교회·청년부

- A4 세로 PDF 포스터
- 모바일 공지 이미지 1080×1350
- 신앙·소명형 문구
- 교회 전용 QR

### 대학·학생단체

- A4 세로 PDF 포스터
- 모바일 공지 이미지 1080×1350
- 자기이해·진로불안 중심 문구
- 대학 전용 QR

## UTM 설계

공통:

```text
utm_campaign=career_direction_pilot_2026q3
```

채널·배포 방식:

| 채널 | utm_source | utm_medium |
|---|---|---|
| 네이버 블로그 무료 | naver_blog | organic_content |
| 네이버 광고 | naver | cpc |
| 인스타그램 무료 | instagram | organic_social |
| 인스타그램 광고 | instagram | paid_social |
| 페이스북 무료 | facebook | organic_social |
| 페이스북 광고 | facebook | paid_social |
| Threads | threads | organic_social |
| 교회·청년부 | church | partner_qr |
| 대학·학생단체 | university | partner_qr |

소재:

```text
empathy_feed_a
typography_feed_b
empathy_story_a
typography_story_b
workbook_blog
threads_type_a
threads_type_b
faith_poster
faith_mobile
university_poster
university_mobile
```

`utm_content`는 영문 소문자, 숫자, underscore만 사용한다. 링크 CSV에는 사람이 읽는 채널명, 배포 방식, 소재명, 전체 URL, QR 파일명을 함께 기록한다.

## 웹사이트 추적 변경

### 데이터 모델

- `analytics_events.utm_content varchar(128) nullable`
- `assessment_callback_requests.utm_content varchar(128) nullable`
- `lead_magnet_leads.utm_content varchar(128) nullable`을 추가해 PDF 신청 attribution을 보존한다.
- UTM 인덱스는 source·medium·campaign·content 분석 패턴을 지원하도록 조정한다.

### 수집

- 공개 분석 이벤트가 URL 또는 클라이언트 payload에서 `utm_content`를 최대 128자로 수집한다.
- 기존 민감정보 검사와 길이 제한을 동일하게 적용한다.
- 첫 랜딩 attribution에 `utm_content`를 저장하고 PDF·콜백 후속 이벤트에 이어간다.
- 콜백 신청에 익명 ID와 함께 최초 또는 현재 확정 attribution을 저장한다.

### 분석

- 유입 성과 표에 `소재` 열을 추가한다.
- source·medium·campaign·content 조합으로 방문, PDF 신청, 다운로드, CTA, 콜백을 표시한다.
- 기존 `utm_content` null 데이터는 `(none)`으로 표시한다.
- 테스트 콜백과 연결 익명 이벤트 제외 규칙은 그대로 유지한다.

## QR 원칙

- QR에는 전체 UTM URL을 직접 인코딩한다.
- PNG는 인쇄·메신저 공유를 위해 1200px 이상으로 제작한다.
- SVG는 인쇄 원본으로 제공한다.
- QR 주변 quiet zone을 유지하고 로고를 QR 내부에 삽입하지 않는다.
- 제작 후 실제 휴대전화로 모든 QR을 스캔하고 최종 URL을 검증한다.

## 파일 구조

```text
campaigns/career-direction-pilot-2026q3/
  README.md
  links/
    campaign-links.csv
  copy/
    instagram-facebook.md
    threads.md
    naver-blog-01.md
    naver-blog-02.md
    church.md
    university.md
  creative/
    source/
    png/
    jpg/
    pdf/
  qr/
    png/
    svg/
```

소스 파일은 수정 가능한 원본으로 보존하고 배포용 PNG·JPG·PDF와 분리한다.

## 성과 측정

- 채널 비교: `utm_source`
- 무료·유료·파트너 비교: `utm_medium`
- 캠페인 비교: `utm_campaign`
- 공감 인물형·타이포형 비교: `utm_content`
- 1차 전환: PDF 신청
- 2차 전환: PDF 다운로드
- 3차 전환: 콜백 CTA 클릭
- 최종 리드 전환: 20분 무료 콜백 신청

파일럿 5~10명과 초기 트래픽은 표본이 작으므로 단기 전환율을 확정적 결론으로 해석하지 않는다. 소재별 클릭과 신청이 누적된 뒤 유료 광고 확장 여부를 결정한다.

## 검증

1. 모든 링크가 `/career-check`로 연결된다.
2. 채널·medium·content가 링크 CSV와 일치한다.
3. QR 스캔 결과와 CSV URL이 일치한다.
4. `utm_content`가 랜딩 이벤트, PDF 신청, 콜백 신청에 보존된다.
5. 대시보드 소재 열의 수치가 원본 이벤트와 일치한다.
6. 기존 UTM·직접 유입 데이터가 `(none)`으로 호환된다.
7. 테스트 데이터 제외가 유지된다.
8. 인스타그램·페이스북 소재가 안전 영역 내에서 잘리지 않는다.
9. A4 PDF를 실제 크기로 렌더링해 QR과 본문 가독성을 확인한다.
10. 문구에 무료 평가·무료 컨설팅으로 오해할 표현이 없다.
11. 로고 비율과 브랜드 색상이 일관된다.
12. TypeScript, lint, production build가 통과한다.

## 완료 기준

- 6개 채널에 즉시 배포할 수 있는 소재·문구·링크·QR이 준비된다.
- 공감 인물형과 타이포형 A/B 성과를 `utm_content`로 비교할 수 있다.
- 무료 게시와 유료 광고가 서로 다른 `utm_medium`으로 구분된다.
- 교회 채널은 신앙 언어, 일반 채널은 진로불안·자기이해 언어를 사용한다.
- 광고 계정 설정이나 비용 집행 없이 파일럿 운영자가 직접 게시할 수 있다.
