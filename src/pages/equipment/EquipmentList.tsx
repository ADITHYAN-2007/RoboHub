import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Search,
  Filter,
  Plus,
  QrCode,
  Cpu,
  Layers,
  LayoutGrid,
  List,
  CheckCircle,
  AlertTriangle,
  Clock,
  ArrowRight,
} from 'lucide-react';
import { apiClient } from '../../api/client.js';
import { useAuth } from '../../context/AuthContext.js';
import { StatusBadge } from '../../components/common/StatusBadge.js';
import { QRCodeModal } from '../../components/common/QRCodeModal.js';
import type { Equipment, EquipmentCategory, EquipmentStatus } from '../../types/index.js';

const CATEGORIES: EquipmentCategory[] = [
  'Robotic Arms',
  'Mobile Robots',
  'Drones',
  'Arduino',
  'Raspberry Pi',
  'ESP32',
  'Sensors',
  'Motors',
  'Motor Drivers',
  'PLC',
  'CNC',
  '3D Printers',
  'Cameras',
  'LiDAR',
  'Batteries',
  'Controllers',
  'Microcontrollers',
  'Power Supplies',
  'Tools',
  'Other',
];

export const EquipmentList: React.FC = () => {
  const { user, hasRole } = useAuth();
  const isTechnicianOrAdmin = hasRole('SUPER_ADMIN', 'LAB_ADMIN', 'LAB_TECHNICIAN');

  const [items, setItems] = useState<Equipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  // QR Modal
  const [selectedQR, setSelectedQR] = useState<Equipment | null>(null);

  // New Equipment Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    equipmentCode: '',
    assetTag: '',
    category: 'Robotic Arms',
    manufacturer: '',
    model: '',
    serialNumber: '',
    description: '',
    purchaseCost: 0,
    maintenanceIntervalDays: 90,
    laboratory: '',
    room: '',
  });
  const [labs, setLabs] = useState<any[]>([]);
  const [rooms, setRooms] = useState<any[]>([]);

  const fetchEquipment = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (selectedCategory !== 'ALL') params.append('category', selectedCategory);
      if (selectedStatus !== 'ALL') params.append('status', selectedStatus);

      const res = await apiClient.get(`/equipment?${params.toString()}`);
      if (res.data.success) {
        setItems(res.data.data.items);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEquipment();
  }, [selectedCategory, selectedStatus]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchEquipment();
    }, 250);
    return () => clearTimeout(timer);
  }, [search]);

  // Load labs & rooms for creation form
  useEffect(() => {
    if (isTechnicianOrAdmin) {
      apiClient.get('/laboratories').then((res) => {
        if (res.data.success) {
          setLabs(res.data.data.laboratories || []);
          setRooms(res.data.data.rooms || []);
          if (res.data.data.laboratories?.length > 0) {
            setFormData((prev) => ({
              ...prev,
              laboratory: res.data.data.laboratories[0]._id,
            }));
          }
        }
      });
    }
  }, [isTechnicianOrAdmin]);

  const handleCreateEquipment = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await apiClient.post('/equipment', formData);
      if (res.data.success) {
        setShowAddModal(false);
        fetchEquipment();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to register equipment.');
    }
  };

  return (
    <div className="space-y-5">
      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-slate-800">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <span>Equipment Inventory</span>
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400">
              {items.length} units
            </span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            University robotics manipulation cells, sensors, autonomous platforms, and 3D fabrication units.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Grid/Table Switcher */}
          <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg p-0.5">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-md text-xs transition-colors ${
                viewMode === 'grid' ? 'bg-slate-800 text-white shadow-xs' : 'text-slate-400 hover:text-white'
              }`}
              title="Grid view"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-md text-xs transition-colors ${
                viewMode === 'table' ? 'bg-slate-800 text-white shadow-xs' : 'text-slate-400 hover:text-white'
              }`}
              title="Table view"
            >
              <List className="w-3.5 h-3.5" />
            </button>
          </div>

          {isTechnicianOrAdmin && (
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-950 bg-cyan-400 hover:bg-cyan-300 rounded-lg transition-colors whitespace-nowrap shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Register Unit</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
        {/* Search */}
        <div className="relative sm:col-span-2">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by code, asset tag, model or name..."
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-900 border border-slate-800 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
          />
        </div>

        {/* Category Filter */}
        <div>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full px-3 py-2 text-xs bg-slate-900 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-cyan-500"
          >
            <option value="ALL">All Categories</option>
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        {/* Status Filter */}
        <div>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="w-full px-3 py-2 text-xs bg-slate-900 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-cyan-500"
          >
            <option value="ALL">All Statuses</option>
            <option value="AVAILABLE">Available</option>
            <option value="IN_USE">In Use / Borrowed</option>
            <option value="UNDER_MAINTENANCE">Under Maintenance</option>
            <option value="DAMAGED">Damaged</option>
            <option value="RETIRED">Retired</option>
          </select>
        </div>
      </div>

      {/* Equipment View: Grid Mode */}
      {viewMode === 'grid' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((eq) => (
            <div
              key={eq._id}
              className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden hover:border-slate-700 transition-all flex flex-col group"
            >
              {/* Media Preview Container with Fallback Gradient */}
              <div className="h-44 relative bg-slate-950 overflow-hidden border-b border-slate-800/80">
                {eq.image ? (
                  <img
                    src={eq.image}
                    alt={eq.name}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-tr from-slate-950 via-slate-900 to-slate-800 flex items-center justify-center text-slate-600">
                    <Cpu className="w-12 h-12 stroke-[1.2]" />
                  </div>
                )}
                {/* Status indicator on top right */}
                <div className="absolute top-2.5 right-2.5 bg-slate-950/80 backdrop-blur-xs px-2 py-1 rounded-md border border-slate-800">
                  <StatusBadge status={eq.status} />
                </div>
              </div>

              {/* Card Body */}
              <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                <div>
                  <div className="text-[11px] text-slate-400 flex items-center gap-2 mb-1">
                    <span className="font-mono text-cyan-400 font-semibold">{eq.equipmentCode}</span>
                    <span>·</span>
                    <span className="font-mono text-slate-400">{eq.assetTag}</span>
                    <span>·</span>
                    <span className="text-slate-400">{eq.category}</span>
                  </div>

                  <h3 className="text-sm font-semibold text-white group-hover:text-cyan-400 transition-colors line-clamp-1">
                    {eq.name}
                  </h3>

                  <p className="text-xs text-slate-400 line-clamp-2 mt-1 leading-relaxed">
                    {eq.description || `${eq.manufacturer} ${eq.model}`}
                  </p>
                </div>

                {/* Card Footer Details */}
                <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs">
                  <div className="text-[11px] text-slate-400">
                    <span>{eq.laboratory?.name || 'Robotics Lab'}</span>
                    {eq.room && <span className="font-mono text-slate-400"> ({eq.room.roomNumber})</span>}
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setSelectedQR(eq)}
                      className="p-1.5 text-slate-400 hover:text-white rounded-md hover:bg-slate-800 transition-colors"
                      title="View QR Code"
                    >
                      <QrCode className="w-3.5 h-3.5" />
                    </button>
                    <Link
                      to={`/equipment/${eq._id}`}
                      className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-md transition-colors"
                    >
                      <span>View</span>
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Equipment View: Table Mode */}
      {viewMode === 'table' && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950/70 border-b border-slate-800 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                <tr>
                  <th className="py-3 px-4">Equipment Unit</th>
                  <th className="py-3 px-4">Code / Asset Tag</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Location</th>
                  <th className="py-3 px-4">Condition</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {items.map((eq) => (
                  <tr key={eq._id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-semibold text-white">{eq.name}</div>
                      <div className="text-[11px] text-slate-500">{eq.manufacturer} · {eq.model}</div>
                    </td>
                    <td className="py-3 px-4 font-mono text-[11px]">
                      <div className="text-cyan-400">{eq.equipmentCode}</div>
                      <div className="text-slate-500">{eq.assetTag}</div>
                    </td>
                    <td className="py-3 px-4 text-slate-300">{eq.category}</td>
                    <td className="py-3 px-4">
                      <div>{eq.laboratory?.name || 'General Lab'}</div>
                      {eq.room && <div className="text-[11px] font-mono text-slate-500">{eq.room.roomNumber}</div>}
                    </td>
                    <td className="py-3 px-4 font-mono text-[11px]">{eq.condition}</td>
                    <td className="py-3 px-4">
                      <StatusBadge status={eq.status} />
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setSelectedQR(eq)}
                          className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800"
                          title="QR Code"
                        >
                          <QrCode className="w-3.5 h-3.5" />
                        </button>
                        <Link
                          to={`/equipment/${eq._id}`}
                          className="px-2 py-1 text-[11px] font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700 rounded transition-colors"
                        >
                          Inspect
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!loading && items.length === 0 && (
        <div className="p-12 text-center bg-slate-900 border border-slate-800 rounded-xl space-y-3">
          <Cpu className="w-10 h-10 text-slate-600 mx-auto stroke-[1.5]" />
          <h3 className="text-sm font-semibold text-white">No Equipment Found</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            No equipment units matched your current filter criteria. Try adjusting the search query or status filters.
          </p>
        </div>
      )}

      {/* QR Code Modal */}
      <QRCodeModal
        isOpen={Boolean(selectedQR)}
        onClose={() => setSelectedQR(null)}
        equipment={
          selectedQR
            ? {
                name: selectedQR.name,
                equipmentCode: selectedQR.equipmentCode,
                assetTag: selectedQR.assetTag,
                category: selectedQR.category,
                status: selectedQR.status,
                qrCodeUrl: selectedQR.qrCodeData,
              }
            : null
        }
      />

      {/* Register Equipment Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 max-h-[90vh] overflow-y-auto">
            <h3 className="text-base font-bold text-white mb-4 pb-2 border-b border-slate-800">
              Register New Robotics Equipment
            </h3>
            <form onSubmit={handleCreateEquipment} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Equipment Name</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Dobot Magician Robotic Arm"
                    className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-white"
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Equipment Code</label>
                  <input
                    type="text"
                    required
                    value={formData.equipmentCode}
                    onChange={(e) => setFormData({ ...formData, equipmentCode: e.target.value })}
                    placeholder="EQ-ARM-009"
                    className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Asset Tag</label>
                  <input
                    type="text"
                    required
                    value={formData.assetTag}
                    onChange={(e) => setFormData({ ...formData, assetTag: e.target.value })}
                    placeholder="TAG-9921"
                    className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-white font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Manufacturer</label>
                  <input
                    type="text"
                    required
                    value={formData.manufacturer}
                    onChange={(e) => setFormData({ ...formData, manufacturer: e.target.value })}
                    placeholder="Dobot"
                    className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Model</label>
                  <input
                    type="text"
                    required
                    value={formData.model}
                    onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                    placeholder="Magician Basic"
                    className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Serial Number</label>
                  <input
                    type="text"
                    required
                    value={formData.serialNumber}
                    onChange={(e) => setFormData({ ...formData, serialNumber: e.target.value })}
                    placeholder="SN-102948"
                    className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Technical Description</label>
                <textarea
                  rows={2}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Key features, specifications, and primary educational use..."
                  className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Assigned Laboratory</label>
                  <select
                    value={formData.laboratory}
                    onChange={(e) => setFormData({ ...formData, laboratory: e.target.value })}
                    className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-white"
                  >
                    {labs.map((l) => (
                      <option key={l._id} value={l._id}>
                        {l.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Room (Optional)</label>
                  <select
                    value={formData.room}
                    onChange={(e) => setFormData({ ...formData, room: e.target.value })}
                    className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-white"
                  >
                    <option value="">None / Floating</option>
                    {rooms.map((r) => (
                      <option key={r._id} value={r._id}>
                        {r.roomNumber} - {r.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3 py-1.5 text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 font-semibold text-slate-950 bg-cyan-400 hover:bg-cyan-300 rounded-lg"
                >
                  Save Equipment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
