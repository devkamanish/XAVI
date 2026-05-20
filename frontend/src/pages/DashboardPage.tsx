import React, { useEffect, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  TrendingUp,
  Users,
  BarChart3,
  Activity,
  XCircle,
} from "lucide-react";
import api from "../services/api";
import type { DashboardStats } from "../types";
import { useOrg } from "../context/OrgContext";
import { formatDistanceToNow } from "date-fns";

const DashboardPage: React.FC = () => {
  const { currentOrg } = useOrg();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentOrg) return;
    const fetchStats = async () => {
      setLoading(true);
      try {
        const { data } = await api.get("/dashboard/stats", {
          headers: { "x-org-id": currentOrg._id }
        });
        if (data.success) setStats(data.data);
      } catch (error) {
        console.error("Failed to fetch dashboard:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, [currentOrg]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="text-center text-slate-400 py-20">
        <BarChart3 className="w-12 h-12 mx-auto mb-4 opacity-50" />
        <p>No dashboard data available yet</p>
        <p className="text-sm mt-1">Create some incidents to see analytics</p>
      </div>
    );
  }

  const overviewCards = [
    { label: "Total Incidents", value: stats.overview.total, icon: AlertTriangle, color: "from-blue-500 to-blue-600", bg: "bg-blue-500/10" },
    { label: "Open", value: stats.overview.open, icon: Clock, color: "from-amber-500 to-amber-600", bg: "bg-amber-500/10" },
    { label: "In Progress", value: stats.overview.inProgress, icon: TrendingUp, color: "from-purple-500 to-purple-600", bg: "bg-purple-500/10" },
    { label: "Resolved", value: stats.overview.resolved, icon: CheckCircle2, color: "from-green-500 to-green-600", bg: "bg-green-500/10" },
    { label: "Closed", value: stats.overview.closed, icon: XCircle, color: "from-slate-500 to-slate-600", bg: "bg-slate-500/10" },
  ];

  const severityData = [
    { label: "Critical", value: stats.bySeverity.critical, color: "bg-red-500", barColor: "bg-red-500/20" },
    { label: "High", value: stats.bySeverity.high, color: "bg-orange-500", barColor: "bg-orange-500/20" },
    { label: "Medium", value: stats.bySeverity.medium, color: "bg-yellow-500", barColor: "bg-yellow-500/20" },
    { label: "Low", value: stats.bySeverity.low, color: "bg-green-500", barColor: "bg-green-500/20" },
  ];

  const maxSeverity = Math.max(...severityData.map((s) => s.value), 1);

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <p className="text-slate-400 text-sm mt-1">{currentOrg?.name} — Overview & Analytics</p>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {overviewCards.map((card) => (
          <div key={card.label} className="glass rounded-xl p-4 hover:scale-[1.02] transition-transform">
            <div className={`w-9 h-9 rounded-lg ${card.bg} flex items-center justify-center mb-3`}>
              <card.icon className="w-4.5 h-4.5 text-white/80" />
            </div>
            <p className="text-2xl font-bold text-white">{card.value}</p>
            <p className="text-xs text-slate-400 mt-0.5">{card.label}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Severity Breakdown */}
        <div className="glass rounded-xl p-5">
          <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-primary-400" />
            Incidents by Severity
          </h3>
          <div className="space-y-3">
            {severityData.map((item) => (
              <div key={item.label}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-slate-300">{item.label}</span>
                  <span className="text-slate-400 font-medium">{item.value}</span>
                </div>
                <div className={`h-2 rounded-full ${item.barColor} overflow-hidden`}>
                  <div
                    className={`h-full rounded-full ${item.color} transition-all duration-700`}
                    style={{ width: `${(item.value / maxSeverity) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Avg Resolution Time & Active Users */}
        <div className="space-y-6">
          {/* Avg Resolution Time */}
          <div className="glass rounded-xl p-5">
            <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
              <Clock className="w-4 h-4 text-primary-400" />
              Average Resolution Time
            </h3>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-white">
                {stats.avgResolutionTimeHours || "—"}
              </span>
              <span className="text-slate-400 text-sm">hours</span>
            </div>
          </div>

          {/* Most Active Users */}
          <div className="glass rounded-xl p-5">
            <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
              <Users className="w-4 h-4 text-primary-400" />
              Most Active Users
            </h3>
            {stats.mostActiveUsers.length === 0 ? (
              <p className="text-slate-500 text-sm">No activity yet</p>
            ) : (
              <div className="space-y-2.5">
                {stats.mostActiveUsers.map((u, i) => (
                  <div key={u._id} className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white text-xs font-semibold">
                      {u.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-slate-200 truncate">{u.name}</p>
                    </div>
                    <span className="text-xs text-slate-400 font-medium">{u.activityCount} actions</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="glass rounded-xl p-5">
        <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
          <Activity className="w-4 h-4 text-primary-400" />
          Recent Activity
        </h3>
        {stats.recentActivity.length === 0 ? (
          <p className="text-slate-500 text-sm">No recent activity</p>
        ) : (
          <div className="space-y-3">
            {stats.recentActivity.map((activity) => (
              <div key={activity._id} className="flex items-start gap-3 text-sm">
                <div className="w-1.5 h-1.5 rounded-full bg-primary-400 mt-2 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-slate-300">{activity.details}</p>
                  {activity.incident && (
                    <p className="text-slate-500 text-xs truncate">
                      on "{activity.incident.title}"
                    </p>
                  )}
                </div>
                <span className="text-xs text-slate-500 shrink-0">
                  {formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true })}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardPage;
