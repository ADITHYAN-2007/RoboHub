import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { History, ArrowLeft, ArrowUpRight, ArrowDownRight, RefreshCw, AlertTriangle } from 'lucide-react';
import { apiClient } from '../../api/client.js';
import type { InventoryTransaction } from '../../types/index.js';

export const InventoryTransactions: React.FC = () => {
  const [transactions, setTransactions] = useState<InventoryTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState('ALL');

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (typeFilter !== 'ALL') params.append('type', typeFilter);

      const res = await apiClient.get(`/inventory/transactions?${params.toString()}`);
      if (res.data.success) {
        setTransactions(res.data.data.items);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, [typeFilter]);

  const typeColorMap: Record<string, { color: string; icon: any }> = {
    STOCK_IN: { color: 'text-emerald-400 bg-emerald-950/40 border-emerald-800/60', icon: ArrowUpRight },
    STOCK_OUT: { color: 'text-cyan-400 bg-cyan-950/40 border-cyan-800/60', icon: ArrowDownRight },
    ADJUSTMENT: { color: 'text-purple-400 bg-purple-950/40 border-purple-800/60', icon: RefreshCw },
    DAMAGED: { color: 'text-rose-400 bg-rose-950/40 border-rose-800/60', icon: AlertTriangle },
    TRANSFER: { color: 'text-blue-400 bg-blue-950/40 border-blue-800/60', icon: RefreshCw },
    RETURNED: { color: 'text-emerald-400 bg-emerald-950/40 border-emerald-800/60', icon: ArrowUpRight },
  };

  return (
    <div className="space-y-5">
      <div>
        <Link
          to="/inventory"
          className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white mb-2"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Component Inventory</span>
        </Link>
        <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
          <span>Inventory Transaction Ledger</span>
          <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400">
            {transactions.length} records
          </span>
        </h1>
        <p className="text-xs text-slate-400 mt-0.5">
          Immutable ledger of every single physical quantity adjustment, intake shipment, and project dispense.
        </p>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 p-1 rounded-lg w-fit text-xs">
        {['ALL', 'STOCK_IN', 'STOCK_OUT', 'ADJUSTMENT', 'DAMAGED', 'RETURNED'].map((t) => (
          <button
            key={t}
            onClick={() => setTypeFilter(t)}
            className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
              typeFilter === t
                ? 'bg-slate-800 text-white shadow-xs font-semibold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            {t.replace(/_/g, ' ')}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/70 border-b border-slate-800 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              <tr>
                <th className="py-3 px-4">Transaction Type</th>
                <th className="py-3 px-4">Component</th>
                <th className="py-3 px-4">Quantity Delta</th>
                <th className="py-3 px-4">Before → After</th>
                <th className="py-3 px-4">Reason / Project</th>
                <th className="py-3 px-4">Logged By</th>
                <th className="py-3 px-4">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {transactions.map((tx) => {
                const conf = typeColorMap[tx.type] || typeColorMap.ADJUSTMENT;
                const Icon = conf.icon;
                return (
                  <tr key={tx._id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono border font-semibold ${conf.color}`}
                      >
                        <Icon className="w-3 h-3" />
                        <span>{tx.type}</span>
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-white">{tx.inventoryItem?.name}</div>
                      <div className="text-[11px] font-mono text-cyan-400">
                        {tx.inventoryItem?.componentCode}
                      </div>
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-white tabular-nums">
                      {tx.quantity > 0 ? `+${tx.quantity}` : tx.quantity}{' '}
                      <span className="font-normal text-slate-400 text-[11px]">
                        {tx.inventoryItem?.unit}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono text-[11px] text-slate-400 tabular-nums">
                      {tx.previousQuantity} → <span className="text-white font-semibold">{tx.newQuantity}</span>
                    </td>
                    <td className="py-3 px-4 max-w-xs truncate text-slate-300">
                      {tx.reason}
                    </td>
                    <td className="py-3 px-4">
                      <div className="text-slate-200">{tx.user?.fullName}</div>
                    </td>
                    <td className="py-3 px-4 font-mono text-[11px] text-slate-400">
                      {new Date(tx.timestamp).toLocaleString()}
                    </td>
                  </tr>
                );
              })}

              {!loading && transactions.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-xs text-slate-500">
                    No transactions recorded for this filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
