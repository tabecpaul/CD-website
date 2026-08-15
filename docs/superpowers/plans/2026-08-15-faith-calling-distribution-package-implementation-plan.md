# 신앙과 소명 3편 배포 패키지 구현 계획

## 목표

승인된 설계에 따라 공식 웹사이트의 신앙과 소명 3편을 네이버 블로그, 인스타그램·페이스북, Threads용으로 재구성하고, UTM 링크·운영표·검수표·ZIP을 포함한 즉시 사용 가능한 배포 패키지를 만든다.

기준 설계: `docs/superpowers/specs/2026-08-15-faith-calling-distribution-package-design.md`

## 구현 원칙

- 기준 원문과 기존 캠페인 형식을 먼저 확인한 뒤 작성한다.
- 세 콘텐츠는 한 편씩 `네이버 → 카드뉴스/캡션 → Threads` 순서로 완성해 메시지 일관성을 유지한다.
- 성경 인용은 공식 원문에 사용된 구절과 개역개정을 우선 대조하고, 새번역은 보완이 필요한 경우만 사용한다.
- 외부 계정 게시나 예약은 수행하지 않는다.
- 기존 사용자 변경사항과 기존 캠페인 파일은 수정하지 않는다.

## 작업 1. 기준 자료와 목적지 URL 확정

**읽을 파일**

- `apps/www/src/content/blog/ko/calling-is-more-than-a-job.mdx`
- `apps/www/src/content/blog/ko/five-tests-for-discerning-gods-will.mdx`
- `apps/www/src/content/blog/ko/gifts-talents-strengths.mdx`
- `campaigns/blog-launch-2026q3/launch-plan.md`
- `campaigns/blog-launch-2026q3/copy/naver-blog/01-career-anxiety-burnout.md`
- `campaigns/blog-launch-2026q3/copy/instagram-facebook.md`
- `campaigns/blog-launch-2026q3/copy/threads.md`
- `campaigns/blog-launch-2026q3/links/campaign-links.csv`

**수행**

1. 세 원문의 제목, 핵심 주장, 성경 구절, CTA를 표로 추출한다.
2. 공식 글, 상담 신청, 자가진단의 실제 경로를 코드에서 확인한다.
3. 기존 일반 진로 캠페인의 8월 일정과 새 일정 8월 18일·23일·27일이 겹치지 않는지 확인한다.

**검증**

- 세 콘텐츠의 CTA 목적지가 설계 표와 일치한다.
- 원문에 없는 신학적 단정이나 Career Direct 효능 표현이 계획에 들어가지 않는다.

## 작업 2. 캠페인 골격 생성

**생성 파일**

- `campaigns/faith-calling-series-2026q3/launch-plan.md`
- `campaigns/faith-calling-series-2026q3/publishing-checklist.md`
- `campaigns/faith-calling-series-2026q3/utm-links.csv`
- `campaigns/faith-calling-series-2026q3/copy/naver-blog/01-calling-is-more-than-a-job.md`
- `campaigns/faith-calling-series-2026q3/copy/naver-blog/02-five-tests-for-discerning-gods-will.md`
- `campaigns/faith-calling-series-2026q3/copy/naver-blog/03-gifts-talents-strengths.md`
- `campaigns/faith-calling-series-2026q3/copy/instagram-facebook.md`
- `campaigns/faith-calling-series-2026q3/copy/threads.md`

**수행**

1. 승인된 디렉터리와 문서 제목을 만든다.
2. 운영표에 KST 기준 8월 18일·23일·27일과 채널별 시간을 기록한다.
3. 체크리스트에 성경 역본, 장·절, 단일 CTA, 개인정보, 모바일 줄바꿈, 링크 검증 항목을 넣는다.

**검증**

- `find campaigns/faith-calling-series-2026q3 -type f | sort`로 8개 파일을 확인한다.
- 빈 제목이나 이전 캠페인명이 남지 않았는지 검색한다.

## 작업 3. 1편 채널 원고 제작

**수정 파일**

- `campaigns/faith-calling-series-2026q3/copy/naver-blog/01-calling-is-more-than-a-job.md`
- `campaigns/faith-calling-series-2026q3/copy/instagram-facebook.md`
- `campaigns/faith-calling-series-2026q3/copy/threads.md`

**수행**

1. `소명은 직업보다 큽니다`를 검색형 네이버 원고로 50~70% 재구성한다.
2. 현실 질문, 소명의 성경적 범위, 성찰 질문, 적용, 상담 CTA를 한 흐름으로 연결한다.
3. 7~8장 카드뉴스 문안, 캡션, 대체 텍스트를 작성한다.
4. 문제 제기부터 상담 CTA까지 이어지는 Threads 4~5개를 작성한다.

**검증**

- CTA는 상담 신청 하나뿐이다.
- `하나님 나라의 청지기 관점`이 문맥에 자연스럽게 반영된다.
- 핵심 성경 구절의 장·절과 역본이 표시된다.

## 작업 4. 2편 채널 원고 제작

**수정 파일**

