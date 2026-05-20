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
  Mail,
  Crown,
} from "lucide-react";
import { useOrg } from "../context/OrgContext";
import { useAuth } from "../context/AuthContext";
import type { Role } from "../types";
import toast from "react-hot-toast";

const SettingsPage: React.FC = () => {
  const { currentOrg, currentRole, members, fetchMembers, createOrg, inviteUser, updateMemberRole, removeMember } =
    useOrg();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();

  const initialTab = searchParams.get("tab") === "create" ? "create" : "general";
  const [activeTab, setActiveTab] = useState(initialTab);

  
  const [orgName, setOrgName] = useState("");
  const [orgDesc, setOrgDesc] = useState("");
  const [creatingOrg, setCreatingOrg] = useState(false);

  
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
  const inputClass = "input-base";

  return (
    <div className="space-y-8 animate-fadeIn">
      {}
      <div className="page-header">
        <div>
          <h1 className="page-title">Settings</h1>
          <p className="page-subtitle">
            {currentOrg ? `Managing ${currentOrg.name}` : "Organization settings and management"}
          </p>
        </div>
      </div>

      {}
      <div className="flex gap-1 border-b border-border/50">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold border-b-2 transition-all duration-200 ${
              activeTab === tab.id ? "tab-active" : "tab-inactive"
            }`}
          >
            <tab.icon className="w-3.5 h-3.5" />
            {tab.label}
          </button>
        ))}
      </div>

      {}
      {activeTab === "general" && currentOrg && (
        <div className="max-w-2xl">
          <div className="card !p-8">
            <h2 className="section-title mb-6">
              <Building2 className="w-5 h-5 text-primary-400" />
              Organization Details
            </h2>
            <div className="divide-y divide-border/30">
              {[
                { label: "Name", value: currentOrg.name, mono: false },
                { label: "Slug", value: currentOrg.slug, mono: true },
                { label: "Description", value: currentOrg.description || "—", mono: false },
              ].map(({ label, value, mono }) => (
                <div key={label} className="py-5 first:pt-0 last:pb-0 flex items-start gap-4">
                  <span className="text-sm text-slate-500 font-semibold w-28 shrink-0 pt-0.5">{label}</span>
                  <span className={`text-sm font-semibold text-slate-200 ${mono ? "font-mono text-primary-300" : ""}`}>
                    {value}
                  </span>
                </div>
              ))}
              <div className="py-5 last:pb-0 flex items-start gap-4">
                <span className="text-sm text-slate-500 font-semibold w-28 shrink-0 pt-0.5">Your Role</span>
                <span className={`badge badge-${currentRole}`}>{currentRole}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {}
      {activeTab === "members" && (
        <div className="space-y-8 max-w-3xl">
          {}
          {canInvite && (
            <div className="card !p-8">
              <h2 className="section-title mb-6">
                <UserPlus className="w-5 h-5 text-primary-400" />
                Invite Team Member
              </h2>
              <form onSubmit={handleInvite} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto_auto] gap-4 items-end">
                  <div>
                    <label className="block text-sm font-semibold text-slate-400 mb-2">
                      Email Address
                    </label>
                    <div className="relative">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
                        <Mail className="w-5 h-5 text-slate-500" />
                      </div>
                      <input
                        id="invite-email"
                        type="email"
                        value={inviteEmail}
                        onChange={(e) => setInviteEmail(e.target.value)}
                        placeholder="colleague@company.com"
                        className={`${inputClass} input-with-icon`}
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-400 mb-2">Role</label>
                    <select
                      value={inviteRole}
                      onChange={(e) => setInviteRole(e.target.value as Role)}
                      className={inputClass}
                    >
                      <option value="developer">Developer</option>
                      <option value="manager">Manager</option>
                      {isAdmin && <option value="admin">Admin</option>}
                    </select>
                  </div>
                  <button
                    type="submit"
                    disabled={inviting}
                    className="btn btn-primary whitespace-nowrap"
                  >
                    <UserPlus className="w-4 h-4" />
                    {inviting ? "Inviting..." : "Send Invite"}
                  </button>
                </div>
              </form>
            </div>
          )}

          {}
          <div className="card !p-8">
            <h2 className="section-title mb-6">
              <Users className="w-5 h-5 text-primary-400" />
              Members
              <span className="ml-auto text-xs text-slate-500 font-medium bg-surface-lighter px-2.5 py-1 rounded-full">
                {members.length} {members.length === 1 ? "member" : "members"}
              </span>
            </h2>
            <div className="space-y-2">
              {members.map((member) => (
                <div
                  key={member._id}
                  className="flex items-center gap-4 p-4 rounded-xl bg-surface/50 hover:bg-surface border border-transparent hover:border-border/50 transition-all"
                >
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white text-sm font-bold shrink-0 shadow-sm">
                    {member.user?.name?.charAt(0).toUpperCase() || "?"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-bold text-white truncate">{member.user?.name || "Unknown"}</p>
                      {member.user?._id === user?._id && (
                        <span className="text-[10px] font-bold text-primary-400 bg-primary-500/10 border border-primary-500/20 px-2 py-0.5 rounded-full uppercase tracking-wider">
                          You
                        </span>
                      )}
                      {member.role === "admin" && (
                        <Crown className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      )}
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5 truncate">{member.user?.email}</p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    {isAdmin && member.user?._id !== user?._id ? (
                      <select
                        value={member.role}
                        onChange={(e) => handleRoleChange(member._id, e.target.value as Role)}
                        className="px-3 py-2 rounded-lg bg-surface-lighter/60 border border-border/50 text-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-primary-500/30 font-medium transition-all"
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
                        className="p-2 rounded-lg hover:bg-red-500/15 text-slate-600 hover:text-red-400 transition-all duration-200"
                        title="Remove member"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {}
      {activeTab === "create" && (
        <div className="max-w-lg">
          <div className="card !p-8">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 rounded-xl bg-primary-500/15 flex items-center justify-center">
                <Building2 className="w-5 h-5 text-primary-400" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">Create New Organization</h2>
                <p className="text-sm text-slate-500 mt-0.5">Set up a new workspace for your team</p>
              </div>
            </div>

            <form onSubmit={handleCreateOrg} className="space-y-6">
              <div>
                <label htmlFor="org-name" className="block text-sm font-semibold text-slate-300 mb-2">
                  Organization Name <span className="text-red-400">*</span>
                </label>
                <input
                  id="org-name"
                  type="text"
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                  placeholder="e.g., Acme Engineering"
                  className={inputClass}
                  required
                />
              </div>
              <div>
                <label htmlFor="org-desc" className="block text-sm font-semibold text-slate-300 mb-2">
                  Description
                  <span className="text-slate-600 font-normal ml-2">optional</span>
                </label>
                <textarea
                  id="org-desc"
                  value={orgDesc}
                  onChange={(e) => setOrgDesc(e.target.value)}
                  placeholder="What does this organization do?"
                  rows={4}
                  className={`${inputClass} resize-none`}
                />
              </div>
              <button
                id="create-org-btn"
                type="submit"
                disabled={creatingOrg}
                className="btn btn-primary w-full btn-lg"
              >
                <Building2 className="w-5 h-5" />
                {creatingOrg ? "Creating..." : "Create Organization"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SettingsPage;
