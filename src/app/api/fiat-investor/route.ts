// /src/app/api/fiat-investor/route.ts
import { NextResponse }  from "next/server";
import { dbConnect }     from "@/lib/dbConnect";
import { FiatInvestor }  from "@/lib/dbSchemas";

export async function POST(req: Request) {
  const { contract, email, amountPaid, paymentMethod, paymentIntentId, maskedCard } =
    await req.json();

  if (!contract || !email || !amountPaid || !paymentMethod) {
    return NextResponse.json({ error: "Faltan campos obligatorios" }, { status: 400 });
  }

  await dbConnect();
  await FiatInvestor.create({
    contract,
    email,
    amountPaid,
    paymentMethod,
    paymentIntentId,
    maskedCard,
  });

  return NextResponse.json({ success: true });
}
