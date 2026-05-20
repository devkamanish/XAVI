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

  // Real-time listeners
  useEffect(() => {
    if (!socket) return;

    const handleCommentAdded = (data: any) => {
      if (data.incidentId === id) {
        fetchComments();
      }
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
    Array.from(e.target.files).forEach(file => {
      formData.append("files", file);
    });

    setUploading(true);
    try {
      const { data } = await api.post(`/incidents/${id}/upload`, formData, {
        headers: {
          "Content-Type": "multipart/form-data"
        }
      });
      if (data.success) {
        toast.success("Files uploaded successfully");
        fetchIncident();
        fetchActivities();
      }
    } catch (error) {
      // API interceptor handles the error message toast
    } finally {
      setUploading(false);
      if (e.target) e.target.value = '';
    }
  };

  if (loading || !incident) {
    return (
      <div className="flex justify-center py-20">
        <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const canEdit = currentRole === "admin" || currentRole === "manager";
  const canDelete = currentRole === "admin" || currentRole === "manager";

  return (
    <div className="space-y-6 animate-fadeIn max-w-5xl">
      {/* Back Button & Actions */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate("/incidents")}
          className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Incidents
        </button>
        <div className="flex gap-2">
          <Link
            to={`/incidents/${id}/edit`}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-slate-300 hover:text-white hover:bg-surface-lighter transition-colors text-sm"
          >
            <Edit className="w-3.5 h-3.5" />
            Edit
          </Link>
          {canDelete && (
            <button
              onClick={handleDelete}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-colors text-sm"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Delete
            </button>
          )}
        </div>
      </div>

      {/* Incident Header */}
      <div className="glass rounded-xl p-6">
        <div className="flex items-center gap-2 mb-3">
          <span className={`badge badge-${incident.severity}`}>{incident.severity}</span>
          <span className={`badge badge-${incident.status}`}>{incident.status.replace("_", " ")}</span>
        </div>
        <h1 className="text-xl font-bold text-white mb-2">{incident.title}</h1>
        {incident.description && (
          <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-wrap">{incident.description}</p>
        )}

        {/* Tags */}
        {incident.tags.length > 0 && (
          <div className="flex gap-1.5 flex-wrap mt-4">
            {incident.tags.map((tag) => (
              <span key={tag} className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-surface-lighter text-slate-400 text-xs">
                <Tag className="w-3 h-3" />
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Meta Info */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-4 border-t border-border">
          <div className="flex items-center gap-2 text-sm">
            <User className="w-4 h-4 text-slate-500" />
            <div>
              <p className="text-[11px] text-slate-500">Reporter</p>
              <p className="text-slate-300">{incident.reporter?.name || "Unknown"}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <User className="w-4 h-4 text-slate-500" />
            <div>
              <p className="text-[11px] text-slate-500">Assignee</p>
              <p className="text-slate-300">{incident.assignee?.name || "Unassigned"}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Clock className="w-4 h-4 text-slate-500" />
            <div>
              <p className="text-[11px] text-slate-500">Created</p>
              <p className="text-slate-300">{format(new Date(incident.createdAt), "MMM d, yyyy")}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="w-4 h-4 text-slate-500" />
            <div>
              <p className="text-[11px] text-slate-500">Due Date</p>
              <p className="text-slate-300">
                {incident.dueDate ? format(new Date(incident.dueDate), "MMM d, yyyy") : "No due date"}
              </p>
            </div>
          </div>
        </div>

        {/* Attachments */}
        <div className="mt-4 pt-4 border-t border-border">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-slate-500 flex items-center gap-1">
              <Paperclip className="w-3 h-3" />
              Attachments ({incident.attachments.length})
            </p>
            <label className={`cursor-pointer flex items-center gap-1 px-3 py-1.5 rounded-lg border border-border text-slate-300 hover:text-white hover:bg-surface-lighter transition-colors text-xs ${uploading ? 'opacity-50 pointer-events-none' : ''}`}>
              <Upload className="w-3 h-3" /> 
              {uploading ? "Uploading..." : "Add File"}
              <input type="file" multiple className="hidden" onChange={handleFileUpload} disabled={uploading} />
            </label>
          </div>
          {incident.attachments.length > 0 && (
            <div className="flex gap-2 flex-wrap mt-3">
              {incident.attachments.map((file, i) => (
                <a
                  key={i}
                  href={file}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-1.5 rounded-lg bg-surface-lighter text-primary-400 border border-border text-xs hover:bg-surface-lighter/80 transition-colors flex items-center gap-1.5"
                >
                  <Paperclip className="w-3.5 h-3.5" />
                  {file.split("/").pop()}
                </a>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Tabs: Comments / Activity */}
      <div>
        <div className="flex gap-1 border-b border-border mb-4">
          <button
            onClick={() => setActiveTab("comments")}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              activeTab === "comments"
                ? "border-primary-500 text-primary-400"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            Comments ({comments.length})
          </button>
          <button
            onClick={() => setActiveTab("activity")}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              activeTab === "activity"
                ? "border-primary-500 text-primary-400"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            Activity ({activities.length})
          </button>
        </div>

        {activeTab === "comments" ? (
          <div className="space-y-4">
            {/* Add Comment Form */}
            <form onSubmit={handleAddComment} className="glass rounded-xl p-4">
              <textarea
                id="comment-input"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Write a comment... Use @email to mention someone"
                rows={3}
                className="w-full px-3 py-2 rounded-lg bg-surface border border-border text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary-500/40 text-sm resize-none"
              />
              <div className="flex justify-end mt-3">
                <button
                  type="submit"
                  disabled={!newComment.trim() || submitting}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary-600 text-white text-sm font-medium hover:bg-primary-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <Send className="w-3.5 h-3.5" />
                  {submitting ? "Sending..." : "Comment"}
                </button>
              </div>
            </form>

            {/* Comment List */}
            {comments.length === 0 ? (
              <p className="text-center text-slate-500 py-8 text-sm">No comments yet. Be the first to comment!</p>
            ) : (
              <div className="space-y-3">
                {comments.map((comment) => (
                  <div key={comment._id} className="glass rounded-xl p-4 animate-slideIn">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white text-xs font-semibold">
                        {comment.author?.name?.charAt(0).toUpperCase() || "?"}
                      </div>
                      <span className="text-sm font-medium text-slate-200">{comment.author?.name || "Unknown"}</span>
                      <span className="text-xs text-slate-500">
                        {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                      </span>
                    </div>
                    <p className="text-sm text-slate-300 whitespace-pre-wrap pl-9">{comment.content}</p>
                    {comment.mentions.length > 0 && (
                      <div className="flex gap-1 mt-2 pl-9">
                        {comment.mentions.map((m) => (
                          <span key={m} className="text-xs text-primary-400 bg-primary-500/10 px-1.5 py-0.5 rounded">
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
          /* Activity Timeline */
          <div className="space-y-3">
            {activities.length === 0 ? (
              <p className="text-center text-slate-500 py-8 text-sm">No activity recorded yet</p>
            ) : (
              activities.map((activity) => (
                <div key={activity._id} className="flex items-start gap-3 text-sm animate-slideIn">
                  <div className="w-7 h-7 rounded-full bg-surface-lighter flex items-center justify-center shrink-0 mt-0.5">
                    <Activity className="w-3.5 h-3.5 text-primary-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-slate-300">{activity.details}</p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true })}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default IncidentDetailPage;
