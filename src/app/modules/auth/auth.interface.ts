import { Role } from "@prisma/client";

export type RefreshPayload = {
	id: string;
	email: string;
	role: Role;
	iat: number;
	profilePic?: string;
	exp: number;
};
