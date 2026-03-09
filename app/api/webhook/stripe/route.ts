import prisma from "@/app/lib/db";
import { stripe } from "@/app/lib/stripe";
import { headers } from "next/headers";
import Stripe from "stripe";

export async function POST(req: Request) {
  const body = await req.text();

  const signature = (await headers()).get("Stripe-Signature") as string;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET as string,
    );
  } catch (error) {
    return new Response("Webhook Error", { status: 400 });
  }

  const session = event.data.object as Stripe.Checkout.Session;

  if (event.type === "checkout.session.completed") {
    const subscription = (await stripe.subscriptions.retrieve(
      session.subscription as string,
    )) as Stripe.Subscription;

    const customerId = String(subscription.customer);

    const user = await prisma.user.findUnique({
      where: {
        stripeCustomerId: customerId,
      },
    });

    if (!user) {
      throw new Error("Unable to find user for subscription");
    }

    await prisma.subscription.create({
      data: {
        stripeSubscriptionId: subscription.id,
        userId: user.id,
        status: subscription.status,
        currentPeriodStart: subscription.current_period_start,
        currentPeriodEnd: subscription.current_period_end,
        planId: subscription.items.data[0].price.id,
        interval: String(subscription.items.data[0].plan.interval),
      },
    });
  }

  if (event.type === "invoice.payment_succeeded") {
    const subscription = await stripe.subscriptions.retrieve(
      session.subscription as string,
    );

    await prisma.subscription.update({
      where: { stripeSubscriptionId: subscription.id },
      data: {
        planId: subscription.items.data[0].price.id,
        status: subscription.status,
        currentPeriodStart: subscription.current_period_start,
        currentPeriodEnd: subscription.current_period_end,
      },
    });
  }

  return new Response(null, { status: 200 });
}
