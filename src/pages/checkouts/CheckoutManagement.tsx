import React, { useState, useEffect } from 'react';
import {
  Repeat,
  Plus,
  ArrowRight,
  AlertTriangle,
  CheckCircle,
  Clock,
  User,
  Cpu,
} from 'lucide-react';
import { apiClient } from '../../api/client.js';
import { useAuth } from '../../context/AuthContext.js';
import { StatusBadge } from '../../components/common/StatusBadge.js';
import type { Checkout, Equipment, User as UserType } from '../../types/index.js';

export const CheckoutManagement: React.FC = () => {
  const { user, hasRole } = useAuth();
  const isTechnicianOrAdmin = hasRole('SUPER_ADMIN', 'LAB_ADMIN', 'LAB_TECHNICIAN');

  const [checkouts, setCheckouts] = useState<Checkout[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Issue modal
  const [showIssueModal, setShowIssueModal] = useState(false);
  const [availableEquipment, setAvailableEquipment] = useState<Equipment[]>([]);
  const [students, setStudents] = useState<UserType[]>([]);
  const [issueEqId, setIssueEqId] = useState('');
  const [issueUserId, setIssueUserId] = useState('');
  const [expectedReturn, setExpectedReturn] = useState('');
  const [conditionBefore, setConditionBefore] = useState<'EXCELLENT' | 'GOOD' | 'FAIR'>('GOOD');
  const [issueNotes, setIssueNotes] = useState('');

  // Return modal
  const [returnTarget, setReturnTarget] = useState<Checkout | null>(null);
  const [conditionAfter, setConditionAfter] = useState<'EXCELLENT' | 'GOOD' | 'FAIR' | 'DAMAGED'>('GOOD');
  const [damageNotes, setDamageNotes] = useState('');
  const [returnNotes, setReturnNotes] = useState('');

  const fetchCheckouts = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (statusFilter !== 'ALL') params.append('status', statusFilter);

      const res = await apiClient.get(`/checkouts?${params.toString()}`);
      if (res.data.success) {
        setCheckouts(res.data.data.items);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCheckouts();
  }, [statusFilter]);

  // Load available equipment & students for issue modal
  useEffect(() => {
    if (isTechnicianOrAdmin) {
      apiClient.get('/equipment?status=AVAILABLE').then((res) => {
        if (res.data.success) {
          setAvailableEquipment(res.data.data.items || []);
          if (res.data.data.items?.length > 0) setIssueEqId(res.data.data.items[0]._id);
        }
      });

      apiClient.get('/users?role=STUDENT').then((res) => {
        if (res.data.success) {
          setStudents(res.data.data.users || []);
          if (res.data.data.users?.length > 0) setIssueUserId(res.data.data.users[0]._id);
        }
      });
    }
  }, [isTechnicianOrAdmin]);

  const handleIssueSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await apiClient.post('/checkouts', {
        equipmentId: issueEqId,
        userId: issueUserId,
        expectedReturnTime: expectedReturn,
        conditionBefore,
        notes: issueNotes,
      });

      if (res.data.success) {
        setShowIssueModal(false);
        fetchCheckouts();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to issue equipment.');
    }
  };

  const handleReturnSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!returnTarget) return;

    try {
      const res = await apiClient.post(`/checkouts/${returnTarget._id}/return`, {
        conditionAfter,
        damageReported: conditionAfter === 'DAMAGED',
        damageNotes,
        notes: returnNotes,
      });

      if (res.data.success) {
        setReturnTarget(null);
        setDamageNotes('');
        setReturnNotes('');
        fetchCheckouts();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to check in equipment.');
    }
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-slate-800">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <span>Hardware Borrowing & Checkouts</span>
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400">
              {checkouts.length} records
            </span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Physical custody tracking, return condition inspection, and automated damage ticket workflow.
          </p>
        </div>

        {isTechnicianOrAdmin && (
          <button
            onClick={() => setShowIssueModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-950 bg-cyan-400 hover:bg-cyan-300 rounded-lg transition-colors whitespace-nowrap shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Issue Hardware</span>
          </button>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 p-1 rounded-lg w-fit text-xs">
        {['ALL', 'CHECKED_OUT', 'RETURNED', 'OVERDUE', 'DAMAGED_RETURN'].map((st) => (
          <button
            key={st}
            onClick={() => setStatusFilter(st)}
            className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
              statusFilter === st
                ? 'bg-slate-800 text-white shadow-xs font-semibold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            {st.replace(/_/g, ' ')}
          </button>
        ))}
      </div>

      {/* Checkouts Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/70 border-b border-slate-800 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              <tr>
                <th className="py-3 px-4">Equipment Unit</th>
                <th className="py-3 px-4">Borrower</th>
                <th className="py-3 px-4">Checkout Time</th>
                <th className="py-3 px-4">Expected Return</th>
                <th className="py-3 px-4">Condition</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {checkouts.map((ch) => (
                <tr key={ch._id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-3 px-4">
                    <div className="font-semibold text-white">{ch.equipment?.name}</div>
                    <div className="text-[11px] text-cyan-400 font-mono">
                      {ch.equipment?.equipmentCode}
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="text-white font-medium">{ch.user?.fullName}</div>
                    <div className="text-[11px] text-slate-500 font-mono">
                      {ch.user?.collegeId} · {ch.user?.department}
                    </div>
                  </td>
                  <td className="py-3 px-4 font-mono text-[11px]">
                    {new Date(ch.checkoutTime).toLocaleDateString()}{' '}
                    {new Date(ch.checkoutTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </td>
                  <td className="py-3 px-4 font-mono text-[11px]">
                    {new Date(ch.expectedReturnTime).toLocaleDateString()}{' '}
                    {new Date(ch.expectedReturnTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </td>
                  <td className="py-3 px-4">
                    <span className="font-mono text-[11px] text-slate-300">
                      {ch.conditionAfter || ch.conditionBefore}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <StatusBadge status={ch.status} />
                  </td>
                  <td className="py-3 px-4 text-right">
                    {isTechnicianOrAdmin && ch.status === 'CHECKED_OUT' && (
                      <button
                        onClick={() => setReturnTarget(ch)}
                        className="px-2.5 py-1 text-xs font-semibold text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded transition-colors"
                      >
                        Receive Return
                      </button>
                    )}
                  </td>
                </tr>
              ))}

              {!loading && checkouts.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-xs text-slate-500">
                    No checkout records found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Return Modal with Damage Inspection Workflow */}
      {returnTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6">
            <h3 className="text-base font-bold text-white mb-1">
              Check-in {returnTarget.equipment?.name}
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Inspect hardware condition before receiving return from {returnTarget.user?.fullName}.
            </p>

            <form onSubmit={handleReturnSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  Condition Inspection Result
                </label>
                <select
                  value={conditionAfter}
                  onChange={(e) => setConditionAfter(e.target.value as any)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white"
                >
                  <option value="EXCELLENT">EXCELLENT - Flawless physical condition</option>
                  <option value="GOOD">GOOD - Nominal minor cosmetic wear</option>
                  <option value="FAIR">FAIR - Operational with mechanical wear</option>
                  <option value="DAMAGED">DAMAGED - Broken joint / actuator / burned module</option>
                </select>
              </div>

              {conditionAfter === 'DAMAGED' && (
                <div className="p-3 bg-rose-950/40 border border-rose-800/80 rounded-lg space-y-2">
                  <div className="text-[11px] font-semibold text-rose-300 flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>Damage Workflow Activated</span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    The equipment status will automatically switch to DAMAGED and a corrective maintenance ticket will be generated.
                  </p>
                  <div>
                    <label className="block text-slate-300 font-medium mb-1">
                      Damage Inspection Details
                    </label>
                    <textarea
                      rows={2}
                      required
                      value={damageNotes}
                      onChange={(e) => setDamageNotes(e.target.value)}
                      placeholder="Specify broken joints, burned motor drivers, stripped gears..."
                      className="w-full px-2.5 py-1.5 bg-slate-950 border border-rose-900 rounded text-white"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-slate-300 font-medium mb-1">Return Notes</label>
                <textarea
                  rows={2}
                  value={returnNotes}
                  onChange={(e) => setReturnNotes(e.target.value)}
                  placeholder="e.g. Returned with all cables and accessories..."
                  className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setReturnTarget(null)}
                  className="px-3 py-1.5 text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 font-semibold text-slate-950 bg-cyan-400 hover:bg-cyan-300 rounded-lg"
                >
                  Complete Return
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Issue Modal */}
      {showIssueModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6">
            <h3 className="text-base font-bold text-white mb-1">Issue Equipment</h3>
            <p className="text-xs text-slate-400 mb-4">
              Hand over physical custody of robotics hardware to an authorized researcher.
            </p>

            <form onSubmit={handleIssueSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Select Equipment</label>
                <select
                  required
                  value={issueEqId}
                  onChange={(e) => setIssueEqId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white"
                >
                  {availableEquipment.map((eq) => (
                    <option key={eq._id} value={eq._id}>
                      {eq.name} ({eq.equipmentCode})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Borrower</label>
                <select
                  required
                  value={issueUserId}
                  onChange={(e) => setIssueUserId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white"
                >
                  {students.map((st) => (
                    <option key={st._id} value={st._id}>
                      {st.fullName} ({st.collegeId} - {st.department})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Expected Return Date & Time</label>
                <input
                  type="datetime-local"
                  required
                  value={expectedReturn}
                  onChange={(e) => setExpectedReturn(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Initial Condition</label>
                <select
                  value={conditionBefore}
                  onChange={(e) => setConditionBefore(e.target.value as any)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white"
                >
                  <option value="EXCELLENT">EXCELLENT</option>
                  <option value="GOOD">GOOD</option>
                  <option value="FAIR">FAIR</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Checkout Notes</label>
                <textarea
                  rows={2}
                  value={issueNotes}
                  onChange={(e) => setIssueNotes(e.target.value)}
                  placeholder="e.g. Issued with power adapter, calibration weights..."
                  className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowIssueModal(false)}
                  className="px-3 py-1.5 text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 font-semibold text-slate-950 bg-cyan-400 hover:bg-cyan-300 rounded-lg"
                >
                  Authorize Checkout
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
