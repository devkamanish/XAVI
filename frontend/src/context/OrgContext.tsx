import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import api from "../services/api";
import type { Organization, OrgWithRole, Role, Membership } from "../types";
import { useAuth } from "./AuthContext";

interface OrgContextType {
  organizations: OrgWithRole[];
  currentOrg: Organization | null;
  currentRole: Role | null;
  members: Membership[];
  loading: boolean;
  fetchOrgs: () => Promise<void>;
  switchOrg: (orgId: string) => void;
  createOrg: (name: string, description?: string) => Promise<void>;
  inviteUser: (email: string, role: Role) => Promise<void>;
  fetchMembers: () => Promise<void>;
  updateMemberRole: (memberId: string, role: Role) => Promise<void>;
  removeMember: (memberId: string) => Promise<void>;
}

const OrgContext = createContext<OrgContextType | null>(null);

export const OrgProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const [organizations, setOrganizations] = useState<OrgWithRole[]>([]);
  const [currentOrg, setCurrentOrg] = useState<Organization | null>(null);
  const [currentRole, setCurrentRole] = useState<Role | null>(null);
  const [members, setMembers] = useState<Membership[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchOrgs = useCallback(async () => {
    if (!isAuthenticated) return;
    setLoading(true);
    try {
      const { data } = await api.get("/orgs");
      if (data.success) {
        setOrganizations(data.data.organizations);

        // Restore last selected org or select first one
        const savedOrgId = localStorage.getItem("currentOrgId");
        const savedOrg = data.data.organizations.find(
          (o: OrgWithRole) => o.organization._id === savedOrgId
        );

        if (savedOrg) {
          setCurrentOrg(savedOrg.organization);
          setCurrentRole(savedOrg.role);
        } else if (data.data.organizations.length > 0) {
          const first = data.data.organizations[0];
          setCurrentOrg(first.organization);
          setCurrentRole(first.role);
          localStorage.setItem("currentOrgId", first.organization._id);
        }
      }
    } catch (error) {
      console.error("Failed to fetch orgs:", error);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    fetchOrgs();
  }, [fetchOrgs]);

  const switchOrg = (orgId: string) => {
    const org = organizations.find((o) => o.organization._id === orgId);
    if (org) {
      setCurrentOrg(org.organization);
      setCurrentRole(org.role);
      localStorage.setItem("currentOrgId", orgId);
      setMembers([]);
    }
  };

  const createOrg = async (name: string, description?: string) => {
    const { data } = await api.post("/orgs", { name, description });
    if (data.success) {
      // Fetch updated org list
      const orgsRes = await api.get("/orgs");
      if (orgsRes.data.success) {
        const newOrgs = orgsRes.data.data.organizations;
        setOrganizations(newOrgs);

        // Find and switch to the newly created org
        const newOrg = newOrgs.find(
          (o: OrgWithRole) => o.organization._id === data.data.organization._id
        );
        if (newOrg) {
          setCurrentOrg(newOrg.organization);
          setCurrentRole(newOrg.role);
          localStorage.setItem("currentOrgId", newOrg.organization._id);
        }
      }
    }
  };

  const inviteUser = async (email: string, role: Role) => {
    if (!currentOrg) return;
    await api.post(`/orgs/${currentOrg._id}/invite`, { email, role });
    await fetchMembers();
  };

  const fetchMembers = useCallback(async () => {
    if (!currentOrg) return;
    try {
      const { data } = await api.get(`/orgs/${currentOrg._id}`, {
        headers: { "x-org-id": currentOrg._id }
      });
      if (data.success) {
        setMembers(data.data.members);
      }
    } catch (error) {
      console.error("Failed to fetch members:", error);
    }
  }, [currentOrg]);

  const updateMemberRole = async (memberId: string, role: Role) => {
    if (!currentOrg) return;
    await api.patch(`/orgs/${currentOrg._id}/members/${memberId}/role`, { role });
    await fetchMembers();
  };

  const removeMember = async (memberId: string) => {
    if (!currentOrg) return;
    await api.delete(`/orgs/${currentOrg._id}/members/${memberId}`);
    await fetchMembers();
  };

  return (
    <OrgContext.Provider
      value={{
        organizations,
        currentOrg,
        currentRole,
        members,
        loading,
        fetchOrgs,
        switchOrg,
        createOrg,
        inviteUser,
        fetchMembers,
        updateMemberRole,
        removeMember,
      }}
    >
      {children}
    </OrgContext.Provider>
  );
};

export const useOrg = (): OrgContextType => {
  const context = useContext(OrgContext);
  if (!context) throw new Error("useOrg must be used within OrgProvider");
  return context;
};
