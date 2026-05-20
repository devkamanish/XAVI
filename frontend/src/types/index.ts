
export interface User {
  _id: string;
  name: string;
  email: string;
  createdAt: string;
  updatedAt: string;
}


export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}


export interface Organization {
  _id: string;
  name: string;
  slug: string;
  description: string;
  owner: User | string;
  createdAt: string;
  updatedAt: string;
}

export type Role = "admin" | "manager" | "developer";

export interface Membership {
  _id: string;
  user: User;
  organization: Organization | string;
  role: Role;
  status: "active" | "invited";
  createdAt: string;
}

export interface OrgWithRole {
  organization: Organization;
  role: Role;
}


export type Severity = "critical" | "high" | "medium" | "low";
export type IncidentStatus = "open" | "in_progress" | "resolved" | "closed";

export interface Incident {
  _id: string;
  title: string;
  description: string;
  severity: Severity;
  status: IncidentStatus;
  tags: string[];
  assignee: User | null;
  reporter: User;
  organization: string;
  dueDate: string | null;
  attachments: string[];
  resolvedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface IncidentFilters {
  page: number;
  limit: number;
  status?: string;
  severity?: string;
  assignee?: string;
  search?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  startDate?: string;
  endDate?: string;
}


export interface Comment {
  _id: string;
  content: string;
  author: User;
  incident: string;
  mentions: string[];
  createdAt: string;
  updatedAt: string;
}


export interface Activity {
  _id: string;
  action: string;
  details: string;
  user: User;
  incident: { _id: string; title: string } | null;
  organization: string;
  metadata: Record<string, any>;
  createdAt: string;
}


export interface DashboardStats {
  overview: {
    total: number;
    open: number;
    inProgress: number;
    resolved: number;
    closed: number;
  };
  bySeverity: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
  avgResolutionTimeHours: number;
  mostActiveUsers: {
    _id: string;
    name: string;
    email: string;
    activityCount: number;
  }[];
  recentActivity: Activity[];
  incidentTrend: { _id: string; count: number }[];
}


export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface PaginatedResponse<T> {
  success: boolean;
  message: string;
  data: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}
