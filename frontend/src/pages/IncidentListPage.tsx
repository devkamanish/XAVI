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
  ArrowRight,
  Calendar,
  User,
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

  
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [severityFilter, setSeverityFilter] = useState("");
  const [assigneeFilter, setAssigneeFilter] = useState("");
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const debouncedSearch = useDebounce(searchTerm, 400);

  const fetchIncidents = useCallback(
    async (page = 1) => {
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
          headers: { "x-org-id": currentOrg._id },
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
    },
    [currentOrg, debouncedSearch, statusFilter, severityFilter, assigneeFilter, sortBy, sortOrder, startDate, endDate]
  );

  useEffect(() => {
    fetchIncidents();
    if (currentOrg) fetchMembers();
  }, [fetchIncidents, currentOrg, fetchMembers]);

  
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
  const activeFilterCount = [statusFilter, severityFilter, assigneeFilter, startDate, endDate, searchTerm].filter(Boolean).length;

  const selectClass = "w-full px-4 py-3 rounded-xl bg-surface border border-border/60 text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500/50 transition-all";

  return (
    <div className="space-y-6 animate-fadeIn">
      {}
      <div className="page-header">
        <div>
          <h1 className="page-title">Incidents</h1>
          <p className="page-subtitle">
            {pagination.total} total incident{pagination.total !== 1 ? "s" : ""}
          </p>
        </div>
        <Link
          to="/incidents/new"
          id="create-incident-btn"
          className="btn btn-primary btn-sm shrink-0"
        >
          <Plus className="w-4 h-4" />
          New Incident
        </Link>
      </div>

      {}
      <div className="card !p-5 space-y-4">
        <div className="flex gap-3">
          {}
          <div className="flex-1 relative">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
              <Search className="w-5 h-5 text-slate-500" />
            </div>
            <input
              id="search-incidents"
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search incidents by title..."
              className="input-base input-with-icon"
            />
          </div>

          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`btn btn-secondary btn-sm !gap-2 !py-3 !px-4 ${showFilters ? "bg-surface-lighter" : ""}`}
          >
            <Filter className="w-4 h-4" />
            <span>Filters</span>
            {activeFilterCount > 0 && (
              <span className="w-5 h-5 rounded-full bg-primary-500 text-white text-[10px] flex items-center justify-center font-bold">
                {activeFilterCount}
              </span>
            )}
          </button>

          {}
          <button
            onClick={() => setSortOrder(sortOrder === "desc" ? "asc" : "desc")}
            title={`Sort ${sortOrder === "desc" ? "ascending" : "descending"}`}
            className="flex items-center gap-2 px-4 py-3 rounded-xl border border-border/60 text-slate-400 hover:text-slate-200 hover:bg-surface-lighter/50 text-sm transition-all duration-200"
          >
            {sortOrder === "desc" ? <SortDesc className="w-4 h-4" /> : <SortAsc className="w-4 h-4" />}
          </button>
        </div>

        {}
        {showFilters && (
          <div className="pt-4 border-t border-border/30 animate-fadeIn">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Status</label>
                <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className={selectClass}>
                  <option value="">All Statuses</option>
                  <option value="open">Open</option>
                  <option value="in_progress">In Progress</option>
                  <option value="resolved">Resolved</option>
                  <option value="closed">Closed</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Severity</label>
                <select value={severityFilter} onChange={(e) => setSeverityFilter(e.target.value)} className={selectClass}>
                  <option value="">All Severities</option>
                  <option value="critical">Critical</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Assignee</label>
                <select value={assigneeFilter} onChange={(e) => setAssigneeFilter(e.target.value)} className={selectClass}>
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
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">From Date</label>
                <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className={selectClass} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">To Date</label>
                <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className={selectClass} />
              </div>
            </div>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="mt-4 flex items-center gap-2 text-sm text-red-400 hover:text-red-300 font-medium transition-colors"
              >
                <X className="w-4 h-4" />
                Clear all filters
              </button>
            )}
          </div>
        )}
      </div>

      {}
      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : incidents.length === 0 ? (
        <div className="card text-center py-20">
          <div className="w-16 h-16 rounded-2xl bg-surface-light border border-border flex items-center justify-center mx-auto mb-5">
            <AlertTriangle className="w-8 h-8 text-slate-600" />
          </div>
          <p className="text-slate-300 text-lg font-semibold">No incidents found</p>
          <p className="text-slate-500 text-sm mt-2 mb-6">
            {hasActiveFilters ? "Try adjusting or clearing your filters" : "Create your first incident to get started"}
          </p>
          {!hasActiveFilters && (
            <Link to="/incidents/new" className="btn btn-primary btn-sm mx-auto">
              <Plus className="w-4 h-4" />
              Create incident
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {incidents.map((incident, i) => (
            <div
              key={incident._id}
              onClick={() => navigate(`/incidents/${incident._id}`)}
              className="card !p-0 hover:border-primary-500/30 cursor-pointer group overflow-hidden"
              style={{ animationDelay: `${i * 40}ms` }}
            >
              <div className="p-6 sm:py-6 sm:px-8">
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  <div className="flex-1 min-w-0">
                    {}
                    <div className="flex items-center gap-2 mb-3">
                      <span className={`badge badge-${incident.severity}`}>{incident.severity}</span>
                      <span className={`badge badge-${incident.status}`}>{incident.status.replace("_", " ")}</span>
                    </div>

                    {}
                    <h3 className="text-white font-semibold text-base group-hover:text-primary-400 transition-colors leading-snug truncate">
                      {incident.title}
                    </h3>

                    {}
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2">
                      <span className="flex items-center gap-1.5 text-slate-500 text-xs">
                        <User className="w-3.5 h-3.5" />
                        {incident.reporter?.name || "Unknown"}
                      </span>
                      <span className="flex items-center gap-1.5 text-slate-500 text-xs">
                        <Calendar className="w-3.5 h-3.5" />
                        {format(new Date(incident.createdAt), "MMM d, yyyy")}
                      </span>
                      {incident.assignee && (
                        <span className="flex items-center gap-1.5 text-slate-500 text-xs">
                          <User className="w-3.5 h-3.5 text-primary-500" />
                          <span className="text-primary-400">{incident.assignee.name}</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {}
                  <div className="flex items-center gap-3 shrink-0">
                    {incident.tags.length > 0 && (
                      <div className="hidden sm:flex gap-2 flex-wrap justify-end">
                        {incident.tags.slice(0, 3).map((tag) => (
                          <span key={tag} className="tag-chip">
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-600 group-hover:text-primary-400 group-hover:bg-primary-500/10 transition-all duration-200">
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between pt-2">
          <p className="text-sm text-slate-500">
            Page <span className="font-semibold text-slate-300">{pagination.page}</span> of{" "}
            <span className="font-semibold text-slate-300">{pagination.totalPages}</span>
            <span className="text-slate-600 ml-2">({pagination.total} total)</span>
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => fetchIncidents(pagination.page - 1)}
              disabled={pagination.page <= 1}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-border/60 text-slate-400 hover:text-white hover:bg-surface-lighter disabled:opacity-30 disabled:cursor-not-allowed transition-all text-sm font-medium"
            >
              <ChevronLeft className="w-4 h-4" />
              Previous
            </button>
            <button
              onClick={() => fetchIncidents(pagination.page + 1)}
              disabled={pagination.page >= pagination.totalPages}
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

export default IncidentListPage;
