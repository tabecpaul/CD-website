"use client";

import { useRouter } from "next/navigation";

export default function LogoutButton() {
  const router = useRouter();
  return <button onClick={async () => { await fetch("/api/admin/logout", { method: "POST" }); router.replace("/admin/login"); router.refresh(); }} className="rounded-full border border-navy/15 px-4 py-2 text-sm font-bold text-navy hover:bg-white">로그아웃</button>;
}
