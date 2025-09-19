// src/controllers/number.controller.ts
import status from "http-status";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { User } from "@prisma/client";
import { NumberService } from "./number.services";

const createNumberList = catchAsync(async (req, res) => {
  const user = req.user as User;
  const result = await NumberService.createNumberListIntoDB(user, req.body, req.file!);

  sendResponse(res, {
    statusCode: status.CREATED,
    message: "Number list created successfully!",
    data: result,
  });
});

const getAllNumberLists = catchAsync(async (req, res) => {
  const user = req.user as User;
  const result = await NumberService.getAllNumberListsFromDB(req.query, user);

  sendResponse(res, {
    statusCode: status.OK,
    message: "Number lists retrieved successfully!",
    meta: result.meta,
    data: result.data,
  });
});

const getSingleNumberList = catchAsync(async (req, res) => {
  const user = req.user as User;
  const { listId } = req.params;
  const result = await NumberService.getSingleNumberListFromDB(listId, user);

  sendResponse(res, {
    statusCode: status.OK,
    message: "Number list retrieved successfully!",
    data: result,
  });
});

const deleteNumberList = catchAsync(async (req, res) => {
  const user = req.user as User;
  const { listId } = req.params;
  await NumberService.deleteNumberListFromDB(listId, user);

  sendResponse(res, {
    statusCode: status.OK,
    message: "Number list deleted successfully!",
  });
});

export const NumberController = {
  createNumberList,
  getAllNumberLists,
  getSingleNumberList,
  deleteNumberList,
};