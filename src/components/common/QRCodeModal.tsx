import React from 'react';
import { X, Download, Printer } from 'lucide-react';

interface QRCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  equipment: {
    name: string;
    equipmentCode: string;
    assetTag: string;
    category: string;
    status: string;
    qrCodeUrl?: string;
  } | null;
}

export const QRCodeModal: React.FC<QRCodeModalProps> = ({ isOpen, onClose, equipment }) => {
  if (!isOpen || !equipment) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    if (!equipment.qrCodeUrl) return;
    const a = document.createElement('a');
    a.href = equipment.qrCodeUrl;
    a.download = `QR_${equipment.equipmentCode}.png`;
    a.click();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 text-center animate-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
          <h3 className="text-sm font-semibold text-slate-200">Equipment Asset Tag & QR</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* QR Code Container */}
        <div className="bg-white p-4 rounded-xl inline-block shadow-inner mb-4">
          {equipment.qrCodeUrl ? (
            <img
              src={equipment.qrCodeUrl}
              alt={`QR Code for ${equipment.name}`}
              className="w-48 h-48 mx-auto object-contain"
            />
          ) : (
            <div className="w-48 h-48 flex items-center justify-center text-xs text-slate-500 font-mono">
              Generating QR...
            </div>
          )}
        </div>

        {/* Equipment Identification Info */}
        <div className="space-y-1 mb-5">
          <h4 className="text-sm font-semibold text-white truncate">{equipment.name}</h4>
          <div className="text-xs text-slate-400 flex items-center justify-center gap-2">
            <span className="font-mono text-cyan-400">{equipment.equipmentCode}</span>
            <span>·</span>
            <span className="font-mono text-slate-400">{equipment.assetTag}</span>
          </div>
          <div className="text-[11px] text-slate-500 uppercase tracking-wider">{equipment.category}</div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={handleDownload}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            Download PNG
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors"
          >
            <Printer className="w-3.5 h-3.5" />
            Print Tag
          </button>
        </div>
      </div>
    </div>
  );
};
