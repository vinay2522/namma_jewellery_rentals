import { Request, Response, NextFunction } from "express";
import bcrypt from "bcryptjs";

// Admin credentials (hashed password)
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || "admin";
const ADMIN_PASSWORD_HASH = process.env.ADMIN_PASSWORD_HASH || "";

// Generate hash for default password "admin123"
const DEFAULT_PASSWORD_HASH = bcrypt.hashSync("admin123", 10);

export interface AuthRequest extends Request {
  session: {
    isAuthenticated?: boolean;
    userId?: string;
  } & Request["session"];
}

// Middleware to check if user is authenticated
export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const authReq = req as AuthRequest;
  
  if (authReq.session.isAuthenticated) {
    return next();
  }
  
  return res.status(401).json({
    success: false,
    message: "Authentication required",
  });
}

// Verify admin credentials
export async function verifyAdminCredentials(
  username: string,
  password: string
): Promise<boolean> {
  if (username !== ADMIN_USERNAME) {
    return false;
  }
  
  const passwordHash = ADMIN_PASSWORD_HASH || DEFAULT_PASSWORD_HASH;
  return bcrypt.compare(password, passwordHash);
}

// Login handler
export async function loginAdmin(
  username: string,
  password: string,
  session: any
): Promise<boolean> {
  const isValid = await verifyAdminCredentials(username, password);
  
  if (isValid) {
    session.isAuthenticated = true;
    session.userId = username;
    return true;
  }
  
  return false;
}

// Logout handler
export function logoutAdmin(session: any): void {
  session.isAuthenticated = false;
  session.userId = undefined;
}
