"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { CreditCard } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import Footer from "@/components/sections/Footer";

// Client Component: `metadata` export isn't available here.
// The document <title> stays the RootLayout default ("Career Direct Korea").

const plans = [
  {
    id: "diagnosis-consulting",
    name: "진단 + 해석 컨설팅",
    price: 390000,
    description: "Career Direct 진단과 1:1 결과 해석 컨설팅",
  },
  {
    id: "diagnosis-action-plan",
    name: "진단 + 해석 + 실행계획",
    price: 590000,
    description: "결과 해석 컨설팅과 맞춤 실행계획 수립까지",
  },
  {
    id: "diagnosis-coaching",
    name: "진단 + 해석 + 실행계획 + 코칭 3회",
    price: 890000,
    description: "실행계획 수립 후 3회의 코칭으로 실제 적용까지 동행",
  },
];

function formatPrice(price: number) {
  return `${price.toLocaleString("ko-KR")}원`;
}

export default function CheckoutPage() {
  const [submitted, setSubmitted] = useState(false);
  const [planId, setPlanId] = useState(plans[0].id);
  const [termsAgreed, setTermsAgreed] = useState(false);
  const [privacyAgreed, setPrivacyAgreed] = useState(false);
  const [marketingAgreed, setMarketingAgreed] = useState(false);

  const selectedPlan = plans.find((plan) => plan.id === planId) ?? plans[0];
  const canSubmit = termsAgreed && privacyAgreed;

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!canSubmit) return;
    setSubmitted(true);
  }

  return (
    <>
      <main className="flex flex-1 flex-col bg-cream">
        <PageHeader />

        <section className="px-6 py-16 sm:px-10 sm:py-20">
          <div className="mx-auto flex w-full max-w-xl flex-col gap-8">
            <div className="flex flex-col gap-2">
              <h1 className="text-3xl font-bold tracking-tight text-navy sm:text-4xl">
                결제하기
              </h1>
              <p className="text-sm leading-6 text-navy/60">
                신청하실 프로그램과 결제수단을 선택해주세요.
              </p>
            </div>

            <div className="rounded-xl border border-gold/40 bg-gold/10 px-4 py-3 text-xs leading-5 text-navy">
              실제 결제는 아직 연동되지 않았습니다. 신청해주시면 담당자가
              확인 후 개별 안내드립니다. 상품과 가격은 확정 전 임시
              값입니다.
            </div>

            <div className="w-full rounded-3xl border border-navy/10 bg-gray/15 px-7 py-8 sm:px-9 sm:py-9">
              {submitted ? (
                <div className="flex flex-col items-center gap-2 py-8 text-center">
                  <span className="text-lg font-bold text-navy">
                    결제 신청이 접수되었습니다
                  </span>
                  <p className="text-sm leading-6 text-navy/60">
                    담당자가 확인 후 안내해드릴게요. 실제 결제는 이후 별도
                    안내에 따라 진행됩니다.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="flex flex-col gap-7">
                  <div className="flex flex-col gap-2.5">
                    <span className="text-xs font-semibold text-navy/70">
                      프로그램 선택
                    </span>
                    <div className="flex flex-col gap-2.5">
                      {plans.map((plan) => (
                        <label
                          key={plan.id}
                          className={`flex cursor-pointer flex-col gap-1 rounded-xl border px-4 py-3 transition-colors ${
                            planId === plan.id
                              ? "border-gold bg-cream"
                              : "border-navy/15 bg-cream/60 hover:border-navy/30"
                          }`}
                        >
                          <span className="flex items-center justify-between gap-3">
                            <span className="flex items-center gap-2.5">
                              <input
                                type="radio"
                                name="plan"
                                value={plan.id}
                                checked={planId === plan.id}
                                onChange={() => setPlanId(plan.id)}
                                className="h-4 w-4 shrink-0 border-navy/30 text-gold focus:outline-none focus:ring-2 focus:ring-gold/40"
                              />
                              <span className="text-sm font-semibold text-navy">
                                {plan.name}
                              </span>
                            </span>
                            <span className="text-sm font-bold text-navy">
                              {formatPrice(plan.price)}
                            </span>
                          </span>
                          <span className="pl-6 text-xs leading-5 text-navy/60">
                            {plan.description}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label
                      htmlFor="name"
                      className="text-xs font-semibold text-navy/70"
                    >
                      이름
                    </label>
                    <input
                      id="name"
                      name="name"
                      type="text"
                      required
                      placeholder="이름을 입력해주세요"
                      className="h-11 rounded-xl border border-navy/15 bg-cream px-4 text-sm text-navy placeholder:text-navy/30 focus:border-gold focus:outline-none"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label
                      htmlFor="email"
                      className="text-xs font-semibold text-navy/70"
                    >
                      이메일
                    </label>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      required
                      placeholder="example@email.com"
                      className="h-11 rounded-xl border border-navy/15 bg-cream px-4 text-sm text-navy placeholder:text-navy/30 focus:border-gold focus:outline-none"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label
                      htmlFor="phone"
                      className="text-xs font-semibold text-navy/70"
                    >
                      연락처
                    </label>
                    <input
                      id="phone"
                      name="phone"
                      type="tel"
                      required
                      placeholder="010-0000-0000"
                      className="h-11 rounded-xl border border-navy/15 bg-cream px-4 text-sm text-navy placeholder:text-navy/30 focus:border-gold focus:outline-none"
                    />
                  </div>

                  <div className="flex flex-col gap-2.5">
                    <span className="text-xs font-semibold text-navy/70">
                      결제수단
                    </span>
                    <div className="flex items-center gap-2 rounded-full border border-gold bg-gold/10 px-4 py-2 text-sm text-navy w-fit">
                      <CreditCard className="size-4" strokeWidth={2} />
                      신용카드
                    </div>
                  </div>

                  <div className="flex flex-col gap-3 border-t border-navy/10 pt-4">
                    <label className="flex items-start gap-2.5 text-xs leading-5 text-navy/70">
                      <input
                        type="checkbox"
                        name="termsAgreed"
                        required
                        checked={termsAgreed}
                        onChange={(e) => setTermsAgreed(e.target.checked)}
                        className="mt-0.5 h-4 w-4 shrink-0 rounded border-navy/30 text-gold focus:outline-none focus:ring-2 focus:ring-gold/40"
                      />
                      <span>
                        <span className="font-semibold text-navy">
                          (필수)
                        </span>{" "}
                        <Link href="/terms" className="underline underline-offset-2 hover:text-navy">
                          이용약관
                        </Link>{" "}
                        및{" "}
                        <Link
                          href="/refund-policy"
                          className="underline underline-offset-2 hover:text-navy"
                        >
                          결제 및 환불정책
                        </Link>
                        에 동의합니다.
                      </span>
                    </label>

                    <label className="flex items-start gap-2.5 text-xs leading-5 text-navy/70">
                      <input
                        type="checkbox"
                        name="privacyAgreed"
                        required
                        checked={privacyAgreed}
                        onChange={(e) => setPrivacyAgreed(e.target.checked)}
                        className="mt-0.5 h-4 w-4 shrink-0 rounded border-navy/30 text-gold focus:outline-none focus:ring-2 focus:ring-gold/40"
                      />
                      <span>
                        <span className="font-semibold text-navy">
                          (필수)
                        </span>{" "}
                        <Link
                          href="/privacy"
                          className="underline underline-offset-2 hover:text-navy"
                        >
                          개인정보처리방침
                        </Link>
                        에 동의합니다.
                      </span>
                    </label>

                    <label className="flex items-start gap-2.5 text-xs leading-5 text-navy/70">
                      <input
                        type="checkbox"
                        name="marketingAgreed"
                        checked={marketingAgreed}
                        onChange={(e) => setMarketingAgreed(e.target.checked)}
                        className="mt-0.5 h-4 w-4 shrink-0 rounded border-navy/30 text-gold focus:outline-none focus:ring-2 focus:ring-gold/40"
                      />
                      <span>
                        <span className="font-semibold text-navy">
                          (선택)
                        </span>{" "}
                        마케팅 정보 수신에 동의합니다.
                      </span>
                    </label>
                  </div>

                  <button
                    type="submit"
                    disabled={!canSubmit}
                    className="mt-2 flex h-12 items-center justify-center rounded-full bg-gold text-sm font-semibold text-cream transition-colors hover:bg-gold/90 disabled:cursor-not-allowed disabled:bg-navy/20 disabled:text-navy/40 disabled:hover:bg-navy/20"
                  >
                    {formatPrice(selectedPlan.price)} 결제하기
                  </button>
                </form>
              )}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
