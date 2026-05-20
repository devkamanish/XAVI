import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Save, AlertTriangle, FileText, Tag, User, Calendar, Activity } from "lucide-react";
import api from "../services/api";
import { useOrg } from "../context/OrgContext";
import type { Incident, Severity, IncidentStatus } from "../types";
import toast from "react-hot-toast";

const IncidentFormPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { currentOrg, members, fetchMembers } = useOrg();
  const navigate = useNavigate();
  const isEditing = !!id;

  const [form, setForm] = useState({
    title: "",
    description: "",
    severity: "medium" as Severity,
    status: "open" as IncidentStatus,
    assignee: "",
    dueDate: "",
    tags: "",
  });
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(isEditing);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  useEffect(() => {
    if (!isEditing) return;
    const fetchIncident = async () => {
      try {
        const { data } = await api.get(`/incidents/${id}`);
        if (data.success) {
          const inc: Incident = data.data.incident;
          setForm({
            title: inc.title,
            description: inc.description || "",
            severity: inc.severity,
            status: inc.status,
            assignee: inc.assignee?._id || "",
            dueDate: inc.dueDate ? inc.dueDate.split("T")[0] : "",
            tags: inc.tags.join(", "),
          });
        }
      } catch {
        toast.error("Failed to load incident");
        navigate("/incidents");
      } finally {
        setFetching(false);
      }
    };
    fetchIncident();
  }, [id, isEditing, navigate]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) {
      toast.error("Title is required");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        title: form.title.trim(),
        description: form.description.trim(),
        severity: form.severity,
        status: form.status,
        assignee: form.assignee || null,
        dueDate: form.dueDate || null,
        tags: form.tags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
      };

      if (isEditing) {
        await api.patch(`/incidents/${id}`, payload);
        toast.success("Incident updated");
        navigate(`/incidents/${id}`);
      } else {
        const { data } = await api.post("/incidents", payload);
        toast.success("Incident created");
        navigate(`/incidents/${data.data.incident._id}`);
      }
    } catch (error: any) {
      const msg = error.response?.data?.message || "Failed to save incident";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="text-center space-y-4">
          <div className="w-10 h-10 border-2 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-slate-500 text-sm">Loading incident...</p>
        </div>
      </div>
    );
  }

  const inputClass = "input-base";
  const labelClass = "block text-sm font-semibold text-slate-300 mb-2";

  return (
    <div className="max-w-3xl space-y-8 animate-fadeIn">
      {}
      <div className="page-header">
        <div>
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-1.5 text-slate-500 hover:text-slate-200 transition-colors text-xs font-medium mb-1 group"
          >
            <ArrowLeft className="w-3.5 h-3.5 group-hover:text-primary-400 transition-colors" />
            Back
          </button>
          <h1 className="page-title">{isEditing ? "Edit Incident" : "Create Incident"}</h1>
          <p className="page-subtitle">
            {isEditing ? "Update incident details" : "Fill in the details below"}
          </p>
        </div>
      </div>

      <div className="card">
        <form onSubmit={handleSubmit} className="space-y-8">
          {}
          <div>
            <label htmlFor="title" className={labelClass}>
              <span className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-slate-500" />
                Title <span className="text-red-400 ml-0.5">*</span>
              </span>
            </label>
            <input
              id="title"
              name="title"
              type="text"
              value={form.title}
              onChange={handleChange}
              placeholder="Brief, clear description of the incident"
              className={inputClass}
              required
            />
          </div>

          {}
          <div>
            <label htmlFor="description" className={labelClass}>
              <span className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-slate-500" />
                Description
              </span>
            </label>
            <textarea
              id="description"
              name="description"
              value={form.description}
              onChange={handleChange}
              placeholder="Detailed description of the incident, steps to reproduce, impact..."
              rows={6}
              className={`${inputClass} resize-none leading-relaxed`}
            />
          </div>

          {}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label htmlFor="severity" className={labelClass}>
                <span className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-slate-500" />
                  Severity
                </span>
              </label>
              <select
                id="severity"
                name="severity"
                value={form.severity}
                onChange={handleChange}
                className={inputClass}
              >
                <option value="low">🟢 Low</option>
                <option value="medium">🟡 Medium</option>
                <option value="high">🟠 High</option>
                <option value="critical">🔴 Critical</option>
              </select>
            </div>

            <div>
              <label htmlFor="status" className={labelClass}>
                <span className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-slate-500" />
                  Status
                </span>
              </label>
              <select
                id="status"
                name="status"
                value={form.status}
                onChange={handleChange}
                className={inputClass}
              >
                <option value="open">Open</option>
                <option value="in_progress">In Progress</option>
                <option value="resolved">Resolved</option>
                <option value="closed">Closed</option>
              </select>
            </div>

            {}
            <div>
              <label htmlFor="assignee" className={labelClass}>
                <span className="flex items-center gap-2">
                  <User className="w-4 h-4 text-slate-500" />
                  Assignee
                </span>
              </label>
              <select
                id="assignee"
                name="assignee"
                value={form.assignee}
                onChange={handleChange}
                className={inputClass}
              >
                <option value="">Unassigned</option>
                {members.map((m) => (
                  <option key={m._id} value={m.user._id}>
                    {m.user.name} ({m.user.email})
                  </option>
                ))}
              </select>
            </div>

            {}
            <div>
              <label htmlFor="dueDate" className={labelClass}>
                <span className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-slate-500" />
                  Due Date
                </span>
              </label>
              <input
                id="dueDate"
                name="dueDate"
                type="date"
                value={form.dueDate}
                onChange={handleChange}
                className={inputClass}
              />
            </div>
          </div>

          {}
          <div>
            <label htmlFor="tags" className={labelClass}>
              <span className="flex items-center gap-2">
                <Tag className="w-4 h-4 text-slate-500" />
                Tags
                <span className="text-slate-600 text-xs font-normal">(comma separated)</span>
              </span>
            </label>
            <input
              id="tags"
              name="tags"
              type="text"
              value={form.tags}
              onChange={handleChange}
              placeholder="e.g., backend, api, urgent, database"
              className={inputClass}
            />
            {form.tags && (
              <div className="flex gap-2 flex-wrap mt-3">
                {form.tags.split(",").map((t) => t.trim()).filter(Boolean).map((tag) => (
                  <span key={tag} className="tag-chip text-xs">
                    <Tag className="w-3 h-3" />
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>

          {}
          <div className="flex justify-end gap-3 pt-6 border-t border-border/40 mt-2">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="btn btn-secondary"
            >
              Cancel
            </button>
            <button
              id="save-incident-btn"
              type="submit"
              disabled={loading}
              className="btn btn-primary"
            >
              <Save className="w-4 h-4" />
              {loading ? "Saving..." : isEditing ? "Update Incident" : "Create Incident"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default IncidentFormPage;
