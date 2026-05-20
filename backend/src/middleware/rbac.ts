import { Request, Response, NextFunction } from "express";
import Membership, { Role } from "../models/Membership";
import { sendError } from "../utils/response";

// Middleware to check if user belongs to the organization
// and attach their membership/role to the request
export const requireOrg = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const orgId = req.headers["x-org-id"] as string;

    if (!orgId) {
      return sendError(res, "Organization ID is required in x-org-id header", 400);
    }

    const membership = await Membership.findOne({
      user: req.user._id,
      organization: orgId,
      status: "active",
    });

    if (!membership) {
      return sendError(res, "You don't have access to this organization", 403);
    }

    // Attach org context to request
    req.orgId = orgId;
    req.userRole = membership.role;

    next();
  } catch (error) {
    return sendError(res, "Organization verification failed", 500);
  }
};

// Middleware factory to check if user has required role
export const requireRole = (...allowedRoles: Role[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.userRole) {
      return sendError(res, "Role not determined", 403);
    }

    if (!allowedRoles.includes(req.userRole)) {
      return sendError(res, `Access denied. Required role: ${allowedRoles.join(" or ")}`, 403);
    }

    next();
  };
};

// Extend Express Request
declare global {
  namespace Express {
    interface Request {
      orgId?: string;
      userRole?: Role;
    }
  }
}
