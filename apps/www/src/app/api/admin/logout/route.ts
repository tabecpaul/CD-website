import { ADMIN_COOKIE } from "@/features/admin/server/auth";

export async function POST() {
  const response = Response.json({ ok: true });
  response.headers.append("Set-Cookie", `${ADMIN_COOKIE}=; Max-Age=0; Path=/admin; HttpOnly; Secure; SameSite=Strict`);
  return response;
}
