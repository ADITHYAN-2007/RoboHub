import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Cpu,
  CalendarDays,
  Repeat,
  Wrench,
  AlertTriangle,
  QrCode,
  ArrowLeft,
  CheckCircle,
  Clock,
  ShieldCheck,
  Building,
} from 'lucide-react';
import { apiClient } from '../../api/client.js';
import { useAuth } from '../../context/AuthContext.js';
import { StatusBadge } from '../../components/common/StatusBadge.js';
import { QRCodeModal } from '../../components/common/QRCodeModal.js';

export const EquipmentDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'specs' | 'reservations' | 'maintenance' | 'checkouts' | 'issues'>('specs');
  const [showQR, setShowQR] = useState(false);

  // Reservation Modal
  const [showReserveModal, setShowReserveModal] = useState(false);
  const [reserveDate, setReserveDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [startTime, setStartTime] = useState('14:00');
  const [endTime, setEndTime] = useState('16:00');
  const [purpose, setPurpose] = useState('');
  const [reserveLoading, setReserveLoading] = useState(false);
  const [reserveSuccess, setReserveSuccess] = useState<string | null>(null);
  const [reserveError, setReserveError] = useState<string | null>(null);

  const fetchDetail = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get(`/equipment/${id}`);
      if (res.data.success) {
        setData(res.data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetail();
  }, [id]);

  const handleReserveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setReserveError(null);
    setReserveSuccess(null);
    setReserveLoading(true);

    try {
      const res = await apiClient.post('/reservations', {
        equipmentId: id,
        date: reserveDate,
        startTime,
        endTime,
        purpose,
      });

      if (res.data.success) {
        setReserveSuccess(res.data.message || 'Reservation submitted successfully!');
        fetchDetail();
        setTimeout(() => {
          setShowReserveModal(false);
          setReserveSuccess(null);
        }, 1500);
      }
    } catch (err: any) {
      setReserveError(err.response?.data?.message || 'Failed to submit reservation.');
    } finally {
      setReserveLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-6 bg-slate-900 rounded w-1/5" />
        <div className="h-64 bg-slate-900 border border-slate-800 rounded-2xl" />
      </div>
    );
  }

  if (!data?.equipment) {
    return (
      <div className="p-8 text-center bg-slate-900 border border-slate-800 rounded-xl">
        <h3 className="text-sm font-semibold text-white">Equipment Record Not Found</h3>
        <Link to="/equipment" className="text-xs text-cyan-400 mt-2 inline-block">
          ← Back to Equipment Roster
        </Link>
      </div>
    );
  }

  const eq = data.equipment;
  const reservations = data.reservations || [];
  const maintenance = data.maintenance || [];
  const checkouts = data.checkouts || [];
  const issues = data.openIssues || [];

  return (
    <div className="space-y-6">
      {/* Breadcrumb Back Navigation */}
      <div>
        <Link
          to="/equipment"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Equipment Roster</span>
        </Link>
      </div>

      {/* Hero Overview Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="grid grid-cols-1 lg:grid-cols-12">
          {/* Hero Image */}
          <div className="lg:col-span-5 h-64 lg:h-auto relative bg-slate-950">
            {eq.image ? (
              <img
                src={eq.image}
                alt={eq.name}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-slate-700 bg-slate-950">
                <Cpu className="w-16 h-16 stroke-[1]" />
              </div>
            )}
            <div className="absolute top-3 left-3 bg-slate-950/80 backdrop-blur-xs px-2.5 py-1 rounded-md border border-slate-800">
              <StatusBadge status={eq.status} />
            </div>
          </div>

          {/* Core Info */}
          <div className="lg:col-span-7 p-6 flex flex-col justify-between space-y-4">
            <div>
              <div className="text-xs text-slate-400 flex items-center gap-2 mb-1.5">
                <span className="font-mono text-cyan-400 font-semibold">{eq.equipmentCode}</span>
                <span>·</span>
                <span className="font-mono text-slate-400">{eq.assetTag}</span>
                <span>·</span>
                <span>{eq.category}</span>
              </div>

              <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">{eq.name}</h1>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">{eq.description}</p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 py-3 border-y border-slate-800/80 text-xs">
              <div>
                <span className="text-[11px] text-slate-500 uppercase tracking-wider block">Manufacturer</span>
                <span className="text-slate-200 font-medium">{eq.manufacturer}</span>
              </div>
              <div>
                <span className="text-[11px] text-slate-500 uppercase tracking-wider block">Model</span>
                <span className="text-slate-200 font-medium">{eq.model}</span>
              </div>
              <div>
                <span className="text-[11px] text-slate-500 uppercase tracking-wider block">Serial No</span>
                <span className="text-slate-200 font-mono">{eq.serialNumber}</span>
              </div>
              <div>
                <span className="text-[11px] text-slate-500 uppercase tracking-wider block">Laboratory</span>
                <span className="text-slate-200 font-medium">{eq.laboratory?.name || 'Main Lab'}</span>
              </div>
              <div>
                <span className="text-[11px] text-slate-500 uppercase tracking-wider block">Workcell Room</span>
                <span className="text-slate-200 font-mono">{eq.room?.roomNumber || 'Shared Floor'}</span>
              </div>
              <div>
                <span className="text-[11px] text-slate-500 uppercase tracking-wider block">Condition</span>
                <span className="text-slate-200 font-medium">{eq.condition}</span>
              </div>
            </div>

            {/* Action Bar */}
            <div className="flex flex-wrap items-center gap-2.5 pt-1">
              {eq.status === 'AVAILABLE' && (
                <button
                  onClick={() => setShowReserveModal(true)}
                  className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-slate-950 bg-cyan-400 hover:bg-cyan-300 rounded-lg transition-colors shadow-sm"
                >
                  <CalendarDays className="w-4 h-4" />
                  <span>Reserve This Equipment</span>
                </button>
              )}

              <button
                onClick={() => setShowQR(true)}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors"
              >
                <QrCode className="w-4 h-4 text-cyan-400" />
                <span>Asset QR Tag</span>
              </button>

              <Link
                to={`/issues?reportFor=${eq._id}`}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors"
              >
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                <span>Report Issue</span>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Tabs */}
      <div>
        <div className="flex items-center gap-1 border-b border-slate-800 pb-px">
          {[
            { id: 'specs', label: 'Technical Specifications' },
            { id: 'reservations', label: `Reservations (${reservations.length})` },
            { id: 'checkouts', label: `Borrowing History (${checkouts.length})` },
            { id: 'maintenance', label: `Maintenance Log (${maintenance.length})` },
            { id: 'issues', label: `Reported Issues (${issues.length})` },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3.5 py-2 text-xs font-medium border-b-2 transition-colors whitespace-nowrap ${
                activeTab === tab.id
                  ? 'border-cyan-400 text-cyan-400 font-semibold'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab 1: Specs */}
        {activeTab === 'specs' && (
          <div className="mt-4 p-5 bg-slate-900 border border-slate-800 rounded-xl space-y-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Hardware Parameters & Operational Limits
            </h3>

            {eq.specifications && Object.keys(eq.specifications).length > 0 ? (
              <dl className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {Object.entries(eq.specifications).map(([key, val]) => (
                  <div key={key} className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                    <dt className="text-[11px] text-slate-500 uppercase tracking-wide">{key}</dt>
                    <dd className="text-xs font-medium text-slate-200 mt-0.5">{String(val)}</dd>
                  </div>
                ))}
              </dl>
            ) : (
              <div className="text-xs text-slate-500 py-4">No custom specifications defined for this unit.</div>
            )}

            {eq.safetyDocumentRequired && (
              <div className="p-3.5 rounded-lg bg-cyan-950/20 border border-cyan-800/40 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 text-cyan-300">
                  <ShieldCheck className="w-4 h-4 text-cyan-400" />
                  <span>Mandatory safety protocol: {eq.safetyDocumentRequired.title} ({eq.safetyDocumentRequired.code})</span>
                </div>
                <Link to="/safety" className="text-xs text-cyan-400 hover:underline font-medium">
                  Review SOP →
                </Link>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Reservations */}
        {activeTab === 'reservations' && (
          <div className="mt-4 bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950/70 border-b border-slate-800 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  <tr>
                    <th className="py-3 px-4">Researcher</th>
                    <th className="py-3 px-4">Scheduled Date</th>
                    <th className="py-3 px-4">Time Slot</th>
                    <th className="py-3 px-4">Research Purpose</th>
                    <th className="py-3 px-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {reservations.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-xs text-slate-500">
                        No reservation records for this unit.
                      </td>
                    </tr>
                  ) : (
                    reservations.map((res: any) => (
                      <tr key={res._id} className="hover:bg-slate-800/40">
                        <td className="py-3 px-4">
                          <div className="font-medium text-white">{res.user?.fullName}</div>
                          <div className="text-[11px] font-mono text-slate-500">{res.user?.collegeId}</div>
                        </td>
                        <td className="py-3 px-4 font-mono">{res.date}</td>
                        <td className="py-3 px-4 font-mono">{res.startTime} - {res.endTime}</td>
                        <td className="py-3 px-4 max-w-xs truncate">{res.purpose}</td>
                        <td className="py-3 px-4">
                          <StatusBadge status={res.status} />
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 3: Checkouts */}
        {activeTab === 'checkouts' && (
          <div className="mt-4 bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950/70 border-b border-slate-800 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  <tr>
                    <th className="py-3 px-4">Borrower</th>
                    <th className="py-3 px-4">Issued By</th>
                    <th className="py-3 px-4">Checked Out</th>
                    <th className="py-3 px-4">Expected Return</th>
                    <th className="py-3 px-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {checkouts.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-xs text-slate-500">
                        No checkout records for this equipment.
                      </td>
                    </tr>
                  ) : (
                    checkouts.map((ch: any) => (
                      <tr key={ch._id} className="hover:bg-slate-800/40">
                        <td className="py-3 px-4 font-medium text-white">{ch.user?.fullName}</td>
                        <td className="py-3 px-4 text-slate-400">{ch.issuedBy?.fullName}</td>
                        <td className="py-3 px-4 font-mono text-[11px]">{new Date(ch.checkoutTime).toLocaleDateString()}</td>
                        <td className="py-3 px-4 font-mono text-[11px]">{new Date(ch.expectedReturnTime).toLocaleDateString()}</td>
                        <td className="py-3 px-4">
                          <StatusBadge status={ch.status} />
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 4: Maintenance */}
        {activeTab === 'maintenance' && (
          <div className="mt-4 bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950/70 border-b border-slate-800 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  <tr>
                    <th className="py-3 px-4">Maintenance Type</th>
                    <th className="py-3 px-4">Technician</th>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Description</th>
                    <th className="py-3 px-4">Cost</th>
                    <th className="py-3 px-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {maintenance.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-xs text-slate-500">
                        No maintenance operations logged for this unit.
                      </td>
                    </tr>
                  ) : (
                    maintenance.map((m: any) => (
                      <tr key={m._id} className="hover:bg-slate-800/40">
                        <td className="py-3 px-4 font-medium text-white">{m.maintenanceType}</td>
                        <td className="py-3 px-4 text-slate-400">{m.technician?.fullName || 'Assigned Staff'}</td>
                        <td className="py-3 px-4 font-mono text-[11px]">{new Date(m.startDate).toLocaleDateString()}</td>
                        <td className="py-3 px-4 max-w-xs truncate">{m.description}</td>
                        <td className="py-3 px-4 font-mono tabular-nums">${m.cost}</td>
                        <td className="py-3 px-4">
                          <StatusBadge status={m.status} />
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 5: Issues */}
        {activeTab === 'issues' && (
          <div className="mt-4 bg-slate-900 border border-slate-800 rounded-xl p-4 divide-y divide-slate-800/60">
            {issues.length === 0 ? (
              <div className="py-6 text-center text-xs text-slate-500">
                No active issues reported for this equipment.
              </div>
            ) : (
              issues.map((iss: any) => (
                <div key={iss._id} className="py-3 flex items-start justify-between text-xs">
                  <div>
                    <div className="font-semibold text-white flex items-center gap-2">
                      <span>{iss.category}</span>
                      <StatusBadge status={iss.severity} />
                    </div>
                    <div className="text-slate-400 mt-1">{iss.description}</div>
                    <div className="text-[11px] text-slate-500 mt-1">
                      Reported by {iss.reporter?.fullName} on {new Date(iss.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                  <StatusBadge status={iss.status} />
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* QR Code Modal */}
      <QRCodeModal
        isOpen={showQR}
        onClose={() => setShowQR(false)}
        equipment={{
          name: eq.name,
          equipmentCode: eq.equipmentCode,
          assetTag: eq.assetTag,
          category: eq.category,
          status: eq.status,
          qrCodeUrl: data.qrCodeUrl || eq.qrCodeData,
        }}
      />

      {/* Reserve Modal */}
      {showReserveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6">
            <h3 className="text-base font-bold text-white mb-2">Book {eq.name}</h3>
            <p className="text-xs text-slate-400 mb-4">
              Reserve slot for academic research or course project. Double-booking prevention enforced automatically.
            </p>

            {reserveError && (
              <div className="p-3 mb-3 rounded-lg bg-rose-950/60 border border-rose-800 text-xs text-rose-300">
                {reserveError}
              </div>
            )}

            {reserveSuccess && (
              <div className="p-3 mb-3 rounded-lg bg-emerald-950/60 border border-emerald-800 text-xs text-emerald-300">
                {reserveSuccess}
              </div>
            )}

            <form onSubmit={handleReserveSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Reservation Date</label>
                <input
                  type="date"
                  required
                  value={reserveDate}
                  onChange={(e) => setReserveDate(e.target.value)}
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
                <label className="block text-slate-300 font-medium mb-1">Academic Purpose</label>
                <textarea
                  rows={2}
                  required
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value)}
                  placeholder="e.g. SLAM navigation tuning, ROS2 trajectory testing..."
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowReserveModal(false)}
                  className="px-3 py-1.5 text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={reserveLoading}
                  className="px-4 py-1.5 font-semibold text-slate-950 bg-cyan-400 hover:bg-cyan-300 rounded-lg transition-colors"
                >
                  {reserveLoading ? 'Verifying Availability...' : 'Confirm Reservation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
