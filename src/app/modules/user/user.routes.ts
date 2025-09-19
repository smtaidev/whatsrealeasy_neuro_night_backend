import status from "http-status";
import auth from "../../middlewares/auth";
import { upload } from "../../utils/file-upload/upload";
import ApiError from "../../errors/AppError";
import { UserValidation } from "./user.validation";
import { UserController } from "./user.controller";
import validateRequest from "../../middlewares/validateRequest";
import { NextFunction, Request, Response, Router } from "express";
import { Role } from "@prisma/client";
import { multerUpload } from "../../config/multer.config";

const router = Router();

router.get("/", auth(Role.ADMIN, Role.SUPERADMIN), UserController.getAllUser);

router.get(
  "/:userId",
  auth(Role.ADMIN, Role.SUPERADMIN, Role.USER),
  UserController.getSingleUserById
);

router.post(
  "/register",
  validateRequest(UserValidation.createUserValidationSchema),
  UserController.createUser
);

router.patch(
  "/update",
  auth(Role.USER, Role.ADMIN, Role.SUPERADMIN),
  multerUpload.single("file"),
  (req: Request, res: Response, next: NextFunction) => {
    const file = req.file;
    if (req?.body?.data) {
      req.body = JSON.parse(req?.body?.data);
    }
    if (file) {
      req.body.profilePic = file?.path;
    }

    validateRequest(UserValidation.updateUserValidationSchema),
    UserController.updateUser(req, res, next);
  }
);

router.patch(
  "/:userId",
  auth(Role.ADMIN, Role.SUPERADMIN),
  validateRequest(UserValidation.updateUserByAdminValidationSchema),
  UserController.updateUserByAdmin
);

router.delete(
  "/:userId",
  auth(Role.ADMIN, Role.SUPERADMIN),
  UserController.deleteUser
);

export const UserRoutes = router;
