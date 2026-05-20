import React, { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  ArrowLeft,
  Edit,
  Trash2,
  Clock,
  User,
  Calendar,
  Tag,
  Send,
  Activity,
  Paperclip,
  Upload,
  MessageSquare,
} from "lucide-react";
import api from "../services/api";
import type { Incident, Comment as CommentType, Activity as ActivityType } from "../types";
import { useOrg } from "../context/OrgContext";
import { useSocket } from "../context/SocketContext";
import { format, formatDistanceToNow } from "date-fns";
import toast from "react-hot-toast";

const IncidentDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { currentRole } = useOrg();
  const socket = useSocket();
  const navigate = useNavigate();

  const [incident, setIncident] = useState<Incident | null>(null);
  const [comments, setComments] = useState<CommentType[]>([]);
  const [activities, setActivities] = useState<ActivityType[]>([]);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [activeTab, setActiveTab] = useState<"comments" | "activity">("comments");

  const fetchIncident = useCallback(async () => {
    try {
      const { data } = await api.get(`/incidents/${id}`);
      if (data.success) setIncident(data.data.incident);
    } catch (error) {
      toast.error("Failed to load incident");
      navigate("/incidents");
    }
  }, [id, navigate]);

  const fetchComments = useCallback(async () => {
    try {
      const { data } = await api.get(`/incidents/${id}/comments`);
      if (data.success) setComments(data.data.comments);
    } catch (error) {
      console.error("Failed to fetch comments:", error);
    }
  }, [id]);

  const fetchActivities = useCallback(async () => {
    try {
      const { data } = await api.get(`/activities?incidentId=${id}`);
      if (data.success) setActivities(data.data);
    } catch (error) {
      console.error("Failed to fetch activities:", error);
    }
  }, [id]);

  useEffect(() => {
    const loadAll = async () => {
      setLoading(true);
      await Promise.all([fetchIncident(), fetchComments(), fetchActivities()]);
      setLoading(false);
    };
    loadAll();
  }, [fetchIncident, fetchComments, fetchActivities]);

  
  useEffect(() => {
    if (!socket) return;
    const handleCommentAdded = (data: any) => {
      if (data.incidentId === id) fetchComments();
    };
    const handleIncidentUpdated = (data: any) => {
      if (data._id === id) {
        setIncident(data);
        fetchActivities();
      }
    };
    socket.on("comment:added", handleCommentAdded);
    socket.on("incident:updated", handleIncidentUpdated);
    return () => {
      socket.off("comment:added", handleCommentAdded);
      socket.off("incident:updated", handleIncidentUpdated);
    };
  }, [socket, id, fetchComments, fetchActivities]);

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    setSubmitting(true);
    try {
      await api.post(`/incidents/${id}/comments`, { content: newComment });
      setNewComment("");
      await fetchComments();
      toast.success("Comment added");
    } catch (error) {
      toast.error("Failed to add comment");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this incident?")) return;
    try {
      await api.delete(`/incidents/${id}`);
      toast.success("Incident deleted");
      navigate("/incidents");
    } catch (error) {
      toast.error("Failed to delete incident");
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const formData = new FormData();
    Array.from(e.target.files).forEach((file) => formData.append("files", file));
    setUploading(true);
    try {
      const { data } = await api.post(`/incidents/${id}/upload`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      if (data.success) {
        toast.success("Files uploaded successfully");
        fetchIncident();
        fetchActivities();
      }
    } catch (error) {
      
    } finally {
      setUploading(false);
      if (e.target) e.target.value = "";
    }
  };

  if (loading || !incident) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="text-center space-y-4">
          <div className="w-10 h-10 border-2 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-slate-500 text-sm">Loading incident...</p>
        </div>
      </div>
    );
  }

  const canEdit = currentRole === "admin" || currentRole === "manager";
  const canDelete = currentRole === "admin" || currentRole === "manager";

  return (
    <div className="space-y-8 animate-fadeIn max-w-5xl">
      {}
      <div className="page-header">
        <div>
          <button
            onClick={() => navigate("/incidents")}
            className="flex items-center gap-1.5 text-slate-500 hover:text-slate-200 transition-colors text-xs font-medium mb-1 group"
          >
            <ArrowLeft className="w-3.5 h-3.5 group-hover:text-primary-400 transition-colors" />
            Incidents
          </button>
          <h1 className="page-title">{incident.title}</h1>
          <div className="flex items-center gap-2 mt-2">
            <span className={`badge badge-${incident.severity}`}>{incident.severity}</span>
            <span className={`badge badge-${incident.status}`}>{incident.status.replace("_", " ")}</span>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Link to={`/incidents/${id}/edit`} className="btn btn-secondary btn-sm">
            <Edit className="w-3.5 h-3.5" />
            Edit
          </Link>
          {canDelete && (
            <button onClick={handleDelete} className="btn btn-danger btn-sm">
              <Trash2 className="w-3.5 h-3.5" />
              Delete
            </button>
          )}
        </div>
      </div>

      {}
      <div className="card">
        {}
        {incident.description ? (
          <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-wrap mb-5">
            {incident.description}
          </p>
        ) : (
          <p className="text-slate-600 text-sm italic mb-5">No description provided.</p>
        )}

        {}
        {incident.tags.length > 0 && (
          <div className="flex gap-2 flex-wrap mb-5">
            {incident.tags.map((tag) => (
              <span key={tag} className="tag-chip">
                <Tag className="w-3 h-3" />
                {tag}
              </span>
            ))}
          </div>
        )}

        {}
        <div className="border-t border-border/30 mb-5" />

        {}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
          {[
            { icon: User, label: "Reporter", value: incident.reporter?.name || "Unknown" },
            { icon: User, label: "Assignee", value: incident.assignee?.name || "Unassigned" },
            { icon: Clock, label: "Created", value: format(new Date(incident.createdAt), "MMM d, yyyy") },
            {
              icon: Calendar,
              label: "Due Date",
              value: incident.dueDate ? format(new Date(incident.dueDate), "MMM d, yyyy") : "No due date",
            },
          ].map(({ icon: Icon, label, value }) => (
            <div
              key={label}
              className="px-5 py-4 rounded-xl bg-surface/60 border border-border/30 flex items-start gap-3.5"
            >
              <div className="w-8 h-8 rounded-lg bg-surface-lighter/60 flex items-center justify-center shrink-0 mt-0.5">
                <Icon className="w-4 h-4 text-slate-400" />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">{label}</p>
                <p className="text-sm font-semibold text-slate-200">{value}</p>
              </div>
            </div>
          ))}
        </div>

        {}
        <div className="mt-6 pt-6 border-t border-border/30">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-semibold text-slate-400 flex items-center gap-2">
              <Paperclip className="w-4 h-4" />
              Attachments
              <span className="text-slate-600">({incident.attachments.length})</span>
            </p>
            <label
              className={`btn btn-secondary btn-sm cursor-pointer ${uploading ? "opacity-50 pointer-events-none" : ""}`}
            >
              <Upload className="w-4 h-4" />
              {uploading ? "Uploading..." : "Add File"}
              <input type="file" multiple className="hidden" onChange={handleFileUpload} disabled={uploading} />
            </label>
          </div>
          {incident.attachments.length > 0 && (
            <div className="flex gap-2 flex-wrap mt-2">
              {incident.attachments.map((file, i) => (
                <a
                  key={i}
                  href={file}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2 px-3 py-2 rounded-lg bg-surface border border-border text-primary-400 hover:text-primary-300 hover:border-primary-500/30 text-xs font-medium transition-all"
                >
                  <Paperclip className="w-3.5 h-3.5" />
                  {file.split("/").pop()}
                </a>
              ))}
            </div>
          )}
        </div>
      </div>

      {}
      <div>
        <div className="flex gap-1 border-b border-border/50 mb-6">
          <button
            onClick={() => setActiveTab("comments")}
            className={`flex items-center gap-2 px-6 py-3.5 text-sm font-semibold border-b-2 transition-all duration-200 ${
              activeTab === "comments" ? "tab-active" : "tab-inactive"
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            Comments
            <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${activeTab === "comments" ? "bg-primary-500/20 text-primary-400" : "bg-surface-lighter text-slate-500"}`}>
              {comments.length}
            </span>
          </button>
          <button
            onClick={() => setActiveTab("activity")}
            className={`flex items-center gap-2 px-6 py-3.5 text-sm font-semibold border-b-2 transition-all duration-200 ${
              activeTab === "activity" ? "tab-active" : "tab-inactive"
            }`}
          >
            <Activity className="w-4 h-4" />
            Activity
            <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${activeTab === "activity" ? "bg-primary-500/20 text-primary-400" : "bg-surface-lighter text-slate-500"}`}>
              {activities.length}
            </span>
          </button>
        </div>

        {activeTab === "comments" ? (
          <div className="space-y-4">
            {}
            <form onSubmit={handleAddComment} className="card !p-6">
              <label className="block text-sm font-semibold text-slate-300 mb-3">
                Add a comment
              </label>
              <textarea
                id="comment-input"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Write a comment... Use @email to mention someone"
                rows={4}
                className="input-base resize-none mb-4"
              />
              <div className="flex items-center justify-between">
                <p className="text-xs text-slate-600">Use @email to mention a teammate</p>
                <button
                  type="submit"
                  disabled={!newComment.trim() || submitting}
                  className="btn btn-primary btn-sm"
                >
                  <Send className="w-4 h-4" />
                  {submitting ? "Posting..." : "Post Comment"}
                </button>
              </div>
            </form>

            {}
            {comments.length === 0 ? (
              <div className="text-center py-12">
                <MessageSquare className="w-10 h-10 text-slate-700 mx-auto mb-3" />
                <p className="text-slate-500 text-sm font-medium">No comments yet</p>
                <p className="text-slate-600 text-xs mt-1">Be the first to comment</p>
              </div>
            ) : (
              <div className="space-y-3">
                {comments.map((comment) => (
                  <div key={comment._id} className="card !p-6 hover:border-border/60 animate-slideIn">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white text-sm font-bold shrink-0 shadow-sm">
                        {comment.author?.name?.charAt(0).toUpperCase() || "?"}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-200">{comment.author?.name || "Unknown"}</p>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                    <p className="text-sm text-slate-300 whitespace-pre-wrap leading-relaxed pl-[52px]">
                      {comment.content}
                    </p>
                    {comment.mentions.length > 0 && (
                      <div className="flex gap-2 mt-3 pl-[52px] flex-wrap">
                        {comment.mentions.map((m) => (
                          <span key={m} className="text-xs text-primary-400 bg-primary-500/10 border border-primary-500/20 px-2.5 py-1 rounded-lg font-semibold">
                            @{m}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          
          <div className="space-y-0">
            {activities.length === 0 ? (
              <div className="text-center py-12">
                <Activity className="w-10 h-10 text-slate-700 mx-auto mb-3" />
                <p className="text-slate-500 text-sm font-medium">No activity recorded yet</p>
              </div>
            ) : (
              <div className="relative">
                <div className="absolute left-4 top-3 bottom-3 w-px bg-border/40" />
                <div className="space-y-1">
                  {activities.map((activity) => (
                    <div key={activity._id} className="flex gap-5 py-4 pl-1 animate-slideIn">
                      <div className="w-8 h-8 rounded-full bg-surface-light border border-border flex items-center justify-center shrink-0 relative z-10">
                        <Activity className="w-3.5 h-3.5 text-primary-400" />
                      </div>
                      <div className="flex-1 pt-1">
                        <p className="text-sm font-medium text-slate-300">{activity.details}</p>
                        <p className="text-xs text-slate-600 mt-1">
                          {formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default IncidentDetailPage;
