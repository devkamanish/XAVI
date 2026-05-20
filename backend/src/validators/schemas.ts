import { z } from "zod";

export const signupSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(50),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters").max(100),
});

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export const createOrgSchema = z.object({
  name: z.string().min(2, "Organization name must be at least 2 characters").max(100),
  description: z.string().max(500).optional(),
});

export const inviteUserSchema = z.object({
  email: z.string().email("Invalid email address"),
  role: z.enum(["admin", "manager", "developer"]).optional().default("developer"),
});

export const createIncidentSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters").max(200),
  description: z.string().max(5000).optional().default(""),
  severity: z.enum(["critical", "high", "medium", "low"]).optional().default("medium"),
  status: z.enum(["open", "in_progress", "resolved", "closed"]).optional().default("open"),
  tags: z.array(z.string()).optional().default([]),
  assignee: z.string().nullable().optional().default(null),
  dueDate: z.string().nullable().optional().default(null),
});

export const updateIncidentSchema = z.object({
  title: z.string().min(3).max(200).optional(),
  description: z.string().max(5000).optional(),
  severity: z.enum(["critical", "high", "medium", "low"]).optional(),
  status: z.enum(["open", "in_progress", "resolved", "closed"]).optional(),
  tags: z.array(z.string()).optional(),
  assignee: z.string().nullable().optional(),
  dueDate: z.string().nullable().optional(),
});

export const createCommentSchema = z.object({
  content: z.string().min(1, "Comment cannot be empty").max(2000),
});

export const incidentQuerySchema = z.object({
  page: z.string().optional().default("1"),
  limit: z.string().optional().default("10"),
  status: z.string().optional(),
  severity: z.string().optional(),
  assignee: z.string().optional(),
  search: z.string().optional(),
  sortBy: z.string().optional().default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).optional().default("desc"),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});
