import { Request, Response } from "express";
import mongoose from "mongoose";
import Incident from "../models/Incident";
import Activity from "../models/Activity";
import { sendSuccess, sendError } from "../utils/response";

// GET /api/dashboard/stats - Dashboard analytics using aggregation pipelines
export const getDashboardStats = async (req: Request, res: Response) => {
  try {
    const orgId = new mongoose.Types.ObjectId(req.orgId!);

    // Run all aggregations in parallel for performance
    const [
      statusCounts,
      severityCounts,
      avgResolutionTime,
      mostActiveUsers,
      recentActivity,
      incidentTrend,
    ] = await Promise.all([
      // 1. Incidents grouped by status
      Incident.aggregate([
        { $match: { organization: orgId } },
        { $group: { _id: "$status", count: { $sum: 1 } } },
      ]),

      // 2. Incidents grouped by severity
      Incident.aggregate([
        { $match: { organization: orgId } },
        { $group: { _id: "$severity", count: { $sum: 1 } } },
      ]),

      // 3. Average resolution time (for resolved/closed incidents)
      Incident.aggregate([
        {
          $match: {
            organization: orgId,
            resolvedAt: { $ne: null },
          },
        },
        {
          $project: {
            resolutionTime: {
              $subtract: ["$resolvedAt", "$createdAt"],
            },
          },
        },
        {
          $group: {
            _id: null,
            avgTime: { $avg: "$resolutionTime" },
          },
        },
      ]),

      // 4. Most active users (by number of activities)
      Activity.aggregate([
        { $match: { organization: orgId } },
        { $group: { _id: "$user", activityCount: { $sum: 1 } } },
        { $sort: { activityCount: -1 } },
        { $limit: 5 },
        {
          $lookup: {
            from: "users",
            localField: "_id",
            foreignField: "_id",
            as: "userInfo",
          },
        },
        { $unwind: "$userInfo" },
        {
          $project: {
            _id: 1,
            activityCount: 1,
            name: "$userInfo.name",
            email: "$userInfo.email",
          },
        },
      ]),

      // 5. Recent activity (last 10)
      Activity.find({ organization: orgId })
        .populate("user", "name email")
        .populate("incident", "title")
        .sort({ createdAt: -1 })
        .limit(10),

      // 6. Incidents created per day (last 30 days)
      Incident.aggregate([
        {
          $match: {
            organization: orgId,
            createdAt: {
              $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
            },
          },
        },
        {
          $group: {
            _id: {
              $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
            },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),
    ]);

    // Format the data nicely
    const statusMap: Record<string, number> = {};
    statusCounts.forEach((s: any) => (statusMap[s._id] = s.count));

    const severityMap: Record<string, number> = {};
    severityCounts.forEach((s: any) => (severityMap[s._id] = s.count));

    const totalIncidents = Object.values(statusMap).reduce((sum, count) => sum + count, 0);

    // Average resolution time in hours
    const avgResTimeMs = avgResolutionTime[0]?.avgTime || 0;
    const avgResTimeHours = Math.round(avgResTimeMs / (1000 * 60 * 60) * 10) / 10;

    return sendSuccess(res, {
      overview: {
        total: totalIncidents,
        open: statusMap["open"] || 0,
        inProgress: statusMap["in_progress"] || 0,
        resolved: statusMap["resolved"] || 0,
        closed: statusMap["closed"] || 0,
      },
      bySeverity: {
        critical: severityMap["critical"] || 0,
        high: severityMap["high"] || 0,
        medium: severityMap["medium"] || 0,
        low: severityMap["low"] || 0,
      },
      avgResolutionTimeHours: avgResTimeHours,
      mostActiveUsers,
      recentActivity,
      incidentTrend,
    });
  } catch (error) {
    console.error("Dashboard error:", error);
    return sendError(res, "Failed to fetch dashboard data");
  }
};
