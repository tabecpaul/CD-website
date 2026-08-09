import { cancelAwaitingPayment } from "@/features/callback-payment/server/admin";
import { authorizePaymentRequest, paymentError } from "@/features/callback-payment/server/request";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const denied = await authorizePaymentRequest(request); if (denied) return denied;
  try {
    const result = await cancelAwaitingPayment(Number((await params).id));
    if (!result) return Response.json({ error: "not_found" }, { status: 404 });
    return Response.json({ ok: true });
  } catch (error) { return paymentError(error); }
}
