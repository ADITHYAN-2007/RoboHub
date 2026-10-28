import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isDestructive?: boolean;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  isDestructive = true,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-xl shadow-2xl p-5 animate-in zoom-in-95 duration-150">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-2.5 text-slate-100">
            {isDestructive && (
              <div className="p-1.5 rounded-lg bg-rose-950/70 border border-rose-900/80 text-rose-400 shrink-0">
                <AlertTriangle className="w-4 h-4" />
              </div>
            )}
            <h3 className="text-base font-semibold">{title}</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1">
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-sm text-slate-400 leading-relaxed mb-6">{message}</p>

        <div className="flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-3.5 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors border border-slate-700"
          >
            {cancelText}
          </button>
          <button
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className={`px-4 py-1.5 text-xs font-medium text-white rounded-lg transition-colors shadow-sm ${
              isDestructive
                ? 'bg-rose-600 hover:bg-rose-500'
                : 'bg-cyan-600 hover:bg-cyan-500'
            }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export const SkeletonTable: React.FC<{ rows?: number }> = ({ rows = 5 }) => {
  return (
    <div className="w-full divide-y divide-slate-800/80 animate-pulse">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center justify-between p-4 gap-4">
          <div className="flex items-center gap-3 w-1/3">
            <div className="w-9 h-9 bg-slate-800 rounded-lg shrink-0" />
            <div className="space-y-1.5 w-full">
              <div className="h-3.5 bg-slate-800 rounded w-4/5" />
              <div className="h-2.5 bg-slate-800/60 rounded w-1/2" />
            </div>
          </div>
          <div className="h-3.5 bg-slate-800 rounded w-24 hidden md:block" />
          <div className="h-3.5 bg-slate-800 rounded w-20 hidden sm:block" />
          <div className="h-6 bg-slate-800/60 rounded w-16" />
        </div>
      ))}
    </div>
  );
};
