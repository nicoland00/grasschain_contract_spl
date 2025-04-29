// src/app/api/fiat-investor/route.ts
import { NextResponse } from "next/server";
import { dbConnect }    from "@/lib/dbConnect";
import { FiatInvestor } from "@/lib/dbSchemas";

// Ensure this runs only server‐side on each request
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/fiat-investor?contract=…
 * Returns total off‐chain USDC invested for a given contract.
 */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const contract = searchParams.get("contract");
    if (!contract) {
      return NextResponse.json(
        { error: "Missing `?contract=` query parameter" },
        { status: 400 }
      );
    }

    await dbConnect();

    // Aggregate sum of amountPaid
    const [agg] = await FiatInvestor.aggregate([
      { $match: { contract } },
      { $group: { _id: null, total: { $sum: "$amountPaid" } } },
    ]);

    return NextResponse.json({ fiatFunded: agg?.total ?? 0 });
  } catch (err: any) {
    console.error("fiat-investor GET error:", err);
    return NextResponse.json(
      { error: err.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/fiat-investor
 * Records a new off‐chain USDC investment from Stripe.
 */
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
    await FiatInvestor.create({
      contract,
      email,
      amountPaid,
      paymentMethod,
      paymentIntentId,
      maskedCard,
    });

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (err: any) {
    console.error("fiat-investor POST error:", err);
    return NextResponse.json(
      { error: err.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}
