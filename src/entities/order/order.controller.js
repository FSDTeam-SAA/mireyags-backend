import { generateResponse } from "../../lib/responseFormate.js";
import { createOrderCheckoutService, getOrdersService, getOrderService, getOrderStatusStatsService, updateOrderStatusService } from "./order.service.js";


export const createOrderCheckoutController = async (req, res, next) => {
  try {
    const userId = req.user?._id || null; 
    const data = await createOrderCheckoutService(userId, req.body);
    return generateResponse(res, 200, true, "Checkout created", data);
  } catch (e) {
    next(e);
  }
};


export const getOrdersController = async (req, res, next) => {
  try {
    const { page, limit, orderStatus, search } = req.query;

    const data = await getOrdersService(req.user, {
      page,
      limit,
      orderStatus,
      search
    });

    return generateResponse(res, 200, true, "Orders fetched", data);
  } catch (err) {
    next(err);
  }
};


export const getOrderController = async (req, res, next) => {
  try {
    const data = await getOrderService(req.params.id, req.user);

    return generateResponse(res, 200, true, "Order fetched", data);
  } catch (err) {
    next(err);
  }
};


export const getOrderStatusStatsController = async (req, res, next) => {
  try {
    const data = await getOrderStatusStatsService(req.user);

    return generateResponse(res, 200, true, "Order status stats fetched", data);
  } catch (err) {
    next(err);
  }
};


export const updateOrderStatusController = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { orderStatus } = req.body;

    const data = await updateOrderStatusService(req.user, id, orderStatus);

    return generateResponse(res, 200, true, "Order status updated", data);
  } catch (err) {
    next(err);
  }
};