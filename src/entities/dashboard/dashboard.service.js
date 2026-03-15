import mongoose from "mongoose";
import { createPaginationInfo } from "../../lib/pagination.js";
import Order from "../order/order.model.js";
import Product from "../product/product.model.js";
import User from "../auth/auth.model.js";


// ─── API 1: Stats Summary ────────────────────────────────────────────────────
// GET /api/v1/dashboard/stats
// Returns: totalRevenue, totalProducts, totalOrders, totalCustomers
export const getDashboardStatsService = async (user) => {
  if (user.role !== "ADMIN") throw new Error("Only admin can access dashboard stats");

  const [revenueResult, totalProducts, totalOrders, totalCustomers] = await Promise.all([
    Order.aggregate([
      { $match: { "payment.paymentStatus": { $in: ["paid", "pending"] } } },
      { $group: { _id: null, totalRevenue: { $sum: "$totalAmount" } } }
    ]),
    Product.countDocuments(),
    Order.countDocuments(),
    User.countDocuments({ role: "USER" })
  ]);

  return {
    totalRevenue: revenueResult[0]?.totalRevenue || 0,
    totalProducts,
    totalOrders,
    totalCustomers
  };
};


// ─── API 2: Growth Charts ────────────────────────────────────────────────────
// GET /api/v1/dashboard/growth?year=2025
// Returns: revenueByMonth { jan: 0, feb: 0, ... }, customersByMonth { jan: 0, ... }
const MONTH_KEYS = ["jan","feb","mar","apr","may","jun","jul","aug","sep","oct","nov","dec"];

const buildMonthMap = (aggregateResult) => {
  const map = Object.fromEntries(MONTH_KEYS.map((m) => [m, 0]));
  aggregateResult.forEach(({ month, value }) => {
    const key = MONTH_KEYS[month - 1];
    if (key) map[key] = value;
  });
  return map;
};

export const getDashboardGrowthService = async (user, query) => {
  if (user.role !== "ADMIN") throw new Error("Only admin can access growth data");

  const year = parseInt(query.year) || new Date().getFullYear();
  const startDate = new Date(`${year}-01-01T00:00:00.000Z`);
  const endDate   = new Date(`${year + 1}-01-01T00:00:00.000Z`);

  const [revenueRaw, customersRaw] = await Promise.all([
    // Monthly revenue
    Order.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate, $lt: endDate },
          "payment.paymentStatus": { $in: ["paid", "pending"] }
        }
      },
      {
        $group: {
          _id: { month: { $month: "$createdAt" } },
          value: { $sum: "$totalAmount" }
        }
      },
      { $project: { _id: 0, month: "$_id.month", value: 1 } }
    ]),

    // Monthly new customers (registered users)
    User.aggregate([
      {
        $match: {
          role: "USER",
          createdAt: { $gte: startDate, $lt: endDate }
        }
      },
      {
        $group: {
          _id: { month: { $month: "$createdAt" } },
          value: { $sum: 1 }
        }
      },
      { $project: { _id: 0, month: "$_id.month", value: 1 } }
    ])
  ]);

  return {
    year,
    revenueByMonth:   buildMonthMap(revenueRaw),
    customersByMonth: buildMonthMap(customersRaw)
  };
};


export const getCustomerAnalyticsService = async (user, query) => {
  if (user.role !== "ADMIN") {
    throw new Error("Only admin can access customer analytics");
  }

  const page = Number(query.page) || 1;
  const limit = Number(query.limit) || 10;
  const skip = (page - 1) * limit;

  const basePipeline = [
    {
      $match: {
        userId: { $ne: null }
      }
    },
    {
      $group: {
        _id: "$userId",
        totalSpent: { $sum: "$totalAmount" },
        totalOrders: { $sum: 1 },
        totalQuantity: { $sum: { $sum: "$items.quantity" } }
      }
    },
    {
      $lookup: {
        from: "users",
        localField: "_id",
        foreignField: "_id",
        as: "user"
      }
    },
    { $unwind: "$user" }
  ];

  if (query.search) {
    basePipeline.push({
      $match: {
        $or: [
          { "user.name": { $regex: query.search, $options: "i" } },
          { "user.email": { $regex: query.search, $options: "i" } }
        ]
      }
    });
  }

  const totalResult = await Order.aggregate([
    ...basePipeline,
    { $count: "count" }
  ]);

  const totalData = totalResult[0]?.count || 0;

  const customers = await Order.aggregate([
    ...basePipeline,
    { $sort: { totalSpent: -1 } },
    { $skip: skip },
    { $limit: limit }
  ]);

  return {
    data: customers.map((c) => ({
      userId: c._id,
      name: c.user.name,
      email: c.user.email,
      image: c.user.profileImage,
      totalOrders: c.totalOrders,
      totalQuantity: c.totalQuantity,
      totalSpent: c.totalSpent
    })),
    pagination: createPaginationInfo(page, limit, totalData)
  };
};


export const getSingleCustomerService = async (user, userId) => {
  if (user.role !== "ADMIN") {
    throw new Error("Only admin can access customer analytics");
  }

  if (!mongoose.Types.ObjectId.isValid(userId)) {
    return null;
  }

  const [customer] = await Order.aggregate([
    {
      $match: {
        userId: new mongoose.Types.ObjectId(userId)
      }
    },
    {
      $group: {
        _id: "$userId",
        totalSpent: { $sum: "$totalAmount" },
        totalOrders: { $sum: 1 },
        totalQuantity: { $sum: { $sum: "$items.quantity" } }
      }
    },
    {
      $lookup: {
        from: "users",
        localField: "_id",
        foreignField: "_id",
        as: "user"
      }
    },
    { $unwind: "$user" }
  ]);

  if (!customer) return null;

  return {
    userId: customer._id,
    name: customer.user.name,
    email: customer.user.email,
    image: customer.user.profileImage,
    totalOrders: customer.totalOrders,
    totalQuantity: customer.totalQuantity,
    totalSpent: customer.totalSpent
  };
};
