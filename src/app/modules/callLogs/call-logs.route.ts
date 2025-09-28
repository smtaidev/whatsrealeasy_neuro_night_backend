
import auth from "../../middlewares/auth";
import {  Router } from "express";
import { Role } from "@prisma/client";
import { CallLogsController } from "./call-logs.controller";

const router = Router();


router.get("/", auth(Role.super_admin), CallLogsController.getCallLogsManagement);

export const CallLogsRoutes = router;