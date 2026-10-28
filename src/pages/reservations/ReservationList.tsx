import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  CalendarDays,
  Plus,
  CheckCircle,
  XCircle,
  Clock,
  Calendar,
  AlertCircle,
  Check,
  X,
} from 'lucide-react';
import { apiClient } from '../../api/client.js';
import { useAuth } from '../../context/AuthContext.js';
import { StatusBadge } from '../../components/common/StatusBadge.js';
import { ConfirmModal } from '../../components/common/ConfirmModal.js';
import type { Reservation, Equipment } from '../../types/index.js';

export const ReservationList: React.FC = () => {
  const { user, hasRole } = useAuth();
  const isTechnicianOrAdmin = hasRole('SUPER_ADMIN', 'LAB_ADMIN', 'LAB_TECHNICIAN');

  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [equipmentList, setEquipmentList] = useState<Equipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Cancel Dialog
  const [cancelTarget, setCancelTarget] = useState<Reservation | null>(null);

  // Reject Dialog
  const [rejectTarget, setRejectTarget] = useState<Reservation | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  // Create Modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedEqId, setSelectedEqId] = useState('');
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [startTime, setStartTime] = useState('10:00');
  const [endTime, setEndTime] = useState('12:00');
  const [purpose, setPurpose] = useState('');
  const [createError, setCreateError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const fetchReservations = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (statusFilter !== 'ALL') params.append('status', statusFilter);

      const res = await apiClient.get(`/reservations?${params.toString()}`);
      if (res.data.success) {
        setReservations(res.data.data.items);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReservations();
  }, [statusFilter]);

  useEffect(() => {
    apiClient.get('/equipment?limit=100').then((res) => {
      if (res.data.success) {
        setEquipmentList(res.data.data.items || []);
        if (res.data.data.items?.length > 0) {
          setSelectedEqId(res.data.data.items[0]._id);
        }
      }
    });
  }, []);

  const handleApprove = async (id: string) => {
    try {
      const res = await apiClient.post(`/reservations/${id}/approve`);
      if (res.data.success) {
        fetchReservations();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to approve reservation.');
    }
  };

  const handleReject = async () => {
    if (!rejectTarget) return;
    try {
      const res = await apiClient.post(`/reservations/${rejectTarget._id}/reject`, {
        reason: rejectReason,
      });
      if (res.data.success) {
        setRejectTarget(null);
        setRejectReason('');
        fetchReservations();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to reject reservation.');
    }
  };

  const handleCancel = async () => {
    if (!cancelTarget) return;
    try {
      const res = await apiClient.post(`/reservations/${cancelTarget._id}/cancel`);
      if (res.data.success) {
        setCancelTarget(null);
        fetchReservations();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to cancel reservation.');
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError(null);
    setSubmitting(true);

    try {
      const res = await apiClient.post('/reservations', {
        equipmentId: selectedEqId,
        date,
        startTime,
        endTime,
        purpose,
      });

      if (res.data.success) {
        setShowCreateModal(false);
        setPurpose('');
        fetchReservations();
      }
    } catch (err: any) {
      setCreateError(err.response?.data?.message || 'Failed to reserve equipment.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-slate-800">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <span>Equipment Reservations</span>
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400">
              {reservations.length} total
            </span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Manage scheduled lab access, prevent overlapping bookings, and review access permits.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to="/reservations/calendar"
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg transition-colors"
          >
            <Calendar className="w-3.5 h-3.5 text-cyan-400" />
            <span>Calendar View</span>
          </Link>

          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-950 bg-cyan-400 hover:bg-cyan-300 rounded-lg transition-colors shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Reservation</span>
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 p-1 rounded-lg w-fit text-xs">
        {['ALL', 'PENDING', 'APPROVED', 'ACTIVE', 'COMPLETED', 'CANCELLED'].map((st) => (
          <button
            key={st}
            onClick={() => setStatusFilter(st)}
            className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
              statusFilter === st
                ? 'bg-slate-800 text-white shadow-xs font-semibold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            {st}
          </button>
        ))}
      </div>

      {/* Reservations Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/70 border-b border-slate-800 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              <tr>
                <th className="py-3 px-4">Equipment Unit</th>
                <th className="py-3 px-4">Reserved By</th>
                <th className="py-3 px-4">Date & Time Window</th>
                <th className="py-3 px-4">Purpose</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {reservations.map((res) => (
                <tr key={res._id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-3 px-4">
                    <Link
                      to={`/equipment/${res.equipment?._id}`}
                      className="font-medium text-white hover:text-cyan-400"
                    >
                      {res.equipment?.name || 'Robotics Hardware'}
                    </Link>
                    <div className="text-[11px] text-slate-500 font-mono">
                      {res.equipment?.equipmentCode}
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="text-white font-medium">{res.user?.fullName}</div>
                    <div className="text-[11px] text-slate-500 font-mono">
                      {res.user?.collegeId} · {res.user?.department}
                    </div>
                  </td>
                  <td className="py-3 px-4 font-mono text-[11px]">
                    <div className="text-slate-200">{res.date}</div>
                    <div className="text-slate-400">
                      {res.startTime} - {res.endTime}
                    </div>
                  </td>
                  <td className="py-3 px-4 max-w-xs truncate text-slate-400">{res.purpose}</td>
                  <td className="py-3 px-4">
                    <StatusBadge status={res.status} />
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      {/* Staff Approval Actions */}
                      {isTechnicianOrAdmin && res.status === 'PENDING' && (
                        <>
                          <button
                            onClick={() => handleApprove(res._id)}
                            className="px-2 py-1 text-[11px] font-semibold text-emerald-400 hover:text-emerald-300 bg-emerald-950/40 hover:bg-emerald-950/70 border border-emerald-800/60 rounded"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => setRejectTarget(res)}
                            className="px-2 py-1 text-[11px] font-semibold text-rose-400 hover:text-rose-300 bg-rose-950/40 hover:bg-rose-950/70 border border-rose-800/60 rounded"
                          >
                            Reject
                          </button>
                        </>
                      )}

                      {/* Cancel button if pending or approved */}
                      {['PENDING', 'APPROVED'].includes(res.status) && (
                        <button
                          onClick={() => setCancelTarget(res)}
                          className="px-2 py-1 text-[11px] text-slate-400 hover:text-rose-300 hover:bg-slate-800 rounded transition-colors"
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}

              {!loading && reservations.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-xs text-slate-500">
                    No reservations matching current filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Cancel Confirmation Dialog */}
      <ConfirmModal
        isOpen={Boolean(cancelTarget)}
        onClose={() => setCancelTarget(null)}
        onConfirm={handleCancel}
        title="Cancel Equipment Reservation"
        message={`Are you sure you want to cancel the reservation for ${cancelTarget?.equipment?.name} on ${cancelTarget?.date}? This slot will become available for other researchers.`}
        confirmText="Yes, Cancel Booking"
      />

      {/* Reject Modal */}
      {rejectTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-xl shadow-2xl p-5">
            <h3 className="text-sm font-semibold text-white mb-2">Reject Reservation Request</h3>
            <p className="text-xs text-slate-400 mb-3">
              Provide a rationale for declining this request. The student will receive a notification.
            </p>
            <textarea
              rows={3}
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="e.g. Scheduled workcell maintenance, priority faculty research..."
              className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-700 rounded-lg text-white mb-4"
            />
            <div className="flex items-center justify-end gap-2 text-xs">
              <button
                onClick={() => setRejectTarget(null)}
                className="px-3 py-1.5 text-slate-400 hover:text-white"
              >
                Dismiss
              </button>
              <button
                onClick={handleReject}
                className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 font-semibold text-white rounded-lg"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Reservation Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6">
            <h3 className="text-base font-bold text-white mb-1">Schedule Robotics Equipment</h3>
            <p className="text-xs text-slate-400 mb-4">
              Select desired hardware and preferred time interval. Overlaps are blocked in real-time.
            </p>

            {createError && (
              <div className="p-3 mb-3 rounded-lg bg-rose-950/60 border border-rose-800 text-xs text-rose-300">
                {createError}
              </div>
            )}

            <form onSubmit={handleCreate} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Target Equipment</label>
                <select
                  required
                  value={selectedEqId}
                  onChange={(e) => setSelectedEqId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white"
                >
                  {equipmentList.map((eq) => (
                    <option key={eq._id} value={eq._id}>
                      {eq.name} ({eq.equipmentCode} - {eq.category})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Booking Date</label>
                <input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Start Time</label>
                  <input
                    type="time"
                    required
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-medium mb-1">End Time</label>
                  <input
                    type="time"
                    required
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Research Purpose</label>
                <textarea
                  rows={2}
                  required
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value)}
                  placeholder="e.g. Robot arm inverse kinematics testing, drone calibration..."
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-3 py-1.5 text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-1.5 font-semibold text-slate-950 bg-cyan-400 hover:bg-cyan-300 rounded-lg"
                >
                  {submitting ? 'Checking availability...' : 'Submit Booking'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
