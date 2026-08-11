import { setCallbackTestStatus } from "@/features/assessment-callback/server/admin";
import { authorizePaymentRequest, paymentError } from "@/features/callback-payment/server/request";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const denied = await authorizePaymentRequest(request);
  if (denied) return denied;
  try {
    const updated = await setCallbackTestStatus(Number((await params).id), await request.json());
    if (!updated) return Response.json({ error: "not_found" }, { status: 404 });
    return Response.json({ ok: true, isTest: updated.isTest });
  } catch (error) {
    return paymentError(error);
  }
}