- `campaigns/faith-calling-series-2026q3/copy/naver-blog/02-five-tests-for-discerning-gods-will.md`
- `campaigns/faith-calling-series-2026q3/copy/instagram-facebook.md`
- `campaigns/faith-calling-series-2026q3/copy/threads.md`

**수행**

1. `하나님의 뜻을 분별하는 다섯 가지 점검`을 네이버 독자용으로 재구성한다.
2. 다섯 점검이 기계적 정답표가 아니라 기도와 공동체 안의 분별 도구임을 명시한다.
3. 7~8장 카드뉴스 문안과 채널별 캡션·대체 텍스트를 작성한다.
4. 다섯 기준을 과밀하지 않게 나눈 Threads 4~5개를 작성한다.

**검증**

- CTA는 상담 신청 하나뿐이다.
- Career Direct가 하나님의 뜻을 판정한다는 표현이 없다.
- 성경 구절이 각 점검의 실제 논지를 뒷받침한다.

## 작업 5. 3편 채널 원고 제작

**수정 파일**

- `campaigns/faith-calling-series-2026q3/copy/naver-blog/03-gifts-talents-strengths.md`
- `campaigns/faith-calling-series-2026q3/copy/instagram-facebook.md`
- `campaigns/faith-calling-series-2026q3/copy/threads.md`

**수행**

1. 은사·재능·강점의 차이와 연결을 네이버 원고로 재구성한다.
2. Career Direct의 재능이 성령의 은사와 같지 않음을 명확히 한다.
3. 평가와 결과 상담 이후 30일 작은 실험으로 이어지는 흐름을 넣는다.
4. 7~8장 카드뉴스 문안·캡션·대체 텍스트와 Threads 4~5개를 작성한다.

**검증**

- CTA는 커리어 자가진단 하나뿐이다.
- 평가 결과를 소명으로 단정하지 않는다.
- 30일 실험이 평가 전제처럼 과도하게 강요되지 않는다.

## 작업 6. UTM 링크 생성

**수정 파일**

- `campaigns/faith-calling-series-2026q3/utm-links.csv`

**열 구조**

```csv
publish_date,content_slug,channel,link_purpose,destination_url,tracked_url
```

**수행**

1. 채널별 공식 원문 링크와 CTA 링크를 구분해 행을 만든다.
2. `utm_campaign=faith_calling_series_2026q3`, `utm_medium=organic_social`을 공통 적용한다.
3. source와 content를 승인된 규칙으로 생성한다.
4. 각 원고의 링크 자리표시자를 최종 tracked URL로 교체한다.

**검증**

- CSV 파싱으로 모든 행의 열 수가 동일한지 확인한다.
- URL 파싱으로 UTM 4개 필드와 목적지 경로를 확인한다.
- 문서의 모든 추적 URL이 CSV에 존재하는지 대조한다.

## 작업 7. 내용·일정·형식 통합 검수

**검수 대상**

- `campaigns/faith-calling-series-2026q3/**/*`

**수행**

1. 장·절 표기, 개역개정/새번역 표기, CTA, 날짜를 전체 검색한다.
2. 네이버 원고와 공식 원문의 문장 중복을 표본 비교한다.
3. 카드뉴스 장 수와 Threads 게시물 수를 확인한다.
4. 맞춤법, 모바일 줄바꿈, 개인정보 포함 여부를 검토한다.
5. 기존 일반 진로 발행일 17·19·21·24·26·28일과 충돌하지 않는지 다시 확인한다.

**검증 명령 예시**

```bash
rg -n "2026-08-(18|23|27)|개역개정|새번역|상담 신청|자가진단" campaigns/faith-calling-series-2026q3
git diff --check
```

## 작업 8. ZIP 제작과 최종 확인

**생성 파일**

- `output/career-direct-korea-faith-calling-series-2026q3.zip`

**수행**

1. 캠페인 폴더만 ZIP에 포함한다.
2. 임시 파일, `.DS_Store`, 기존 캠페인, 개발 파일이 들어가지 않도록 한다.
3. ZIP 목록과 압축 무결성을 확인한다.
4. 원본 폴더와 ZIP 경로를 최종 안내한다.

**검증**

```bash
unzip -t output/career-direct-korea-faith-calling-series-2026q3.zip
unzip -l output/career-direct-korea-faith-calling-series-2026q3.zip
```

## 구현 순서와 완료 조건

작업 1부터 8까지 순차 진행한다. 각 콘텐츠는 채널 간 메시지 검수를 마친 뒤 다음 편으로 넘어간다. 다음 조건을 모두 충족하면 완료로 본다.

- 네이버 원고 3편이 있다.
- 카드뉴스 문안·캡션·대체 텍스트 3세트가 있다.
- Threads 문안 3세트가 있다.
- 운영표와 게시 체크리스트가 있다.
- 모든 추적 링크가 유효한 형식이며 문서와 CSV가 일치한다.
- 기존 일반 진로 일정과 발행일이 겹치지 않는다.
- ZIP 파일의 무결성 검사가 통과한다.
