import React, { useEffect, useState, useCallback } from "react";
import {
  Activity as ActivityIcon,
  ChevronLeft,
  ChevronRight,
  Plus,
  MessageSquare,
  UserPlus,
  Edit,
  Trash2,
  RefreshCw,
  AlertTriangle,
} from "lucide-react";
import api from "../services/api";
import type { Activity } from "../types";
import { useOrg } from "../context/OrgContext";
import { formatDistanceToNow, format } from "date-fns";
import { Link } from "react-router-dom";

const getActionMeta = (action: string): { color: string; bg: string; icon: React.ElementType } => {
  if (action.includes("created")) return { color: "text-green-400", bg: "bg-green-500/15 border-green-500/30", icon: Plus };
  if (action.includes("deleted")) return { color: "text-red-400", bg: "bg-red-500/15 border-red-500/30", icon: Trash2 };
  if (action.includes("comment")) return { color: "text-blue-400", bg: "bg-blue-500/15 border-blue-500/30", icon: MessageSquare };
  if (action.includes("invited")) return { color: "text-purple-400", bg: "bg-purple-500/15 border-purple-500/30", icon: UserPlus };
  if (action.includes("changed") || action.includes("updated")) return { color: "text-amber-400", bg: "bg-amber-500/15 border-amber-500/30", icon: Edit };
  if (action.includes("closed") || action.includes("resolved")) return { color: "text-slate-400", bg: "bg-slate-500/15 border-slate-500/30", icon: RefreshCw };
  return { color: "text-primary-400", bg: "bg-primary-500/15 border-primary-500/30", icon: ActivityIcon };
};

const ActivityPage: React.FC = () => {
  const { currentOrg } = useOrg();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const fetchActivities = useCallback(async () => {
    if (!currentOrg) return;
    setLoading(true);
    try {
      const { data } = await api.get(`/activities?page=${page}&limit=20`, {
        headers: { "x-org-id": currentOrg._id },
      });
      if (data.success) {
        setActivities(data.data);
        setTotalPages(data.pagination.totalPages);
        setTotal(data.pagination.total || data.data.length);
      }
    } catch (error) {
      console.error("Failed to fetch activities:", error);
    } finally {
      setLoading(false);
    }
  }, [currentOrg, page]);

  useEffect(() => {
    fetchActivities();
  }, [fetchActivities]);

  return (
    <div className="space-y-8 animate-fadeIn max-w-4xl">
      {}
      <div className="page-header">
        <div>
          <h1 className="page-title">Activity Timeline</h1>
          <p className="page-subtitle">All actions across {currentOrg?.name}</p>
        </div>
        {!loading && total > 0 && (
          <span className="text-xs text-slate-500 font-semibold bg-surface-light border border-border/50 px-3 py-1.5 rounded-lg shrink-0">
            {total} events
          </span>
        )}
      </div>

      {}
      {loading ? (
        <div className="flex items-center justify-center py-24">
          <div className="text-center space-y-4">
            <div className="w-10 h-10 border-2 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-slate-500 text-sm">Loading activity...</p>
          </div>
        </div>
      ) : activities.length === 0 ? (
        <div className="card text-center py-20">
          <div className="w-16 h-16 rounded-2xl bg-surface-light border border-border flex items-center justify-center mx-auto mb-5">
            <ActivityIcon className="w-8 h-8 text-slate-600" />
          </div>
          <p className="text-slate-300 text-lg font-semibold">No activity yet</p>
          <p className="text-slate-500 text-sm mt-2">Actions and events will appear here</p>
        </div>
      ) : (
        <div className="relative">
          {}
          <div className="absolute left-5 top-5 bottom-5 w-px bg-gradient-to-b from-primary-500/20 via-border/40 to-transparent" />

          <div className="space-y-4">
            {activities.map((activity, i) => {
              const meta = getActionMeta(activity.action);
              const Icon = meta.icon;
              return (
                <div
                  key={activity._id}
                  className="flex gap-6 animate-slideIn group"
                  style={{ animationDelay: `${i * 30}ms` }}
                >
                  {}
                  <div
                    className={`w-10 h-10 rounded-full border flex items-center justify-center shrink-0 relative z-10 ${meta.bg} transition-transform group-hover:scale-110 duration-200`}
                  >
                    <Icon className={`w-4 h-4 ${meta.color}`} />
                  </div>

                  {}
                  <div className="flex-1 card !p-6 hover:border-border/60 mb-3">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-200 leading-snug">{activity.details}</p>

                        {activity.incident && (
                          <Link
                            to={`/incidents/${activity.incident._id}`}
                            className="inline-flex items-center gap-1.5 text-xs text-primary-400 hover:text-primary-300 mt-2 font-medium transition-colors"
                          >
                            <AlertTriangle className="w-3 h-3" />
                            {activity.incident.title}
                          </Link>
                        )}

                        {}
                        <div className="flex items-center gap-2 mt-3">
                          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white text-[10px] font-bold shrink-0">
                            {activity.user?.name?.charAt(0).toUpperCase() || "?"}
                          </div>
                          <span className="text-xs font-semibold text-slate-400">{activity.user?.name}</span>
                          <span className="px-2 py-0.5 rounded-md bg-surface-lighter text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                            {activity.action.replace(/_/g, " ")}
                          </span>
                        </div>
                      </div>

                      {}
                      <div className="text-right shrink-0">
                        <p className="text-xs font-medium text-slate-500">
                          {formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true })}
                        </p>
                        <p className="text-[10px] text-slate-600 mt-0.5">
                          {format(new Date(activity.createdAt), "MMM d, HH:mm")}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-2">
          <p className="text-sm text-slate-500">
            Page <span className="font-semibold text-slate-300">{page}</span> of{" "}
            <span className="font-semibold text-slate-300">{totalPages}</span>
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-border/60 text-slate-400 hover:text-white hover:bg-surface-lighter disabled:opacity-30 disabled:cursor-not-allowed transition-all text-sm font-medium"
            >
              <ChevronLeft className="w-4 h-4" />
              Previous
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-border/60 text-slate-400 hover:text-white hover:bg-surface-lighter disabled:opacity-30 disabled:cursor-not-allowed transition-all text-sm font-medium"
            >
              Next
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ActivityPage;
