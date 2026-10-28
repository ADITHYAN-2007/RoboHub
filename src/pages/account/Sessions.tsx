import React, { useState, useEffect } from 'react';
import { Shield, Laptop, Smartphone, Trash2, RefreshCw, AlertTriangle } from 'lucide-react';
import { apiClient } from '../../api/client.js';
import type { UserSession } from '../../types/index.js';

export const Sessions: React.FC = () => {
  const [sessions, setSessions] = useState<UserSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [revokingId, setRevokingId] = useState<string | null>(null);

  const fetchSessions = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get('/auth/sessions');
      if (res.data.success) {
        setSessions(res.data.data || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  const handleRevoke = async (id: string) => {
    try {
      setRevokingId(id);
      const res = await apiClient.delete(`/auth/sessions/${id}`);
      if (res.data.success) {
        setSessions((prev) => prev.filter((s) => s._id !== id));
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to revoke session.');
    } finally {
      setRevokingId(null);
    }
  };

  const handleRevokeAllOther = async () => {
    if (!confirm('Revoke all other active sessions across devices?')) return;
    try {
      const res = await apiClient.delete('/auth/sessions');
      if (res.data.success) {
        fetchSessions();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to revoke other sessions.');
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-slate-800">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <span>Active Login Sessions & Security</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Manage authenticated device sessions, rotate refresh tokens, and revoke unauthorized access.
          </p>
        </div>

        <button
          onClick={handleRevokeAllOther}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-rose-400 bg-rose-950/40 hover:bg-rose-950/70 border border-rose-800/60 rounded-lg transition-colors"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Revoke All Other Sessions</span>
        </button>
      </div>

      <div className="space-y-3">
        {sessions.map((sess) => {
          const isMobile = sess.device === 'Mobile';
          return (
            <div
              key={sess._id}
              className="p-4 bg-slate-900 border border-slate-800 rounded-xl flex items-center justify-between gap-4"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center text-slate-400">
                  {isMobile ? <Smartphone className="w-5 h-5" /> : <Laptop className="w-5 h-5" />}
                </div>

                <div>
                  <div className="text-xs font-semibold text-white flex items-center gap-2">
                    <span>{sess.device} Session</span>
                    <span className="font-mono text-[10px] text-cyan-400">{sess.ip}</span>
                  </div>
                  <div className="text-[11px] text-slate-400 truncate max-w-sm mt-0.5">
                    {sess.browser}
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono mt-1">
                    Last active: {new Date(sess.lastActiveAt).toLocaleString()}
                  </div>
                </div>
              </div>

              <button
                onClick={() => handleRevoke(sess._id)}
                disabled={revokingId === sess._id}
                className="px-2.5 py-1 text-xs font-medium text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors border border-slate-800"
              >
                {revokingId === sess._id ? 'Revoking...' : 'Revoke'}
              </button>
            </div>
          );
        })}

        {!loading && sessions.length === 0 && (
          <div className="p-8 text-center text-xs text-slate-500">
            No active sessions found.
          </div>
        )}
      </div>
    </div>
  );
};
