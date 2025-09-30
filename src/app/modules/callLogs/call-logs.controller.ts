import status from "http-status";
import sendResponse from "../../utils/sendResponse";
import catchAsync from "../../utils/catchAsync";
import { Request, Response } from "express";
import pickOptions from "../../utils/pick";
import { CallLogsService } from "./call-logs.service";

// Controller function
const getCallLogsManagement = catchAsync(
  async (req: Request, res: Response) => {
    const options = pickOptions(req.query, [
      "limit",
      "page",
      "sortBy",
      "sortOrder",
    ]);
    const filters = pickOptions(req.query, ["searchTerm", "call_status", "callType"]);

    const result = await CallLogsService.getCallLogsManagement(
      options,
      filters
    );

    sendResponse(res, {
      statusCode: status.OK,
      message: "Organization call logs retrieved successfully",
      data: result,
    });
  }
);

export const CallLogsController = {
    getCallLogsManagement
}