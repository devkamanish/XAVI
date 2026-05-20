import { Request, Response } from "express";
import Activity from "../models/Activity";
import { sendSuccess, sendError, sendPaginated } from "../utils/response";

// GET /api/activities - Get activity timeline for org
export const getActivities = async (req: Request, res: Response) => {
  try {
    const orgId = req.orgId!;
    const { page = "1", limit = "20", incidentId } = req.query;

    const pageNum = parseInt(page as string) || 1;
    const limitNum = Math.min(parseInt(limit as string) || 20, 50);
    const skip = (pageNum - 1) * limitNum;

    const filter: any = { organization: orgId };
    if (incidentId) {
      filter.incident = incidentId;
    }

    const [activities, total] = await Promise.all([
      Activity.find(filter)
        .populate("user", "name email")
        .populate("incident", "title")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum),
      Activity.countDocuments(filter),
    ]);

    return sendPaginated(res, activities, total, pageNum, limitNum);
  } catch (error) {
    return sendError(res, "Failed to fetch activities");
  }
};
