import { Role } from "@prisma/client";
import jwt, { JwtPayload } from "jsonwebtoken";

export type IJwtPayload = {
  id?: string;
  name?: string | null;
  email: string;
  profilePic?: string | null;
  role: Role;
  isActive?: boolean;
};

const createToken = (
  jwtPayload: IJwtPayload,
  secret: string,
  expiresIn: string
) => {
  return jwt.sign(
    jwtPayload,
    secret as jwt.Secret,
    {
      expiresIn: expiresIn as string,
    } as jwt.SignOptions
  );
};

const verifyToken = (token: string, secret: string): JwtPayload => {
  return jwt.verify(token, secret) as JwtPayload;
};

export const jwtHelpers = {
  createToken,
  verifyToken,
};
