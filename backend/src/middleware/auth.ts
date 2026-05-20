import { Request, Response, NextFunction } from "express";
import { verifyAccessToken } from "../utils/jwt";
import User from "../models/User";
import { sendError } from "../utils/response";

// Extend Express Request to include user
declare global {
  namespace Express {
    interface Request {
      user?: any;
    }
  }
}

export const authenticate = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return sendError(res, "No token provided. Please log in.", 401);
    }

    const token = authHeader.split(" ")[1];

    try {
      const decoded = verifyAccessToken(token);
      const user = await User.findById(decoded.userId).select("-password");

      if (!user) {
        return sendError(res, "User not found", 401);
      }

      req.user = user;
      next();
    } catch (err: any) {
      if (err.name === "TokenExpiredError") {
        return sendError(res, "Token expired. Please refresh.", 401);
      }
      return sendError(res, "Invalid token", 401);
    }
  } catch (error) {
    return sendError(res, "Authentication failed", 500);
  }
};
