import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Building2,
  UserPlus,
  Users,
  Shield,
  Trash2,
  Plus,
  Settings as SettingsIcon,
} from "lucide-react";
import { useOrg } from "../context/OrgContext";
import { useAuth } from "../context/AuthContext";
import type { Role } from "../types";
import toast from "react-hot-toast";

const SettingsPage: React.FC = () => {
  const { currentOrg, currentRole, members, fetchMembers, createOrg, inviteUser, updateMemberRole, removeMember } = useOrg();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();

  const initialTab = searchParams.get("tab") === "create" ? "create" : "general";
  const [activeTab, setActiveTab] = useState(initialTab);

  // Create Org form
  const [orgName, setOrgName] = useState("");
  const [orgDesc, setOrgDesc] = useState("");
  const [creatingOrg, setCreatingOrg] = useState(false);

  // Invite form
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<Role>("developer");
  const [inviting, setInviting] = useState(false);

  useEffect(() => {
    if (currentOrg && activeTab === "members") {
      fetchMembers();
    }
  }, [currentOrg, activeTab, fetchMembers]);

  const handleCreateOrg = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orgName.trim()) {
      toast.error("Organization name is required");
      return;
    }
    setCreatingOrg(true);
    try {
      await createOrg(orgName.trim(), orgDesc.trim());
      toast.success("Organization created!");
      setOrgName("");
      setOrgDesc("");
      setActiveTab("general");
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to create organization");
    } finally {
      setCreatingOrg(false);
    }
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim()) {
      toast.error("Email is required");
      return;
    }
    setInviting(true);
    try {
      await inviteUser(inviteEmail.trim(), inviteRole);
      toast.success("User invited successfully!");
      setInviteEmail("");
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to invite user");
    } finally {
      setInviting(false);
    }
  };

  const handleRoleChange = async (memberId: string, newRole: Role) => {
    try {
      await updateMemberRole(memberId, newRole);
      toast.success("Role updated");
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to update role");
    }
  };

  const handleRemoveMember = async (memberId: string, memberName: string) => {
    if (!confirm(`Remove ${memberName} from the organization?`)) return;
    try {
      await removeMember(memberId);
      toast.success("Member removed");
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to remove member");
    }
  };

  const tabs = [
    { id: "general", label: "General", icon: SettingsIcon },
    { id: "members", label: "Members", icon: Users },
    { id: "create", label: "New Org", icon: Plus },
  ];

  const isAdmin = currentRole === "admin";
  const canInvite = isAdmin || currentRole === "manager";

  return (
    <div className="space-y-6 animate-fadeIn">
      <div>
        <h1 className="text-2xl font-bold text-white">Organization Settings</h1>
        <p className="text-slate-400 text-sm mt-1">
          Manage your organization, members, and roles
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-border">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab.id
                ? "border-primary-500 text-primary-400"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === "general" && currentOrg && (
        <div className="glass rounded-xl p-6 max-w-2xl">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Building2 className="w-5 h-5 text-primary-400" />
            Organization Details
          </h2>
          <div className="space-y-4">
            <div>
              <label className="text-sm text-slate-400">Name</label>
              <p className="text-white font-medium mt-1">{currentOrg.name}</p>
            </div>
            <div>
              <label className="text-sm text-slate-400">Slug</label>
              <p className="text-slate-300 mt-1 font-mono text-sm">{currentOrg.slug}</p>
            </div>
            {currentOrg.description && (
              <div>
                <label className="text-sm text-slate-400">Description</label>
                <p className="text-slate-300 mt-1">{currentOrg.description}</p>
              </div>
            )}
            <div>
              <label className="text-sm text-slate-400">Your Role</label>
              <p className="mt-1">
                <span className={`badge badge-${currentRole}`}>{currentRole}</span>
              </p>
            </div>
          </div>
        </div>
      )}

      {activeTab === "members" && (
        <div className="space-y-6 max-w-3xl">
          {/* Invite Form */}
          {canInvite && (
            <div className="glass rounded-xl p-6">
              <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-primary-400" />
                Invite User
              </h2>
              <form onSubmit={handleInvite} className="flex flex-col sm:flex-row gap-3">
                <input
                  id="invite-email"
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="user@example.com"
                  className="flex-1 px-4 py-2.5 rounded-lg bg-surface border border-border text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary-500/40 text-sm"
                  required
                />
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value as Role)}
                  className="px-4 py-2.5 rounded-lg bg-surface border border-border text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/40"
                >
                  <option value="developer">Developer</option>
                  <option value="manager">Manager</option>
                  {isAdmin && <option value="admin">Admin</option>}
                </select>
                <button
                  type="submit"
                  disabled={inviting}
                  className="px-5 py-2.5 rounded-lg bg-primary-600 text-white text-sm font-medium hover:bg-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors whitespace-nowrap"
                >
                  {inviting ? "Inviting..." : "Invite"}
                </button>
              </form>
            </div>
          )}

          {/* Member List */}
          <div className="glass rounded-xl p-6">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Users className="w-5 h-5 text-primary-400" />
              Members ({members.length})
            </h2>
            <div className="space-y-3">
              {members.map((member) => (
                <div
                  key={member._id}
                  className="flex items-center gap-3 p-3 rounded-lg bg-surface/50 hover:bg-surface transition-colors"
                >
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white text-sm font-semibold shrink-0">
                    {member.user?.name?.charAt(0).toUpperCase() || "?"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">
                      {member.user?.name || "Unknown"}
                      {member.user?._id === user?._id && (
                        <span className="text-xs text-slate-500 ml-2">(you)</span>
                      )}
                    </p>
                    <p className="text-xs text-slate-500 truncate">{member.user?.email}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {isAdmin && member.user?._id !== user?._id ? (
                      <select
                        value={member.role}
                        onChange={(e) => handleRoleChange(member._id, e.target.value as Role)}
                        className="px-2 py-1 rounded-md bg-surface-lighter border border-border text-slate-200 text-xs focus:outline-none"
                      >
                        <option value="developer">Developer</option>
                        <option value="manager">Manager</option>
                        <option value="admin">Admin</option>
                      </select>
                    ) : (
                      <span className={`badge badge-${member.role}`}>{member.role}</span>
                    )}
                    {isAdmin && member.user?._id !== user?._id && (
                      <button
                        onClick={() => handleRemoveMember(member._id, member.user?.name || "this user")}
                        className="p-1.5 rounded-lg hover:bg-red-500/10 text-slate-500 hover:text-red-400 transition-colors"
                        title="Remove member"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === "create" && (
        <div className="glass rounded-xl p-6 max-w-lg">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Building2 className="w-5 h-5 text-primary-400" />
            Create New Organization
          </h2>
          <form onSubmit={handleCreateOrg} className="space-y-5">
            <div>
              <label htmlFor="org-name" className="block text-sm font-medium text-slate-300 mb-1.5">
                Organization Name <span className="text-red-400">*</span>
              </label>
              <input
                id="org-name"
                type="text"
                value={orgName}
                onChange={(e) => setOrgName(e.target.value)}
                placeholder="e.g., Acme Engineering"
                className="w-full px-4 py-2.5 rounded-lg bg-surface border border-border text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary-500/40 text-sm"
                required
              />
            </div>
            <div>
              <label htmlFor="org-desc" className="block text-sm font-medium text-slate-300 mb-1.5">
                Description
              </label>
              <textarea
                id="org-desc"
                value={orgDesc}
                onChange={(e) => setOrgDesc(e.target.value)}
                placeholder="What does this organization do?"
                rows={3}
                className="w-full px-4 py-2.5 rounded-lg bg-surface border border-border text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary-500/40 text-sm resize-none"
              />
            </div>
            <button
              id="create-org-btn"
              type="submit"
              disabled={creatingOrg}
              className="w-full py-2.5 rounded-lg bg-gradient-to-r from-primary-600 to-primary-500 text-white font-medium text-sm hover:from-primary-500 hover:to-primary-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-primary-500/20"
            >
              {creatingOrg ? "Creating..." : "Create Organization"}
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default SettingsPage;
