// src/routes/number.routes.ts
import { Router } from "express";
import auth from "../../middlewares/auth";
import validateRequest from "../../middlewares/validateRequest";
import { multerUpload } from "../../config/multer.config";
import { Role } from "@prisma/client";
import { NumberController } from "./number.controller";

const router = Router();

router.post(
  "/upload",
  auth(Role.USER, Role.ADMIN, Role.SUPERADMIN),
  multerUpload.single("file"),
//   validateRequest(NumberValidation.createNumberListValidationSchema),
  NumberController.createNumberList
);

router.get(
  "/",
  auth(Role.USER, Role.ADMIN, Role.SUPERADMIN),
  NumberController.getAllNumberLists
);

router.get(
  "/:listId",
  auth(Role.USER, Role.ADMIN, Role.SUPERADMIN),
  NumberController.getSingleNumberList
);

router.delete(
  "/:listId",
  auth(Role.USER, Role.ADMIN, Role.SUPERADMIN),
  NumberController.deleteNumberList
);

export const NumberRoutes = router;