import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Cpu,
  CalendarDays,
  Repeat,
  FolderGit2,
  Package,
  Wrench,
  AlertTriangle,
  ShieldCheck,
  Users,
  Building2,
  FileSpreadsheet,
  LineChart,
  History,
  Sliders,
  FileCode,
  X,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.js';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { user, hasRole } = useAuth();

  const isStaff = hasRole('SUPER_ADMIN', 'LAB_ADMIN', 'FACULTY', 'LAB_TECHNICIAN');
  const isAdmin = hasRole('SUPER_ADMIN', 'LAB_ADMIN');
  const isTechnician = hasRole('SUPER_ADMIN', 'LAB_ADMIN', 'LAB_TECHNICIAN');

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
      isActive
        ? 'bg-cyan-500/10 text-cyan-400 font-semibold'
        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
    }`;

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-xs md:hidden"
          aria-hidden="true"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed md:sticky top-0 left-0 z-40 h-screen w-64 bg-slate-900 border-r border-slate-800 flex flex-col transition-transform duration-200 ease-in-out md:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand / Logo Top */}
        <div className="flex items-center justify-between h-16 px-4 border-b border-slate-800 md:hidden">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-500" />
            <span className="text-sm font-bold text-white tracking-wide">ROBO LAB HUB</span>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-white rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Groups */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
          {/* Main */}
          <div>
            <div className="px-3 mb-2 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
              Overview
            </div>
            <nav className="space-y-0.5">
              <NavLink to="/dashboard" onClick={onClose} className={navLinkClass}>
                <LayoutDashboard className="w-4 h-4 shrink-0" />
                <span>Dashboard</span>
              </NavLink>
            </nav>
          </div>

          {/* Laboratory Operations */}
          <div>
            <div className="px-3 mb-2 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
              Operations
            </div>
            <nav className="space-y-0.5">
              <NavLink to="/equipment" onClick={onClose} className={navLinkClass}>
                <Cpu className="w-4 h-4 shrink-0" />
                <span>Equipment Roster</span>
              </NavLink>

              <NavLink to="/reservations" onClick={onClose} className={navLinkClass}>
                <CalendarDays className="w-4 h-4 shrink-0" />
                <span>Reservations</span>
              </NavLink>

              <NavLink to="/checkouts" onClick={onClose} className={navLinkClass}>
                <Repeat className="w-4 h-4 shrink-0" />
                <span>Borrow & Check-out</span>
              </NavLink>
            </nav>
          </div>

          {/* Research & Innovation */}
          <div>
            <div className="px-3 mb-2 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
              Research & Projects
            </div>
            <nav className="space-y-0.5">
              <NavLink to="/projects" onClick={onClose} className={navLinkClass}>
                <FolderGit2 className="w-4 h-4 shrink-0" />
                <span>Robotics Projects</span>
              </NavLink>

              <NavLink to="/inventory-requests" onClick={onClose} className={navLinkClass}>
                <Package className="w-4 h-4 shrink-0" />
                <span>Component Requests</span>
              </NavLink>
            </nav>
          </div>

          {/* Hardware & Facility */}
          <div>
            <div className="px-3 mb-2 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
              Hardware & Safety
            </div>
            <nav className="space-y-0.5">
              <NavLink to="/inventory" onClick={onClose} className={navLinkClass}>
                <Package className="w-4 h-4 shrink-0" />
                <span>Components Inventory</span>
              </NavLink>

              {isTechnician && (
                <NavLink to="/maintenance" onClick={onClose} className={navLinkClass}>
                  <Wrench className="w-4 h-4 shrink-0" />
                  <span>Maintenance Queue</span>
                </NavLink>
              )}

              <NavLink to="/issues" onClick={onClose} className={navLinkClass}>
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>Equipment Issues</span>
              </NavLink>

              <NavLink to="/safety" onClick={onClose} className={navLinkClass}>
                <ShieldCheck className="w-4 h-4 shrink-0" />
                <span>Safety Guidelines</span>
              </NavLink>
            </nav>
          </div>

          {/* Administration Modules */}
          {isAdmin && (
            <div>
              <div className="px-3 mb-2 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                Laboratory Administration
              </div>
              <nav className="space-y-0.5">
                <NavLink to="/admin/users" onClick={onClose} className={navLinkClass}>
                  <Users className="w-4 h-4 shrink-0" />
                  <span>User Accounts</span>
                </NavLink>

                <NavLink to="/admin/laboratories" onClick={onClose} className={navLinkClass}>
                  <Building2 className="w-4 h-4 shrink-0" />
                  <span>Laboratories & Rooms</span>
                </NavLink>

                <NavLink to="/admin/reports" onClick={onClose} className={navLinkClass}>
                  <FileSpreadsheet className="w-4 h-4 shrink-0" />
                  <span>Reports & CSV Export</span>
                </NavLink>

                <NavLink to="/admin/analytics" onClick={onClose} className={navLinkClass}>
                  <LineChart className="w-4 h-4 shrink-0" />
                  <span>System Analytics</span>
                </NavLink>

                <NavLink to="/admin/audit-logs" onClick={onClose} className={navLinkClass}>
                  <History className="w-4 h-4 shrink-0" />
                  <span>Audit Event Stream</span>
                </NavLink>

                <NavLink to="/admin/settings" onClick={onClose} className={navLinkClass}>
                  <Sliders className="w-4 h-4 shrink-0" />
                  <span>Lab Settings</span>
                </NavLink>
              </nav>
            </div>
          )}

          {/* Developer / Documentation */}
          <div>
            <div className="px-3 mb-2 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
              Integration
            </div>
            <nav className="space-y-0.5">
              <NavLink to="/api-docs" onClick={onClose} className={navLinkClass}>
                <FileCode className="w-4 h-4 shrink-0" />
                <span>REST API Specs</span>
              </NavLink>
            </nav>
          </div>
        </div>

        {/* Footer User Profile Summary */}
        <div className="p-3 border-t border-slate-800 bg-slate-950/40">
          <div className="flex items-center gap-2.5 px-2 py-1.5">
            <div className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-xs text-cyan-400 shrink-0">
              {user?.fullName?.charAt(0)}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-xs font-semibold text-slate-200 truncate">{user?.fullName}</div>
              <div className="text-[10px] text-slate-400 font-mono truncate">{user?.role}</div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
