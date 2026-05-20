import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Save } from "lucide-react";
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

  // Fetch members for assignee dropdown
  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  // Fetch existing incident if editing
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
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
      <div className="flex justify-center py-20">
        <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fadeIn">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm"
      >
        <ArrowLeft className="w-4 h-4" />
        Back
      </button>

      <div className="glass rounded-xl p-6">
        <h1 className="text-xl font-bold text-white mb-6">
          {isEditing ? "Edit Incident" : "Create New Incident"}
        </h1>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Title */}
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-slate-300 mb-1.5">
              Title <span className="text-red-400">*</span>
            </label>
            <input
              id="title"
              name="title"
              type="text"
              value={form.title}
              onChange={handleChange}
              placeholder="Brief description of the incident"
              className="w-full px-4 py-2.5 rounded-lg bg-surface border border-border text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary-500/40 text-sm"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-slate-300 mb-1.5">
              Description
            </label>
            <textarea
              id="description"
              name="description"
              value={form.description}
              onChange={handleChange}
              placeholder="Detailed description of the incident..."
              rows={5}
              className="w-full px-4 py-2.5 rounded-lg bg-surface border border-border text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary-500/40 text-sm resize-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {/* Severity */}
            <div>
              <label htmlFor="severity" className="block text-sm font-medium text-slate-300 mb-1.5">
                Severity
              </label>
              <select
                id="severity"
                name="severity"
                value={form.severity}
                onChange={handleChange}
                className="w-full px-4 py-2.5 rounded-lg bg-surface border border-border text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-500/40 text-sm"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>

            {/* Status */}
            <div>
              <label htmlFor="status" className="block text-sm font-medium text-slate-300 mb-1.5">
                Status
              </label>
              <select
                id="status"
                name="status"
                value={form.status}
                onChange={handleChange}
                className="w-full px-4 py-2.5 rounded-lg bg-surface border border-border text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-500/40 text-sm"
              >
                <option value="open">Open</option>
                <option value="in_progress">In Progress</option>
                <option value="resolved">Resolved</option>
                <option value="closed">Closed</option>
              </select>
            </div>

            {/* Assignee */}
            <div>
              <label htmlFor="assignee" className="block text-sm font-medium text-slate-300 mb-1.5">
                Assignee
              </label>
              <select
                id="assignee"
                name="assignee"
                value={form.assignee}
                onChange={handleChange}
                className="w-full px-4 py-2.5 rounded-lg bg-surface border border-border text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-500/40 text-sm"
              >
                <option value="">Unassigned</option>
                {members.map((m) => (
                  <option key={m._id} value={m.user._id}>
                    {m.user.name} ({m.user.email})
                  </option>
                ))}
              </select>
            </div>

            {/* Due Date */}
            <div>
              <label htmlFor="dueDate" className="block text-sm font-medium text-slate-300 mb-1.5">
                Due Date
              </label>
              <input
                id="dueDate"
                name="dueDate"
                type="date"
                value={form.dueDate}
                onChange={handleChange}
                className="w-full px-4 py-2.5 rounded-lg bg-surface border border-border text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-500/40 text-sm"
              />
            </div>
          </div>

          {/* Tags */}
          <div>
            <label htmlFor="tags" className="block text-sm font-medium text-slate-300 mb-1.5">
              Tags <span className="text-slate-500 text-xs">(comma separated)</span>
            </label>
            <input
              id="tags"
              name="tags"
              type="text"
              value={form.tags}
              onChange={handleChange}
              placeholder="e.g., backend, api, urgent"
              className="w-full px-4 py-2.5 rounded-lg bg-surface border border-border text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary-500/40 text-sm"
            />
          </div>

          {/* Submit Button */}
          <div className="flex justify-end gap-3 pt-4 border-t border-border">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="px-4 py-2.5 rounded-lg border border-border text-slate-300 hover:bg-surface-lighter text-sm transition-colors"
            >
              Cancel
            </button>
            <button
              id="save-incident-btn"
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-gradient-to-r from-primary-600 to-primary-500 text-white font-medium text-sm hover:from-primary-500 hover:to-primary-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-primary-500/20"
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
