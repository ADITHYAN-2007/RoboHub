import React, { useState, useEffect } from 'react';
import {
  Wrench,
  Plus,
  CheckCircle,
  Clock,
  AlertTriangle,
  Calendar,
  DollarSign,
} from 'lucide-react';
import { apiClient } from '../../api/client.js';
import { useAuth } from '../../context/AuthContext.js';
import { StatusBadge } from '../../components/common/StatusBadge.js';
import type { Maintenance, Equipment, User as UserType } from '../../types/index.js';

export const MaintenanceDashboard: React.FC = () => {
  const { hasRole } = useAuth();
  const isTechnicianOrAdmin = hasRole('SUPER_ADMIN', 'LAB_ADMIN', 'LAB_TECHNICIAN');

  const [records, setRecords] = useState<Maintenance[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Schedule modal
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [equipmentList, setEquipmentList] = useState<Equipment[]>([]);
  const [technicians, setTechnicians] = useState<UserType[]>([]);
  const [selectedEqId, setSelectedEqId] = useState('');
  const [selectedTechId, setSelectedTechId] = useState('');
  const [maintenanceType, setMaintenanceType] = useState('PREVENTIVE');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [estimatedCost, setEstimatedCost] = useState(0);

  // Complete modal
  const [completeTarget, setCompleteTarget] = useState<Maintenance | null>(null);
  const [finalCost, setFinalCost] = useState(0);
  const [partsUsedInput, setPartsUsedInput] = useState('');
  const [completionNotes, setCompletionNotes] = useState('');
  const [conditionAfter, setConditionAfter] = useState('EXCELLENT');

  const fetchRecords = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (statusFilter !== 'ALL') params.append('status', statusFilter);

      const res = await apiClient.get(`/maintenance?${params.toString()}`);
      if (res.data.success) {
        setRecords(res.data.data.items);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, [statusFilter]);

  useEffect(() => {
    if (isTechnicianOrAdmin) {
      apiClient.get('/equipment?limit=100').then((res) => {
        if (res.data.success) {
          setEquipmentList(res.data.data.items || []);
          if (res.data.data.items?.length > 0) setSelectedEqId(res.data.data.items[0]._id);
        }
      });

      apiClient.get('/users/technicians').then((res) => {
        if (res.data.success) {
          setTechnicians(res.data.data || []);
          if (res.data.data?.length > 0) setSelectedTechId(res.data.data[0]._id);
        }
      });
    }
  }, [isTechnicianOrAdmin]);

  const handleScheduleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await apiClient.post('/maintenance', {
        equipmentId: selectedEqId,
        technicianId: selectedTechId,
        maintenanceType,
        description,
        startDate,
        cost: estimatedCost,
      });

      if (res.data.success) {
        setShowScheduleModal(false);
        setDescription('');
        fetchRecords();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to schedule maintenance.');
    }
  };

  const handleCompleteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!completeTarget) return;

    try {
      const partsUsed = partsUsedInput
        ? partsUsedInput.split(',').map((p) => p.trim()).filter(Boolean)
        : [];

      const res = await apiClient.post(`/maintenance/${completeTarget._id}/complete`, {
        finalCost,
        partsUsed,
        notes: completionNotes,
        conditionAfter,
      });

      if (res.data.success) {
        setCompleteTarget(null);
        setCompletionNotes('');
        setPartsUsedInput('');
        fetchRecords();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to complete maintenance job.');
    }
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-slate-800">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <span>Maintenance & Calibration Queue</span>
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400">
              {records.length} operations
            </span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Robotic joints calibration, preventive inspection schedules, corrective repairs, and replacement parts tracking.
          </p>
        </div>

        {isTechnicianOrAdmin && (
          <button
            onClick={() => setShowScheduleModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-950 bg-cyan-400 hover:bg-cyan-300 rounded-lg transition-colors whitespace-nowrap shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Schedule Job</span>
          </button>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 p-1 rounded-lg w-fit text-xs">
        {['ALL', 'SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'].map((st) => (
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

      {/* Maintenance Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/70 border-b border-slate-800 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              <tr>
                <th className="py-3 px-4">Equipment Unit</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Assigned Technician</th>
                <th className="py-3 px-4">Scheduled Date</th>
                <th className="py-3 px-4">Description</th>
                <th className="py-3 px-4">Cost</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {records.map((rec) => (
                <tr key={rec._id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-3 px-4">
                    <div className="font-semibold text-white">{rec.equipment?.name}</div>
                    <div className="text-[11px] text-cyan-400 font-mono">
                      {rec.equipment?.equipmentCode}
                    </div>
                  </td>
                  <td className="py-3 px-4 font-mono text-[11px]">
                    <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300">
                      {rec.maintenanceType}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="text-white font-medium">
                      {rec.technician?.fullName || 'Technician Desk'}
                    </div>
                  </td>
                  <td className="py-3 px-4 font-mono text-[11px]">
                    {new Date(rec.startDate).toLocaleDateString()}
                  </td>
                  <td className="py-3 px-4 max-w-xs truncate text-slate-400">
                    {rec.description}
                  </td>
                  <td className="py-3 px-4 font-mono tabular-nums text-slate-200">
                    ${rec.cost}
                  </td>
                  <td className="py-3 px-4">
                    <StatusBadge status={rec.status} />
                  </td>
                  <td className="py-3 px-4 text-right">
                    {isTechnicianOrAdmin && rec.status !== 'COMPLETED' && (
                      <button
                        onClick={() => {
                          setCompleteTarget(rec);
                          setFinalCost(rec.cost || 0);
                        }}
                        className="px-2.5 py-1 text-xs font-semibold text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded transition-colors"
                      >
                        Sign Off Job
                      </button>
                    )}
                  </td>
                </tr>
              ))}

              {!loading && records.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-xs text-slate-500">
                    No maintenance records found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Schedule Job Modal */}
      {showScheduleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6">
            <h3 className="text-base font-bold text-white mb-1">Schedule Maintenance Job</h3>
            <p className="text-xs text-slate-400 mb-4">
              Equipment status will switch to UNDER_MAINTENANCE until marked completed.
            </p>

            <form onSubmit={handleScheduleSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Equipment Unit</label>
                <select
                  required
                  value={selectedEqId}
                  onChange={(e) => setSelectedEqId(e.target.value)}
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
                  <label className="block text-slate-300 font-medium mb-1">Operation Type</label>
                  <select
                    value={maintenanceType}
                    onChange={(e) => setMaintenanceType(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white"
                  >
                    <option value="PREVENTIVE">PREVENTIVE</option>
                    <option value="CALIBRATION">CALIBRATION</option>
                    <option value="INSPECTION">INSPECTION</option>
                    <option value="CORRECTIVE">CORRECTIVE</option>
                    <option value="REPAIR">REPAIR</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Assigned Technician</label>
                  <select
                    value={selectedTechId}
                    onChange={(e) => setSelectedTechId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white"
                  >
                    {technicians.map((t) => (
                      <option key={t._id} value={t._id}>
                        {t.fullName}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Scheduled Start Date</label>
                  <input
                    type="date"
                    required
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Estimated Cost ($)</label>
                  <input
                    type="number"
                    value={estimatedCost}
                    onChange={(e) => setEstimatedCost(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Scope & Description</label>
                <textarea
                  rows={2}
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g. Six-axis joint zeroing, encoder check, gear lubrication..."
                  className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowScheduleModal(false)}
                  className="px-3 py-1.5 text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 font-semibold text-slate-950 bg-cyan-400 hover:bg-cyan-300 rounded-lg"
                >
                  Confirm Schedule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Complete Maintenance Modal */}
      {completeTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6">
            <h3 className="text-base font-bold text-white mb-1">Complete Maintenance Sign-Off</h3>
            <p className="text-xs text-slate-400 mb-4">
              Complete {completeTarget.maintenanceType} for {completeTarget.equipment?.name}. Hardware will be restored to AVAILABLE.
            </p>

            <form onSubmit={handleCompleteSubmit} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Final Cost ($)</label>
                  <input
                    type="number"
                    required
                    value={finalCost}
                    onChange={(e) => setFinalCost(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Condition After Repair</label>
                  <select
                    value={conditionAfter}
                    onChange={(e) => setConditionAfter(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white"
                  >
                    <option value="EXCELLENT">EXCELLENT</option>
                    <option value="GOOD">GOOD</option>
                    <option value="FAIR">FAIR</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  Parts Replaced / Used (Comma-separated)
                </label>
                <input
                  type="text"
                  value={partsUsedInput}
                  onChange={(e) => setPartsUsedInput(e.target.value)}
                  placeholder="e.g. Stepper driver IC, M3 mounting bolts, silicone lubricant"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Sign-Off Notes</label>
                <textarea
                  rows={2}
                  value={completionNotes}
                  onChange={(e) => setCompletionNotes(e.target.value)}
                  placeholder="Test diagnostics run, repeatability verified..."
                  className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setCompleteTarget(null)}
                  className="px-3 py-1.5 text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 font-semibold text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded-lg"
                >
                  Sign Off & Release Equipment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
