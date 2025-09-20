
import auth from "../../middlewares/auth";
import { UserValidation } from "./user.validation";
import { UserController } from "./user.controller";
import validateRequest from "../../middlewares/validateRequest";
import { NextFunction, Request, Response, Router } from "express";
import { Role } from "@prisma/client";
import { multerUpload } from "../../config/multer.config";

const router = Router();
router.post(
  "/register",
  validateRequest(UserValidation.createUserValidationSchema),
  UserController.createUser
);

router.get("/", auth(Role.admin, Role.super_admin), UserController.getAllUser);

router.get(
  "/:userId",
  UserController.getSingleUserById
);

router.patch(
  "/update",
  auth(Role.admin, Role.super_admin),
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
  auth(Role.admin, Role.super_admin),
  validateRequest(UserValidation.updateUserByAdminValidationSchema),
  UserController.updateUserByAdmin
);

router.delete(
  "/:userId",
  auth(Role.admin, Role.super_admin),
  UserController.deleteUser
);

export const UserRoutes = router;
