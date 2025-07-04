// src/app/api/stripe/webhook/route.ts
import { NextResponse } from "next/server";
import { dbConnect }    from "@/lib/dbConnect";
import { FiatInvestor } from "@/lib/dbSchemas";
// ⬇️ Only import the Stripe *types* at compile time
import type Stripe from "stripe";

export const runtime    = "nodejs";
export const dynamic    = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  return new NextResponse("ok", { status: 200 });
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      Allow:                         "GET,POST,OPTIONS",
      "Access-Control-Allow-Origin":  "*",
      "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type,Stripe-Signature",
    },
  });
}

export async function POST(req: Request) {
  const secret         = process.env.STRIPE_SECRET_KEY!;
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET!;
  // Lazy‐load the stripe library at runtime
  const StripePkg = (await import("stripe")).default;
  const stripe    = new StripePkg(secret, { apiVersion: "2025-05-28.basil" });

  // Buffer & header for signature check
  const buf = await req.arrayBuffer();
  const sig = req.headers.get("stripe-signature") || "";

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(Buffer.from(buf), sig, endpointSecret) as Stripe.Event;
  } catch (err: any) {
    console.error("❌ Webhook signature verification failed:", err.message);
    return new NextResponse(err.message, { status: 400 });
  }

  // Only handle completed checkout sessions
  if (event.type === "checkout.session.completed") {
    const sess       = event.data.object as Stripe.Checkout.Session;
    const contract   = sess.metadata?.contract;
    const email      = sess.customer_email;
    const amountPaid = (sess.amount_total ?? 0) / 100;

    if (contract && email) {
      try {
        await dbConnect();
        // Upsert: create new or increment existing
        await FiatInvestor.updateOne(
          { contract, email },
          {
            $inc: { amountPaid },
            $set: {
              paymentMethod:   sess.payment_method_types?.[0],
              paymentIntentId: sess.payment_intent as string,
              maskedCard:      undefined,
              updatedAt:       new Date(),
            },
            $setOnInsert: { createdAt: new Date() },
          },
          { upsert: true }
        );
        console.log(`✅ Recorded $${amountPaid} for ${email} on ${contract}`);
      } catch (dbErr) {
        console.error("❌ Error upserting FiatInvestor:", dbErr);
      }
    } else {
      console.warn("⚠️ checkout.session.completed missing contract or email, skipping");
    }
  }

  return NextResponse.json({ received: true });
}
