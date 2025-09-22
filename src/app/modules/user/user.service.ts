import status from "http-status";
import config from "../../config";
import prisma from "../../utils/prisma";
import ApiError from "../../errors/AppError";
import { Role, User } from "@prisma/client";
import QueryBuilder from "../../builder/QueryBuilder";
import { jwtHelpers } from "./../../helpers/jwtHelpers";
import { hashPassword } from "../../helpers/hashPassword";

const createUserIntoDB = async (payload: User) => {
  // Check if user exists by email or phone
  const isUserExist = await prisma.user.findFirst({
    where: {
      OR: [
        { email: payload?.email }
      ],
    },
  });

  if (isUserExist) {
    throw new ApiError(
      status.BAD_REQUEST,
      `User with this email/phone already exists!`
    );
  }

  // Hash password
  const hashedPassword = await hashPassword(payload.password);

  const userData = {
    ...payload,
    role: Role.admin,
    isActive: true,
    password: hashedPassword,
  };

  // Create user
  const result = await prisma.user.create({ data: userData });

  if (!result) {
    throw new ApiError(status.BAD_REQUEST, "Failed to create user!");
  }

  // JWT payload
  const jwtPayload = {
    id: result.id,
    name: result.name,
    email: result.email,
    role: result.role,
    profilePic: result?.profilePic || "",
  };

  // Generate tokens
  const accessToken = jwtHelpers.createToken(
    jwtPayload,
    config.jwt.access.secret as string,
    config.jwt.access.expiresIn as string
  );

  const refreshToken = jwtHelpers.createToken(
    jwtPayload,
    config.jwt.refresh.secret as string,
    config.jwt.refresh.expiresIn as string
  );

  return {
    accessToken,
    refreshToken,
  };
};


const getAllUserFromDB = async (query: Record<string, unknown>) => {
  const userQuery = new QueryBuilder(prisma.user, query)
    .search(["name", "email"])
    .select([
      "id",
      "email",
      "name",
      "profilePic",
      "role",
      "isActive",
      "isVerified",
      "createdAt",
    ])
    .paginate();

  const [result, meta] = await Promise.all([
    userQuery.execute(),
    userQuery.countTotal(),
  ]);

  if (!result.length) {
    throw new ApiError(status.NOT_FOUND, "No users found!");
  }

  // Remove password from each user
  const data = result.map((user: User) => {
    const { password, ...rest } = user;
    return rest;
  });

  return {
    meta,
    data,
  };
};

const updateUserIntoDB = async (user: User, payload: Partial<User>) => {
  const userId = user?.id;

  const isUserExist = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!isUserExist) {
    throw new ApiError(status.NOT_FOUND, "User not found!");
  }

  if (!payload.profilePic && isUserExist.profilePic) {
    payload.profilePic = isUserExist.profilePic;
  }

  const updatedData: Partial<User> = {
    name: payload.name,
    profilePic: payload.profilePic || "",
  };

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: updatedData,
    select: {
      id: true,
      name: true,
      email: true,
      profilePic: true,
      role: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return updatedUser;
};

const updateUserByAdminIntoDB = async (
  authUser: User,
  user_id: string,
  payload: Partial<User>
) => {
  console.log("Payload in Service:", payload);
  const isUserExist = await prisma.user.findUnique({
    where: { id: user_id },
  });

  if (!isUserExist) {
    throw new ApiError(status.NOT_FOUND, "User not found!");
  }

  // Initialize the update data object
  const updatedData: Partial<User> = {};

  // Check permissions based on admin role
  // if (authUser.role === Role.SUPERADMIN) {
  //   // SUPERADMIN can update both role and isActive
  //   if (payload.role !== undefined) {
  //     updatedData.role = payload.role;
  //   }
  //   if (payload.isActive !== undefined) {
  //     updatedData.isActive = payload.isActive;
  //   }
  // } else if (authUser.role === Role.ADMIN) {
  //   // ADMIN can only update isActive status if the user is a regular USER
  //   if (payload.isActive && isUserExist.role === Role.USER) {
  //     updatedData.isActive = payload.isActive;
  //   }

  //   // ADMIN cannot change roles - check if they're trying to
  //   if (payload.role !== undefined && payload.role !== isUserExist.role) {
  //     throw new ApiError(
  //       status.FORBIDDEN,
  //       "Admins are not allowed to change user roles. Only Super Admins can modify roles."
  //     );
  //   }
  // } else {
  //   // Other roles shouldn't have access to this function
  //   throw new ApiError(
  //     status.FORBIDDEN,
  //     "You do not have permission to update user information."
  //   );
  // }

  // Check if there's anything to update
  // if (Object.keys(updatedData).length === 0) {
  //   throw new ApiError(
  //     status.BAD_REQUEST,
  //     "No valid fields provided for update."
  //   );
  // }

  const updatedUser = await prisma.user.update({
    where: { id: user_id },
    data: updatedData,
    select: {
      id: true,
      name: true,
      email: true,
      profilePic: true,
      role: true,
      isActive: true,
      // isVerified: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return updatedUser;
};
const getSingleUserByIdFromDB = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new ApiError(status.NOT_FOUND, "User not found!");
  }

  const { password, ...rest } = user;

  return rest;
};

const deleteUserFromDB = async (userId: string) => {
  const isUserExist = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!isUserExist) {
    throw new ApiError(status.NOT_FOUND, "User not found!");
  }

  await prisma.user.delete({
    where: { id: userId },
  });

  return null;
};

export const UserService = {
  createUserIntoDB,
  getAllUserFromDB,
  updateUserIntoDB,
  deleteUserFromDB,
  getSingleUserByIdFromDB,
  updateUserByAdminIntoDB,
};
