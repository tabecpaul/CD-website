import { createHash } from "node:crypto";
import { ADMIN_COOKIE, createAdminSession, verifyAdminPassword } from "@/features/admin/server/auth";

const attempts = new Map<string, { count: number; resetAt: number }>();
const WINDOW_MS = 10 * 60_000;
const MAX_ATTEMPTS = 8;

function attemptKey(request: Request) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  return createHash("sha256").update(`${process.env.ADMIN_DASHBOARD_SESSION_SECRET ?? ""}:${ip}`).digest("hex");
}

export async function POST(request: Request) {
  const key = attemptKey(request);
  const now = Date.now();
  const current = attempts.get(key);
  if (current && current.resetAt > now && current.count >= MAX_ATTEMPTS) {
    return Response.json({ error: "too_many_attempts" }, { status: 429 });
  }
  try {
    const body = await request.json() as { password?: unknown };
    if (typeof body.password !== "string" || body.password.length > 256 || !verifyAdminPassword(body.password)) {
      attempts.set(key, { count: current && current.resetAt > now ? current.count + 1 : 1, resetAt: now + WINDOW_MS });
      return Response.json({ error: "invalid_credentials" }, { status: 401 });
    }
    attempts.delete(key);
    const session = createAdminSession();
    const response = Response.json({ ok: true });
    // Remove the legacy path-scoped cookie before issuing a site-wide cookie.
    // Admin API routes live under /api/admin and cannot receive Path=/admin cookies.
    response.headers.append("Set-Cookie", `${ADMIN_COOKIE}=; Max-Age=0; Path=/admin; HttpOnly; Secure; SameSite=Strict`);
    response.headers.append("Set-Cookie", `${ADMIN_COOKIE}=${session.value}; Max-Age=${session.maxAge}; Path=/; HttpOnly; Secure; SameSite=Strict`);
    return response;
  } catch {
    return Response.json({ error: "invalid_request" }, { status: 400 });
  }
}
