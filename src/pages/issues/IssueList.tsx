import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  AlertTriangle,
  Plus,
  CheckCircle2,
  Clock,
  User,
  Cpu,
  ArrowRight,
} from 'lucide-react';
import { apiClient } from '../../api/client.js';
import { useAuth } from '../../context/AuthContext.js';
import { StatusBadge } from '../../components/common/StatusBadge.js';
import type { IssueReport, Equipment, IssueStatus, IssueSeverity } from '../../types/index.js';

export const IssueList: React.FC = () => {
  const [searchParams] = useSearchParams();
  const reportForEquipment = searchParams.get('reportFor');

  const { user, hasRole } = useAuth();
  const isTechnicianOrAdmin = hasRole('SUPER_ADMIN', 'LAB_ADMIN', 'LAB_TECHNICIAN');

  const [issues, setIssues] = useState<IssueReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [severityFilter, setSeverityFilter] = useState('ALL');

  // Report Issue Modal
  const [showReportModal, setShowReportModal] = useState(Boolean(reportForEquipment));
  const [equipmentList, setEquipmentList] = useState<Equipment[]>([]);
  const [equipmentId, setEquipmentId] = useState(reportForEquipment || '');
  const [category, setCategory] = useState('Mechanical Malfunction');
  const [severity, setSeverity] = useState<IssueSeverity>('MEDIUM');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Update Status Modal
  const [statusTarget, setStatusTarget] = useState<IssueReport | null>(null);
  const [newStatus, setNewStatus] = useState<IssueStatus>('IN_PROGRESS');
  const [resolutionNotes, setResolutionNotes] = useState('');

  const fetchIssues = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (statusFilter !== 'ALL') params.append('status', statusFilter);
      if (severityFilter !== 'ALL') params.append('severity', severityFilter);

      const res = await apiClient.get(`/issues?${params.toString()}`);
      if (res.data.success) {
        setIssues(res.data.data.items);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIssues();
  }, [statusFilter, severityFilter]);

  useEffect(() => {
    apiClient.get('/equipment?limit=100').then((res) => {
      if (res.data.success) {
        setEquipmentList(res.data.data.items || []);
        if (!equipmentId && res.data.data.items?.length > 0) {
          setEquipmentId(res.data.data.items[0]._id);
        }
      }
    });
  }, []);

  const handleReportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await apiClient.post('/issues', {
        equipmentId,
        category,
        severity,
        description,
      });

      if (res.data.success) {
        setShowReportModal(false);
        setDescription('');
        fetchIssues();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to submit report.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!statusTarget) return;

    try {
      const res = await apiClient.patch(`/issues/${statusTarget._id}`, {
        status: newStatus,
        resolutionNotes,
      });

      if (res.data.success) {
        setStatusTarget(null);
        setResolutionNotes('');
        fetchIssues();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to update issue status.');
    }
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-slate-800">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <span>Hardware Issues & Damage Reports</span>
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400">
              {issues.length} reports
            </span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Student and faculty defect reporting with urgent alerting for critical safety hazards.
          </p>
        </div>

        <button
          onClick={() => setShowReportModal(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-950 bg-rose-400 hover:bg-rose-300 rounded-lg transition-colors whitespace-nowrap shadow-xs"
        >
          <AlertTriangle className="w-3.5 h-3.5" />
          <span>Report Damaged Hardware</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 p-1 rounded-lg text-xs">
          {['ALL', 'OPEN', 'ACKNOWLEDGED', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1 rounded-md font-medium transition-colors ${
                statusFilter === st
                  ? 'bg-slate-800 text-white shadow-xs font-semibold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {st}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 p-1 rounded-lg text-xs">
          {['ALL', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].map((sev) => (
            <button
              key={sev}
              onClick={() => setSeverityFilter(sev)}
              className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                severityFilter === sev
                  ? 'bg-slate-800 text-rose-400 shadow-xs font-semibold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {sev}
            </button>
          ))}
        </div>
      </div>

      {/* Issues Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/70 border-b border-slate-800 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              <tr>
                <th className="py-3 px-4">Equipment Unit</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Severity</th>
                <th className="py-3 px-4">Reporter</th>
                <th className="py-3 px-4">Reported On</th>
                <th className="py-3 px-4">Description</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {issues.map((iss) => (
                <tr key={iss._id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-3 px-4">
                    <div className="font-semibold text-white">{iss.equipment?.name}</div>
                    <div className="text-[11px] text-cyan-400 font-mono">
                      {iss.equipment?.equipmentCode}
                    </div>
                  </td>
                  <td className="py-3 px-4 text-slate-300">{iss.category}</td>
                  <td className="py-3 px-4">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-mono uppercase font-bold border ${
                        iss.severity === 'CRITICAL'
                          ? 'bg-rose-950 text-rose-300 border-rose-800 animate-pulse'
                          : iss.severity === 'HIGH'
                          ? 'bg-rose-950/50 text-rose-400 border-rose-900'
                          : iss.severity === 'MEDIUM'
                          ? 'bg-amber-950/50 text-amber-400 border-amber-900'
                          : 'bg-slate-800 text-slate-400 border-slate-700'
                      }`}
                    >
                      {iss.severity}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="text-white font-medium">{iss.reporter?.fullName}</div>
                    <div className="text-[11px] text-slate-500 font-mono">
                      {iss.reporter?.collegeId}
                    </div>
                  </td>
                  <td className="py-3 px-4 font-mono text-[11px] text-slate-400">
                    {new Date(iss.createdAt).toLocaleDateString()}
                  </td>
                  <td className="py-3 px-4 max-w-xs truncate text-slate-300">
                    {iss.description}
                  </td>
                  <td className="py-3 px-4">
                    <StatusBadge status={iss.status} />
                  </td>
                  <td className="py-3 px-4 text-right">
                    {isTechnicianOrAdmin && (
                      <button
                        onClick={() => {
                          setStatusTarget(iss);
                          setNewStatus(iss.status);
                          setResolutionNotes(iss.resolutionNotes || '');
                        }}
                        className="px-2.5 py-1 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded transition-colors"
                      >
                        Manage
                      </button>
                    )}
                  </td>
                </tr>
              ))}

              {!loading && issues.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-xs text-slate-500">
                    No hardware issue reports found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Report Modal */}
      {showReportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6">
            <h3 className="text-base font-bold text-white mb-1">Report Equipment Issue</h3>
            <p className="text-xs text-slate-400 mb-4">
              Alert the laboratory technician team about malfunctioning or damaged robotics hardware.
            </p>

            <form onSubmit={handleReportSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Affected Equipment</label>
                <select
                  required
                  value={equipmentId}
                  onChange={(e) => setEquipmentId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white"
                >
                  {equipmentList.map((eq) => (
                    <option key={eq._id} value={eq._id}>
                      {eq.name} ({eq.equipmentCode})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Defect Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white"
                  >
                    <option value="Mechanical Malfunction">Mechanical Malfunction</option>
                    <option value="Burned Driver / Motor">Burned Driver / Motor</option>
                    <option value="Sensor Failure">Sensor Failure</option>
                    <option value="Firmware / Communication">Firmware / Communication</option>
                    <option value="Cracked Frame / Structural">Cracked Frame / Structural</option>
                    <option value="Emergency Stop Tripped">Emergency Stop Tripped</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Severity Level</label>
                  <select
                    value={severity}
                    onChange={(e) => setSeverity(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white"
                  >
                    <option value="LOW">LOW (Cosmetic / Minor)</option>
                    <option value="MEDIUM">MEDIUM (Degraded operation)</option>
                    <option value="HIGH">HIGH (Inoperable hardware)</option>
                    <option value="CRITICAL">CRITICAL (Safety / Fire Hazard)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Failure Description</label>
                <textarea
                  rows={3}
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Detail the sequence of events, symptoms, error codes, burning odor, or broken parts..."
                  className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowReportModal(false)}
                  className="px-3 py-1.5 text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-1.5 font-semibold text-slate-950 bg-rose-400 hover:bg-rose-300 rounded-lg transition-colors"
                >
                  {submitting ? 'Submitting...' : 'Transmit Issue Report'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Update Status Modal (Staff) */}
      {statusTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6">
            <h3 className="text-base font-bold text-white mb-1">Update Issue Status</h3>
            <p className="text-xs text-slate-400 mb-4">
              Managing report #{statusTarget._id.slice(-6)} for {statusTarget.equipment?.name}.
            </p>

            <form onSubmit={handleUpdateStatus} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Issue Workflow Status</label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value as any)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white"
                >
                  <option value="OPEN">OPEN</option>
                  <option value="ACKNOWLEDGED">ACKNOWLEDGED (Assigned to tech)</option>
                  <option value="IN_PROGRESS">IN_PROGRESS (Bench repair active)</option>
                  <option value="RESOLVED">RESOLVED (Repairs completed)</option>
                  <option value="CLOSED">CLOSED (Verified)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Resolution Notes</label>
                <textarea
                  rows={3}
                  value={resolutionNotes}
                  onChange={(e) => setResolutionNotes(e.target.value)}
                  placeholder="Technician diagnostic findings, components replaced, calibration test outcome..."
                  className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setStatusTarget(null)}
                  className="px-3 py-1.5 text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 font-semibold text-slate-950 bg-cyan-400 hover:bg-cyan-300 rounded-lg"
                >
                  Update Status
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
