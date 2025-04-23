// src/app/api/stripe/webhook/route.ts
import { NextResponse } from "next/server";
import Stripe from "stripe";
import { dbConnect } from "@/lib/dbConnect";
import { FiatInvestor } from "@/lib/dbSchemas";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;
export const config = { api: { bodyParser: false } };

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-03-31.basil",
});
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(req: Request) {
  // 1) read the raw buffer exactly once
  const buf = await req.arrayBuffer();
  console.log("🔥 got a webhook ping, length:", buf.byteLength);

  // 2) grab the signature header
  const sig = req.headers.get("stripe-signature");
  if (!sig) {
    console.error("❌ missing stripe-signature header");
    return new NextResponse("Missing signature", { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(Buffer.from(buf), sig, endpointSecret);
  } catch (err: any) {
    console.error("❌ webhook signature verification failed:", err.message);
    return new NextResponse(`Webhook Error: ${err.message}`, { status: 400 });
  }

  console.log("✅ verified event:", event.type);

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    console.log("📝 session metadata:", session.metadata);

    const contract        = session.metadata?.contract;
    const email           = session.customer_email;
    const amountPaid      = (session.amount_total as number) / 100;
    const paymentMethod   = session.payment_method_types?.[0];
    const paymentIntentId = session.payment_intent as string;

    // fail fast if any required field is missing
    if (!contract || !email || !amountPaid || !paymentMethod || !paymentIntentId) {
      console.error("❌ missing data in session:", { contract, email, amountPaid, paymentMethod, paymentIntentId });
      return new NextResponse("Missing data in session", { status: 400 });
    }

    // retrieve the PI so we can log card last4
    const pi = await stripe.paymentIntents.retrieve(paymentIntentId, { expand: ["payment_method"] });
    const card = (pi.payment_method as Stripe.PaymentMethod).card;
    const maskedCard = (card && "last4" in card) ? card.last4 : undefined;

    console.log("🛠️ about to write to Mongo:", { contract, email, amountPaid, paymentMethod, paymentIntentId, maskedCard });
    await dbConnect();
    await FiatInvestor.create({ contract, email, amountPaid, paymentMethod, paymentIntentId, maskedCard });
    console.log("🎉 persisted FiatInvestor for", email, "contract", contract);
  } else {
    console.log("⏭️ skipping event type:", event.type);
  }

  return NextResponse.json({ received: true });
}
