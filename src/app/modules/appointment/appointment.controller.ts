import { Request, Response } from 'express';
import status from 'http-status';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import { googleCalendarService } from './appointment.service';
import { AppointmentEventData } from './appointment.interface';
import config from '../../config';

const redirectToGoogleAuth = catchAsync(async (req: Request, res: Response) => {
  console.log('Redirecting to Google OAuth')
  const authUrl = googleCalendarService.generateAuthUrl();
  console.log('Auth URL:', authUrl)
  res.redirect(authUrl);
});

const handleOAuthCallback = catchAsync(async (req: Request, res: Response) => {
  const code = req.query.code as string;
  if (!code) {
    return res.status(status.BAD_REQUEST).send("No code provided");
  }

  const tokens = await googleCalendarService.setToken(code);

  res.redirect(`${config.url.frontend}/dashboard/super-admin/outbound/calender`); 
});

const getAuthStatus = catchAsync(async (req: Request, res: Response) => {
  const isAuthenticated = googleCalendarService.isAuthenticated();
  const hasRefreshToken = googleCalendarService.hasRefreshToken();
  
  sendResponse(res, {
    statusCode: status.OK,
    message: "Authentication status retrieved successfully",
    data: { 
      authenticated: isAuthenticated,
      hasRefreshToken: hasRefreshToken
    },
  });
});

const initiateAuth = catchAsync(async (req: Request, res: Response) => {
  const authUrl = googleCalendarService.generateAuthUrl();
  console.log('Initiating auth, redirecting to:', authUrl)
  
  res.json({
    success: true,
    url: authUrl,
    message: "Google Auth URL generated successfully",
  });
});

const handleRedirect = catchAsync(async (req: Request, res: Response) => {
  const code = req.query.code as string;
  if (!code) {
    return res.status(status.BAD_REQUEST).send('Authorization code not found');
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
  const { summary, description, start, end , callLogId} = req.body;
  // console.log('setAppointment called with:', req.body)
  
  // Validate required fields
  if (!summary || !start || !end) {
    return res.status(status.BAD_REQUEST).json({ 
      error: 'Missing required fields: summary, start, end' 
    });
  }

  // Validate that start and end have dateTime
  if (!start.dateTime || !end.dateTime) {
    return res.status(status.BAD_REQUEST).json({ 
      error: 'Both start and end must have dateTime properties' 
    });
  }

  // Validate date format
  try {
    new Date(start.dateTime);
    new Date(end.dateTime);
  } catch (error) {
    return res.status(status.BAD_REQUEST).json({ 
      error: 'Invalid date format. Use ISO 8601 format: YYYY-MM-DDTHH:mm:ss' 
    });
  }

  const eventData: AppointmentEventData = {
    callLogId: callLogId || null,
    summary,
    description,
    start: {
      dateTime: start.dateTime,
      timeZone: start.timeZone  || 'UTC'
    },
    end: {
      dateTime: end.dateTime,
      timeZone: end.timeZone  || 'UTC'
    }
  };

  try {
    const result = await googleCalendarService.setAppointment(eventData);
    
    sendResponse(res, {
      statusCode: status.OK,
      message: "Appointment set successfully",
      data: {
        message: result.id ? 'Appointment created' : 'Appointment updated',
        appointment: result,
        meetLink: result.hangoutLink
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
  setAppointment
};