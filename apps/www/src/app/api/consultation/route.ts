import { consultationRequests, db } from "@newland/db";

export async function POST(request: Request) {
  const body = await request.json();
  const { name, email, phone, timeSlot, marketingAgreed, privacyAgreed } =
    body;

  if (!name || !email || !phone || !timeSlot || !privacyAgreed) {
    return Response.json(
      { error: "필수 항목을 모두 입력해주세요." },
      { status: 400 },
    );
  }

  await db.insert(consultationRequests).values({
    name,
    email,
    phone,
    timeSlot,
    marketingAgreed: Boolean(marketingAgreed),
  });

  return Response.json({ ok: true }, { status: 201 });
}
