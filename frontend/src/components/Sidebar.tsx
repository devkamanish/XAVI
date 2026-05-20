import React, { useState, useCallback } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  AlertTriangle,
  Settings,
  LogOut,
  Building2,
  ChevronDown,
  Plus,
  Menu,
  X,
  Activity,
  Shield,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useOrg } from "../context/OrgContext";
import { useClickOutside } from "../hooks/useDebounce";

const Sidebar: React.FC = () => {
  const { user, logout } = useAuth();
  const { organizations, currentOrg, switchOrg } = useOrg();
  const navigate = useNavigate();
  const [orgDropdownOpen, setOrgDropdownOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const dropdownRef = useClickOutside(useCallback(() => setOrgDropdownOpen(false), []));

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const navItems = [
    { to: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
    { to: "/incidents", icon: AlertTriangle, label: "Incidents" },
    { to: "/activity", icon: Activity, label: "Activity" },
    { to: "/settings", icon: Settings, label: "Settings" },
  ];

  const sidebarContent = (
    <div className="flex flex-col h-full overflow-hidden">

      {}
      <div className="px-6 py-6 border-b border-border/30 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center shadow-md shadow-primary-500/30 shrink-0">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <div className="min-w-0">
            <p className="text-base font-bold text-white leading-none tracking-tight">XAVI</p>
            <p className="text-[11px] text-slate-500 mt-1.5 leading-none font-medium">Incident Platform</p>
          </div>
        </div>
      </div>

      {}
      <div className="px-5 py-4 border-b border-border/30 shrink-0">
        <div ref={dropdownRef} className="relative">
          <button
            id="org-switcher"
            onClick={() => setOrgDropdownOpen(!orgDropdownOpen)}
            className="w-full flex items-center justify-between gap-2 px-3.5 py-3 rounded-xl bg-surface/50 hover:bg-surface-lighter/40 border border-border/40 hover:border-border/70 transition-all duration-200 group"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-6 h-6 rounded-md bg-primary-500/20 flex items-center justify-center shrink-0">
                <Building2 className="w-3.5 h-3.5 text-primary-400" />
              </div>
              <span className="truncate text-slate-200 font-semibold text-sm">
                {currentOrg?.name || "Select Organization"}
              </span>
            </div>
            <ChevronDown
              className={`w-4 h-4 text-slate-500 transition-transform duration-200 shrink-0 ${
                orgDropdownOpen ? "rotate-180" : ""
              }`}
            />
          </button>

          {orgDropdownOpen && (
            <div className="absolute top-full left-0 right-0 mt-1.5 bg-surface-light border border-border/60 rounded-xl shadow-2xl z-50 overflow-hidden animate-scaleIn">
              <div className="py-1">
                {organizations.map((o) => (
                  <button
                    key={o.organization._id}
                    onClick={() => {
                      switchOrg(o.organization._id);
                      setOrgDropdownOpen(false);
                    }}
                    className={`w-full text-left px-4 py-3 text-sm hover:bg-surface-lighter/60 transition-colors flex items-center justify-between gap-2 ${
                      currentOrg?._id === o.organization._id
                        ? "text-primary-400 bg-primary-500/10"
                        : "text-slate-300"
                    }`}
                  >
                    <span className="truncate font-semibold">{o.organization.name}</span>
                    <span className={`badge badge-${o.role} shrink-0 !text-[10px]`}>{o.role}</span>
                  </button>
                ))}
              </div>
              <div className="border-t border-border/40">
                <button
                  onClick={() => {
                    navigate("/settings?tab=create");
                    setOrgDropdownOpen(false);
                  }}
                  className="w-full text-left px-4 py-3 text-sm text-primary-400 hover:bg-surface-lighter/60 transition-colors flex items-center gap-2"
                >
                  <Plus className="w-3.5 h-3.5 shrink-0" />
                  <span className="font-semibold">Create Organization</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {}
      <nav className="flex-1 px-5 pt-6 pb-4 overflow-y-auto">
        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.12em] px-2.5 mb-3">
          Menu
        </p>
        <div className="space-y-1.5">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => setMobileOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3.5 px-3.5 py-3 rounded-xl text-sm font-medium transition-all duration-200 group relative ${
                  isActive
                    ? "bg-primary-500/10 text-primary-300 border-l-2 border-primary-500"
                    : "text-slate-400 hover:text-slate-100 hover:bg-surface-lighter/30 border-l-2 border-transparent"
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <item.icon
                    className={`w-[17px] h-[17px] shrink-0 transition-colors ${
                      isActive ? "text-primary-400" : "text-slate-500 group-hover:text-slate-300"
                    }`}
                  />
                  <span className="leading-none">{item.label}</span>
                  {isActive && (
                    <span className="ml-auto w-1.5 h-1.5 rounded-full bg-primary-400 shrink-0" />
                  )}
                </>
              )}
            </NavLink>
          ))}
        </div>
      </nav>

      {}
      <div className="px-5 py-4 border-t border-border/30 shrink-0">
        <div className="flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-surface-lighter/20 transition-colors group cursor-default">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white text-sm font-bold shrink-0">
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-slate-200 truncate leading-tight">{user?.name}</p>
            <p className="text-[11px] text-slate-500 truncate mt-0.5">{user?.email}</p>
          </div>
          <button
            id="logout-btn"
            onClick={handleLogout}
            className="p-1.5 rounded-md hover:bg-red-500/15 text-slate-600 hover:text-red-400 transition-all duration-200 shrink-0 opacity-0 group-hover:opacity-100"
            title="Logout"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {}
      <button
        onClick={() => setMobileOpen(!mobileOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bg-surface-light border border-border text-slate-400 hover:text-white transition-colors"
      >
        {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/70 backdrop-blur-sm z-40"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-40 w-60 bg-surface-light border-r border-border/40 transition-transform duration-300 lg:translate-x-0 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {sidebarContent}
      </aside>
    </>
  );
};

export default Sidebar;
