import React, { useState, useEffect } from 'react';
import {
  FileSpreadsheet,
  Download,
  Calendar,
  Filter,
  Cpu,
  Repeat,
  Wrench,
  Package,
} from 'lucide-react';
import { apiClient } from '../../api/client.js';

export const ReportsDashboard: React.FC = () => {
  const [activeReport, setActiveReport] = useState<'equipment' | 'reservations' | 'inventory' | 'maintenance'>('equipment');
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchReport = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get(`/reports/${activeReport}`);
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
    fetchReport();
  }, [activeReport]);

  const handleExportCSV = () => {
    // Open CSV download endpoint directly
    window.location.href = `/api/reports/${activeReport}?format=csv`;
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-slate-800">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <span>Laboratory Reports & CSV Data Export</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Audit-grade inventory reports, borrowing statistics, and equipment maintenance expenditure logs.
          </p>
        </div>

        <button
          onClick={handleExportCSV}
          className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-slate-950 bg-cyan-400 hover:bg-cyan-300 rounded-lg transition-colors whitespace-nowrap shadow-xs"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Export {activeReport.toUpperCase()} (CSV)</span>
        </button>
      </div>

      {/* Report Switcher Tabs */}
      <div className="flex flex-wrap items-center gap-1 bg-slate-900 border border-slate-800 p-1 rounded-lg w-fit text-xs">
        <button
          onClick={() => setActiveReport('equipment')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium transition-colors ${
            activeReport === 'equipment' ? 'bg-slate-800 text-white font-semibold' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Cpu className="w-3.5 h-3.5" />
          <span>Equipment Roster</span>
        </button>

        <button
          onClick={() => setActiveReport('reservations')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium transition-colors ${
            activeReport === 'reservations' ? 'bg-slate-800 text-white font-semibold' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Calendar className="w-3.5 h-3.5" />
          <span>Reservations Log</span>
        </button>

        <button
          onClick={() => setActiveReport('inventory')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium transition-colors ${
            activeReport === 'inventory' ? 'bg-slate-800 text-white font-semibold' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Package className="w-3.5 h-3.5" />
          <span>Components Stock</span>
        </button>

        <button
          onClick={() => setActiveReport('maintenance')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium transition-colors ${
            activeReport === 'maintenance' ? 'bg-slate-800 text-white font-semibold' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Wrench className="w-3.5 h-3.5" />
          <span>Maintenance & Repairs</span>
        </button>
      </div>

      {/* Report Preview Data Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto max-h-[65vh]">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/80 border-b border-slate-800 text-[11px] font-semibold uppercase tracking-wider text-slate-400 sticky top-0">
              {activeReport === 'equipment' && (
                <tr>
                  <th className="py-3 px-4">Code</th>
                  <th className="py-3 px-4">Asset Tag</th>
                  <th className="py-3 px-4">Equipment Unit</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Manufacturer</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Condition</th>
                  <th className="py-3 px-4 font-mono">Value ($)</th>
                </tr>
              )}
              {activeReport === 'reservations' && (
                <tr>
                  <th className="py-3 px-4">Equipment</th>
                  <th className="py-3 px-4">Borrower</th>
                  <th className="py-3 px-4">Student ID</th>
                  <th className="py-3 px-4">Department</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Slot</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Purpose</th>
                </tr>
              )}
              {activeReport === 'inventory' && (
                <tr>
                  <th className="py-3 px-4">Code</th>
                  <th className="py-3 px-4">Part Name</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Quantity</th>
                  <th className="py-3 px-4">Min Stock</th>
                  <th className="py-3 px-4">Location</th>
                  <th className="py-3 px-4 font-mono">Unit Cost</th>
                </tr>
              )}
              {activeReport === 'maintenance' && (
                <tr>
                  <th className="py-3 px-4">Equipment</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Technician</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4 font-mono">Cost</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Scope</th>
                </tr>
              )}
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
              {data.map((row, idx) => (
                <tr key={idx} className="hover:bg-slate-800/40 transition-colors">
                  {Object.values(row).map((val: any, cIdx) => (
                    <td key={cIdx} className="py-2.5 px-4 truncate max-w-xs text-slate-300">
                      {String(val ?? '')}
                    </td>
                  ))}
                </tr>
              ))}

              {!loading && data.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-xs font-sans text-slate-500">
                    No data records found for this report.
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
