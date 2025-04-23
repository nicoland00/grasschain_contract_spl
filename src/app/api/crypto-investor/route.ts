// /src/app/api/crypto-investor/route.ts
import { NextResponse } from "next/server";
import { dbConnect }       from "@/lib/dbConnect";
import { CryptoInvestor }  from "@/lib/dbSchemas";

export async function POST(req: Request) {
  const { contract, investor, nftMint, txSignature, amount } = await req.json();
  if (!contract || !investor || !nftMint || !txSignature || amount == null) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  await dbConnect();
  await CryptoInvestor.create({ contract, investor, nftMint, txSignature, amount });
  return NextResponse.json({ success: true });
}
