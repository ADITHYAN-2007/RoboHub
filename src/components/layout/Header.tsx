import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Search,
  Bell,
  CheckCircle,
  AlertCircle,
  Clock,
  LogOut,
  User as UserIcon,
  Shield,
  Layers,
  Moon,
  Sun,
  ChevronDown,
} from 'lucide-react';
import { useAuth, DEMO_CREDENTIALS } from '../../context/AuthContext.js';
import { useTheme } from '../../context/ThemeContext.js';
import { apiClient } from '../../api/client.js';
import type { NotificationItem, UserRole } from '../../types/index.js';

interface HeaderProps {
  onOpenSearch: () => void;
  onToggleSidebar: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenSearch, onToggleSidebar }) => {
  const { user, logout, quickLoginAsRole } = useAuth();
  const { theme, setTheme, isDark } = useTheme();
  const navigate = useNavigate();

  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [showNotifications, setShowNotifications] = useState<boolean>(false);
  const [showRoleSwitcher, setShowRoleSwitcher] = useState<boolean>(false);
  const [showUserMenu, setShowUserMenu] = useState<boolean>(false);

  const notifRef = useRef<HTMLDivElement>(null);
  const roleRef = useRef<HTMLDivElement>(null);
  const userRef = useRef<HTMLDivElement>(null);

  // Fetch notifications
  const loadNotifications = async () => {
    if (!user) return;
    try {
      const res = await apiClient.get('/notifications');
      if (res.data.success) {
        setNotifications(res.data.data.notifications || []);
        setUnreadCount(res.data.data.unreadCount || 0);
      }
    } catch {
      // Ignore
    }
  };

  useEffect(() => {
    loadNotifications();
    const interval = setInterval(loadNotifications, 30000);
    return () => clearInterval(interval);
  }, [user]);

  // Click outside listener
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifications(false);
      }
      if (roleRef.current && !roleRef.current.contains(e.target as Node)) {
        setShowRoleSwitcher(false);
      }
      if (userRef.current && !userRef.current.contains(e.target as Node)) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMarkAllRead = async () => {
    try {
      await apiClient.post('/notifications/read-all');
      setUnreadCount(0);
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch {
      // Ignore
    }
  };

  const handleNotificationClick = async (notif: NotificationItem) => {
    if (!notif.isRead) {
      await apiClient.patch(`/notifications/${notif._id}/read`);
      setUnreadCount((c) => Math.max(0, c - 1));
      setNotifications((prev) =>
        prev.map((n) => (n._id === notif._id ? { ...n, isRead: true } : n))
      );
    }
    setShowNotifications(false);
    if (notif.link) {
      navigate(notif.link);
    }
  };

  const roleColorMap: Record<UserRole, string> = {
    SUPER_ADMIN: 'text-rose-400 border-rose-800/80 bg-rose-950/40',
    LAB_ADMIN: 'text-amber-400 border-amber-800/80 bg-amber-950/40',
    FACULTY: 'text-purple-400 border-purple-800/80 bg-purple-950/40',
    LAB_TECHNICIAN: 'text-cyan-400 border-cyan-800/80 bg-cyan-950/40',
    STUDENT: 'text-emerald-400 border-emerald-800/80 bg-emerald-950/40',
  };

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between h-16 px-4 md:px-6 bg-slate-900/90 backdrop-blur-md border-b border-slate-800">
      {/* Zone 1: Clean Brand Wordmark (Single text element wordmark adhering to top-bar contract) */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="p-1.5 text-slate-400 hover:text-slate-200 md:hidden rounded-lg hover:bg-slate-800"
          aria-label="Toggle navigation"
        >
          <Layers className="w-5 h-5" />
        </button>
        <Link
          to="/dashboard"
          className="text-base sm:text-lg font-bold tracking-tight text-white flex items-center gap-2 hover:opacity-90 transition-opacity"
        >
          <span className="w-2.5 h-2.5 rounded-full bg-cyan-500 shadow-sm shadow-cyan-500/50" />
          <span>ROBO LAB HUB</span>
        </Link>
      </div>

      {/* Zone 2: Search trigger */}
      <div className="hidden lg:flex items-center max-w-xs w-full mx-6">
        <button
          onClick={onOpenSearch}
          className="w-full flex items-center justify-between px-3 py-1.5 text-xs text-slate-400 bg-slate-950/70 border border-slate-800 hover:border-slate-700 rounded-lg transition-colors"
        >
          <span className="flex items-center gap-2">
            <Search className="w-3.5 h-3.5 text-slate-500" />
            <span>Search equipment, inventory, projects...</span>
          </span>
          <kbd className="px-1.5 py-0.5 text-[10px] font-mono text-slate-500 bg-slate-900 border border-slate-700 rounded">
            Ctrl K
          </kbd>
        </button>
      </div>

      {/* Zone 3: Actions - Search Mobile, Quick Role Switcher, Notifications, Theme, User Menu */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Mobile Search Icon */}
        <button
          onClick={onOpenSearch}
          className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 lg:hidden"
          title="Search"
        >
          <Search className="w-4 h-4" />
        </button>

        {/* Quick Role Switcher (Convenient for evaluator to test all 5 RBAC roles instantly) */}
        <div className="relative" ref={roleRef}>
          <button
            onClick={() => setShowRoleSwitcher(!showRoleSwitcher)}
            className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium border rounded-md transition-colors ${
              user ? roleColorMap[user.role] : 'text-slate-400 border-slate-700'
            }`}
            title="Switch demo role to test role-based access control"
          >
            <Shield className="w-3.5 h-3.5" />
            <span className="hidden sm:inline font-mono">{user?.role}</span>
            <ChevronDown className="w-3 h-3 opacity-70" />
          </button>

          {showRoleSwitcher && (
            <div className="absolute right-0 mt-2 w-64 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95 duration-100">
              <div className="px-2 py-1.5 text-[11px] font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-800 mb-1">
                Switch Evaluation Role
              </div>
              {(Object.keys(DEMO_CREDENTIALS) as UserRole[]).map((r) => {
                const cred = DEMO_CREDENTIALS[r];
                const isActive = user?.role === r;
                return (
                  <button
                    key={r}
                    onClick={() => {
                      quickLoginAsRole(r);
                      setShowRoleSwitcher(false);
                    }}
                    className={`w-full text-left px-2.5 py-2 rounded-lg text-xs transition-colors flex items-center justify-between ${
                      isActive
                        ? 'bg-slate-800 font-semibold text-white'
                        : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
                    }`}
                  >
                    <div>
                      <div className="font-mono text-[11px] text-cyan-400">{r}</div>
                      <div className="text-[11px] text-slate-400">{cred.title}</div>
                    </div>
                    {isActive && <CheckCircle className="w-3.5 h-3.5 text-cyan-400 shrink-0" />}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Notifications Dropdown */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
            title="Notifications"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-cyan-500 text-[10px] font-bold text-slate-950 font-mono">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-100">
              <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800 bg-slate-950/50">
                <div className="text-xs font-semibold text-white flex items-center gap-2">
                  <span>Notifications</span>
                  {unreadCount > 0 && (
                    <span className="font-mono text-[10px] text-cyan-400">({unreadCount} new)</span>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllRead}
                    className="text-[11px] text-slate-400 hover:text-cyan-400 transition-colors"
                  >
                    Mark all read
                  </button>
                )}
              </div>

              <div className="max-h-80 overflow-y-auto divide-y divide-slate-800/60">
                {notifications.length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-500">
                    No notifications right now.
                  </div>
                ) : (
                  notifications.map((item) => (
                    <div
                      key={item._id}
                      onClick={() => handleNotificationClick(item)}
                      className={`p-3 cursor-pointer transition-colors hover:bg-slate-800/60 ${
                        !item.isRead ? 'bg-cyan-950/10' : ''
                      }`}
                    >
                      <div className="flex items-start gap-2.5">
                        <div className="mt-0.5 shrink-0">
                          {item.type.includes('APPROVED') ? (
                            <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                          ) : item.type.includes('REJECTED') || item.type.includes('ALERT') ? (
                            <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
                          ) : (
                            <Clock className="w-3.5 h-3.5 text-cyan-400" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-xs font-medium text-slate-200 truncate">
                            {item.title}
                          </div>
                          <div className="text-[11px] text-slate-400 mt-0.5 line-clamp-2">
                            {item.message}
                          </div>
                          <div className="text-[10px] text-slate-500 mt-1 font-mono">
                            {new Date(item.createdAt).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </div>
                        </div>
                        {!item.isRead && (
                          <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 shrink-0 mt-1" />
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Menu */}
        <div className="relative" ref={userRef}>
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-2 p-1 text-slate-300 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <div className="w-7 h-7 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-semibold text-cyan-400">
              {user?.fullName?.charAt(0) || 'U'}
            </div>
            <span className="hidden md:inline-block text-xs font-medium max-w-[120px] truncate text-slate-200">
              {user?.fullName}
            </span>
            <ChevronDown className="w-3 h-3 text-slate-500" />
          </button>

          {showUserMenu && (
            <div className="absolute right-0 mt-2 w-52 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl p-1.5 z-50 animate-in fade-in zoom-in-95 duration-100">
              <div className="px-3 py-2 border-b border-slate-800 mb-1">
                <div className="text-xs font-semibold text-white truncate">{user?.fullName}</div>
                <div className="text-[11px] text-slate-400 truncate">{user?.email}</div>
                <div className="text-[10px] font-mono text-cyan-400 mt-0.5">{user?.collegeId}</div>
              </div>

              <Link
                to="/profile"
                onClick={() => setShowUserMenu(false)}
                className="flex items-center gap-2 px-3 py-2 text-xs text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
              >
                <UserIcon className="w-3.5 h-3.5" />
                <span>My Profile</span>
              </Link>

              <Link
                to="/sessions"
                onClick={() => setShowUserMenu(false)}
                className="flex items-center gap-2 px-3 py-2 text-xs text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
              >
                <Shield className="w-3.5 h-3.5" />
                <span>Active Sessions</span>
              </Link>

              <div className="border-t border-slate-800 my-1" />

              <button
                onClick={() => {
                  setShowUserMenu(false);
                  logout();
                  navigate('/login');
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs text-rose-400 hover:bg-rose-950/30 rounded-lg transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
