# Career Direct Korea 블로그 배포 제작 계획

**기준 설계:** `docs/superpowers/specs/2026-08-11-blog-distribution-design.md`

## 목표

공식 블로그 6편을 네이버 블로그, 인스타그램·페이스북, 스레드에 배포할 수 있는 완성 원고와 고유 UTM 링크, 수동 게시 운영표를 만든다. 자동 게시와 외부 채널 계정 조작은 이번 범위에 포함하지 않는다.

## 산출물 구조

```text
campaigns/blog-launch-2026q3/
├── README.md
├── launch-plan.md
├── checklist.md
├── links/
│   └── campaign-links.csv
└── copy/
    ├── naver-blog/
    │   ├── 01-career-anxiety-burnout.md
    │   ├── 02-four-career-compasses.md
    │   ├── 03-change-jobs.md
    │   ├── 04-ai-job-anxiety.md
    │   ├── 05-like-vs-strength.md
    │   └── 06-career-transition.md
    ├── instagram-facebook.md
    └── threads.md
```

## 작업 1: 캠페인 기본 구조와 운영 기준

**파일**

- 생성: `campaigns/blog-launch-2026q3/README.md`
- 생성: `campaigns/blog-launch-2026q3/launch-plan.md`
- 생성: `campaigns/blog-launch-2026q3/checklist.md`

**내용**

1. 캠페인 목적, 대상, 채널과 CTA 원칙을 README에 기록한다.
2. 2026년 8월 17일부터 28일까지 채널별 게시 시간을 운영표로 작성한다.
3. 게시 전 링크·오탈자·출처·모바일·CTA 확인 항목을 체크리스트로 만든다.

**검증**

```bash
rg -n "2026-08-(17|19|21|24|26|28)|naver_blog|instagram|facebook|threads" campaigns/blog-launch-2026q3
```

## 작업 2: UTM 링크 매트릭스

**파일**

- 생성: `campaigns/blog-launch-2026q3/links/campaign-links.csv`

**열**

```csv
publish_date,article_slug,channel,destination_type,destination_url,utm_source,utm_medium,utm_campaign,utm_content,tracked_url
```

**규칙**

- 글마다 4개 채널 × 공식 원문 링크를 만든다.
- 글의 기본 CTA마다 4개 채널 × CTA 링크를 만든다.
- `utm_medium=organic_social`, `utm_campaign=blog_launch_2026q3`로 고정한다.
- `utm_content={slug}_{channel}_{YYYYMMDD}` 형식을 사용한다.
- URL 쿼리는 표준 퍼센트 인코딩하고 중복 행을 허용하지 않는다.

**검증**

```bash
python3 - <<'PY'
import csv
from pathlib import Path
rows=list(csv.DictReader(Path('campaigns/blog-launch-2026q3/links/campaign-links.csv').open()))
assert len(rows) == 48
assert len({r['tracked_url'] for r in rows}) == 48
assert all(r['utm_campaign']=='blog_launch_2026q3' for r in rows)
print('UTM rows:', len(rows))
PY
```

## 작업 3: 네이버 블로그 원고 1편 — 진로 불안과 번아웃

**파일:** `campaigns/blog-launch-2026q3/copy/naver-blog/01-career-anxiety-burnout.md`

**구성**

1. 검색형 제목과 2~3문장 요약
2. 열심히 살지만 방향을 잃는 현실 장면
3. 번아웃과 진로 불안의 차이
4. 성격·흥미·재능·가치관 점검 질문
5. 위험 신호 시 전문기관을 우선 이용하라는 안내
6. 5개 실천 체크리스트
7. 무료 자가진단 CTA와 공식 원문 링크
8. WHO 및 Career Direct 출처

**검증:** 원문 복제가 아닌 재서술인지 확인하고 CTA는 자가진단 하나만 사용한다.

## 작업 4: 네이버 블로그 원고 2편 — 네 가지 나침반

**파일:** `campaigns/blog-launch-2026q3/copy/naver-blog/02-four-career-compasses.md`

성격·흥미·재능·가치관을 각각 설명하고 네 기준을 하나의 진로 문장으로 통합하는 예시와 5개 체크리스트를 제공한다. CTA는 무료 자가진단으로 한다.

## 작업 5: 네이버 블로그 원고 3편 — 이직 또는 잔류

