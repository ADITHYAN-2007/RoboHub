import React, { useState, useEffect } from 'react';
import { History, Search, Shield, User, Clock, Eye } from 'lucide-react';
import { apiClient } from '../../api/client.js';
import type { AuditLog } from '../../types/index.js';

export const AuditLogs: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionFilter, setActionFilter] = useState('ALL');
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (actionFilter !== 'ALL') params.append('action', actionFilter);

      const res = await apiClient.get(`/audit-logs?${params.toString()}`);
      if (res.data.success) {
        setLogs(res.data.data.logs || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [actionFilter]);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="pb-3 border-b border-slate-800">
        <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
          <span>Security Audit Trail & Event Stream</span>
          <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400">
            Immutable Ledger
          </span>
        </h1>
        <p className="text-xs text-slate-400 mt-0.5">
          Tamper-evident record of administrative operations, equipment checkouts, inventory dispensations, and role escalations.
        </p>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-1 bg-slate-900 border border-slate-800 p-1 rounded-lg w-fit text-xs">
        {[
          'ALL',
          'LOGIN',
          'ROLE_CHANGED',
          'USER_STATUS_CHANGED',
          'EQUIPMENT_CREATED',
          'EQUIPMENT_STATUS_CHANGED',
          'CHECKOUT',
          'CHECKIN',
          'INVENTORY_ADJUSTED',
          'MAINTENANCE_COMPLETED',
        ].map((act) => (
          <button
            key={act}
            onClick={() => setActionFilter(act)}
            className={`px-2.5 py-1 rounded-md font-mono text-[11px] transition-colors ${
              actionFilter === act
                ? 'bg-slate-800 text-cyan-400 shadow-xs font-semibold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            {act.replace(/_/g, ' ')}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/70 border-b border-slate-800 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              <tr>
                <th className="py-3 px-4">Action</th>
                <th className="py-3 px-4">Actor</th>
                <th className="py-3 px-4">Target Entity</th>
                <th className="py-3 px-4">Details</th>
                <th className="py-3 px-4 font-mono">Timestamp</th>
                <th className="py-3 px-4 text-right">Inspection</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
              {logs.map((log) => (
                <tr key={log._id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-3 px-4">
                    <span className="font-semibold text-cyan-400">{log.action}</span>
                  </td>
                  <td className="py-3 px-4 font-sans text-white">
                    {log.actor ? (
                      <div>
                        <span className="font-medium">{log.actor.fullName}</span>
                        <div className="text-[10px] text-slate-500 font-mono">{log.actor.collegeId}</div>
                      </div>
                    ) : (
                      <span className="text-slate-500">System / Anonymous</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-slate-300">
                    {log.entity}
                    {log.entityId && <span className="text-[10px] text-slate-500 block truncate max-w-[120px]">#{log.entityId}</span>}
                  </td>
                  <td className="py-3 px-4 max-w-sm truncate text-slate-300 font-sans text-xs">
                    {log.details || '—'}
                  </td>
                  <td className="py-3 px-4 text-slate-400">
                    {new Date(log.createdAt).toLocaleString()}
                  </td>
                  <td className="py-3 px-4 text-right">
                    {(log.before || log.after) && (
                      <button
                        onClick={() => setSelectedLog(log)}
                        className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white inline-flex items-center gap-1 font-sans text-[11px]"
                      >
                        <Eye className="w-3 h-3" />
                        <span>Diff</span>
                      </button>
                    )}
                  </td>
                </tr>
              ))}

              {!loading && logs.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-xs font-sans text-slate-500">
                    No audit records matching filter criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Before / After Diff Inspector Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-xl shadow-2xl p-5 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h3 className="text-sm font-semibold text-white">
                Audit Record Inspection — {selectedLog.action}
              </h3>
              <button
                onClick={() => setSelectedLog(null)}
                className="text-slate-400 hover:text-white text-xs"
              >
                Close
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs font-mono">
              <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                <span className="text-[11px] font-semibold text-rose-400 uppercase block mb-1">
                  Before State
                </span>
                <pre className="text-[10px] text-slate-400 overflow-x-auto whitespace-pre-wrap">
                  {selectedLog.before ? JSON.stringify(selectedLog.before, null, 2) : 'No prior state recorded'}
                </pre>
              </div>

              <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                <span className="text-[11px] font-semibold text-emerald-400 uppercase block mb-1">
                  After State
                </span>
                <pre className="text-[10px] text-slate-400 overflow-x-auto whitespace-pre-wrap">
                  {selectedLog.after ? JSON.stringify(selectedLog.after, null, 2) : 'No post state recorded'}
                </pre>
              </div>
            </div>

            <div className="text-[11px] text-slate-500 font-mono">
              Logged from IP: {selectedLog.ip || '127.0.0.1'}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
