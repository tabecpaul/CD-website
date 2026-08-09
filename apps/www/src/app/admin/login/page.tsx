import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { hasAdminSession } from "@/features/admin/server/auth";
import LoginForm from "./LoginForm";

export const metadata: Metadata = { title: "관리자 로그인", robots: { index: false, follow: false } };

export default async function AdminLoginPage() {
  if (await hasAdminSession()) redirect("/admin/analytics");
  return (
    <main className="flex min-h-screen items-center justify-center bg-cream px-6 py-16">
      <section className="w-full max-w-md rounded-[1.75rem] border border-navy/10 bg-white p-8 shadow-[0_24px_80px_rgba(23,50,77,.12)] sm:p-10">
        <p className="text-xs font-black tracking-[.16em] text-teal">CAREER DIRECT KOREA</p>
        <h1 className="mt-3 text-3xl font-black text-navy">전환 대시보드</h1>
        <p className="mt-3 text-sm leading-6 text-navy/60">승인된 관리자만 접속할 수 있습니다.</p>
        <LoginForm />
      </section>
    </main>
  );
}
