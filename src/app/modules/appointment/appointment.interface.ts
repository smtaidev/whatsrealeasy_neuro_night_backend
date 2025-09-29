// appointment.interface.ts
export interface GoogleTokens {
  access_token: string;
  refresh_token: string;
  scope: string;
  token_type: string;
  expiry_date: number;
  refresh_token_expires_in?: number;
}

export interface AppointmentEventData {
  callLogId?: string | null;
  summary: string;
  description?: string;
  start: {
    dateTime: string; // Make this required
    timeZone?: string;
  };
  end: {
    dateTime: string; // Make this required  
    timeZone?: string;
  };
}

export interface CalendarEvent {
  id?: string;
  summary?: string;
  description?: string;
  start?: { dateTime?: string; timeZone?: string };
  end?: { dateTime?: string; timeZone?: string };
  hangoutLink?: string;
  status?: string;
}

export interface CalendarListEntry {
  id: string;
  summary: string;
  description?: string;
  primary?: boolean;
}

export interface GoogleCalendarServiceInterface {
  generateAuthUrl(): string;
  isAuthenticated(): boolean;
  hasRefreshToken(): boolean;
  setToken(code: string): Promise<GoogleTokens>;
  setAppointment(eventData: AppointmentEventData): Promise<CalendarEvent>;
  getAppointment(): Promise<CalendarEvent | { message: string }>;
  cancelAppointment(): Promise<{ message: string }>;
  clearAppointment(): { message: string };
  listCalendars(): Promise<CalendarListEntry[]>;
  listEvents(calendarId?: string, maxResults?: number): Promise<CalendarEvent[]>;
  getAuthClient(): any;
  manualRefreshToken(): Promise<boolean>;
}