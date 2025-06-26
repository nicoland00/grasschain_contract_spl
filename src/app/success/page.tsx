import Stripe from "stripe";
import { dbConnect } from "@/lib/dbConnect";
import { FiatInvestor } from "@/lib/dbSchemas";

interface Props {
  searchParams: { session_id?: string };
}

export default async function SuccessPage({ searchParams }: Props) {
  if (searchParams.session_id && process.env.STRIPE_SECRET_KEY) {
    try {
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
        apiVersion: "2025-05-28.basil",
      });
      const session = await stripe.checkout.sessions.retrieve(searchParams.session_id);
      const contract = session.metadata?.contract;
      const email = session.customer_email;
      const amountPaid = (session.amount_total ?? 0) / 100;
      if (contract && email) {
        await dbConnect();
        await FiatInvestor.updateOne(
          { contract, email },
          {
            $inc: { amountPaid },
            $set: {
              paymentMethod: session.payment_method_types?.[0],
              paymentIntentId: session.payment_intent as string,
              updatedAt: new Date(),
            },
            $setOnInsert: { createdAt: new Date() },
          },
          { upsert: true }
        );
      }
    } catch (err) {
      console.error("stripe success handler error", err);
    }
  }
  
  return (
    <div className="text-center p-8">
      <h1 className="text-3xl font-bold">🎉 Payment complete!</h1>
      <p>Thanks for your investment. You’ll see it reflected on the contract page shortly.</p>
    </div>
  );
}