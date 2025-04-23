// src/app/api/fiat/summary/route.ts
import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/dbConnect";
import { FiatInvestor } from "@/lib/dbSchemas";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const contract = searchParams.get("contract");
  if (!contract) {
    return NextResponse.json({ error: "missing contract" }, { status: 400 });
  }

  await dbConnect();
  const agg = await FiatInvestor.aggregate([
    { $match: { contract } },
    { $group: { _id: null, total: { $sum: "$amountPaid" } } }
  ]);

  const total = agg[0]?.total || 0;
  return NextResponse.json({ fiatFunded: total });
}
