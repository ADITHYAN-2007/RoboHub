import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Package,
  Plus,
  Search,
  AlertTriangle,
  ArrowUpDown,
  History,
  FileText,
  CheckCircle,
} from 'lucide-react';
import { apiClient } from '../../api/client.js';
import { useAuth } from '../../context/AuthContext.js';
import type { InventoryItem, TransactionType } from '../../types/index.js';

export const InventoryList: React.FC = () => {
  const { hasRole } = useAuth();
  const isTechnicianOrAdmin = hasRole('SUPER_ADMIN', 'LAB_ADMIN', 'LAB_TECHNICIAN');

  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [lowStockOnly, setLowStockOnly] = useState(false);

  // Adjust stock modal
  const [adjustItem, setAdjustItem] = useState<InventoryItem | null>(null);
  const [delta, setDelta] = useState<number>(1);
  const [type, setType] = useState<TransactionType>('STOCK_IN');
  const [reason, setReason] = useState('');
  const [adjustLoading, setAdjustLoading] = useState(false);
  const [adjustError, setAdjustError] = useState<string | null>(null);

  // Add Item modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    componentCode: '',
    category: 'Sensors',
    partNumber: '',
    manufacturer: '',
    quantity: 10,
    minimumStock: 5,
    unit: 'pcs',
    storageLocation: 'Shelf A-1',
    cost: 5,
  });

  const fetchItems = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (categoryFilter !== 'ALL') params.append('category', categoryFilter);
      if (lowStockOnly) params.append('lowStockOnly', 'true');

      const res = await apiClient.get(`/inventory?${params.toString()}`);
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
    fetchItems();
  }, [categoryFilter, lowStockOnly]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchItems();
    }, 250);
    return () => clearTimeout(timer);
  }, [search]);

  const handleAdjustSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustItem) return;
    setAdjustError(null);
    setAdjustLoading(true);

    try {
      // Invert sign if stock out or damaged
      const finalDelta =
        type === 'STOCK_OUT' || type === 'DAMAGED' ? -Math.abs(delta) : Math.abs(delta);

      const res = await apiClient.post(`/inventory/${adjustItem._id}/adjust`, {
        delta: finalDelta,
        type,
        reason,
      });

      if (res.data.success) {
        setAdjustItem(null);
        setReason('');
        setDelta(1);
        fetchItems();
      }
    } catch (err: any) {
      setAdjustError(err.response?.data?.message || 'Failed to adjust stock.');
    } finally {
      setAdjustLoading(false);
    }
  };

  const handleCreateItem = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await apiClient.post('/inventory', formData);
      if (res.data.success) {
        setShowAddModal(false);
        fetchItems();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to create inventory item.');
    }
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-slate-800">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <span>Hardware Components & Inventory</span>
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400">
              {items.length} components
            </span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Microcontrollers, sensors, actuators, motor drivers, and fabrication consumables with audit logs.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to="/inventory/transactions"
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg transition-colors"
          >
            <History className="w-3.5 h-3.5 text-cyan-400" />
            <span>Audit Trail</span>
          </Link>

          <Link
            to="/inventory-requests"
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg transition-colors"
          >
            <FileText className="w-3.5 h-3.5 text-emerald-400" />
            <span>Requisitions</span>
          </Link>

          {isTechnicianOrAdmin && (
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-950 bg-cyan-400 hover:bg-cyan-300 rounded-lg transition-colors shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Part</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
        <div className="relative sm:col-span-2">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search parts by name, code, manufacturer, part number..."
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-900 border border-slate-800 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
          />
        </div>

        <div>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="w-full px-3 py-2 text-xs bg-slate-900 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-cyan-500"
          >
            <option value="ALL">All Categories</option>
            <option value="Motors">Motors</option>
            <option value="Motor Drivers">Motor Drivers</option>
            <option value="Sensors">Sensors</option>
            <option value="Batteries">Batteries</option>
            <option value="ICs">ICs</option>
            <option value="Resistors">Resistors</option>
            <option value="Connectors">Connectors</option>
          </select>
        </div>

        <div className="flex items-center">
          <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={lowStockOnly}
              onChange={(e) => setLowStockOnly(e.target.checked)}
              className="rounded bg-slate-950 border-slate-700 text-cyan-500 focus:ring-0"
            />
            <span className="flex items-center gap-1 text-rose-400">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Low Stock Alerts Only</span>
            </span>
          </label>
        </div>
      </div>

      {/* Inventory Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/70 border-b border-slate-800 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              <tr>
                <th className="py-3 px-4">Component</th>
                <th className="py-3 px-4">Part / Code</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Storage Location</th>
                <th className="py-3 px-4 font-mono">Stock Level</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {items.map((item) => {
                const isLow = item.quantity <= item.minimumStock;
                return (
                  <tr key={item._id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-semibold text-white">{item.name}</div>
                      <div className="text-[11px] text-slate-500">{item.manufacturer}</div>
                    </td>
                    <td className="py-3 px-4 font-mono text-[11px]">
                      <div className="text-cyan-400">{item.componentCode}</div>
                      <div className="text-slate-500">{item.partNumber}</div>
                    </td>
                    <td className="py-3 px-4 text-slate-300">{item.category}</td>
                    <td className="py-3 px-4 text-slate-400 font-mono text-[11px]">
                      {item.storageLocation}
                    </td>
                    <td className="py-3 px-4 font-mono tabular-nums">
                      <div className="flex items-center gap-1.5">
                        <span className={`font-bold ${isLow ? 'text-rose-400' : 'text-slate-100'}`}>
                          {item.quantity} {item.unit}
                        </span>
                        {isLow && (
                          <span className="text-[10px] text-rose-400 font-semibold px-1 rounded bg-rose-950/80 border border-rose-900">
                            LOW
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-slate-500">Min: {item.minimumStock}</div>
                    </td>
                    <td className="py-3 px-4 text-right">
                      {isTechnicianOrAdmin && (
                        <button
                          onClick={() => setAdjustItem(item)}
                          className="px-2.5 py-1 text-[11px] font-semibold text-slate-950 bg-cyan-400 hover:bg-cyan-300 rounded transition-colors inline-flex items-center gap-1"
                        >
                          <ArrowUpDown className="w-3 h-3" />
                          <span>Adjust</span>
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}

              {!loading && items.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-xs text-slate-500">
                    No inventory components found matching your search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Adjust Stock Modal */}
      {adjustItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6">
            <h3 className="text-base font-bold text-white mb-1">Adjust Inventory Stock</h3>
            <p className="text-xs text-slate-400 mb-4">
              Updating quantity for <span className="text-white font-medium">{adjustItem.name}</span>. Every modification is recorded in the immutable audit log.
            </p>

            {adjustError && (
              <div className="p-2.5 mb-3 rounded bg-rose-950/60 border border-rose-800 text-xs text-rose-300">
                {adjustError}
              </div>
            )}

            <form onSubmit={handleAdjustSubmit} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Transaction Type</label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white"
                  >
                    <option value="STOCK_IN">STOCK IN (+ Intake)</option>
                    <option value="STOCK_OUT">STOCK OUT (- Dispense)</option>
                    <option value="ADJUSTMENT">AUDIT ADJUSTMENT (Recount)</option>
                    <option value="DAMAGED">DAMAGED / DEFECTIVE (- Scrap)</option>
                    <option value="RETURNED">RETURNED (+ Returned part)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">
                    Quantity ({adjustItem.unit})
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={delta}
                    onChange={(e) => setDelta(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Mandatory Reason / Project</label>
                <textarea
                  rows={2}
                  required
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="e.g. Replenishment shipment from Digikey, student robotics arm experiment..."
                  className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setAdjustItem(null)}
                  className="px-3 py-1.5 text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={adjustLoading}
                  className="px-4 py-1.5 font-semibold text-slate-950 bg-cyan-400 hover:bg-cyan-300 rounded-lg"
                >
                  {adjustLoading ? 'Logging...' : 'Apply Stock Change'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Part Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6">
            <h3 className="text-base font-bold text-white mb-1">Register New Component</h3>
            <p className="text-xs text-slate-400 mb-4">
              Add a new hardware consumable or module to university storage inventory.
            </p>

            <form onSubmit={handleCreateItem} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Component Name</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. MG996R Metal Gear Servo"
                    className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Component Code</label>
                  <input
                    type="text"
                    required
                    value={formData.componentCode}
                    onChange={(e) => setFormData({ ...formData, componentCode: e.target.value })}
                    placeholder="INV-MOT-009"
                    className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-white font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-white"
                  >
                    <option value="Motors">Motors</option>
                    <option value="Motor Drivers">Motor Drivers</option>
                    <option value="Sensors">Sensors</option>
                    <option value="Batteries">Batteries</option>
                    <option value="ICs">ICs</option>
                    <option value="Resistors">Resistors</option>
                    <option value="Connectors">Connectors</option>
                    <option value="Mechanical Parts">Mechanical Parts</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Part Number</label>
                  <input
                    type="text"
                    value={formData.partNumber}
                    onChange={(e) => setFormData({ ...formData, partNumber: e.target.value })}
                    placeholder="MG996R-180"
                    className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Manufacturer</label>
                  <input
                    type="text"
                    value={formData.manufacturer}
                    onChange={(e) => setFormData({ ...formData, manufacturer: e.target.value })}
                    placeholder="TowerPro"
                    className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Initial Quantity</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: Number(e.target.value) })}
                    className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Min Threshold</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={formData.minimumStock}
                    onChange={(e) =>
                      setFormData({ ...formData, minimumStock: Number(e.target.value) })
                    }
                    className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Unit</label>
                  <input
                    type="text"
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                    placeholder="pcs"
                    className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Storage Location</label>
                <input
                  type="text"
                  required
                  value={formData.storageLocation}
                  onChange={(e) => setFormData({ ...formData, storageLocation: e.target.value })}
                  placeholder="e.g. Cabinet B - Drawer 04"
                  className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-white"
                />
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
                  Save Component
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
