// src/app/api/notifications/route.ts
import { NextResponse } from "next/server";
import { dbConnect }   from "@/lib/dbConnect";
import Notification     from "@/models/Notification";
import CryptoInvestor   from "@/models/tracking/CryptoInvestor";
import FiatInvestor     from "@/models/tracking/FiatInvestor";
import { getServerSession } from "next-auth/next";
import { authOptions }      from "@/lib/auth";

const ADMIN_PUBKEY = process.env.NEXT_PUBLIC_ADMIN_PUBKEY;
export const runtime = "nodejs";

export async function GET(req: Request) {
  await dbConnect();
  const url     = new URL(req.url);
  const wallet  = url.searchParams.get("wallet");
  const session = await getServerSession(authOptions);
  const email   = session?.user?.email;

  // if ?contract=xyz was passed, just show that one
  const contractOnly = url.searchParams.get("contract");
  let myContracts: string[];
  if (contractOnly) {
    myContracts = [contractOnly];
  } else {
    // otherwise fall back to email or wallet
    if (wallet) {
      const cis = await CryptoInvestor.find({ investor: wallet }).lean();
      myContracts = cis.map((ci) => ci.contract);
    } else if (email) {
      const fis = await FiatInvestor.find({ email }).lean();
      myContracts = fis.map((fi) => fi.contract);
    } else {
      // nothing
      myContracts = [];
    }
  }

  // fetch notifications that are global (contract: null) OR in myContracts
  const docs = await Notification.find({
    $or: [
      { contract: null },
      { contract: { $in: myContracts } },
    ],
  })
    .sort({ createdAt: 1 })
    .lean();

  return NextResponse.json(docs);
}
