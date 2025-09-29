import status from "http-status";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { User } from "@prisma/client";
import { AnalyticsService } from "./analytics.service";
import pickOptions from "../../utils/pick";

const getDashbaordAnalytics = catchAsync(async (req, res) => {
  const options = pickOptions(req.query, [
    "limit",
    "page",
    "sortBy",
    "sortOrder",
  ]);

  const filters = pickOptions(req.query, [
    "bookingStatus",
    "serviceId",
    "callType",
    "timeRange",
    "call_status",
    "startDate",
    "endDate"
  ]);
  const result = await AnalyticsService.getDashboardAnalytics(options, filters);

  sendResponse(res, {
    statusCode: status.OK,
    message: "Users retrieved successfully!",
    data: result,
  });
});
const getDashbaordServices = catchAsync(async (req, res) => {
  const options = pickOptions(req.query, [
    "limit",
    "page",
    "sortBy",
    "sortOrder",
  ]);

  const filters = pickOptions(req.query, [
    "timePeriod", // '1month', '6month', '1year'
    "metric", // 'booking', 'conversation'
  ]);

  const result = await AnalyticsService.getDashbaordServices(options, filters);

  sendResponse(res, {
    statusCode: status.OK,
    message: "Dashboard services retrieved successfully",
    data: result,
  });
});

export const AnalyticsController = {
  getDashbaordAnalytics,
  getDashbaordServices,
};
