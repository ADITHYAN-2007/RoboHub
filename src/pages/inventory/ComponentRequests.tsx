import React, { useState, useEffect } from 'react';
import {
  Package,
  Plus,
  CheckCircle,
  XCircle,
  Clock,
  ArrowRight,
  HandMetal,
} from 'lucide-react';
import { apiClient } from '../../api/client.js';
import { useAuth } from '../../context/AuthContext.js';
import { StatusBadge } from '../../components/common/StatusBadge.js';
import type { ComponentRequest, InventoryItem, Project } from '../../types/index.js';

export const ComponentRequests: React.FC = () => {
  const { user, hasRole } = useAuth();
  const isTechnicianOrAdmin = hasRole('SUPER_ADMIN', 'LAB_ADMIN', 'LAB_TECHNICIAN');

  const [requests, setRequests] = useState<ComponentRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Request modal
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [inventoryList, setInventoryList] = useState<InventoryItem[]>([]);
  const [projectsList, setProjectsList] = useState<Project[]>([]);
  const [componentId, setComponentId] = useState('');
  const [requestedQuantity, setRequestedQuantity] = useState(1);
  const [reason, setReason] = useState('');
  const [requiredDate, setRequiredDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [projectId, setProjectId] = useState('');

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (statusFilter !== 'ALL') params.append('status', statusFilter);

      const res = await apiClient.get(`/component-requests?${params.toString()}`);
      if (res.data.success) {
        setRequests(res.data.data.items);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [statusFilter]);

  useEffect(() => {
    apiClient.get('/inventory?limit=100').then((res) => {
      if (res.data.success) {
        setInventoryList(res.data.data.items || []);
        if (res.data.data.items?.length > 0) setComponentId(res.data.data.items[0]._id);
      }
    });

    apiClient.get('/projects?limit=50').then((res) => {
      if (res.data.success) {
        setProjectsList(res.data.data.items || []);
      }
    });
  }, []);

  const handleApprove = async (id: string, qty: number) => {
    try {
      const res = await apiClient.post(`/component-requests/${id}/approve`, {
        approvedQuantity: qty,
      });
      if (res.data.success) {
        fetchRequests();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to approve request.');
    }
  };

  const handleReject = async (id: string) => {
    const reason = prompt('Specify rejection reason for this component request:');
    if (!reason) return;
    try {
      const res = await apiClient.post(`/component-requests/${id}/reject`, {
        rejectionReason: reason,
      });
      if (res.data.success) {
        fetchRequests();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to reject request.');
    }
  };

  const handleIssue = async (id: string) => {
    try {
      const res = await apiClient.post(`/component-requests/${id}/issue`);
      if (res.data.success) {
        alert(res.data.message || 'Components successfully issued. Inventory updated.');
        fetchRequests();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to issue components.');
    }
  };

  const handleSubmitRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await apiClient.post('/component-requests', {
        componentId,
        requestedQuantity,
        reason,
        requiredDate,
        projectId: projectId || undefined,
      });

      if (res.data.success) {
        setShowRequestModal(false);
        setReason('');
        setRequestedQuantity(1);
        fetchRequests();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to submit request.');
    }
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-slate-800">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <span>Project Component Requisitions</span>
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400">
              {requests.length} total
            </span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Student parts requests for robotics projects, technician approvals, and automatic stock deduction.
          </p>
        </div>

        <button
          onClick={() => setShowRequestModal(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-950 bg-cyan-400 hover:bg-cyan-300 rounded-lg transition-colors whitespace-nowrap shadow-xs"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Request Parts</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 p-1 rounded-lg w-fit text-xs">
        {['ALL', 'PENDING', 'APPROVED', 'ISSUED', 'REJECTED'].map((st) => (
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

      {/* Requests Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/70 border-b border-slate-800 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              <tr>
                <th className="py-3 px-4">Component</th>
                <th className="py-3 px-4">Requester</th>
                <th className="py-3 px-4">Project</th>
                <th className="py-3 px-4">Quantity</th>
                <th className="py-3 px-4">Required Date</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {requests.map((req) => (
                <tr key={req._id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-3 px-4">
                    <div className="font-semibold text-white">{req.component?.name}</div>
                    <div className="text-[11px] text-cyan-400 font-mono">
                      {req.component?.componentCode} · {req.component?.storageLocation}
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="font-medium text-white">{req.requester?.fullName}</div>
                    <div className="text-[11px] text-slate-500 font-mono">
                      {req.requester?.collegeId}
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    {req.project ? (
                      <span className="text-slate-300">{req.project.projectName}</span>
                    ) : (
                      <span className="text-slate-500 font-mono">Independent</span>
                    )}
                  </td>
                  <td className="py-3 px-4 font-mono tabular-nums">
                    <span className="font-bold text-white">{req.requestedQuantity}</span>{' '}
                    <span className="text-slate-400">{req.component?.unit}</span>
                  </td>
                  <td className="py-3 px-4 font-mono text-[11px]">
                    {new Date(req.requiredDate).toLocaleDateString()}
                  </td>
                  <td className="py-3 px-4">
                    <StatusBadge status={req.status} />
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      {isTechnicianOrAdmin && req.status === 'PENDING' && (
                        <>
                          <button
                            onClick={() => handleApprove(req._id, req.requestedQuantity)}
                            className="px-2 py-1 text-[11px] font-semibold text-emerald-400 bg-emerald-950/40 hover:bg-emerald-950/80 border border-emerald-800/60 rounded"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleReject(req._id)}
                            className="px-2 py-1 text-[11px] font-semibold text-rose-400 bg-rose-950/40 hover:bg-rose-950/80 border border-rose-800/60 rounded"
                          >
                            Reject
                          </button>
                        </>
                      )}

                      {isTechnicianOrAdmin && req.status === 'APPROVED' && (
                        <button
                          onClick={() => handleIssue(req._id)}
                          className="px-2.5 py-1 text-[11px] font-semibold text-slate-950 bg-cyan-400 hover:bg-cyan-300 rounded"
                        >
                          Hand Over / Issue
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}

              {!loading && requests.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-xs text-slate-500">
                    No component requests found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* New Request Modal */}
      {showRequestModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6">
            <h3 className="text-base font-bold text-white mb-1">Request Hardware Components</h3>
            <p className="text-xs text-slate-400 mb-4">
              Select parts from lab storage inventory for your robotics engineering research.
            </p>

            <form onSubmit={handleSubmitRequest} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Select Component</label>
                <select
                  required
                  value={componentId}
                  onChange={(e) => setComponentId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white"
                >
                  {inventoryList.map((item) => (
                    <option key={item._id} value={item._id}>
                      {item.name} ({item.quantity} {item.unit} available in {item.storageLocation})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Quantity</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={requestedQuantity}
                    onChange={(e) => setRequestedQuantity(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Required By Date</label>
                  <input
                    type="date"
                    required
                    value={requiredDate}
                    onChange={(e) => setRequiredDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Associated Project (Optional)</label>
                <select
                  value={projectId}
                  onChange={(e) => setProjectId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white"
                >
                  <option value="">General Robotics Coursework</option>
                  {projectsList.map((prj) => (
                    <option key={prj._id} value={prj._id}>
                      {prj.projectName} ({prj.projectCode})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Requisition Justification</label>
                <textarea
                  rows={2}
                  required
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="e.g. Differential steering drive testing, PID velocity control tuning..."
                  className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowRequestModal(false)}
                  className="px-3 py-1.5 text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 font-semibold text-slate-950 bg-cyan-400 hover:bg-cyan-300 rounded-lg"
                >
                  Submit Requisition
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
