// token.service.ts
import { PrismaClient, User } from '@prisma/client';

const prisma = new PrismaClient();

export interface GoogleTokens {
  access_token: string;
  refresh_token: string;
  scope: string;
  token_type: string;
  expiry_date: number;
  refresh_token_expires_in?: number;
}

/**
 * Get Super Admin user with Google tokens
 */
const getSuperAdmin = async (): Promise<User | null> => {
  return await prisma.user.findFirst({
    where: {
      role: 'super_admin',
      isActive: true
    }
  });
};

/**
 * Save Google tokens for Super Admin
 */
const saveTokens = async (tokens: GoogleTokens): Promise<User> => {
  const superAdmin = await getSuperAdmin();
  
  if (!superAdmin) {
    throw new Error('No active Super Admin found');
  }

  return await prisma.user.update({
    where: { id: superAdmin.id },
    data: {
      googleAccessToken: tokens.access_token,
      googleRefreshToken: tokens.refresh_token,
      googleExpiryDate: tokens.expiry_date ? BigInt(tokens.expiry_date) : null,
      googleScope: tokens.scope,
      updatedAt: new Date()
    }
  });
};

/**
 * Get current Google tokens for Super Admin
 */
const getTokens = async (): Promise<GoogleTokens | null> => {
  const superAdmin = await getSuperAdmin();
  
  if (!superAdmin || !superAdmin.googleAccessToken || !superAdmin.googleRefreshToken || !superAdmin.googleExpiryDate) {
    return null;
  }

  return {
    access_token: superAdmin.googleAccessToken,
    refresh_token: superAdmin.googleRefreshToken,
    scope: superAdmin.googleScope || '',
    token_type: 'Bearer',
    expiry_date: Number(superAdmin.googleExpiryDate)
  };
};

/**
 * Check if access token is expired
 */
const isTokenExpired = async (): Promise<boolean> => {
  const tokens = await getTokens();
  if (!tokens) return true;
  
  return Date.now() > tokens.expiry_date;
};

/**
 * Update access token (after refresh)
 */
const updateAccessToken = async (accessToken: string, expiryDate: number): Promise<User> => {
  const superAdmin = await getSuperAdmin();
  
  if (!superAdmin) {
    throw new Error('No active Super Admin found');
  }

  return await prisma.user.update({
    where: { id: superAdmin.id },
    data: {
      googleAccessToken: accessToken,
      googleExpiryDate: BigInt(expiryDate),
      updatedAt: new Date()
    }
  });
};

/**
 * Clear Google tokens (for logout or re-authentication)
 */
const clearTokens = async (): Promise<User> => {
  const superAdmin = await getSuperAdmin();
  
  if (!superAdmin) {
    throw new Error('No active Super Admin found');
  }

  return await prisma.user.update({
    where: { id: superAdmin.id },
    data: {
      googleAccessToken: null,
      googleRefreshToken: null,
      googleExpiryDate: null,
      googleScope: null,
      updatedAt: new Date()
    }
  });
};

// Export the token service
export const tokenService = {
  getSuperAdmin,
  saveTokens,
  getTokens,
  isTokenExpired,
  updateAccessToken,
  clearTokens
};