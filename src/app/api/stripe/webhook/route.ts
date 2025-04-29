// src/app/api/stripe/webhook/route.ts
import { NextResponse } from "next/server";
import Stripe from "stripe";
import { dbConnect } from "@/lib/dbConnect";
import { FiatInvestor } from "@/lib/dbSchemas";

// Server-side only
export const runtime    = "nodejs";
export const dynamic    = "force-dynamic";
export const revalidate = 0;

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-03-31.basil",
});
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET!;

/**
 * Stripe Dashboard “Send test webhook” often issues a GET → 200 OK
 */
export async function GET() {
  return new NextResponse("ok", { status: 200 });
}

/**
 * Pre-flight CORS (Stripe may OPTIONS before POST)
 */
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      Allow: "GET,POST,OPTIONS",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type,Stripe-Signature",
    },
  });
}

/**
 * The real webhook handler for checkout.session.completed
 */
export async function POST(req: Request) {
  // 1) raw body buffer
  const buf = await req.arrayBuffer();
  const sig = req.headers.get("stripe-signature")!;

  // 2) verify signature
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      Buffer.from(buf),
      sig,
      endpointSecret
    );
  } catch (e: any) {
    console.error("❌ stripe webhook verify failed:", e.message);
    return new NextResponse(e.message, { status: 400 });
  }

  // 3) handle successful checkout
  if (event.type === "checkout.session.completed") {
    const sess       = event.data.object as Stripe.Checkout.Session;
    const contract   = sess.metadata!.contract!;
    const email      = sess.customer_email!;
    const amountPaid = (sess.amount_total! as number) / 100;

    // save to Mongo (off-chain)
    await dbConnect();
    await FiatInvestor.create({
      contract,
      email,
      amountPaid,
      paymentMethod: sess.payment_method_types![0],
      paymentIntentId: sess.payment_intent as string,
      maskedCard: undefined,
    });
    // (optional) notify admin…
  }

  // always return 200 to Stripe
  return NextResponse.json({ received: true });
}
