import { Router } from "express";
import { AuthRoutes } from "../modules/auth/auth.route";
import { UserRoutes } from "../modules/user/user.routes";
import { AnalyticsRoutes } from "../modules/analytics/analytics.routes";
import { appointmentRoutes } from "../modules/appointment/appointment.route";

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
  }
  // app.use('/api/calendar', GoogleCalendarRoutes);
];

moduleRoutes.forEach((route) => router.use(route.path, route.route));

export default router;
