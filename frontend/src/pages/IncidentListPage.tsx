import React, { useEffect, useState, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Plus,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  SortAsc,
  SortDesc,
  X,
} from "lucide-react";
import api from "../services/api";
import type { Incident, IncidentFilters, PaginatedResponse } from "../types";
import { useOrg } from "../context/OrgContext";
import { useSocket } from "../context/SocketContext";
import { useDebounce } from "../hooks/useDebounce";
import { format } from "date-fns";

const IncidentListPage: React.FC = () => {
  const { currentOrg, currentRole, members, fetchMembers } = useOrg();
  const socket = useSocket();
  const navigate = useNavigate();

  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 10, totalPages: 0 });
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);

  // Filter state
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [severityFilter, setSeverityFilter] = useState("");
  const [assigneeFilter, setAssigneeFilter] = useState("");
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const debouncedSearch = useDebounce(searchTerm, 400);

  const fetchIncidents = useCallback(async (page = 1) => {
    if (!currentOrg) return;
    setLoading(true);
    try {
      const params: Record<string, string> = {
        page: page.toString(),
        limit: "10",
        sortBy,
        sortOrder,
      };
      if (debouncedSearch) params.search = debouncedSearch;
      if (statusFilter) params.status = statusFilter;
      if (severityFilter) params.severity = severityFilter;
      if (assigneeFilter) params.assignee = assigneeFilter;
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;

      const { data } = await api.get<PaginatedResponse<Incident>>("/incidents", { 
        params,
        headers: { "x-org-id": currentOrg._id }
      });
      if (data.success) {
        setIncidents(data.data);
        setPagination(data.pagination);
      }
    } catch (error) {
      console.error("Failed to fetch incidents:", error);
    } finally {
      setLoading(false);
    }
  }, [currentOrg, debouncedSearch, statusFilter, severityFilter, assigneeFilter, sortBy, sortOrder, startDate, endDate]);

  useEffect(() => {
    fetchIncidents();
    if (currentOrg) {
      fetchMembers();
    }
  }, [fetchIncidents, currentOrg, fetchMembers]);

  // Real-time updates
  useEffect(() => {
    if (!socket) return;

    const handleCreated = () => fetchIncidents(pagination.page);
    const handleUpdated = () => fetchIncidents(pagination.page);

    socket.on("incident:created", handleCreated);
    socket.on("incident:updated", handleUpdated);

    return () => {
      socket.off("incident:created", handleCreated);
      socket.off("incident:updated", handleUpdated);
    };
  }, [socket, fetchIncidents, pagination.page]);

  const clearFilters = () => {
    setStatusFilter("");
    setSeverityFilter("");
    setAssigneeFilter("");
    setStartDate("");
    setEndDate("");
    setSearchTerm("");
  };

  const hasActiveFilters = statusFilter || severityFilter || assigneeFilter || startDate || endDate || searchTerm;

  return (
    <div className="space-y-5 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Incidents</h1>
          <p className="text-slate-400 text-sm mt-1">
            {pagination.total} total incident{pagination.total !== 1 ? "s" : ""}
          </p>
        </div>
        <Link
          to="/incidents/new"
          id="create-incident-btn"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-gradient-to-r from-primary-600 to-primary-500 text-white font-medium text-sm hover:from-primary-500 hover:to-primary-400 transition-all shadow-lg shadow-primary-500/20"
        >
          <Plus className="w-4 h-4" />
          New Incident
        </Link>
      </div>

      {/* Search & Filter Bar */}
      <div className="glass rounded-xl p-4 space-y-4">
        <div className="flex gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              id="search-incidents"
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search incidents by title..."
              className="w-full pl-10 pr-4 py-2 rounded-lg bg-surface border border-border text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary-500/40 text-sm"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${
              showFilters || hasActiveFilters
                ? "border-primary-500 text-primary-400 bg-primary-500/10"
                : "border-border text-slate-400 hover:text-slate-200 hover:bg-surface-lighter"
            }`}
          >
            <Filter className="w-4 h-4" />
            Filters
            {hasActiveFilters && (
              <span className="w-2 h-2 rounded-full bg-primary-400" />
            )}
          </button>
          <button
            onClick={() => setSortOrder(sortOrder === "desc" ? "asc" : "desc")}
            className="flex items-center gap-1 px-3 py-2 rounded-lg border border-border text-slate-400 hover:text-slate-200 hover:bg-surface-lighter text-sm transition-colors"
            title={`Sort ${sortOrder === "desc" ? "ascending" : "descending"}`}
          >
            {sortOrder === "desc" ? <SortDesc className="w-4 h-4" /> : <SortAsc className="w-4 h-4" />}
          </button>
        </div>

        {/* Expanded Filters */}
        {showFilters && (
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 pt-2 border-t border-border animate-fadeIn">
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-surface border border-border text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/40"
              >
                <option value="">All Statuses</option>
                <option value="open">Open</option>
                <option value="in_progress">In Progress</option>
                <option value="resolved">Resolved</option>
                <option value="closed">Closed</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Severity</label>
              <select
                value={severityFilter}
                onChange={(e) => setSeverityFilter(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-surface border border-border text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/40"
              >
                <option value="">All Severities</option>
                <option value="critical">Critical</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Assignee</label>
              <select
                value={assigneeFilter}
                onChange={(e) => setAssigneeFilter(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-surface border border-border text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/40"
              >
                <option value="">All Assignees</option>
                <option value="unassigned">Unassigned</option>
                {members.map((m) => (
                  <option key={m.user._id} value={m.user._id}>
                    {m.user.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-1 block">From Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-surface border border-border text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/40"
              />
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-1 block">To Date</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-surface border border-border text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/40"
              />
            </div>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="col-span-2 lg:col-span-5 flex items-center justify-center gap-1 text-sm text-red-400 hover:text-red-300 transition-colors"
              >
                <X className="w-3.5 h-3.5" />
                Clear all filters
              </button>
            )}
          </div>
        )}
      </div>

      {/* Incident List */}
      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : incidents.length === 0 ? (
        <div className="text-center py-16">
          <AlertTriangle className="w-12 h-12 text-slate-600 mx-auto mb-4" />
          <p className="text-slate-400">No incidents found</p>
          <p className="text-sm text-slate-500 mt-1">
            {hasActiveFilters ? "Try adjusting your filters" : "Create your first incident to get started"}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {incidents.map((incident) => (
            <div
              key={incident._id}
              onClick={() => navigate(`/incidents/${incident._id}`)}
              className="glass rounded-xl p-4 hover:border-primary-500/30 cursor-pointer transition-all hover:scale-[1.005] group"
            >
              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className={`badge badge-${incident.severity}`}>{incident.severity}</span>
                    <span className={`badge badge-${incident.status}`}>{incident.status.replace("_", " ")}</span>
                  </div>
                  <h3 className="text-white font-medium group-hover:text-primary-400 transition-colors truncate">
                    {incident.title}
                  </h3>
                  <p className="text-slate-500 text-xs mt-1">
                    by {incident.reporter?.name || "Unknown"} · {format(new Date(incident.createdAt), "MMM d, yyyy")}
                    {incident.assignee && ` · Assigned to ${incident.assignee.name}`}
                  </p>
                </div>
                {incident.tags.length > 0 && (
                  <div className="flex gap-1.5 flex-wrap sm:justify-end">
                    {incident.tags.slice(0, 3).map((tag) => (
                      <span key={tag} className="px-2 py-0.5 rounded-md bg-surface-lighter text-slate-400 text-xs">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-slate-400">
            Page {pagination.page} of {pagination.totalPages}
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => fetchIncidents(pagination.page - 1)}
              disabled={pagination.page <= 1}
              className="p-2 rounded-lg border border-border text-slate-400 hover:text-white hover:bg-surface-lighter disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => fetchIncidents(pagination.page + 1)}
              disabled={pagination.page >= pagination.totalPages}
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

export default IncidentListPage;
