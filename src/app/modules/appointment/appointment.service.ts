// appointment.service.ts
import { google, calendar_v3 } from "googleapis";
import {
  AppointmentEventData,
  CalendarEvent,
  CalendarListEntry,
  GoogleCalendarServiceInterface,
  GoogleTokens,
} from "./appointment.interface";
import { tokenService } from "../token/token.service";
import prisma from "../../utils/prisma";

// State management
let oAuth2Client: any = null;
let calendar: calendar_v3.Calendar | null = null;
const calendarId: string = "primary";
let currentAppointmentId: string | null = null;

// Initialize the service
const initializeOAuthClient = (): void => {
  oAuth2Client = new google.auth.OAuth2(
    process.env.CLIENT_ID!,
    process.env.SECRET_ID!,
    process.env.REDIRECT!
  );

  calendar = google.calendar({ version: "v3", auth: oAuth2Client });

  // Load tokens from database on initialization
  loadTokensFromDB();
};

const loadTokensFromDB = async (): Promise<void> => {
  try {
    const tokens = await tokenService.getTokens();
    if (tokens) {
      oAuth2Client.setCredentials(tokens);
      console.log("Tokens loaded from database successfully");

      // Auto-refresh if token is expired
      if (await tokenService.isTokenExpired()) {
        await refreshAccessToken();
      }
    }
  } catch (error) {
    console.log("No valid tokens found in database, need to authenticate");
  }
};

const refreshAccessToken = async (): Promise<void> => {
  try {
    const tokens = await tokenService.getTokens();
    if (!tokens?.refresh_token) {
      throw new Error("No refresh token available");
    }

    oAuth2Client.setCredentials({
      refresh_token: tokens.refresh_token,
    });

    const { credentials } = await oAuth2Client.refreshAccessToken();

    // Save new access token to database
    await tokenService.updateAccessToken(
      credentials.access_token,
      credentials.expiry_date
    );

    oAuth2Client.setCredentials(credentials);
    console.log("Access token refreshed successfully");
  } catch (error) {
    console.error("Error refreshing access token:", error);
    throw error;
  }
};

const ensureValidToken = async (): Promise<void> => {
  if (await tokenService.isTokenExpired()) {
    await refreshAccessToken();
  }
};

const generateAuthUrl = (): string => {
  if (!oAuth2Client) initializeOAuthClient();

  return oAuth2Client.generateAuthUrl({
    access_type: "offline",
    scope: [
      "https://www.googleapis.com/auth/calendar.readonly",
      "https://www.googleapis.com/auth/calendar.events",
    ],
    prompt: "consent",
  });
};

const isAuthenticated = (): boolean => {
  if (!oAuth2Client) initializeOAuthClient();

  const credentials = oAuth2Client.credentials;
  return !!(credentials && credentials.access_token);
};

const hasRefreshToken = (): boolean => {
  if (!oAuth2Client) initializeOAuthClient();

  const credentials = oAuth2Client.credentials;
  return !!(credentials && credentials.refresh_token);
};

const setToken = async (code: string): Promise<GoogleTokens> => {
  try {
    if (!oAuth2Client) initializeOAuthClient();

    const { tokens } = await oAuth2Client.getToken(code);
    oAuth2Client.setCredentials(tokens);

    // Save tokens to database
    await tokenService.saveTokens(tokens);

    console.log("Tokens saved to database successfully");
    return tokens;
  } catch (error) {
    console.error("Error getting token:", (error as Error).message);
    throw error;
  }
};

