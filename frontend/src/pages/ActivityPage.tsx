import React, { useEffect, useState, useCallback } from "react";
import { Activity as ActivityIcon, ChevronLeft, ChevronRight } from "lucide-react";
import api from "../services/api";
import type { Activity } from "../types";
import { useOrg } from "../context/OrgContext";
import { formatDistanceToNow } from "date-fns";
import { Link } from "react-router-dom";

const ActivityPage: React.FC = () => {
  const { currentOrg } = useOrg();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchActivities = useCallback(async () => {
    if (!currentOrg) return;
    setLoading(true);
    try {
      const { data } = await api.get(`/activities?page=${page}&limit=20`, {
        headers: { "x-org-id": currentOrg._id }
      });
      if (data.success) {
        setActivities(data.data);
        setTotalPages(data.pagination.totalPages);
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

  const getActionColor = (action: string) => {
    if (action.includes("created")) return "bg-green-500";
    if (action.includes("closed") || action.includes("deleted")) return "bg-red-500";
    if (action.includes("changed")) return "bg-amber-500";
    if (action.includes("comment")) return "bg-blue-500";
    if (action.includes("invited")) return "bg-purple-500";
    return "bg-slate-500";
  };

  return (
    <div className="space-y-6 animate-fadeIn max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-white">Activity Timeline</h1>
        <p className="text-slate-400 text-sm mt-1">
          All actions across {currentOrg?.name}
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : activities.length === 0 ? (
        <div className="text-center py-16">
          <ActivityIcon className="w-12 h-12 text-slate-600 mx-auto mb-4" />
          <p className="text-slate-400">No activity yet</p>
        </div>
      ) : (
        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-4 top-0 bottom-0 w-px bg-border" />

          <div className="space-y-4">
            {activities.map((activity) => (
              <div key={activity._id} className="flex gap-4 animate-slideIn">
                {/* Timeline dot */}
                <div className={`w-2.5 h-2.5 rounded-full ${getActionColor(activity.action)} mt-2 shrink-0 relative z-10 ring-4 ring-surface ml-[11px]`} />

                {/* Content */}
                <div className="flex-1 glass rounded-xl p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm text-slate-200">{activity.details}</p>
                      {activity.incident && (
                        <Link
                          to={`/incidents/${activity.incident._id}`}
                          className="text-xs text-primary-400 hover:text-primary-300 mt-1 inline-block"
                        >
                          → {activity.incident.title}
                        </Link>
                      )}
                    </div>
                    <span className="text-xs text-slate-500 shrink-0">
                      {formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true })}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <div className="w-5 h-5 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white text-[10px] font-semibold">
                      {activity.user?.name?.charAt(0).toUpperCase() || "?"}
                    </div>
                    <span className="text-xs text-slate-400">{activity.user?.name}</span>
                    <span className="px-1.5 py-0.5 rounded bg-surface-lighter text-[10px] text-slate-500 uppercase tracking-wider">
                      {activity.action.replace(/_/g, " ")}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-slate-400">Page {page} of {totalPages}</p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="p-2 rounded-lg border border-border text-slate-400 hover:text-white hover:bg-surface-lighter disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="p-2 rounded-lg border border-border text-slate-400 hover:text-white hover:bg-surface-lighter disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ActivityPage;
