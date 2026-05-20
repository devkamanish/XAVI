import React from "react";
import { Outlet, Navigate, useLocation } from "react-router-dom";
import Sidebar from "./Sidebar";
import { useOrg } from "../context/OrgContext";

const Layout: React.FC = () => {
  const { currentOrg, organizations, loading } = useOrg();
  const location = useLocation();

  if (!loading && organizations.length === 0 && !location.pathname.startsWith("/settings")) {
    return <Navigate to="/settings?tab=create" replace />;
  }

  const isSettingsPage = location.pathname.startsWith("/settings");

  return (
    <div className="flex h-screen overflow-hidden bg-surface">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        {}
        <div className="min-h-full px-6 py-8 md:px-10 md:py-10 lg:px-12 lg:py-12 pt-24 lg:pt-12">
          {currentOrg || isSettingsPage ? (
            <div className="max-w-[1300px] animate-fadeIn">
              <Outlet />
            </div>
          ) : (
            <div className="flex items-center justify-center h-[70vh]">
              <div className="text-center space-y-4">
                <div className="w-14 h-14 rounded-2xl bg-surface-light border border-border/50 flex items-center justify-center mx-auto">
                  <svg className="w-7 h-7 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <p className="text-slate-300 font-semibold">No organization selected</p>
                <p className="text-slate-500 text-sm">Select or create an organization to get started</p>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Layout;
