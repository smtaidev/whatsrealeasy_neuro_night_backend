import status from "http-status";
import config from "../../config";
import { UserService } from "./user.service";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { User } from "@prisma/client";

const createUser = catchAsync(async (req, res) => {
  const result = await UserService.createUserIntoDB(req.body);

  sendResponse(res, {
    statusCode: status.CREATED,
    message: result.message,
  });
});

const getAllUser = catchAsync(async (req, res) => {
  const result = await UserService.getAllUserFromDB(req.query);

  sendResponse(res, {
    statusCode: status.OK,
    message: "Users are retrieved successfully!",
    meta: result.meta,
    data: result.data,
  });
});

const updateUser = catchAsync(async (req, res) => {
  const user = req.user as User;

  // if (req.file) {
  //   req.body.profilePic = `${config.url.image}/uploads/${req.file.filename}`;
  // }
  

  const result = await UserService.updateUserIntoDB(user, req.body);

  sendResponse(res, {
    statusCode: status.OK,
    message: "User updated successfully!",
    data: result,
  });
});

const updateUserByAdmin = catchAsync(async (req, res) => {
  const { userId } = req.params;
  const authUser = req.user as User;
  const result = await UserService.updateUserByAdminIntoDB(
    authUser,
    userId,
    req.body
  );
  sendResponse(res, {
    statusCode: status.OK,
    message: "User updated successfully!",
    data: result,
  });
});

const getSingleUserById = catchAsync(async (req, res) => {
  const { userId } = req.params;

  const result = await UserService.getSingleUserByIdFromDB(userId);

  sendResponse(res, {
    statusCode: status.OK,
    message: "User retrieved successfully!",
    data: result,
  });
});

const deleteUser = catchAsync(async (req, res) => {
  const { userId } = req.params;

  await UserService.deleteUserFromDB(userId);

  sendResponse(res, {
    statusCode: status.OK,
    message: "User deleted successfully!",
  });
});

export const UserController = {
  createUser,
  getAllUser,
  updateUser,
  deleteUser,
  getSingleUserById,
  updateUserByAdmin
};
