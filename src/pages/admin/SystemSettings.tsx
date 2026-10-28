import React, { useState, useEffect } from 'react';
import { Sliders, Save, CheckCircle2 } from 'lucide-react';
import { apiClient } from '../../api/client.js';

export const SystemSettings: React.FC = () => {
  const [settings, setSettings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<Record<string, string>>({});
  const [successKey, setSuccessKey] = useState<string | null>(null);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get('/settings');
      if (res.data.success) {
        setSettings(res.data.data || []);
        const map: Record<string, string> = {};
        for (const s of res.data.data) {
          map[s.key] = s.value;
        }
        setEditValues(map);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSave = async (key: string) => {
    try {
      setSavingKey(key);
      const res = await apiClient.patch(`/settings/${key}`, {
        value: editValues[key],
      });
      if (res.data.success) {
        setSuccessKey(key);
        setTimeout(() => setSuccessKey(null), 2000);
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to update setting.');
    } finally {
      setSavingKey(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="pb-3 border-b border-slate-800">
        <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
          <span>Laboratory System & Safety Configuration</span>
        </h1>
        <p className="text-xs text-slate-400 mt-0.5">
          Global policies for booking duration caps, safety acknowledgements, and institutional support dispatches.
        </p>
      </div>

      <div className="space-y-3">
        {settings.map((s) => (
          <div
            key={s.key}
            className="p-5 bg-slate-900 border border-slate-800 rounded-xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
          >
            <div className="space-y-1 max-w-lg">
              <div className="text-[11px] font-mono text-cyan-400 font-semibold">{s.key}</div>
              <h3 className="text-sm font-semibold text-white">{s.description}</h3>
              <div className="text-[11px] text-slate-500 uppercase tracking-wide">Category: {s.category}</div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <input
                type="text"
                value={editValues[s.key] ?? s.value}
                onChange={(e) => setEditValues({ ...editValues, [s.key]: e.target.value })}
                className="w-48 px-3 py-1.5 text-xs bg-slate-950 border border-slate-700 rounded-lg text-white font-mono"
              />
              <button
                onClick={() => handleSave(s.key)}
                disabled={savingKey === s.key}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-950 bg-cyan-400 hover:bg-cyan-300 rounded-lg transition-colors"
              >
                {successKey === s.key ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5 text-slate-950" />
                    <span>Saved</span>
                  </>
                ) : (
                  <>
                    <Save className="w-3.5 h-3.5" />
                    <span>{savingKey === s.key ? 'Saving...' : 'Apply'}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
