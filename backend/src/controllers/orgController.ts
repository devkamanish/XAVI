import { Request, Response } from "express";
import Organization from "../models/Organization";
import Membership from "../models/Membership";
import User from "../models/User";
import Activity from "../models/Activity";
import { sendSuccess, sendError } from "../utils/response";

// POST /api/orgs - Create a new organization
export const createOrg = async (req: Request, res: Response) => {
  try {
    const { name, description } = req.body;

    // Generate slug from name
    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      + "-" + Date.now().toString(36);

    const org = await Organization.create({
      name,
      slug,
      description: description || "",
      owner: req.user._id,
    });

    // Creator becomes admin automatically
    await Membership.create({
      user: req.user._id,
      organization: org._id,
      role: "admin",
      status: "active",
    });

    // Log activity
    await Activity.create({
      action: "org_created",
      details: `${req.user.name} created organization "${name}"`,
      user: req.user._id,
      organization: org._id,
    });

    return sendSuccess(res, { organization: org }, "Organization created", 201);
  } catch (error) {
    console.error("Create org error:", error);
    return sendError(res, "Failed to create organization");
  }
};

// GET /api/orgs - Get all orgs user belongs to
export const getMyOrgs = async (req: Request, res: Response) => {
  try {
    const memberships = await Membership.find({
      user: req.user._id,
      status: "active",
    }).populate("organization");

    const orgs = memberships.map((m) => ({
      organization: m.organization,
      role: m.role,
    }));

    return sendSuccess(res, { organizations: orgs });
  } catch (error) {
    return sendError(res, "Failed to fetch organizations");
  }
};

// GET /api/orgs/:orgId - Get org details
export const getOrgDetails = async (req: Request, res: Response) => {
  try {
    const org = await Organization.findById(req.params.orgId).populate("owner", "name email");

    if (!org) {
      return sendError(res, "Organization not found", 404);
    }

    // Check if user is a member
    const membership = await Membership.findOne({
      user: req.user._id,
      organization: org._id,
      status: "active",
    });

    if (!membership) {
      return sendError(res, "You don't have access to this organization", 403);
    }

    // Get all members
    const members = await Membership.find({
      organization: org._id,
    }).populate("user", "name email");

    return sendSuccess(res, {
      organization: org,
      members,
      currentUserRole: membership.role,
    });
  } catch (error) {
    return sendError(res, "Failed to fetch organization details");
  }
};

// POST /api/orgs/:orgId/invite - Invite a user
export const inviteUser = async (req: Request, res: Response) => {
  try {
    const { email, role } = req.body;
    const orgId = req.params.orgId;

    // Check the inviter's membership (must be admin or manager)
    const inviterMembership = await Membership.findOne({
      user: req.user._id,
      organization: orgId,
      status: "active",
    });

    if (!inviterMembership || !["admin", "manager"].includes(inviterMembership.role)) {
      return sendError(res, "Only admins and managers can invite users", 403);
    }

    // Find the user to invite
    const userToInvite = await User.findOne({ email });
    if (!userToInvite) {
      return sendError(res, "User with this email not found. They need to sign up first.", 404);
    }

    // Check for duplicate invite
    const existingMembership = await Membership.findOne({
      user: userToInvite._id,
      organization: orgId,
    });

    if (existingMembership) {
      return sendError(res, "User is already a member or has been invited", 409);
    }

    // Create membership
    const membership = await Membership.create({
      user: userToInvite._id,
      organization: orgId,
      role: role || "developer",
      status: "active", // Direct join for simplicity
    });

    // Log activity
    await Activity.create({
      action: "user_invited",
      details: `${req.user.name} invited ${userToInvite.name} as ${role || "developer"}`,
      user: req.user._id,
      organization: orgId,
    });

    return sendSuccess(res, { membership }, "User invited successfully", 201);
  } catch (error) {
    console.error("Invite error:", error);
    return sendError(res, "Failed to invite user");
  }
};

// PATCH /api/orgs/:orgId/members/:memberId/role - Update member role
export const updateMemberRole = async (req: Request, res: Response) => {
  try {
    const { orgId, memberId } = req.params;
    const { role } = req.body;

    // Check inviter is admin
    const inviterMembership = await Membership.findOne({
      user: req.user._id,
      organization: orgId,
      status: "active",
      role: "admin",
    });

    if (!inviterMembership) {
      return sendError(res, "Only admins can change roles", 403);
    }

    const membership = await Membership.findOneAndUpdate(
      { _id: memberId, organization: orgId },
      { role },
      { new: true }
    ).populate("user", "name email");

    if (!membership) {
      return sendError(res, "Membership not found", 404);
    }

    await Activity.create({
      action: "user_invited", // Using an existing valid action type, or org_updated
      details: `${req.user.name} changed role of ${membership.user.name} to ${role}`,
      user: req.user._id,
      organization: orgId,
    });

    return sendSuccess(res, { membership }, "Role updated");
  } catch (error) {
    return sendError(res, "Failed to update role");
  }
};

// DELETE /api/orgs/:orgId/members/:memberId - Remove member
export const removeMember = async (req: Request, res: Response) => {
  try {
    const { orgId, memberId } = req.params;

    const inviterMembership = await Membership.findOne({
      user: req.user._id,
      organization: orgId,
      status: "active",
      role: "admin",
    });

    if (!inviterMembership) {
      return sendError(res, "Only admins can remove members", 403);
    }

    const membership = await Membership.findOneAndDelete({
      _id: memberId,
      organization: orgId,
    });

    if (!membership) {
      return sendError(res, "Membership not found", 404);
    }

    await Activity.create({
      action: "user_invited", // General org activity action
      details: `${req.user.name} removed a member from the organization`,
      user: req.user._id,
      organization: orgId,
    });

    return sendSuccess(res, null, "Member removed");
  } catch (error) {
    return sendError(res, "Failed to remove member");
  }
};
