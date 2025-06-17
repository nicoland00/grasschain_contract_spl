export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { dbConnect }    from "@/lib/dbConnect";
import { FiatInvestor } from "@/lib/dbSchemas";

export async function POST(req: Request) {
  try {
    const {
      contract,
      email,
      amountPaid,
      paymentMethod,
      paymentIntentId,
      maskedCard,
    } = await req.json();

    if (!contract || !email || amountPaid == null || !paymentMethod) {
      return NextResponse.json(
        { error: "Faltan campos obligatorios" },
        { status: 400 }
      );
    }

    await dbConnect();
    await FiatInvestor.updateOne(
      { contract, email },
      {
        $inc: { amountPaid },
        $set: {
          paymentMethod,
          paymentIntentId,
          maskedCard,
          updatedAt: new Date(),
        },
        $setOnInsert: {
          createdAt: new Date(),
        },
      },
      { upsert: true }
    );

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (err: any) {
    console.error("❌ /api/fiat-investor POST error:", err);
    return NextResponse.json(
      { error: err.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}
