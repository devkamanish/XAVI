import { Router, Request, Response, NextFunction } from "express";
import {
  createOrg,
  getMyOrgs,
  getOrgDetails,
  inviteUser,
  updateMemberRole,
  removeMember,
} from "../controllers/orgController";
import { authenticate } from "../middleware/auth";
import { validate } from "../middleware/validate";
import { createOrgSchema, inviteUserSchema } from "../validators/schemas";
import Membership from "../models/Membership";
import { sendError } from "../utils/response";

const router = Router();
router.use(authenticate);


const requireOrgRole = (...allowedRoles: string[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const orgId = req.params.orgId;
      if (!orgId) return sendError(res, "Organization ID required", 400);

      const membership = await Membership.findOne({
        user: req.user._id,
        organization: orgId,
        status: "active",
      });

      if (!membership) {
        return sendError(res, "You don't have access to this organization", 403);
      }

      if (!allowedRoles.includes(membership.role)) {
        return sendError(res, `Access denied. Required role: ${allowedRoles.join(" or ")}`, 403);
      }

      req.userRole = membership.role;
      next();
    } catch (error) {
      return sendError(res, "Authorization check failed", 500);
    }
  };
};

router.post("/", validate(createOrgSchema), createOrg);
router.get("/", getMyOrgs);
router.get("/:orgId", getOrgDetails);
router.post("/:orgId/invite", requireOrgRole("admin", "manager"), validate(inviteUserSchema), inviteUser);
router.patch("/:orgId/members/:memberId/role", requireOrgRole("admin"), updateMemberRole);
router.delete("/:orgId/members/:memberId", requireOrgRole("admin"), removeMember);

export default router;
