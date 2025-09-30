import { Request, Response, NextFunction } from 'express';
import status from 'http-status';
import { Role } from '@prisma/client';
import { googleCalendarService } from './appointment.service';
import auth from '../../middlewares/auth';

export const checkCalendarAuth = (req: Request, res: Response, next: NextFunction) => {
  const isAuthenticated = googleCalendarService.isAuthenticated();
  
  if (!isAuthenticated) {
    return res.status(status.UNAUTHORIZED).json({ 
      error: 'Not authenticated. Please visit /auth first to authenticate with Google.' 
    });
  }
  
  next();
};

// Combine with your existing role-based auth
export const calendarAuth = (...roles: Role[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    // First check Google Calendar authentication
    const isAuthenticated = googleCalendarService.isAuthenticated();
    
    if (!isAuthenticated) {
      return res.status(status.UNAUTHORIZED).json({ 
        error: 'Not authenticated. Please authenticate with Google Calendar first.' 
      });
    }
    
    // Then check role-based authentication (your existing auth middleware)
    return auth(...roles)(req, res, next);
  };
};