**파일:** `campaigns/blog-launch-2026q3/copy/naver-blog/03-change-jobs.md`

회피 요인과 지향 요인, 회사·직무·관계·생활 조건을 구분하고 결정 날짜를 정하는 방법을 설명한다. CTA는 20분 무료 콜백으로 한다.

## 작업 6: 네이버 블로그 원고 4편 — AI 일자리 불안

**파일:** `campaigns/blog-launch-2026q3/copy/naver-blog/04-ai-job-anxiety.md`

ILO 공식 자료를 바탕으로 직업이 아닌 과업 단위의 변화를 설명한다. 자동화 과업·인간 기여·전환 역량·30일 실험을 포함하고 CTA는 무료 자가진단으로 한다.

## 작업 7: 네이버 블로그 원고 5편 — 좋아하는 일과 잘하는 일

**파일:** `campaigns/blog-launch-2026q3/copy/naver-blog/05-like-vs-strength.md`

흥미와 재능을 억지로 일치시키지 않고 역할·환경·가치와 연결하는 방법을 설명한다. CTA는 무료 자가진단으로 한다.

## 작업 8: 네이버 블로그 원고 6편 — 경력 전환

**파일:** `campaigns/blog-launch-2026q3/copy/naver-blog/06-career-transition.md`

재정·시간·가족·시장·중단 기준을 확인하고 퇴사 전에 할 수 있는 작은 실험을 제시한다. CTA는 20분 무료 콜백으로 한다.

**네이버 6편 공통 검증**

```bash
for file in campaigns/blog-launch-2026q3/copy/naver-blog/*.md; do
  test "$(wc -w < "$file")" -ge 250 || exit 1
  rg -q "Career Direct Korea|박정열" "$file" || exit 1
done
```

## 작업 9: 인스타그램·페이스북 공용 캡션 6편

**파일:** `campaigns/blog-launch-2026q3/copy/instagram-facebook.md`

각 게시물은 다음 형식을 따른다.

1. 공감 질문 한 줄
2. 핵심 통찰 3~5개
3. 독자가 답할 참여 질문 한 개
4. 지정 CTA 한 개
5. 5~8개의 과도하지 않은 해시태그
6. 페이스북용 추적 링크와 인스타그램용 프로필 링크 안내

기존 공감 인물형과 타이포형 소재를 게시물별로 교차 지정한다.

## 작업 10: 스레드 연속 글 6편

**파일:** `campaigns/blog-launch-2026q3/copy/threads.md`

각 콘텐츠를 3~5개의 번호가 있는 짧은 게시물로 만든다. 질문→관찰→행동 순서를 유지하고 마지막 게시물에 CTA와 추적 링크를 둔다.

## 작업 11: 링크와 원고 교차 검증

**검증 항목**

- 모든 원고의 URL이 CSV에 존재한다.
- 자가진단 글에는 콜백 CTA가 섞이지 않는다.
- 콜백 글에는 자가진단을 최종 CTA로 사용하지 않는다.
- 공식 글 6개와 CTA 목적지 2개가 모두 HTTPS다.
- UTM source와 실제 채널이 일치한다.
- 개인정보나 실제 고객 사례가 포함되지 않는다.

**검증 명령**

```bash
rg -n "https://(www\.)?careerdirect\.kr/blog/|https://start\.careerdirect\.kr/" campaigns/blog-launch-2026q3/copy
git diff --check
```

## 작업 12: 최종 검토와 Preview용 커밋

1. 제목, 날짜, CTA, 링크를 운영표와 대조한다.
2. 네이버 원고 6편을 모바일에서 읽기 쉬운 짧은 문단으로 확인한다.
3. CSV 검증 스크립트를 실행한다.
4. 사용자 소유의 기존 캠페인 파일과 미추적 자산은 커밋하지 않는다.
5. `codex/blog-distribution` 브랜치에 명시적 경로만 스테이징하여 커밋한다.

## 완료 기준

- 18개 채널 원고가 모두 완성돼 복사·게시할 수 있다.
- 48개 UTM 링크가 중복 없이 검증된다.
- 게시 일정과 콘텐츠 파일이 일대일로 대응한다.
- 첫 2주는 계정 연동 없이 수동 게시가 가능하다.
- 게시 후 관리자 전환 분석에서 채널과 글을 구분할 수 있다.
