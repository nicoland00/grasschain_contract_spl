// src/app/api/notifications/route.ts
import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/dbConnect";
import Notification, { INotification } from "@/models/Notification";
import CryptoInvestor from "@/models/tracking/CryptoInvestor";
import FiatInvestor from "@/models/tracking/FiatInvestor";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

const ADMIN_PUBKEY = process.env.NEXT_PUBLIC_ADMIN_PUBKEY;

export const runtime = "nodejs";

export async function GET(req: Request) {
  await dbConnect();

  // figure out who’s asking
  const url = new URL(req.url);
  const wallet = url.searchParams.get("wallet");
  const session = await getServerSession(authOptions);
  const email = session?.user?.email;

  // collect this user’s contracts
  let myContracts: string[] = [];
  if (wallet) {
    const cis = await CryptoInvestor.find({ investor: wallet }).lean();
    myContracts = cis.map((ci) => ci.contract);
  } else if (email) {
    const fis = await FiatInvestor.find({ email }).lean();
    myContracts = fis.map((fi) => fi.contract);
  }

  // fetch notifications that are general (contract: null) OR contract in myContracts
  const docs = await Notification.find({
    $or: [
      { contract: null },
      { contract: { $in: myContracts } },
    ],
  })
    .sort({ createdAt: -1 })
    .lean();

  return NextResponse.json(docs);
}

export async function POST(req: Request) {
  await dbConnect();
  const body = await req.json();
  const { title, message, contract, adminPubkey } = body;

  // only admin can create
  if (adminPubkey !== ADMIN_PUBKEY) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  if (!title || !message) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  const notif = await Notification.create({ title, message, contract: contract || null });
  return NextResponse.json(notif, { status: 201 });
}
