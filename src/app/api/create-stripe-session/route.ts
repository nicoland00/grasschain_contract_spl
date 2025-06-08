// src/app/api/create-stripe-session/route.ts
import { NextResponse } from "next/server";
import Stripe          from "stripe";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  // 1) Grab your secret at request time
  const secret = process.env.STRIPE_SECRET_KEY;
  if (!secret) {
    console.error("⚠️ Missing STRIPE_SECRET_KEY");
    return NextResponse.json({ error: "Stripe not configured" }, { status: 500 });
  }

  // 2) Instantiate Stripe when we know the env var is there
  const stripe = new Stripe(secret, {
    apiVersion: "2025-05-28.basil",
  });

  // 3) Parse & validate incoming body
  const { contract, email, amount } = await req.json();
  if (!contract || !email || !amount) {
    return NextResponse.json(
      { error: "Faltan campos obligatorios" },
      { status: 400 }
    );
  }

  try {
    // 4) Create Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: `Inversión contrato ${contract}`,
            },
            unit_amount: Math.round(amount * 100),
          },
          quantity: 1,
        },
      ],
      customer_email: email,
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/cancel`,
      metadata: { contract },
    });

    return NextResponse.json({ url: session.url });
  } catch (err: any) {
    console.error("❌ stripe checkout error:", err);
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
