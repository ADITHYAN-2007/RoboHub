import React, { useState, useEffect } from 'react';
import { ShieldCheck, AlertCircle, FileCheck, CheckCircle2, ChevronDown, ChevronUp } from 'lucide-react';
import { apiClient } from '../../api/client.js';
import { useAuth } from '../../context/AuthContext.js';
import type { SafetyDocument, SafetyAcknowledgement } from '../../types/index.js';

export const SafetyDashboard: React.FC = () => {
  const { user } = useAuth();
  const [documents, setDocuments] = useState<SafetyDocument[]>([]);
  const [userAcks, setUserAcks] = useState<SafetyAcknowledgement[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedDocId, setExpandedDocId] = useState<string | null>(null);
  const [acknowledgingId, setAcknowledgingId] = useState<string | null>(null);

  const fetchSafety = async () => {
    try {
      setLoading(true);
      const [docsRes, acksRes] = await Promise.all([
        apiClient.get('/safety'),
        apiClient.get('/safety/user-status'),
      ]);
      if (docsRes.data.success) setDocuments(docsRes.data.data || []);
      if (acksRes.data.success) setUserAcks(acksRes.data.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSafety();
  }, []);

  const handleAcknowledge = async (docId: string) => {
    try {
      setAcknowledgingId(docId);
      const res = await apiClient.post('/safety/acknowledge', { documentId: docId });
      if (res.data.success) {
        fetchSafety();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to record acknowledgement.');
    } finally {
      setAcknowledgingId(null);
    }
  };

  const isDocAcknowledged = (docId: string) => {
    return userAcks.some((a) => {
      const doc = a.safetyDocument as any;
      return (typeof doc === 'string' ? doc : doc?._id) === docId;
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="pb-3 border-b border-slate-800">
        <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
          <span>Safety Protocols & Compliance</span>
          <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400">
            OSHA & University Standards
          </span>
        </h1>
        <p className="text-xs text-slate-400 mt-0.5">
          Laboratory operating procedures, mandatory student PPE clearances, and battery fire safety.
        </p>
      </div>

      {/* Safety Clearance Status Banner */}
      <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-950/60 border border-emerald-800/80 text-emerald-400 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-semibold text-white">
              {user?.fullName} — Clearance Status
            </div>
            <div className="text-[11px] text-slate-400">
              Acknowledged{' '}
              <span className="font-mono text-cyan-400 font-semibold">{userAcks.length}</span> of{' '}
              <span className="font-mono text-white font-semibold">{documents.length}</span> mandatory protocols.
            </div>
          </div>
        </div>

        {userAcks.length === documents.length && documents.length > 0 ? (
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-950/50 border border-emerald-800 text-emerald-400 text-xs font-medium">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Full Safety Clearance Active</span>
          </div>
        ) : (
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-950/50 border border-amber-800 text-amber-400 text-xs font-medium">
            <AlertCircle className="w-3.5 h-3.5" />
            <span>Action Required: Review Pending SOPs</span>
          </div>
        )}
      </div>

      {/* Documents List */}
      <div className="space-y-4">
        {documents.map((doc) => {
          const acknowledged = isDocAcknowledged(doc._id);
          const isExpanded = expandedDocId === doc._id;

          return (
            <div
              key={doc._id}
              className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden transition-all shadow-xs"
            >
              <div className="p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-xs">
                    <span className="font-mono text-cyan-400 font-semibold">{doc.code}</span>
                    <span>·</span>
                    <span className="text-slate-400">{doc.category}</span>
                    <span>·</span>
                    <span className="font-mono text-slate-500">v{doc.version}</span>
                  </div>
                  <h3 className="text-base font-semibold text-white">{doc.title}</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">{doc.summary}</p>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  {acknowledged ? (
                    <span className="inline-flex items-center gap-1 px-3 py-1 text-xs font-semibold text-emerald-400 bg-emerald-950/50 border border-emerald-800/80 rounded-lg font-mono">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>ACKNOWLEDGED</span>
                    </span>
                  ) : (
                    <button
                      onClick={() => handleAcknowledge(doc._id)}
                      disabled={acknowledgingId === doc._id}
                      className="px-3.5 py-1.5 text-xs font-semibold text-slate-950 bg-cyan-400 hover:bg-cyan-300 rounded-lg transition-colors shadow-xs"
                    >
                      {acknowledgingId === doc._id ? 'Saving...' : 'Acknowledge Protocol'}
                    </button>
                  )}

                  <button
                    onClick={() => setExpandedDocId(isExpanded ? null : doc._id)}
                    className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
                  >
                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Collapsible Rules & SOP Breakdown */}
              {isExpanded && (
                <div className="p-5 pt-0 border-t border-slate-800/80 bg-slate-950/50 space-y-4 text-xs">
                  <div>
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                      Mandatory Operational Directives
                    </h4>
                    <ul className="space-y-1.5 text-slate-300">
                      {doc.rules?.map((rule, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <span className="text-cyan-400 font-mono">[{idx + 1}]</span>
                          <span>{rule}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-rose-400 mb-2">
                      Emergency & Fail-Safe Response SOP
                    </h4>
                    <ul className="space-y-1.5 text-slate-300">
                      {doc.emergencyProcedures?.map((proc, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <AlertCircle className="w-3.5 h-3.5 text-rose-400 shrink-0 mt-0.5" />
                          <span>{proc}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {doc.requiredForCategories && doc.requiredForCategories.length > 0 && (
                    <div className="pt-2 text-[11px] text-slate-400">
                      <span>Mandatory clearance for reserving: </span>
                      <span className="text-slate-200 font-medium">
                        {doc.requiredForCategories.join(', ')}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
