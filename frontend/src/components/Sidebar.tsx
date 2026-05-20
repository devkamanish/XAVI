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
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="p-5 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white tracking-tight">XAVI</h1>
            <p className="text-[10px] text-slate-400 -mt-0.5">Incident Management</p>
          </div>
        </div>
      </div>

      {/* Org Switcher */}
      <div className="p-3 border-b border-border">
        <div ref={dropdownRef} className="relative">
          <button
            id="org-switcher"
            onClick={() => setOrgDropdownOpen(!orgDropdownOpen)}
            className="w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-lg bg-surface-lighter/50 hover:bg-surface-lighter transition-colors text-sm"
          >
            <div className="flex items-center gap-2 min-w-0">
              <Building2 className="w-4 h-4 text-primary-400 shrink-0" />
              <span className="truncate text-slate-200">
                {currentOrg?.name || "Select Organization"}
              </span>
            </div>
            <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${orgDropdownOpen ? "rotate-180" : ""}`} />
          </button>

          {orgDropdownOpen && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-surface-light border border-border rounded-lg shadow-xl z-50 overflow-hidden animate-fadeIn">
              {organizations.map((o) => (
                <button
                  key={o.organization._id}
                  onClick={() => {
                    switchOrg(o.organization._id);
                    setOrgDropdownOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2.5 text-sm hover:bg-surface-lighter transition-colors flex items-center justify-between ${
                    currentOrg?._id === o.organization._id ? "text-primary-400 bg-primary-500/10" : "text-slate-300"
                  }`}
                >
                  <span className="truncate">{o.organization.name}</span>
                  <span className={`badge badge-${o.role} !text-[10px] !py-0`}>{o.role}</span>
                </button>
              ))}
              <button
                onClick={() => {
                  navigate("/settings?tab=create");
                  setOrgDropdownOpen(false);
                }}
                className="w-full text-left px-3 py-2.5 text-sm text-primary-400 hover:bg-surface-lighter transition-colors flex items-center gap-2 border-t border-border"
              >
                <Plus className="w-3.5 h-3.5" />
                Create Organization
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            onClick={() => setMobileOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                isActive
                  ? "bg-primary-600/20 text-primary-400 shadow-sm"
                  : "text-slate-400 hover:text-slate-200 hover:bg-surface-lighter/50"
              }`
            }
          >
            <item.icon className="w-[18px] h-[18px]" />
            {item.label}
          </NavLink>
        ))}
      </nav>

      {/* User Section */}
      <div className="p-3 border-t border-border">
        <div className="flex items-center gap-3 px-3 py-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white text-sm font-semibold">
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-slate-200 truncate">{user?.name}</p>
            <p className="text-[11px] text-slate-500 truncate">{user?.email}</p>
          </div>
          <button
            id="logout-btn"
            onClick={handleLogout}
            className="p-1.5 rounded-lg hover:bg-red-500/10 text-slate-400 hover:text-red-400 transition-colors"
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
      {/* Mobile toggle */}
      <button
        onClick={() => setMobileOpen(!mobileOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bg-surface-light border border-border text-slate-300"
      >
        {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 bg-black/60 z-40" onClick={() => setMobileOpen(false)} />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-40 w-64 bg-surface-light border-r border-border transition-transform lg:translate-x-0 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {sidebarContent}
      </aside>
    </>
  );
};

export default Sidebar;
