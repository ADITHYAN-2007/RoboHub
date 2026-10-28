import React, { useState, useEffect } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  LineChart,
  Line,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { LineChart as ChartIcon, Cpu, DollarSign, Activity } from 'lucide-react';
import { apiClient } from '../../api/client.js';

export const AnalyticsView: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [utilization, setUtilization] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        const [dashRes, utilRes] = await Promise.all([
          apiClient.get('/analytics/dashboard'),
          apiClient.get('/analytics/equipment-utilization'),
        ]);

        if (dashRes.data.success) setData(dashRes.data.data);
        if (utilRes.data.success) setUtilization(utilRes.data.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, []);

  if (loading) {
    return <div className="h-64 bg-slate-900 border border-slate-800 rounded-2xl animate-pulse" />;
  }

  const categoryDistribution = data?.categoryDistribution || [];
  const reservationTrend = data?.reservationTrend || [];
  const maintenanceSummary = data?.maintenanceSummary || [];
  const mostUsed = utilization?.mostUsed || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="pb-3 border-b border-slate-800">
        <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
          <span>Robotics Laboratory Deep Analytics</span>
        </h1>
        <p className="text-xs text-slate-400 mt-0.5">
          Real-time aggregations computed across hardware usage telemetry, booking trends, and maintenance overhead.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Most Utilized Units */}
        <div className="p-5 bg-slate-900 border border-slate-800 rounded-xl space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Most Borrowed Equipment (Checkout Telemetry)
            </h3>
            <Cpu className="w-4 h-4 text-cyan-400" />
          </div>

          <div className="divide-y divide-slate-800/80">
            {mostUsed.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-500">
                Telemetry baseline active. Complete checkouts to populate ranking.
              </div>
            ) : (
              mostUsed.map((item: any, i: number) => (
                <div key={i} className="py-2.5 flex items-center justify-between text-xs">
                  <div>
                    <div className="font-semibold text-white">{item.name}</div>
                    <div className="text-[11px] text-slate-500 font-mono">
                      {item.code} · {item.category}
                    </div>
                  </div>
                  <div className="text-right font-mono">
                    <span className="text-sm font-bold text-cyan-400 tabular-nums">
                      {item.checkoutCount}
                    </span>
                    <span className="text-[10px] text-slate-500 block">loans</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Maintenance Cost by Type */}
        <div className="p-5 bg-slate-900 border border-slate-800 rounded-xl space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Maintenance Cost Distribution ($)
            </h3>
            <DollarSign className="w-4 h-4 text-emerald-400" />
          </div>

          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={maintenanceSummary} margin={{ top: 10, right: 10, left: -10, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="_id" tick={{ fill: '#94a3b8', fontSize: 10 }} />
                <YAxis tick={{ fill: '#94a3b8', fontSize: 10 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: '#334155',
                    borderRadius: '8px',
                    fontSize: '11px',
                  }}
                />
                <Bar dataKey="totalCost" name="Total Expenditure ($)" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category breakdown */}
        <div className="p-5 bg-slate-900 border border-slate-800 rounded-xl space-y-3">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Hardware Assets by Robotics Category
          </h3>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryDistribution} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="_id" tick={{ fill: '#94a3b8', fontSize: 10 }} angle={-20} textAnchor="end" />
                <YAxis tick={{ fill: '#94a3b8', fontSize: 10 }} allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: '#334155',
                    borderRadius: '8px',
                    fontSize: '11px',
                  }}
                />
                <Bar dataKey="count" name="Registered Units" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Reservation Trends */}
        <div className="p-5 bg-slate-900 border border-slate-800 rounded-xl space-y-3">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            7-Day Booking Trajectory
          </h3>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={reservationTrend} margin={{ top: 10, right: 10, left: -20, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="_id" tick={{ fill: '#94a3b8', fontSize: 10 }} />
                <YAxis tick={{ fill: '#94a3b8', fontSize: 10 }} allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: '#334155',
                    borderRadius: '8px',
                    fontSize: '11px',
                  }}
                />
                <Line type="monotone" dataKey="total" name="Total Requests" stroke="#06b6d4" strokeWidth={2} />
                <Line type="monotone" dataKey="approved" name="Approved" stroke="#10b981" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
