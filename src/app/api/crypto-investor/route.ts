// src/app/api/crypto-investor/route.ts
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { dbConnect }      from "@/lib/dbConnect";
import { CryptoInvestor } from "@/lib/dbSchemas";

export async function POST(req: Request) {
  try {
    const { contract, investor, nftMint, txSignature, amount } = await req.json();
    if (!contract || !investor || !nftMint || !txSignature || amount == null) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    await dbConnect();
    await CryptoInvestor.updateOne(
      { contract, investor },
      {
        $inc: { amount },
        $set: {
          nftMint,
          txSignature,
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
    console.error("crypto-investor POST error:", err);
    return NextResponse.json(
      { error: err.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}
