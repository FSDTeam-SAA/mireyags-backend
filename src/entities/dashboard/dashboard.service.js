import { createPaginationInfo } from "../../lib/pagination.js";
import Order from "../order/order.model.js";


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
      image: c.user.image,
      totalOrders: c.totalOrders,
      totalQuantity: c.totalQuantity,
      totalSpent: c.totalSpent
    })),
    pagination: createPaginationInfo(page, limit, totalData)
  };
};