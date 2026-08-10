# 청년 직장인 진로 방향 파일럿 캠페인

## 캠페인 목표

무료 12페이지 `진로 방향 자가진단 PDF` 신청을 1차 전환으로 삼고, 격일 3회 코칭 이메일과 20분 무료 콜백을 통해 Career Direct 평가·컨설팅으로 연결한다.

## 공통 운영 규칙

- 랜딩페이지: `https://start.careerdirect.kr/career-check`
- 캠페인: `career_direction_pilot_2026q3`
- 게시할 때 반드시 `links/campaign-links.csv`에서 해당 채널·소재 링크를 복사한다.
- A/B 비교 기준은 `utm_content`다. 링크에서 해당 값을 임의로 바꾸지 않는다.
- PDF는 무료 자료이며 Career Direct 유료 평가·컨설팅과 혼동되게 표현하지 않는다.
- 이 폴더는 소재와 추적 링크만 제공한다. 광고 계정 설정, 게시 자동화, 예산 집행은 포함하지 않는다.

## 채널별 사용

| 채널 | 권장 소재 | 문구 파일 |
|---|---|---|
| Instagram/Facebook | 공감 인물형 A, 타이포형 B | `copy/instagram-facebook.md` |
| Threads | 타이포 A/B | `copy/threads.md` |
| 네이버 블로그 | 워크북형 대표·본문 카드 | `copy/naver-blog-01.md`, `copy/naver-blog-02.md` |
| 교회·청년부 | 신앙·소명형 포스터 | `copy/church.md` |
| 대학·학생단체 | 자기이해·진로불안형 포스터 | `copy/university.md` |

## 게시 전 체크리스트

1. 채널과 무료/유료 배포 구분이 링크 manifest와 일치하는가?
2. CTA가 무료 PDF 신청으로 하나만 제시되는가?
3. 이미지 속 문구와 본문 문구가 같은 약속을 하는가?
4. 링크를 새 창에서 열어 랜딩페이지가 정상 표시되는가?
5. QR을 실제 휴대전화로 스캔했는가?
6. 관리자 전환 분석의 `소재` 열에 올바른 `utm_content`가 표시되는가?

## 재생성

번들 Python 환경에서 `source/generate-links-and-qr.py`를 실행하면 CSV와 PNG/SVG QR을 동일하게 재생성할 수 있다.
