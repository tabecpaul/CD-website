import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const outputPath = path.join(root, "apps/www/src/features/content-operations/contentCatalog.generated.json");

const campaigns = [
  {
    id: "blog_launch_2026q3",
    root: "campaigns/blog-launch-2026q3",
    social: "copy/instagram-facebook.md",
    threads: "copy/threads.md",
    links: "links/campaign-links.csv",
    linkSlug: "article_slug",
    linkPurpose: "destination_type",
    naver: [
      "copy/naver-blog/01-career-anxiety-burnout.md",
      "copy/naver-blog/02-four-career-compasses.md",
      "copy/naver-blog/03-change-jobs.md",
      "copy/naver-blog/04-ai-job-anxiety.md",
      "copy/naver-blog/05-like-vs-strength.md",
      "copy/naver-blog/06-career-transition.md",
    ],
    items: [
      ["why-career-anxiety-and-burnout", "왜 열심히 사는데 진로 불안과 번아웃을 느끼나요?", "career-reality", "self-check", "https://start.careerdirect.kr/career-check"],
      ["four-career-compasses", "성격·흥미·재능·가치관, 네 가지 나침반으로 진로를 점검하는 법", "self-understanding", "self-check", "https://start.careerdirect.kr/career-check"],
      ["should-i-change-jobs", "이직해야 할까, 남아야 할까? 결정 전에 확인할 기준", "career-transition", "callback", "https://start.careerdirect.kr/assessment-consultation"],
      ["ai-job-anxiety-checklist", "AI 때문에 내 일이 사라질까 불안할 때 확인할 6가지", "ai-and-work", "self-check", "https://start.careerdirect.kr/career-check"],
      ["what-i-like-vs-what-i-do-well", "좋아하는 일과 잘하는 일이 다를 때 진로를 정하는 법", "self-understanding", "self-check", "https://start.careerdirect.kr/career-check"],
      ["before-career-transition", "경력 전환을 결심하기 전에 반드시 확인할 현실 조건", "career-transition", "callback", "https://start.careerdirect.kr/assessment-consultation"],
    ],
  },
  {
    id: "faith_calling_series_2026q3",
    root: "campaigns/faith-calling-series-2026q3",
    social: "copy/instagram-facebook.md",
    threads: "copy/threads.md",
    links: "utm-links.csv",
    linkSlug: "content_slug",
    linkPurpose: "link_purpose",
    naver: [
      "copy/naver-blog/01-calling-is-more-than-a-job.md",
      "copy/naver-blog/02-five-tests-for-discerning-gods-will.md",
      "copy/naver-blog/03-gifts-talents-strengths.md",
    ],
    items: [
      ["calling-is-more-than-a-job", "소명은 직업 하나를 찾는 일이 아닙니다", "faith-and-calling", "callback", "https://start.careerdirect.kr/assessment-consultation"],
      ["five-tests-for-discerning-gods-will", "하나님의 뜻을 분별할 때 확인해야 할 5가지 기준", "faith-and-calling", "callback", "https://start.careerdirect.kr/assessment-consultation"],
      ["gifts-talents-strengths", "은사·재능·강점은 어떻게 다른가? 하나님이 맡기신 나를 이해하는 법", "faith-and-calling", "self-check", "https://start.careerdirect.kr/career-check"],
    ],
  },
];

function parseCsv(text) {
  const [headerLine, ...lines] = text.trim().split(/\r?\n/);
  const headers = headerLine.split(",");
  return lines.filter(Boolean).map((line) => Object.fromEntries(line.split(",").map((value, index) => [headers[index], value])));
}

function markdownSections(text) {
  return [...text.matchAll(/^## \d{2} · (.+?) — (\d{4}-\d{2}-\d{2})\n([\s\S]*?)(?=\n---\n|(?![\s\S]))/gm)].map((match) => ({
    label: match[1].trim(),
    publishDate: match[2],
    body: match[3].trim(),
  }));
}

