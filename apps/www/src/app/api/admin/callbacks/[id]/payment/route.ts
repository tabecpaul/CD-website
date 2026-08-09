import { createPaymentInstruction } from "@/features/callback-payment/server/admin";
import { authorizePaymentRequest, paymentError } from "@/features/callback-payment/server/request";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const denied = await authorizePaymentRequest(request); if (denied) return denied;
  try {
    const body = await request.json() as Record<string, unknown>;
    const result = await createPaymentInstruction(Number((await params).id), body.productCode, body.depositorName);
    if (!result) return Response.json({ error: "not_found" }, { status: 404 });
    return Response.json({ ok: true, emailSent: result.email.ok }, { status: 201 });
  } catch (error) { return paymentError(error); }
}
