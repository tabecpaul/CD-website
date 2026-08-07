import type { Metadata } from "next";
import CareerCheckLanding from "@/features/lead-magnet/components/CareerCheckLanding";

export const metadata: Metadata = {
  title: "무료 진로방향 자가진단 | Career Direct Korea",
  description:
    "진로 불안과 번아웃을 느끼는 청년 직장인을 위한 10분 자가진단. 성격·흥미·재능·가치관의 네 가지 나침반으로 지금의 방향을 점검하세요.",
  alternates: { canonical: "https://www.careerdirect.kr/career-check" },
  openGraph: {
    title: "왜 열심히 사는데 진로 불안과 번아웃을 느끼나요?",
    description: "네 가지 나침반으로 지금의 커리어 방향을 점검하는 무료 12페이지 워크북",
    url: "https://www.careerdirect.kr/career-check",
    siteName: "Career Direct Korea",
    locale: "ko_KR",
    type: "website",
    images: [{ url: "/og.png", width: 1536, height: 1024, alt: "청년 직장인을 위한 무료 진로방향 자가진단" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "왜 열심히 사는데 진로 불안과 번아웃을 느끼나요?",
    description: "네 가지 나침반으로 지금의 커리어 방향을 점검하는 무료 12페이지 워크북",
    images: ["/og.png"],
  },
};

export default function CareerCheckPage() {
  return <CareerCheckLanding />;
}
