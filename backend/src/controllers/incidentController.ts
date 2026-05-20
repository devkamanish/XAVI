import { Request, Response } from "express";
import mongoose from "mongoose";
import Incident from "../models/Incident";
import Activity from "../models/Activity";
import { sendSuccess, sendError, sendPaginated } from "../utils/response";

// POST /api/incidents - Create a new incident
export const createIncident = async (req: Request, res: Response) => {
  try {
    const { title, description, severity, status, tags, assignee, dueDate } = req.body;
    const orgId = req.orgId!;

    const incident = await Incident.create({
      title,
      description,
      severity,
      status,
      tags,
      assignee: assignee || null,
      reporter: req.user._id,
      organization: orgId,
      dueDate: dueDate ? new Date(dueDate) : null,
    });

    // Log activity
    await Activity.create({
      action: "incident_created",
      details: `${req.user.name} created incident "${title}"`,
      user: req.user._id,
      incident: incident._id,
      organization: orgId,
    });

    // Populate references before sending
    await incident.populate("reporter", "name email");
    await incident.populate("assignee", "name email");

    // Emit real-time event
    const io = req.app.get("io");
    if (io) {
      io.to(orgId).emit("incident:created", incident);
    }

    return sendSuccess(res, { incident }, "Incident created", 201);
  } catch (error) {
    console.error("Create incident error:", error);
    return sendError(res, "Failed to create incident");
  }
};

// GET /api/incidents - List incidents with filters, search, pagination, sorting
export const getIncidents = async (req: Request, res: Response) => {
  try {
    const orgId = req.orgId!;
    const {
      page = "1",
      limit = "10",
      status,
      severity,
      assignee,
      search,
      sortBy = "createdAt",
      sortOrder = "desc",
      startDate,
      endDate,
    } = req.query;

    const pageNum = parseInt(page as string) || 1;
    const limitNum = Math.min(parseInt(limit as string) || 10, 50);
    const skip = (pageNum - 1) * limitNum;

    // Build filter query - always scoped to organization
    const filter: any = { organization: orgId };

    if (status) {
      // Support multiple statuses: "open,in_progress"
      const statuses = (status as string).split(",");
      filter.status = { $in: statuses };
    }

    if (severity) {
      const severities = (severity as string).split(",");
      filter.severity = { $in: severities };
    }

    if (assignee) {
      if (assignee === "unassigned") {
        filter.assignee = null;
      } else {
        filter.assignee = assignee;
      }
    }

    if (search) {
      filter.title = { $regex: search, $options: "i" };
    }

    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate as string);
      if (endDate) filter.createdAt.$lte = new Date(endDate as string);
    }

    // Build sort
    const sort: any = {};
    sort[sortBy as string] = sortOrder === "asc" ? 1 : -1;

    const [incidents, total] = await Promise.all([
      Incident.find(filter)
        .populate("reporter", "name email")
        .populate("assignee", "name email")
        .sort(sort)
        .skip(skip)
        .limit(limitNum),
      Incident.countDocuments(filter),
    ]);

    return sendPaginated(res, incidents, total, pageNum, limitNum);
  } catch (error) {
    console.error("Get incidents error:", error);
    return sendError(res, "Failed to fetch incidents");
  }
};

// GET /api/incidents/:id - Get single incident
export const getIncident = async (req: Request, res: Response) => {
  try {
    const incident = await Incident.findOne({
      _id: req.params.id,
      organization: req.orgId,
    })
      .populate("reporter", "name email")
      .populate("assignee", "name email");

    if (!incident) {
      return sendError(res, "Incident not found", 404);
    }

    return sendSuccess(res, { incident });
  } catch (error) {
    return sendError(res, "Failed to fetch incident");
  }
};

// PATCH /api/incidents/:id - Update incident
export const updateIncident = async (req: Request, res: Response) => {
  try {
    const orgId = req.orgId!;
    const incidentId = req.params.id;

    // Find existing incident first (for activity logging)
    const existingIncident = await Incident.findOne({
      _id: incidentId,
      organization: orgId,
    });

    if (!existingIncident) {
      return sendError(res, "Incident not found", 404);
    }

    const updates = req.body;

    // Track what changed for activity log
    const changes: string[] = [];

    if (updates.status && updates.status !== existingIncident.status) {
      changes.push(`status from "${existingIncident.status}" to "${updates.status}"`);
      // Set resolvedAt when status becomes resolved or closed
      if (["resolved", "closed"].includes(updates.status) && !existingIncident.resolvedAt) {
        updates.resolvedAt = new Date();
      }
    }

    if (updates.severity && updates.severity !== existingIncident.severity) {
      changes.push(`severity from "${existingIncident.severity}" to "${updates.severity}"`);
    }

    if (updates.assignee !== undefined && String(updates.assignee) !== String(existingIncident.assignee)) {
      changes.push("assignee");
    }

    if (updates.title && updates.title !== existingIncident.title) {
      changes.push("title");
    }

    if (updates.dueDate !== undefined) {
      updates.dueDate = updates.dueDate ? new Date(updates.dueDate) : null;
    }

    // Update with optimistic concurrency (using __v)
    const incident = await Incident.findOneAndUpdate(
      { _id: incidentId, organization: orgId, __v: existingIncident.__v },
      { $set: updates, $inc: { __v: 1 } },
      { new: true, runValidators: true }
    )
      .populate("reporter", "name email")
      .populate("assignee", "name email");

    if (!incident) {
      // Check if it was a concurrency issue or if it was actually deleted
      const checkExists = await Incident.findById(incidentId);
      if (checkExists) {
        return sendError(res, "Incident was modified concurrently by another user. Please refresh and try again.", 409);
      }
      return sendError(res, "Incident not found", 404);
    }

    // Log activity for each change
    for (const change of changes) {
      await Activity.create({
        action: change.startsWith("status") ? "status_changed" :
               change.startsWith("severity") ? "severity_changed" :
               change.startsWith("assignee") ? "assignee_changed" : "incident_updated",
        details: `${req.user.name} changed ${change}`,
        user: req.user._id,
        incident: incidentId,
        organization: orgId,
        metadata: { field: change, updates },
      });
    }

    // Emit real-time event
    const io = req.app.get("io");
    if (io) {
      io.to(orgId).emit("incident:updated", incident);

      // Specific events for status and assignment changes
      if (changes.some(c => c.startsWith("status"))) {
        io.to(orgId).emit("incident:statusChanged", {
          incidentId,
          newStatus: updates.status,
          updatedBy: req.user.name,
        });
      }
      if (changes.some(c => c.startsWith("assignee"))) {
        io.to(orgId).emit("incident:assigneeChanged", {
          incidentId,
          newAssignee: updates.assignee,
          updatedBy: req.user.name,
        });
      }
    }

    return sendSuccess(res, { incident }, "Incident updated");
  } catch (error) {
    console.error("Update incident error:", error);
    return sendError(res, "Failed to update incident");
  }
};

// DELETE /api/incidents/:id - Delete incident (admin/manager only)
export const deleteIncident = async (req: Request, res: Response) => {
  try {
    const incident = await Incident.findOneAndDelete({
      _id: req.params.id,
      organization: req.orgId,
    });

    if (!incident) {
      return sendError(res, "Incident not found", 404);
    }

    // Log activity
    await Activity.create({
      action: "incident_deleted",
      details: `${req.user.name} deleted incident "${incident.title}"`,
      user: req.user._id,
      organization: req.orgId!,
    });

    return sendSuccess(res, null, "Incident deleted");
  } catch (error) {
    return sendError(res, "Failed to delete incident");
  }
};
