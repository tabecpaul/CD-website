# 이미지 원본 기록

## `empathy-young-professional-v1.png`

- 생성 방식: Codex 기본 내장 이미지 생성 도구
- 용도 분류: `ads-marketing`
- 사용 위치: Meta 피드·스토리 공감 인물형 A

### 최종 프롬프트

```text
Use case: ads-marketing
Asset type: Korean career coaching campaign source photo for square and vertical social ads
Primary request: Create a photorealistic, natural editorial photograph of one Korean young professional in their late 20s or early 30s, sitting alone at a tidy desk after work, thoughtfully reflecting on career direction. The person should feel relatable, capable, and quietly concerned, not clinically depressed.
Scene/backdrop: contemporary but non-branded Korean office or home-office, softly blurred background, notebook and closed laptop as subtle context
Subject: one Korean young professional in smart casual clothing, natural expression, authentic skin texture
Style/medium: premium candid lifestyle photography, realistic and understated
Composition/framing: portrait-oriented composition that can crop cleanly to square; subject placed primarily in the right half; generous calm negative space on the left and upper-left for Korean headline overlay
Lighting/mood: soft late-afternoon window light, warm neutral ambience, hopeful teal accent in the environment
Color palette: warm cream, deep navy, muted teal, restrained gold accents
Constraints: no visible company logo, no religious symbol, no text, no watermark, no exaggerated sadness, no medical burnout imagery, no extra people, anatomically correct hands and face
```

한글 제목, 로고, CTA는 이미지 생성 모델에 맡기지 않고 `source/generate-creatives.py`에서 정확하게 합성한다.
