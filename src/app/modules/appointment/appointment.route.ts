// appointment.routes.ts
import { Router } from 'express';
import auth from '../../middlewares/auth';
import { Role } from '@prisma/client';
import { GoogleCalendarController } from './appointment.controller';

const router = Router();

// ==================== PUBLIC ROUTES (OAuth Flow) ====================
// These are for the initial Google OAuth authentication
router.get("/auth/initiate",auth(Role.super_admin), GoogleCalendarController.initiateAuth); // Start OAuth flow
router.get("/redirect", GoogleCalendarController.handleOAuthCallback); // Google redirects here

// ==================== PROTECTED ROUTES (Require Super Admin) ====================
// Authentication status check
router.get("/auth/status", auth(Role.super_admin , Role.admin), GoogleCalendarController.getAuthStatus);


// Appointment management
router.post("/",  GoogleCalendarController.setAppointment);

export const appointmentRoutes = router;

// // Calendar management
// router.patch("/clear",  GoogleCalendarController.clearAppointment);
// router.get("/calendars",  GoogleCalendarController.listCalendars);
// router.get("/events",  GoogleCalendarController.listEvents);
// router.get("/",  GoogleCalendarController.getAppointment);
// router.delete("/",  GoogleCalendarController.cancelAppointment);

// http://localhost:5000/api/v1/appointments/auth/initiate
// http://localhost:5000/api/v1/appointments/redirect