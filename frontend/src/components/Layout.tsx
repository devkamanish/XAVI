import React from "react";
import { Outlet, Navigate, useLocation } from "react-router-dom";
import Sidebar from "./Sidebar";
import { useOrg } from "../context/OrgContext";

const Layout: React.FC = () => {
  const { currentOrg, organizations, loading } = useOrg();
  const location = useLocation();

  // If no orgs exist and not already on settings page, redirect to create one
  if (!loading && organizations.length === 0 && !location.pathname.startsWith("/settings")) {
    return <Navigate to="/settings?tab=create" replace />;
  }

  // Always show the settings page (needed for first org creation)
  // For other pages, require an org to be selected
  const isSettingsPage = location.pathname.startsWith("/settings");

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-y-auto bg-surface">
        <div className="p-4 lg:p-6 lg:pl-6 pt-16 lg:pt-6">
          {currentOrg || isSettingsPage ? (
            <Outlet />
          ) : (
            <div className="flex items-center justify-center h-[60vh]">
              <div className="text-center">
                <p className="text-slate-400 text-lg">Select an organization to get started</p>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Layout;
