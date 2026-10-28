import React, { useState, useEffect } from 'react';
import { FileCode, Globe, Shield, Terminal, ChevronRight } from 'lucide-react';
import { apiClient } from '../../api/client.js';

export const ApiDocs: React.FC = () => {
  const [spec, setSpec] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiClient.get('/docs').then((res) => {
      if (res.data.success) {
        setSpec(res.data.data);
      }
      setLoading(false);
    });
  }, []);

  const methodColor = (method: string) => {
    switch (method) {
      case 'GET':
        return 'text-emerald-400 bg-emerald-950/60 border-emerald-800/80';
      case 'POST':
        return 'text-cyan-400 bg-cyan-950/60 border-cyan-800/80';
      case 'PATCH':
        return 'text-amber-400 bg-amber-950/60 border-amber-800/80';
      case 'DELETE':
        return 'text-rose-400 bg-rose-950/60 border-rose-800/80';
      default:
        return 'text-slate-400 bg-slate-800 border-slate-700';
    }
  };

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="pb-3 border-b border-slate-800">
        <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
          <span>Robo Lab Hub REST API Documentation</span>
          <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-800 text-cyan-400">
            v1.0.0 OpenAPI
          </span>
        </h1>
        <p className="text-xs text-slate-400 mt-0.5">
          RESTful backend endpoints for robotics laboratory operations, equipment reservations, and telemetry.
        </p>
      </div>

      <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl space-y-2 text-xs">
        <div className="flex items-center gap-2 font-semibold text-white">
          <Terminal className="w-4 h-4 text-cyan-400" />
          <span>Base Server URL & Authentication</span>
        </div>
        <div className="font-mono bg-slate-950 p-2.5 rounded border border-slate-800 text-slate-300">
          Authorization: Bearer &lt;ACCESS_TOKEN&gt; · Cookies: robolab_refresh_token (HTTP-Only)
        </div>
      </div>

      {/* Endpoints Grouped */}
      <div className="space-y-6">
        {spec?.endpoints?.map((grp: any, idx: number) => (
          <div key={idx} className="space-y-3">
            <h2 className="text-sm font-bold text-white flex items-center gap-2 uppercase tracking-wider text-xs">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
              <span>{grp.category}</span>
            </h2>

            <div className="bg-slate-900 border border-slate-800 rounded-xl divide-y divide-slate-800/80 overflow-hidden shadow-xs">
              {grp.routes?.map((route: any, rIdx: number) => (
                <div
                  key={rIdx}
                  className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs hover:bg-slate-800/30 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`w-16 text-center font-mono font-bold text-[10px] px-2 py-0.5 rounded border ${methodColor(
                        route.method
                      )}`}
                    >
                      {route.method}
                    </span>
                    <span className="font-mono text-white text-xs">/api{route.path}</span>
                  </div>

                  <div className="text-slate-400 text-xs sm:text-right">
                    {route.description}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
