// src/app/api/verify-nfts/route.ts
import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/dbConnect";
import CryptoInvestor, { ICryptoInvestor } from "@/models/tracking/CryptoInvestor";
import FiatInvestor, { IFiatInvestor } from "@/models/tracking/FiatInvestor";

export async function POST(request: Request) {
  try {
    // 1) Conecta a Mongo
    await dbConnect();

    // 2) Parsea body
    const { userNFTs, email } = await request.json();

    // 3) Si vienen NFTs (crypto)
    if (Array.isArray(userNFTs) && userNFTs.length > 0) {
      const ci = await CryptoInvestor
        .findOne<ICryptoInvestor>({ nftMint: { $in: userNFTs } })
        .lean();

      if (!ci) {
        return NextResponse.json(
          { success: false, error: "No matching NFT found." },
          { status: 404 }
        );
      }
      if (!ci.ranchId) {
        return NextResponse.json(
          {
            success: false,
            error:
              "Contract is active, but tracking isn’t configured yet. You’ll be notified once the herd location is available."
          },
          { status: 400 }
        );
      }

      return NextResponse.json({
        success:    true,
        ranchId:    ci.ranchId,
        contractId: ci.contract
      });
    }

    // 4) Si viene email (fiat)
    if (typeof email === "string" && email.trim() !== "") {
      const fi = await FiatInvestor
        .findOne<IFiatInvestor>({ email })
        .lean();

      if (!fi) {
        return NextResponse.json(
          { success: false, error: "No matching email found." },
          { status: 404 }
        );
      }
      if (!fi.ranchId) {
        return NextResponse.json(
          {
            success: false,
            error:
              "Contract is active, but tracking isn’t configured yet. You’ll be notified once the herd location is available."
          },
          { status: 400 }
        );
      }

      return NextResponse.json({
        success:    true,
        ranchId:    fi.ranchId,
        contractId: fi.contract
      });
    }

    // 5) Ningún parámetro válido
    return NextResponse.json(
      { success: false, error: "You must provide either userNFTs or email." },
      { status: 400 }
    );
  } catch (err: any) {
    console.error("Error in /api/verify-nfts:", err);
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}
