import { Request, Response } from "express";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { AIAgentService } from "./agent.service";
import status from "http-status";
import pickOptions from "../../utils/pick";

const getAllAIAgents = catchAsync(async (req: Request, res: Response) => {
  const options = pickOptions(req.query, [
    "limit",
    "page",
    "sortBy",
    "sortOrder",
  ]);

  const result = await AIAgentService.getAllAIAgents(options, req.query.callType as string);

  sendResponse(res, {
    statusCode: status.OK,
    message: "AI Agents retrieved successfully",
    data: result,
  });
});

export const AIAgentController = {
  getAllAIAgents,
};