function cardSlides(body) {
  const cardArea = body.match(/### 카드뉴스 8장\n([\s\S]*?)(?=\n### 인스타그램·페이스북 공용 캡션)/)?.[1] ?? "";
  return [...cardArea.matchAll(/^\*\*(\d)장 · ([^*]+)\*\*\n([\s\S]*?)(?=\n+\*\*\d장 ·|(?![\s\S]))/gm)].map((match) => `${match[1]}장 · ${match[2].trim()}\n${match[3].trim()}`);
}

function socialCopy(body, channel) {
  const raw = body.match(/### 인스타그램·페이스북 공용 캡션\n([\s\S]*?)(?=\n### 이미지 대체 텍스트|$)/)?.[1] ?? "";
  return raw.split(/\r?\n/).filter((line) => {
    if (line.startsWith("**소재:**") || line.startsWith("**이미지 대체 텍스트:**")) return false;
    if (channel === "instagram" && line.startsWith("**Facebook")) return false;
    if (channel === "facebook" && line.startsWith("**Instagram")) return false;
    return true;
  }).join("\n").trim();
}

function altText(body) {
  const section = body.match(/### 이미지 대체 텍스트\n+([\s\S]*)$/)?.[1]?.trim();
  if (section) return section;
  return body.match(/^\*\*이미지 대체 텍스트:\*\* (.+)$/m)?.[1]?.trim() ?? null;
}

function ctaLink(rows, slug, channel, purposeField) {
  const row = rows.find((item) => item.channel === channel && item[purposeField] !== "article" && item[purposeField] !== "official_article" && (item.article_slug === slug || item.content_slug === slug));
  if (!row?.tracked_url) throw new Error(`CTA_LINK_MISSING:${slug}:${channel}`);
  return row.tracked_url;
}

const catalog = [];
for (const campaign of campaigns) {
  const campaignRoot = path.join(root, campaign.root);
  const [socialText, threadsText, linksText] = await Promise.all([
    readFile(path.join(campaignRoot, campaign.social), "utf8"),
    readFile(path.join(campaignRoot, campaign.threads), "utf8"),
    readFile(path.join(campaignRoot, campaign.links), "utf8"),
  ]);
  const socialSections = markdownSections(socialText);
  const threadSections = markdownSections(threadsText);
  const rows = parseCsv(linksText);
  if (socialSections.length !== campaign.items.length || threadSections.length !== campaign.items.length) throw new Error(`SECTION_COUNT_INVALID:${campaign.id}`);

  for (let index = 0; index < campaign.items.length; index += 1) {
    const [slug, title, category, ctaType, ctaUrl] = campaign.items[index];
    const social = socialSections[index];
    const thread = threadSections[index];
    const slides = cardSlides(social.body);
    if (slides.length !== 8) throw new Error(`CARD_COUNT_INVALID:${slug}:${slides.length}`);
    const naverCopy = (await readFile(path.join(campaignRoot, campaign.naver[index]), "utf8")).trim();
    const officialUrl = `https://www.careerdirect.kr/blog/${slug}`;
    const tasks = [
      { channel: "naver_blog", scheduledTime: "08:00", postCopy: naverCopy, cardSlides: null, altText: null },
      { channel: "instagram", scheduledTime: "19:00", postCopy: socialCopy(social.body, "instagram"), cardSlides: slides, altText: altText(social.body) },
      { channel: "facebook", scheduledTime: "19:00", postCopy: socialCopy(social.body, "facebook"), cardSlides: slides, altText: altText(social.body) },
      { channel: "threads", scheduledTime: "21:00", postCopy: thread.body, cardSlides: null, altText: null },
    ].map((task) => ({ ...task, trackedUrl: ctaLink(rows, slug, task.channel, campaign.linkPurpose) }));
    catalog.push({ slug, title, category, campaign: campaign.id, officialUrl, ctaType, ctaUrl, isTest: false, publishDate: social.publishDate, tasks });
  }
}

if (catalog.length !== 9 || catalog.reduce((sum, item) => sum + item.tasks.length, 0) !== 36) throw new Error("CATALOG_COUNT_INVALID");
await mkdir(path.dirname(outputPath), { recursive: true });
await writeFile(outputPath, `${JSON.stringify(catalog, null, 2)}\n`, "utf8");
process.stdout.write(`Generated ${catalog.length} items and ${catalog.reduce((sum, item) => sum + item.tasks.length, 0)} tasks at ${outputPath}\n`);
