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
  ArrowRight,
} from "lucide-react";
import api from "../services/api";
import type { DashboardStats } from "../types";
import { useOrg } from "../context/OrgContext";
import { formatDistanceToNow } from "date-fns";
import { Link } from "react-router-dom";

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
          headers: { "x-org-id": currentOrg._id },
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
        <div className="text-center space-y-4">
          <div className="w-10 h-10 border-2 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-slate-500 text-sm">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="text-center py-24">
        <div className="w-20 h-20 rounded-2xl bg-surface-light border border-border flex items-center justify-center mx-auto mb-6">
          <BarChart3 className="w-10 h-10 text-slate-600" />
        </div>
        <p className="text-slate-300 text-xl font-semibold">No data yet</p>
        <p className="text-slate-500 text-sm mt-2 mb-6">Create some incidents to see analytics</p>
        <Link to="/incidents/new" className="btn btn-primary btn-sm">
          Create first incident
        </Link>
      </div>
    );
  }

  const overviewCards = [
    {
      label: "Total Incidents",
      value: stats.overview.total,
      icon: AlertTriangle,
      gradient: "from-blue-500/20 to-blue-600/5",
      iconBg: "bg-blue-500/15",
      iconColor: "text-blue-400",
      accent: "border-b-blue-500/40",
    },
    {
      label: "Open",
      value: stats.overview.open,
      icon: Clock,
      gradient: "from-amber-500/20 to-amber-600/5",
      iconBg: "bg-amber-500/15",
      iconColor: "text-amber-400",
      accent: "border-b-amber-500/40",
    },
    {
      label: "In Progress",
      value: stats.overview.inProgress,
      icon: TrendingUp,
      gradient: "from-purple-500/20 to-purple-600/5",
      iconBg: "bg-purple-500/15",
      iconColor: "text-purple-400",
      accent: "border-b-purple-500/40",
    },
    {
      label: "Resolved",
      value: stats.overview.resolved,
      icon: CheckCircle2,
      gradient: "from-green-500/20 to-green-600/5",
      iconBg: "bg-green-500/15",
      iconColor: "text-green-400",
      accent: "border-b-green-500/40",
    },
    {
      label: "Closed",
      value: stats.overview.closed,
      icon: XCircle,
      gradient: "from-slate-500/20 to-slate-600/5",
      iconBg: "bg-slate-500/15",
      iconColor: "text-slate-400",
      accent: "border-b-slate-500/40",
    },
  ];

  const severityData = [
    { label: "Critical", value: stats.bySeverity.critical, barColor: "bg-red-500", trackColor: "bg-red-500/10" },
    { label: "High", value: stats.bySeverity.high, barColor: "bg-orange-500", trackColor: "bg-orange-500/10" },
    { label: "Medium", value: stats.bySeverity.medium, barColor: "bg-yellow-500", trackColor: "bg-yellow-500/10" },
    { label: "Low", value: stats.bySeverity.low, barColor: "bg-green-500", trackColor: "bg-green-500/10" },
  ];

  const maxSeverity = Math.max(...severityData.map((s) => s.value), 1);
  const totalSeverity = severityData.reduce((a, b) => a + b.value, 0);

  return (
    <div className="space-y-8 animate-fadeIn">
      {}
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">{currentOrg?.name} — Overview &amp; Analytics</p>
        </div>
        <Link to="/incidents/new" className="btn btn-primary btn-sm shrink-0">
          <AlertTriangle className="w-4 h-4" />
          New Incident
        </Link>
      </div>

      {}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-5">
        {overviewCards.map((card, i) => (
          <div
            key={card.label}
            className={`card stat-card bg-gradient-to-b ${card.gradient} border-b-2 ${card.accent} hover:scale-[1.03] hover:-translate-y-0.5`}
            style={{ animationDelay: `${i * 60}ms` }}
          >
            <div className={`w-11 h-11 rounded-xl ${card.iconBg} flex items-center justify-center mb-4`}>
              <card.icon className={`w-5 h-5 ${card.iconColor}`} />
            </div>
            <p className="text-4xl font-black text-white leading-none">{card.value}</p>
            <p className="text-sm text-slate-400 mt-2 font-medium">{card.label}</p>
          </div>
        ))}
      </div>

      {}
      <div className="grid lg:grid-cols-2 gap-8">
        {}
        <div className="card">
          <div className="flex items-center justify-between mb-6">
            <h3 className="section-title">
              <BarChart3 className="w-4 h-4 text-primary-400" />
              Incidents by Severity
            </h3>
            <span className="text-xs text-slate-500 font-medium">{totalSeverity} total</span>
          </div>
          <div className="space-y-5">
            {severityData.map((item) => {
              const pct = totalSeverity > 0 ? Math.round((item.value / totalSeverity) * 100) : 0;
              return (
                <div key={item.label}>
                  <div className="flex justify-between items-center mb-2">
                    <div className="flex items-center gap-2">
                      <span className={`w-2.5 h-2.5 rounded-full ${item.barColor} inline-block`} />
                      <span className="text-sm font-medium text-slate-300">{item.label}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-white">{item.value}</span>
                      <span className="text-xs text-slate-500 w-8 text-right">{pct}%</span>
                    </div>
                  </div>
                  <div className={`h-2.5 rounded-full ${item.trackColor} overflow-hidden`}>
                    <div
                      className={`h-full rounded-full ${item.barColor} transition-all duration-700 ease-out`}
                      style={{ width: `${(item.value / maxSeverity) * 100}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {}
        <div className="space-y-8">
          {}
          <div className="card">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="section-title mb-4">
                  <Clock className="w-4 h-4 text-primary-400" />
                  Avg Resolution Time
                </h3>
                <div className="flex items-baseline gap-2 mt-3">
                  <span className="text-5xl font-black text-white leading-none">
                    {stats.avgResolutionTimeHours || "—"}
                  </span>
                  <span className="text-slate-400 text-base font-medium">hours</span>
                </div>
                <p className="text-slate-500 text-xs mt-2">Across all resolved incidents</p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-primary-500/10 flex items-center justify-center">
                <Clock className="w-6 h-6 text-primary-400" />
              </div>
            </div>
          </div>

          {}
          <div className="card">
            <h3 className="section-title mb-5">
              <Users className="w-4 h-4 text-primary-400" />
              Most Active Users
            </h3>
            {stats.mostActiveUsers.length === 0 ? (
              <div className="text-center py-4">
                <p className="text-slate-500 text-sm">No activity recorded yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {stats.mostActiveUsers.map((u, i) => (
                  <div key={u._id} className="flex items-center gap-3 py-1">
                    <span className="text-xs font-bold text-slate-600 w-4 text-center shrink-0">
                      {i + 1}
                    </span>
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white text-sm font-bold shrink-0 shadow-sm">
                      {u.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-200 truncate">{u.name}</p>
                    </div>
                    <div className="shrink-0 text-right">
                      <span className="text-sm font-bold text-white">{u.activityCount}</span>
                      <span className="text-xs text-slate-500 ml-1">actions</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {}
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <h3 className="section-title">
            <Activity className="w-4 h-4 text-primary-400" />
            Recent Activity
          </h3>
          <Link
            to="/activity"
            className="flex items-center gap-1.5 text-xs font-semibold text-primary-400 hover:text-primary-300 transition-colors"
          >
            View all
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
        {stats.recentActivity.length === 0 ? (
          <div className="text-center py-8">
            <Activity className="w-10 h-10 text-slate-700 mx-auto mb-3" />
            <p className="text-slate-500 text-sm">No recent activity</p>
          </div>
        ) : (
          <div className="divide-y divide-border/30">
            {stats.recentActivity.map((activity) => (
              <div key={activity._id} className="flex items-start gap-4 py-4 first:pt-0 last:pb-0">
                <div className="w-8 h-8 rounded-full bg-primary-500/10 border border-primary-500/20 flex items-center justify-center shrink-0 mt-0.5">
                  <span className="w-2 h-2 rounded-full bg-primary-400 inline-block" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-slate-200 font-medium">{activity.details}</p>
                  {activity.incident && (
                    <p className="text-slate-500 text-xs mt-0.5 truncate">
                      on &ldquo;{activity.incident.title}&rdquo;
                    </p>
                  )}
                </div>
                <span className="text-xs text-slate-500 shrink-0 mt-0.5">
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
