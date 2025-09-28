import { Router } from "express";
import { AuthRoutes } from "../modules/auth/auth.route";
import { UserRoutes } from "../modules/user/user.routes";
import { AnalyticsRoutes } from "../modules/analytics/analytics.routes";
import { appointmentRoutes } from "../modules/appointment/appointment.route";
import { CallLogsRoutes } from "../modules/callLogs/call-logs.route";

const router = Router();

const moduleRoutes = [
  {
    path: "/auth",
    route: AuthRoutes,
  },
  {
    path: "/users",
    route: UserRoutes,
  },
  {
    path: "/analytics",
    route: AnalyticsRoutes,
  },
  {
    path: "/appointments",
    route: appointmentRoutes,
  },
  {
    path: "/call-logs",
    route: CallLogsRoutes
  }
];

moduleRoutes.forEach((route) => router.use(route.path, route.route));

export default router;
