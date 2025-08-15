// src/app/api/verify-nfts/route.ts
import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/dbConnect";
import CryptoInvestor from "@/models/tracking/CryptoInvestor";
import FiatInvestor from "@/models/tracking/FiatInvestor";

export async function POST(request: Request) {
  try {
    await dbConnect();
    const { contract, lotId, email, address } = await request.json();

    if (address) {
      const ci = await CryptoInvestor.findOne({ investor: address, contract }).lean();
      if (ci && ci.ranchId) {
        return NextResponse.json({ success: true, ranchId: ci.ranchId, lotId: ci.lotId, contractId: ci.contract });
      }
    }

    if (email) {
      const fi = await FiatInvestor.findOne({ email, contract }).lean();
      if (fi && fi.ranchId) {
        return NextResponse.json({ success: true, ranchId: fi.ranchId, lotId: fi.lotId, contractId: fi.contract });
      }
    }

    return NextResponse.json({ success: false, reason: "No matching investment" }, { status: 404 });
  } catch (err: any) {
    console.error("Error in /api/verify-nfts:", err);
    return NextResponse.json({ success: false, reason: err.message }, { status: 500 });
  }
}
