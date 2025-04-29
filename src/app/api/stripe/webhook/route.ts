// src/app/api/stripe/webhook/route.ts
import { NextResponse } from "next/server";
import Stripe from "stripe";
import { dbConnect } from "@/lib/dbConnect";
import { FiatInvestor } from "@/lib/dbSchemas";

export const runtime    = "nodejs";
export const dynamic    = "force-dynamic";
export const revalidate = 0;
export const config     = { api: { bodyParser: false } };

const stripe         = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-03-31.basil",
});
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(req: Request) {
  const buf = await req.arrayBuffer();
  const sig = req.headers.get("stripe-signature")!;

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(Buffer.from(buf), sig, endpointSecret);
  } catch (e: any) {
    console.error("❌ stripe webhook verify failed:", e.message);
    return new NextResponse(e.message, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const sess       = event.data.object as Stripe.Checkout.Session;
    const contract   = sess.metadata!.contract!;
    const email      = sess.customer_email!;
    const amountPaid = (sess.amount_total! as number) / 100;

    // 1️⃣ Save to Mongo (off-chain)
    await dbConnect();
    await FiatInvestor.create({
      contract,
      email,
      amountPaid,
      paymentMethod: sess.payment_method_types![0],
      paymentIntentId: sess.payment_intent as string,
      maskedCard: undefined,
    });

    // (Optionally notify admin here)
  }

  return NextResponse.json({ received: true });
}
