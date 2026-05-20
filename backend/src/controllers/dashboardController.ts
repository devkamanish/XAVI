import { Request, Response } from "express";
import mongoose from "mongoose";
import Incident from "../models/Incident";
import Activity from "../models/Activity";
import { sendSuccess, sendError } from "../utils/response";


export const getDashboardStats = async (req: Request, res: Response) => {
  try {
    const orgId = new mongoose.Types.ObjectId(req.orgId!);

    
    const [
      statusCounts,
      severityCounts,
      avgResolutionTime,
      mostActiveUsers,
      recentActivity,
      incidentTrend,
    ] = await Promise.all([
      
      Incident.aggregate([
        { $match: { organization: orgId } },
        { $group: { _id: "$status", count: { $sum: 1 } } },
      ]),

      
      Incident.aggregate([
        { $match: { organization: orgId } },
        { $group: { _id: "$severity", count: { $sum: 1 } } },
      ]),

      
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

      
      Activity.find({ organization: orgId })
        .populate("user", "name email")
        .populate("incident", "title")
        .sort({ createdAt: -1 })
        .limit(10),

      
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

    
    const statusMap: Record<string, number> = {};
    statusCounts.forEach((s: any) => (statusMap[s._id] = s.count));

    const severityMap: Record<string, number> = {};
    severityCounts.forEach((s: any) => (severityMap[s._id] = s.count));

    const totalIncidents = Object.values(statusMap).reduce((sum, count) => sum + count, 0);

    
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
