// 🚨 runtime/dynamic MUST come before any imports
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { dbConnect }      from "@/lib/dbConnect";
import { CryptoInvestor } from "@/lib/dbSchemas";

export async function POST(req: Request) {
  try {
    const { contract, investor, nftMint, txSignature, amount } = await req.json();
    if (
      !contract ||
      !investor ||
      !nftMint ||
      !txSignature ||
      amount == null
    ) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    await dbConnect();
    await CryptoInvestor.create({
      contract,
      investor,
      nftMint,
      txSignature,
      amount,
    });

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (err: any) {
    console.error("❌ /api/crypto-investor error:", err);
    return NextResponse.json(
      { error: err.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}
