import mongoose, { Schema } from "mongoose";


const orderItemSchema = new Schema(
  {
    productId: {
      type: Schema.Types.ObjectId,
      ref: "Product",
      required: true
    },

    name: String,
    image: String,

    size: String,

    quantity: {
      type: Number,
      required: true
    },

    price: {
      type: Number,
      required: true
    },

    offerPrice: Number,

    subTotal: Number
  },
  { _id: false }
);


const deliverySchema = new Schema(
  {
    type: {
      type: String,
      enum: ["home", "office"],
      default: "home"
    },

    firstName: String,
    lastName: String,
    phone: String,
    email: String,
    city: String,
    area: String,
    address: String
  },
  { _id: false }
);


const paymentSchema = new Schema(
  {
    method: {
      type: String,
      enum: ["cod", "stripe"],
      required: true
    },

    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "failed"],
      default: "pending"
    },

    stripeSessionId: String,
    paymentIntentId: String
  },
  { _id: false }
);


const orderSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User"
    },

    guestEmail: {
      type: String,
      trim: true,
      lowercase: true
    },

    items: [orderItemSchema],

    delivery: deliverySchema,

    payment: paymentSchema,

    totalAmount: Number,

    orderStatus: {
      type: String,
      enum: ["placed", "processing", "shipped", "delivered", "cancelled"],
      default: "placed"
    }
  },
  { timestamps: true }
);


const Order = mongoose.model("Order", orderSchema);
export default Order;