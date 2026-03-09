import mongoose, { Schema } from "mongoose";

const productSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },

    weight: {
      type: String
    },

    size: [
      {
        type: String
      }
    ],

    price: {
      type: Number,
      required: true
    },

    offerPrice: {
      type: Number
    },

    stock: {
      type: Number,
      required: true
    },

    category: {
      type: Schema.Types.ObjectId,
      ref: "Category",
      required: true
    },

    brand: {
      type: Schema.Types.ObjectId,
      ref: "Brand",
      required: true
    },

    description: {
      type: String
    },

    image: {
      type: String,
      required: true
    },

    subImages: [
      {
        type: String
      }
    ],

    averageRating: {
      type: Number,
      default: 0
    },

    reviewCount: {
      type: Number,
      default: 0
    }
  },
  { timestamps: true }
);

const Product = mongoose.model("Product", productSchema);
export default Product;
