// src/app/api/create-stripe-session/route.ts
import { NextResponse } from "next/server";
import Stripe          from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-03-31.basil",
});

export async function POST(req: Request) {
  const { contract, email, amount } = await req.json();
  if (!contract || !email || !amount) {
    return NextResponse.json({ error: "Faltan campos obligatorios" }, { status: 400 });
  }

  // Creamos la sesión de Checkout
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
          unit_amount: Math.round(amount * 100), // en céntimos
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
}
