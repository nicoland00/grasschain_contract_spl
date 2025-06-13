// src/app/api/notifications/route.ts
import { NextResponse }       from "next/server";
import { dbConnect }         from "@/lib/dbConnect";
import Notification          from "@/models/Notification";
import { getServerSession }  from "next-auth/next";
import { authOptions }       from "@/lib/auth";

export const runtime = "nodejs";
const ADMIN_PUBKEY = process.env.NEXT_PUBLIC_ADMIN_PUBKEY;

// fetch notifications for a wallet/email or contract query…
export async function GET(req: Request) {
  await dbConnect();
  const url     = new URL(req.url);
  const session = await getServerSession(authOptions);
  const wallet  = url.searchParams.get("wallet");
  const email   = session?.user?.email;
  const contractQuery = url.searchParams.get("contract");

  let filter: any = {};
  if (contractQuery) {
    filter = {
      $or: [
        { contract: contractQuery },
        { contract: null }      // include general notices
      ]
    };
  }
   else if (wallet) {
    filter = { contract: { $in: /* find by wallet logic */ [] } };
  } else if (email) {
    filter = { contract: { $in: /* find by email logic */ [] } };
  }

  const docs = await Notification.find(filter)
    .sort({ createdAt: -1 })   // latest first
    .lean();
  return NextResponse.json(docs);
}

// **NEW**: handle creating notifications
export async function POST(req: Request) {
  await dbConnect();
  const session = await getServerSession(authOptions);
  const body = await req.json();
  // optional: verify only admin can post
  if (body.adminPubkey !== ADMIN_PUBKEY) {
    return NextResponse.error();
  }

  const notif = await Notification.create({
    title:      body.title,
    message:    body.message,
    contract:   body.contract ?? null,
    stage:      body.stage ?? "active",
    mediaUrls:  body.mediaUrls ?? [],
    adminPubkey: body.adminPubkey,
  });
  return NextResponse.json(notif);
}
