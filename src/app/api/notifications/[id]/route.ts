// src/app/api/notifications/[id]/route.ts
import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/dbConnect";
import Notification from "@/models/Notification";

const ADMIN_PUBKEY = process.env.NEXT_PUBLIC_ADMIN_PUBKEY;

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  await dbConnect();
  const { id } = params;
  const { title, message, contract, adminPubkey, attachments } = await req.json();

  if (adminPubkey !== ADMIN_PUBKEY) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const updated = await Notification.findByIdAndUpdate(
    id,
    { title, message, contract: contract || null, attachments: attachments ?? [] },
    { new: true }
  );
  return updated
    ? NextResponse.json(updated)
    : NextResponse.json({ error: "Not found" }, { status: 404 });
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  await dbConnect();
  const { id } = params;
  const { adminPubkey } = await req.json();

  if (adminPubkey !== ADMIN_PUBKEY) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  await Notification.findByIdAndDelete(id);
  return NextResponse.json({ success: true });
}