const setAppointment = async (
  eventData: AppointmentEventData
): Promise<CalendarEvent> => {
  try {
    if (!oAuth2Client || !calendar) initializeOAuthClient();

    // Ensure we have a valid token before making API call
    await ensureValidToken();

    let response;
    const requestId = `appointment_${Date.now()}`;

    const conferenceData = {
      createRequest: {
        requestId,
        conferenceSolutionKey: { type: "hangoutsMeet" },
      },
    };

    // Fix: Ensure consistent dateTime format and proper timezone handling
    const event: calendar_v3.Schema$Event = {
      summary: eventData.summary,
      description: eventData.description || "",
      start: {
        dateTime: eventData.start.dateTime,
        timeZone: eventData.start.timeZone || "UTC",
      },
      end: {
        dateTime: eventData.end.dateTime,
        timeZone: eventData.end.timeZone || "UTC",
      },
      conferenceData: conferenceData,
      reminders: {
        useDefault: false,
        overrides: [
          { method: "email", minutes: 24 * 60 },
          { method: "popup", minutes: 30 },
        ],
      },
    };

    // Validate that both start and end have dateTime properties
    if (!event.start.dateTime || !event.end.dateTime) {
      throw new Error("Both start and end must have dateTime properties");
    }

    // Ensure the dateTime strings are in proper ISO format
    const startDateTime = new Date(event.start.dateTime).toISOString();
    const endDateTime = new Date(event.end.dateTime).toISOString();

    event.start.dateTime = startDateTime;
    event.end.dateTime = endDateTime;

    if (currentAppointmentId) {
      // Update existing appointment
      response = await calendar.events.update({
        calendarId,
        eventId: currentAppointmentId,
        resource: event,
        conferenceDataVersion: 1,
      });
    } else {
      // Create new appointment
      response = await calendar.events.insert({
        calendarId,
        resource: event,
        conferenceDataVersion: 1,
        sendUpdates: "all",
      });
    }

    // Save to booking database
    const bookingData = {
      callLogId: eventData?.callLogId,
      title: event.summary || "No Title",
      description: event.description || "",
      startTime: new Date(event.start.dateTime!), // ISO format
      endTime: new Date(event.end.dateTime!), // ISO format
      timeZone: event.start.timeZone || "UTC",
      googleEventId: response.data.id || null,
      meetLink: response.data.hangoutLink || null,
      calendarLink: response.data.htmlLink || null,
      status: response.data.status ? "confirmed" : "unknown",
    };

    const result = await prisma.booking.create({
      data: bookingData,
    });

    console.log("Booking saved to database:", result.id);

    currentAppointmentId = response.data.id || null;
    return response.data;
  } catch (error) {
    console.error("Error setting appointment:", (error as Error).message);
    if ((error as any).response) {
      console.error("Error details:", (error as any).response.data);
    }
    throw error;
  }
};

const getAppointment = async (): Promise<
  CalendarEvent | { message: string }
> => {
  try {
    if (!oAuth2Client || !calendar) initializeOAuthClient();

    if (!currentAppointmentId) {
      return { message: "No appointment currently set" };
    }

    await ensureValidToken();

    const response = await calendar.events.get({
      calendarId,
      eventId: currentAppointmentId,
    });

    return response.data;
  } catch (error) {
    console.error("Error getting appointment:", (error as Error).message);
    if ((error as any).code === 404) {
      currentAppointmentId = null;
      return { message: "Appointment not found, was it deleted?" };
    }
    throw error;
  }
};

const cancelAppointment = async (): Promise<{ message: string }> => {
  try {
    if (!oAuth2Client || !calendar) initializeOAuthClient();

    if (!currentAppointmentId) {
      return { message: "No appointment to cancel" };
    }

    await ensureValidToken();

    await calendar.events.delete({
      calendarId,
      eventId: currentAppointmentId,
    });

    currentAppointmentId = null;
    return { message: "Appointment successfully cancelled" };
  } catch (error) {
    console.error("Error cancelling appointment:", (error as Error).message);
    if ((error as any).code === 404) {
      currentAppointmentId = null;
      return { message: "Appointment was already deleted" };
    }
    throw error;
  }
};

const clearAppointment = (): { message: string } => {
  currentAppointmentId = null;
  return { message: "Appointment reference cleared" };
};

const listCalendars = async (): Promise<CalendarListEntry[]> => {
  try {
    if (!oAuth2Client || !calendar) initializeOAuthClient();

    await ensureValidToken();

    const response = await calendar.calendarList.list({});
    return response.data.items || [];
  } catch (error) {
    console.error("Error fetching calendars:", (error as Error).message);
    throw error;
  }
};

const listEvents = async (
  calendarId: string = "primary",
  maxResults: number = 15
): Promise<CalendarEvent[]> => {
  try {
    if (!oAuth2Client || !calendar) initializeOAuthClient();

    await ensureValidToken();

    const response = await calendar.events.list({
      calendarId,
      timeMin: new Date().toISOString(),
      maxResults,
      singleEvents: true,
      orderBy: "startTime",
    });
    return response.data.items || [];
  } catch (error) {
    console.error("Error fetching events:", (error as Error).message);
    throw error;
  }
};

const getAuthClient = (): any => {
  if (!oAuth2Client) initializeOAuthClient();
  return oAuth2Client;
};

const manualRefreshToken = async (): Promise<boolean> => {
  try {
    if (!oAuth2Client) initializeOAuthClient();

    await refreshAccessToken();
    return true;
  } catch (error) {
    console.error("Manual token refresh failed:", error);
    return false;
  }
};

// Initialize the service when imported
initializeOAuthClient();

// Export the functional service
export const googleCalendarService = {
  generateAuthUrl,
  isAuthenticated,
  hasRefreshToken,
  setToken,
  setAppointment,
  getAppointment,
  cancelAppointment,
  clearAppointment,
  listCalendars,
  listEvents,
  getAuthClient,
  manualRefreshToken,
};
