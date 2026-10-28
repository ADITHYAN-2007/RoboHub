import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  Cpu,
  CheckCircle,
  Repeat,
  Wrench,
  CalendarDays,
  FolderGit2,
  Package,
  AlertTriangle,
  ArrowUpRight,
  Plus,
  FileSpreadsheet,
} from 'lucide-react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  LineChart,
  Line,
  CartesianGrid,
} from 'recharts';
import { useAuth } from '../../context/AuthContext.js';
import { apiClient } from '../../api/client.js';
import { StatusBadge } from '../../components/common/StatusBadge.js';

const STATUS_COLORS: Record<string, string> = {
  AVAILABLE: '#10B981', // emerald-500
  IN_USE: '#06B6D4', // cyan-500
  UNDER_MAINTENANCE: '#F59E0B', // amber-500
  DAMAGED: '#EF4444', // red-500
  RESERVED: '#8B5CF6', // purple-500
};

export const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        setLoading(true);
        const res = await apiClient.get('/analytics/dashboard');
        if (res.data.success) {
          setData(res.data.data);
        }
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to load dashboard data.');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, [user]);

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 bg-slate-900 rounded w-1/4" />
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-24 bg-slate-900 border border-slate-800 rounded-xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="h-64 bg-slate-900 border border-slate-800 rounded-xl" />
          <div className="h-64 bg-slate-900 border border-slate-800 rounded-xl" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-slate-900 border border-rose-900/50 rounded-xl text-center">
        <AlertTriangle className="w-8 h-8 text-rose-400 mx-auto mb-2" />
        <h3 className="text-sm font-semibold text-white">Dashboard Unavailable</h3>
        <p className="text-xs text-slate-400 mt-1">{error}</p>
      </div>
    );
  }

  const kpi = data?.kpi || {};
  const statusBreakdown = data?.equipmentStatusBreakdown || [];
  const categoryDistribution = data?.categoryDistribution || [];
  const reservationTrend = data?.reservationTrend || [];
  const inventoryConsumption = data?.inventoryConsumption || [];

  return (
    <div className="space-y-6">
      {/* Editorial Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-2 border-b border-slate-800/80">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <span>Laboratory Mission Control</span>
            <span className="text-xs font-mono font-normal px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
              {user?.role}
            </span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time status of university robotics testbeds, active research teams, and equipment rosters.
          </p>
        </div>

        {/* Quick Action Group */}
        <div className="flex items-center gap-2">
          <Link
            to="/reservations"
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-950 bg-cyan-400 hover:bg-cyan-300 rounded-lg transition-colors whitespace-nowrap"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Book Equipment</span>
          </Link>
          {['SUPER_ADMIN', 'LAB_ADMIN'].includes(user?.role || '') && (
            <Link
              to="/admin/reports"
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg transition-colors whitespace-nowrap"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </Link>
          )}
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <div className="p-3.5 bg-slate-900 border border-slate-800 rounded-xl">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[11px] font-medium uppercase tracking-wider">Total Units</span>
            <Cpu className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-bold text-white font-mono tabular-nums">
            {kpi.totalEquipment || 0}
          </div>
          <div className="text-[11px] text-emerald-400 mt-0.5 flex items-center gap-1 font-mono">
            <span>{kpi.availableEquipment || 0} available</span>
          </div>
        </div>

        <div className="p-3.5 bg-slate-900 border border-slate-800 rounded-xl">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[11px] font-medium uppercase tracking-wider">In Active Use</span>
            <Repeat className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-bold text-white font-mono tabular-nums">
            {kpi.inUseEquipment || 0}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5 font-mono">
            {kpi.activeCheckoutsCount || 0} active loans
          </div>
        </div>

        <div className="p-3.5 bg-slate-900 border border-slate-800 rounded-xl">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[11px] font-medium uppercase tracking-wider">Reservations</span>
            <CalendarDays className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-white font-mono tabular-nums">
            {kpi.pendingReservations || 0}
          </div>
          <div className="text-[11px] text-amber-400 mt-0.5">Pending review</div>
        </div>

        <div className="p-3.5 bg-slate-900 border border-slate-800 rounded-xl">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[11px] font-medium uppercase tracking-wider">Active Projects</span>
            <FolderGit2 className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-2xl font-bold text-white font-mono tabular-nums">
            {kpi.activeProjects || 0}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">Autonomous & Robotics</div>
        </div>

        <div className="p-3.5 bg-slate-900 border border-slate-800 rounded-xl">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[11px] font-medium uppercase tracking-wider">Low Stock</span>
            <Package className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-2xl font-bold text-rose-400 font-mono tabular-nums">
            {kpi.lowStockItemsCount || 0}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">Threshold alerts</div>
        </div>
      </div>

      {/* Role-Specific Spotlight Banner (For Students / Faculty) */}
      {user?.role === 'STUDENT' && (
        <div className="p-4 bg-gradient-to-r from-slate-900 to-slate-900/60 border border-cyan-900/40 rounded-xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <span>Welcome back, {user.fullName}</span>
              <span className="text-[10px] font-mono text-cyan-400">{user.collegeId}</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              You currently have <span className="text-white font-mono tabular-nums">{kpi.myUpcoming || 0}</span> upcoming reservations and are enrolled in <span className="text-white font-mono tabular-nums">{kpi.myProjects || 0}</span> robotics research projects.
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Link
              to="/reservations"
              className="px-3 py-1.5 text-xs font-semibold text-slate-900 bg-cyan-400 hover:bg-cyan-300 rounded-lg transition-colors"
            >
              My Bookings
            </Link>
            <Link
              to="/projects"
              className="px-3 py-1.5 text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700 transition-colors"
            >
              My Team
            </Link>
          </div>
        </div>
      )}

      {/* Visual Analytics Charts Section (Recharts) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Equipment Category Distribution */}
        <div className="p-5 bg-slate-900 border border-slate-800 rounded-xl">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Equipment Category Roster
              </h3>
              <p className="text-[11px] text-slate-500">Distribution of robotics hardware across categories</p>
            </div>
          </div>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryDistribution} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis
                  dataKey="_id"
                  tick={{ fill: '#94a3b8', fontSize: 10 }}
                  interval={0}
                  angle={-25}
                  textAnchor="end"
                />
                <YAxis tick={{ fill: '#94a3b8', fontSize: 10 }} allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: '#334155',
                    borderRadius: '8px',
                    fontSize: '11px',
                  }}
                />
                <Bar dataKey="count" name="Units" fill="#06b6d4" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Equipment Status Distribution (Donut / Pie) */}
        <div className="p-5 bg-slate-900 border border-slate-800 rounded-xl">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Equipment Operational Status
              </h3>
              <p className="text-[11px] text-slate-500">Available vs In-Use vs Scheduled Maintenance</p>
            </div>
          </div>
          <div className="h-56 flex flex-col sm:flex-row items-center justify-between">
            <div className="w-full sm:w-1/2 h-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusBreakdown}
                    dataKey="count"
                    nameKey="_id"
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={75}
                    paddingAngle={3}
                  >
                    {statusBreakdown.map((entry: any, index: number) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={STATUS_COLORS[entry._id] || '#64748b'}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderColor: '#334155',
                      borderRadius: '8px',
                      fontSize: '11px',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="w-full sm:w-1/2 space-y-2 mt-2 sm:mt-0 text-xs">
              {statusBreakdown.map((item: any) => (
                <div key={item._id} className="flex items-center justify-between text-slate-300">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: STATUS_COLORS[item._id] || '#64748b' }}
                    />
                    <span className="text-xs">{item._id.replace(/_/g, ' ')}</span>
                  </div>
                  <span className="font-mono tabular-nums font-semibold">{item.count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Secondary Row: Fast Navigation Cards & Inventory Quick Scan */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Quick Access Card */}
        <div className="p-5 bg-slate-900 border border-slate-800 rounded-xl space-y-3">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Rapid Operations
          </h3>
          <div className="space-y-2">
            <Link
              to="/equipment"
              className="flex items-center justify-between p-2.5 rounded-lg bg-slate-950 border border-slate-800 hover:border-slate-700 transition-colors group"
            >
              <div className="flex items-center gap-2.5">
                <Cpu className="w-4 h-4 text-cyan-400" />
                <span className="text-xs text-slate-200 group-hover:text-cyan-400">Explore Equipment Catalog</span>
              </div>
              <ArrowUpRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-slate-200" />
            </Link>

            <Link
              to="/reservations"
              className="flex items-center justify-between p-2.5 rounded-lg bg-slate-950 border border-slate-800 hover:border-slate-700 transition-colors group"
            >
              <div className="flex items-center gap-2.5">
                <CalendarDays className="w-4 h-4 text-emerald-400" />
                <span className="text-xs text-slate-200 group-hover:text-emerald-400">Schedule Workcell Slot</span>
              </div>
              <ArrowUpRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-slate-200" />
            </Link>

            <Link
              to="/safety"
              className="flex items-center justify-between p-2.5 rounded-lg bg-slate-950 border border-slate-800 hover:border-slate-700 transition-colors group"
            >
              <div className="flex items-center gap-2.5">
                <CheckCircle className="w-4 h-4 text-purple-400" />
                <span className="text-xs text-slate-200 group-hover:text-purple-400">Safety SOPs & Guidelines</span>
              </div>
              <ArrowUpRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-slate-200" />
            </Link>

            <Link
              to="/issues"
              className="flex items-center justify-between p-2.5 rounded-lg bg-slate-950 border border-slate-800 hover:border-slate-700 transition-colors group"
            >
              <div className="flex items-center gap-2.5">
                <AlertTriangle className="w-4 h-4 text-rose-400" />
                <span className="text-xs text-slate-200 group-hover:text-rose-400">Report Broken Hardware</span>
              </div>
              <ArrowUpRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-slate-200" />
            </Link>
          </div>
        </div>

        {/* Top Consumed Components */}
        <div className="lg:col-span-2 p-5 bg-slate-900 border border-slate-800 rounded-xl">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Inventory Activity
              </h3>
              <p className="text-[11px] text-slate-500">Most requested parts by student robotics teams</p>
            </div>
            <Link to="/inventory" className="text-xs text-cyan-400 hover:text-cyan-300 font-medium">
              View All Stock →
            </Link>
          </div>

          <div className="divide-y divide-slate-800/80">
            {inventoryConsumption.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-500">
                No recent inventory consumption recorded.
              </div>
            ) : (
              inventoryConsumption.map((item: any, idx: number) => (
                <div key={idx} className="py-2.5 flex items-center justify-between text-xs">
                  <div className="min-w-0 pr-4">
                    <div className="font-medium text-slate-200 truncate">{item.name}</div>
                    <div className="text-[11px] text-slate-500">Standard consumable part</div>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="font-mono tabular-nums text-cyan-400 font-semibold">
                      {item.totalQuantityOut} {item.unit}
                    </span>
                    <span className="text-[10px] text-slate-500 block">issued</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
