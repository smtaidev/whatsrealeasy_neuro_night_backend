import { Request, Response } from "express";
import status from "http-status";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { googleCalendarService } from "./appointment.service";
import { AppointmentEventData } from "./appointment.interface";
import config from "../../config";
import { google } from "googleapis";
import { tokenService } from "../token/token.service";

const redirectToGoogleAuth = catchAsync(async (req: Request, res: Response) => {
  console.log("Redirecting to Google OAuth");
  const authUrl = googleCalendarService.generateAuthUrl();
  console.log("Auth URL:", authUrl);
  res.redirect(authUrl);
});

// const handleOAuthCallback = catchAsync(async (req: Request, res: Response) => {
//   const code = req.query.code as string;
//   if (!code) {
//     return res.status(status.BAD_REQUEST).send("No code provided");
//   }

//   const tokens = await googleCalendarService.setToken(code);

//   res.redirect(`${config.url.frontend}/dashboard/super-admin/outbound/calender`);
// });

// const handleOAuthCallback = catchAsync(async (req: Request, res: Response) => {
//   const code = req.query.code as string;
//   if (!code) {
//     return res.status(status.BAD_REQUEST).send("No code provided");
//   }

//   // Get tokens first
//   const tokens = await googleCalendarService.setToken(code);

//   // ✅ ADD THIS: Verify the authenticated user's email
//   const oauth2Client = googleCalendarService.getAuthClient();
//   oauth2Client.setCredentials(tokens);

//   const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
//   const { data: userInfo } = await oauth2.userinfo.get();

//   // ✅ WHITELIST CHECK
//   const AUTHORIZED_EMAILS = [
//     'mdsajjadhosenshohan@gmail.com',
//     // 'bestlocalaimarketing@gmail.com',
//     // Add more authorized emails here
//   ];

//   if (!AUTHORIZED_EMAILS.includes(userInfo.email!)) {
//     // ❌ Unauthorized email - clear tokens and reject
//     await tokenService.clearTokens(); // You'll need to create this method

//     return res.redirect(
//       `${config.url.frontend}/dashboard/super-admin/outbound/calender?error=unauthorized&email=${userInfo.email}`
//     );
//   }

//   // ✅ Authorized - proceed
//   res.redirect(`${config.url.frontend}/dashboard/super-admin/outbound/calender?success=true`);
// });


const handleOAuthCallback = catchAsync(async (req: Request, res: Response) => {
  const code = req.query.code as string;
  if (!code) {
    return res.status(status.BAD_REQUEST).send("No code provided");
  }

  // Exchange code for tokens
  const tokens = await googleCalendarService.setToken(code);
  const oauth2Client = googleCalendarService.getAuthClient();
  oauth2Client.setCredentials(tokens);

  console.log(tokens); // Keep this for debugging if needed

  // ✅ Fetch user info using Google's OAuth2 API (requires 'email' or 'openid' scope for full access)
  // If scopes don't include 'email' or 'openid', add them to your OAuth configuration
  // This is a more reliable way to get the email without relying on id_token
  const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
  try {
    const { data } = await oauth2.userinfo.get();
    const email = data.email as string;

    if (!email) {
      return res.status(status.BAD_REQUEST).send("No email found in user info");
    }

    // decoded.email has the email (now from userinfo)
    const AUTHORIZED_EMAILS = ["mdsajjadhosenshohan@gmail.com"];
    if (!AUTHORIZED_EMAILS.includes(email)) {
      await tokenService.clearTokens();
      return res.redirect(
        `${config.url.frontend}/dashboard/super-admin/outbound/calender?error=unauthorized&email=${email}`
      );
    }

    return res.redirect(
      `${config.url.frontend}/dashboard/super-admin/outbound/calender?success=true&email=${email}`
    );
  } catch (error) {
    console.error('Error fetching user info:', error);
    return res.status(status.INTERNAL_SERVER_ERROR).send("Failed to fetch user information");
  }

  // If you prefer to use id_token (after adding 'openid email' scopes):
  // if (!tokens.id_token) {
  //   return res.status(status.BAD_REQUEST).send("ID token not provided by Google");
  // }
  // const decoded: any = jwt.decode(tokens.id_token as string);
  // const email = decoded.email;
  // ... rest of the logic
});




const getAuthStatus = catchAsync(async (req: Request, res: Response) => {
  const isAuthenticated = googleCalendarService.isAuthenticated();
  const hasRefreshToken = googleCalendarService.hasRefreshToken();

  sendResponse(res, {
    statusCode: status.OK,
    message: "Authentication status retrieved successfully",
    data: {
      authenticated: isAuthenticated,
      hasRefreshToken: hasRefreshToken,
    },
  });
});

const initiateAuth = catchAsync(async (req: Request, res: Response) => {
  console.log("Initiating auth");
  const authUrl = googleCalendarService.generateAuthUrl();
  console.log("Initiating auth, redirecting to:", authUrl);

  res.json({
    success: true,
    url: authUrl,
    message: "Google Auth URL generated successfully",
  });
});

const handleRedirect = catchAsync(async (req: Request, res: Response) => {
  const code = req.query.code as string;
  if (!code) {
    return res.status(status.BAD_REQUEST).send("Authorization code not found");
  }

  const tokens = await googleCalendarService.setToken(code);

  res.send(`
    <html>
      <body>
        <h1>Successfully authenticated!</h1>
        <p>You can now use the appointment API endpoints.</p>
        <p><a href="/">Return to home</a></p>
      </body>
    </html>
  `);
});

// appointment.controller.ts - Better validation
const setAppointment = catchAsync(async (req: Request, res: Response) => {
  const { summary, description, start, end, callLogId } = req.body;
  // console.log('setAppointment called with:', req.body)

  // Validate required fields
  if (!summary || !start || !end) {
    return res.status(status.BAD_REQUEST).json({
      error: "Missing required fields: summary, start, end",
    });
  }

  // Validate that start and end have dateTime
  if (!start.dateTime || !end.dateTime) {
    return res.status(status.BAD_REQUEST).json({
      error: "Both start and end must have dateTime properties",
    });
  }

  // Validate date format
  try {
    new Date(start.dateTime);
    new Date(end.dateTime);
  } catch (error) {
    return res.status(status.BAD_REQUEST).json({
      error: "Invalid date format. Use ISO 8601 format: YYYY-MM-DDTHH:mm:ss",
    });
  }

  const eventData: AppointmentEventData = {
    callLogId: callLogId || null,
    summary,
    description,
    start: {
      dateTime: start.dateTime,
      timeZone: start.timeZone || "UTC",
    },
    end: {
      dateTime: end.dateTime,
      timeZone: end.timeZone || "UTC",
    },
  };

  try {
    const result = await googleCalendarService.setAppointment(eventData);

    sendResponse(res, {
      statusCode: status.OK,
      message: "Appointment set successfully",
      data: {
        message: result.id ? "Appointment created" : "Appointment updated",
        appointment: result,
        meetLink: result.hangoutLink,
      },
    });
  } catch (error: any) {
    sendResponse(res, {
      statusCode: status.INTERNAL_SERVER_ERROR,
      message: error.message || "Failed to set appointment",
      // errorMessages: [{ path: "unknown", message: error.message }],
    });
  }
});

export const GoogleCalendarController = {
  redirectToGoogleAuth,
  handleOAuthCallback,
  getAuthStatus,
  initiateAuth,
  handleRedirect,
  setAppointment,
};
