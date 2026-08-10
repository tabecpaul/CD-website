import { confirmPayment } from "@/features/callback-payment/server/admin";
import { authorizePaymentRequest, paymentError } from "@/features/callback-payment/server/request";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const denied = await authorizePaymentRequest(request); if (denied) return denied;
  try {
    const body = await request.json();
    const result = await confirmPayment(Number((await params).id), body.confirmed);
    if (!result) return Response.json({ error: "not_found" }, { status: 404 });
    return Response.json({ ok: true });
  } catch (error) { return paymentError(error); }
}
