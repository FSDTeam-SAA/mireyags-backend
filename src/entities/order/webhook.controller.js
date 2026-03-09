import Stripe from "stripe";
import Order from "./order.model.js";
import Product from "../product/product.model.js";


const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);


export const stripeOrderWebhook = async (req, res) => {
  const sig = req.headers["stripe-signature"];
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error("Webhook signature failed:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // PAYMENT SUCCESS
  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const orderId = session.metadata.orderId;

    const order = await Order.findById(orderId);
    if (!order) return res.status(400).send("Order not found");

    // idempotent protection
    if (order.payment.paymentStatus === "paid") {
      return res.status(200).send("Already processed");
    }

    // update order payment
    order.payment.paymentStatus = "paid";
    order.payment.paymentIntentId = session.payment_intent;
    await order.save();

    // reduce stock
    for (const item of order.items) {
      await Product.findByIdAndUpdate(item.productId, {
        $inc: { stock: -item.quantity }
      });
    }

    console.log("Order paid:", order._id);
  }

  // FAILURE EVENTS
  if (
    event.type === "checkout.session.expired" ||
    event.type === "checkout.session.async_payment_failed" ||
    event.type === "payment_intent.payment_failed"
  ) {
    const session = event.data.object;
    const orderId = session.metadata?.orderId;

    if (orderId) {
      await Order.findByIdAndUpdate(orderId, {
        "payment.paymentStatus": "failed"
      });
    }
  }

  res.status(200).send("Webhook received");
};