import { Request, Response } from "express";
import Comment from "../models/Comment";
import Activity from "../models/Activity";
import Incident from "../models/Incident";
import { sendSuccess, sendError } from "../utils/response";
import { parseMentions } from "../utils/mentions";

// POST /api/incidents/:incidentId/comments
export const addComment = async (req: Request, res: Response) => {
  try {
    const { incidentId } = req.params;
    const { content } = req.body;
    const orgId = req.orgId!;

    // Check incident exists and belongs to org
    const incident = await Incident.findOne({
      _id: incidentId,
      organization: orgId,
    });

    if (!incident) {
      return sendError(res, "Incident not found", 404);
    }

    // Parse @email mentions
    const mentions = parseMentions(content);

    const comment = await Comment.create({
      content,
      author: req.user._id,
      incident: incidentId,
      organization: orgId,
      mentions,
    });

    await comment.populate("author", "name email");

    // Log activity
    await Activity.create({
      action: "comment_added",
      details: `${req.user.name} commented on "${incident.title}"`,
      user: req.user._id,
      incident: incidentId,
      organization: orgId,
      metadata: { mentions },
    });

    // Emit real-time event
    const io = req.app.get("io");
    if (io) {
      io.to(orgId).emit("comment:added", {
        incidentId,
        comment,
      });
    }

    return sendSuccess(res, { comment }, "Comment added", 201);
  } catch (error) {
    console.error("Add comment error:", error);
    return sendError(res, "Failed to add comment");
  }
};

// GET /api/incidents/:incidentId/comments
export const getComments = async (req: Request, res: Response) => {
  try {
    const { incidentId } = req.params;
    const orgId = req.orgId!;

    const comments = await Comment.find({
      incident: incidentId,
      organization: orgId,
    })
      .populate("author", "name email")
      .sort({ createdAt: 1 }); // oldest first

    return sendSuccess(res, { comments });
  } catch (error) {
    return sendError(res, "Failed to fetch comments");
  }
};

// DELETE /api/incidents/:incidentId/comments/:commentId
export const deleteComment = async (req: Request, res: Response) => {
  try {
    const { incidentId, commentId } = req.params;
    const orgId = req.orgId!;

    const comment = await Comment.findOne({
      _id: commentId,
      incident: incidentId,
      organization: orgId,
    });

    if (!comment) {
      return sendError(res, "Comment not found", 404);
    }

    // Only author, admin, or manager can delete
    const isAuthor = comment.author.toString() === req.user._id.toString();
    const isPrivileged = ["admin", "manager"].includes(req.userRole!);

    if (!isAuthor && !isPrivileged) {
      return sendError(res, "Not authorized to delete this comment", 403);
    }

    await Comment.deleteOne({ _id: commentId });

    return sendSuccess(res, null, "Comment deleted");
  } catch (error) {
    return sendError(res, "Failed to delete comment");
  }
};
