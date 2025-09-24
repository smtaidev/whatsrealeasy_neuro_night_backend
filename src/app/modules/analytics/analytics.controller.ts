import status from "http-status";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { User } from "@prisma/client";
import { AnalyticsService } from "./analytics.service";


const getDashbaordAnalytics = catchAsync(async (req, res) => {
  const result = await AnalyticsService.getDashbaordAnalytics(req.query as Record<string, unknown>);

  sendResponse(res, {
    statusCode: status.OK,
    message: "Users retrieved successfully!",
    data: result,
  });
});


export const AnalyticsController = {
  getDashbaordAnalytics,
};
