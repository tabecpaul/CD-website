import { hasAdminSession } from "@/features/admin/server/auth";

export async function authorizePaymentRequest(request: Request) {
  if (!(await hasAdminSession())) return Response.json({ error: "unauthorized" }, { status: 401 });
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://start.careerdirect.kr";
  if (request.headers.get("origin") !== new URL(siteUrl).origin) return Response.json({ error: "forbidden" }, { status: 403 });
  return null;
}

export function paymentError(error: unknown) {
  const code = error instanceof Error ? error.message : "PAYMENT_UNKNOWN";
  const status = code === "PAYMENT_ACTIVE_EXISTS" || code === "PAYMENT_STATE_INVALID" ? 409 : code === "PAYMENT_INPUT_INVALID" || code === "REFUND_CONTEXT_INVALID" ? 400 : 503;
  if (status === 503) console.error("Admin payment request failed", { errorCode: error instanceof Error ? error.name : "UNKNOWN", errorMessage: code.slice(0, 120) });
  return Response.json({ error: status === 409 ? "invalid_state" : status === 400 ? "invalid_request" : "payment_unavailable" }, { status });
}
