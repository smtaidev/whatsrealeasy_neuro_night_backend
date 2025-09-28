
import { Router } from "express";
import auth from "../../middlewares/auth";
import { Role } from "@prisma/client";
import { AnalyticsController } from "./analytics.controller";

const router = Router();


router.get("/", auth(Role.super_admin), AnalyticsController.getDashbaordAnalytics);
router.get("/services", auth(Role.super_admin), AnalyticsController.getDashbaordServices);

export const AnalyticsRoutes = router;
