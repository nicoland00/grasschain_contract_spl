// src/app/api/stripe/webhook/route.ts
import { NextResponse } from "next/server";
import Stripe from "stripe";
import { dbConnect } from "@/lib/dbConnect";
import { FiatInvestor } from "@/lib/dbSchemas";

// --- Route Segment Config (Next.js 14) ---
export const runtime = 'nodejs';           // ensure Node.js runtime
export const dynamic = 'force-dynamic';    // always run (no static caching)
export const revalidate = 0;               // never cache

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-03-31.basil",
});
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(req: Request) {
  // Raw body for webhook signature verification
  const buf = Buffer.from(await req.arrayBuffer());
  const sig = req.headers.get("stripe-signature")!;
  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(buf, sig, endpointSecret);
  } catch (err: any) {
    return new NextResponse(`Webhook Error: ${err.message}`, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const { contract } = session.metadata!;
    const email           = session.customer_email!;
    const amountPaid      = (session.amount_total! as number) / 100;
    const paymentMethod   = session.payment_method_types![0];
    const paymentIntentId = session.payment_intent as string;
    // If you want card last4, you must expand the PaymentIntent in your webhook creation:
    const pi = await stripe.paymentIntents.retrieve(paymentIntentId, {
      expand: ["payment_method"],
    });
    const cardDetails = (pi.payment_method as Stripe.PaymentMethod).card;
    const maskedCard  = cardDetails?.last4;

    await dbConnect();
    await FiatInvestor.create({
      contract,
      email,
      amountPaid,
      paymentMethod,
      paymentIntentId,
      maskedCard,
    });
  }

  return NextResponse.json({ received: true });
}
