import Stripe from "stripe";
import Product from "../product/product.model.js";
import Order from "./order.model.js";
import { createPaginationInfo } from "../../lib/pagination.js";


const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);


export const createOrderCheckoutService = async (userId, payload) => {
  const { items, delivery, paymentMethod } = payload;

  if (!items?.length) throw new Error("Cart empty");

  let orderItems = [];
  let total = 0;

  // Build order items and calculate total
  for (const item of items) {
    const product = await Product.findById(item.productId);
    if (!product) throw new Error("Product not found");

    if (product.stock < item.quantity)
      throw new Error(`${product.name} out of stock`);

    const price = product.offerPrice || product.price;
    const subTotal = price * item.quantity;
    total += subTotal;

    orderItems.push({
      productId: product._id,
      name: product.name,
      image: product.image,
      size: item.size,
      quantity: item.quantity,
      price: product.price,
      offerPrice: product.offerPrice,
      subTotal
    });
  }

  // Create order FIRST
  const order = await Order.create({
    userId, // null if guest
    guestEmail: !userId ? delivery.email : undefined, // store guest email
    items: orderItems,
    delivery,
    payment: {
      method: paymentMethod,
      paymentStatus: "pending"
    },
    totalAmount: total
  });

  // Cash on Delivery → return immediately
  if (paymentMethod === "cod") {
    for (const item of order.items) {
      await Product.findByIdAndUpdate(item.productId, {
        $inc: { stock: -item.quantity }
      });
    }

    order.payment.paymentStatus = "pending"; 
    await order.save();

    return { type: "cod", order };
  }

  // Stripe → create checkout session linked to order
  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    payment_method_types: ["card"],

    line_items: [
      {
        price_data: {
          currency: "usd",
          product_data: {
            name: `Order ${order._id}`
          },
          unit_amount: Math.round(total * 100)
        },
        quantity: 1
      }
    ],

    metadata: {
      orderId: order._id.toString(),
      userId: userId ? userId.toString() : "guest"
    },

    customer_email: userId ? undefined : delivery.email, // guest email for Stripe receipt

    success_url: `${process.env.FRONTEND_URL}/payment-success`,
    cancel_url: `${process.env.FRONTEND_URL}/payment-cancel`
  });

  // Save session id in order
  order.payment.stripeSessionId = session.id;
  await order.save();

  return { type: "stripe", url: session.url, order };
};


export const getOrdersService = async (user, query) => {
  const page = Number(query.page) || 1;
  const limit = Number(query.limit) || 10;
  const skip = (page - 1) * limit;

  const match= {};

  if (user.role !== "ADMIN") {
    match.userId = user.id;
  }

  if (query.orderStatus) {
    match.orderStatus = query.orderStatus;
  }

  if (query.search) {
    const regex = new RegExp(query.search, "i");

    match.$or = [
      { "delivery.type": regex },
      { "delivery.firstName": regex },
      { "delivery.lastName": regex },
      { "delivery.phone": regex },
      { "delivery.email": regex },
      { "delivery.city": regex },
      { "delivery.area": regex },
      { "delivery.address": regex }
    ];
  }

  const totalData = await Order.countDocuments(match);

  const orders = await Order.find(match)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate("userId", "name email profileImage");

  return {
    data: orders,
    pagination: createPaginationInfo(page, limit, totalData)
  };
};


export const getOrderService = async (id, currentUser) => {
  let order;

  // ADMIN → can see any order
  if (currentUser.role === "ADMIN") {
    order = await Order.findById(id);
  } 
  // USER → only own order
  else {
    order = await Order.findOne({ _id: id, userId: currentUser._id });
  }

  if (!order) throw new Error("Order not found");

  await order.populate("userId", "name email profileImage");

  return order;
};


export const getOrderStatusStatsService = async (user) => {
  if (user.role !== "ADMIN") {
    throw new Error("Only admin can view stats");
  }

  const stats = await Order.aggregate([
    {
      $group: {
        _id: "$orderStatus",
        count: { $sum: 1 }
      }
    }
  ]);

  const result = {
    placed: 0,
    processing: 0,
    shipped: 0,
    delivered: 0,
    cancelled: 0
  };

  stats.forEach((s) => {
    result[s._id] = s.count;
  });

  return result;
};


const allowedStatuses = [
  "placed",
  "processing",
  "shipped",
  "delivered",
  "cancelled"
];


export const updateOrderStatusService = async (user, orderId, orderStatus) => {

  if (user.role !== "ADMIN") {
    throw new Error("Only admin can update order status");
  }

  if (!allowedStatuses.includes(orderStatus)) {
    throw new Error("Invalid order status");
  }

  const order = await Order.findById(orderId);
  if (!order) {
    throw new Error("Order not found");
  }

  order.orderStatus = orderStatus;
  await order.save();

  return order;
};
