import { Request, Response } from "express";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { AIAgentService } from "./agent.service";
import status from "http-status";

const getAllAIAgents = catchAsync(async (req: Request, res: Response) => {


  const result = await AIAgentService.getAllAIAgents();

  sendResponse(res, {
    statusCode: status.OK,
    message: "AI Agents retrieved successfully",
    data: result,
  });
});

export const AIAgentController = {
    getAllAIAgents,
}