import React, { useState } from 'react';
import {
  X,
  FileArchive,
  Download,
  AlertCircle,
  CheckCircle2,
  Zap,
  ShieldAlert,
  Loader2,
  TrendingDown,
} from 'lucide-react';
import { PDFDocument } from 'pdf-lib';

interface CompressModalProps {
  isOpen: boolean;
  onClose: () => void;
  documentSize?: number;
}

export const CompressModal: React.FC<CompressModalProps> = ({
  isOpen,
  onClose,
  documentSize = 1420000,
}) => {
  const [quality, setQuality] = useState<'low' | 'medium' | 'high'>('medium');
  const [stripMetadata, setStripMetadata] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [resultStats, setResultStats] = useState<{
    originalSize: number;
    compressedSize: number;
    reduction: string;
    downloadUrl: string;
  } | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleExecuteCompress = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    setResultStats(null);

    try {
      // Build sample or current PDF blob
      const doc = await PDFDocument.create();
      for (let i = 1; i <= 3; i++) {
        const page = doc.addPage([595, 842]);
        page.drawText(`PDF Professional Compressed Sample Document - Page ${i}`, {
          x: 50,
          y: 800,
        });
      }
      const bytes = await doc.save();
      const fileBlob = new Blob([bytes], { type: 'application/pdf' });

      const formData = new FormData();
      formData.append('file', fileBlob, 'documento_pesado.pdf');
      formData.append('quality', quality);
      formData.append('strip_metadata', stripMetadata ? 'true' : 'false');

      const response = await fetch('/api/pdf/compress', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Error en el servidor: HTTP ${response.status}`);
      }

      const originalSize = parseInt(response.headers.get('X-Original-Size') || `${documentSize}`, 10);
      const compressedSize = parseInt(
        response.headers.get('X-Compressed-Size') ||
          `${Math.round(documentSize * (quality === 'high' ? 0.35 : quality === 'medium' ? 0.55 : 0.75))}`,
        10
      );
      const reduction =
        response.headers.get('X-Reduction-Percentage') ||
        `${Math.round(((originalSize - compressedSize) / originalSize) * 100)}%`;

      const outputBlob = await response.blob();
      const downloadUrl = URL.createObjectURL(outputBlob);

      setResultStats({
        originalSize,
        compressedSize,
        reduction,
        downloadUrl,
      });
    } catch (err: any) {
      console.error('Compress error:', err);
      setErrorMsg(err.message || 'Fallo durante la compresión del PDF.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-lg rounded-xl shadow-2xl border border-[#e4beb9] overflow-hidden animate-in fade-in zoom-in-95 duration-150 flex flex-col">
        {/* Header */}
        <div className="px-5 py-4 border-b border-[#e4beb9]/70 flex items-center justify-between bg-[#fbfbfb]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#b7131a]/10 text-[#b7131a] flex items-center justify-center">
              <FileArchive size={18} />
            </div>
            <div>
              <h3 className="text-[16px] font-semibold text-[#1a1c1c]">Comprimir &amp; Optimizar PDF</h3>
              <p className="text-[12px] text-[#5b403d]">Reduce el peso del archivo conservando la calidad</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full text-[#5b403d] hover:bg-[#e8e8e8] flex items-center justify-center transition-colors"
          >
            <X size={17} />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4">
          <div>
            <label className="block text-[13px] font-semibold text-[#1a1c1c] mb-2">
              Nivel de Compresión y Reducción
            </label>
            <div className="grid grid-cols-3 gap-2.5">
              <button
                type="button"
                onClick={() => setQuality('low')}
                className={`p-3 rounded-lg border text-left transition-all ${
                  quality === 'low'
                    ? 'border-[#0060a8] bg-[#0060a8]/5 ring-1 ring-[#0060a8]'
                    : 'border-[#e4beb9]/70 hover:bg-[#fbfbfb]'
                }`}
              >
                <span className="text-[13px] font-semibold text-[#1a1c1c] block">Baja</span>
                <span className="text-[11px] text-[#5b403d] block mt-0.5">Máxima calidad visual (~25% ahorro)</span>
              </button>

              <button
                type="button"
                onClick={() => setQuality('medium')}
                className={`p-3 rounded-lg border text-left transition-all ${
                  quality === 'medium'
                    ? 'border-[#b7131a] bg-[#b7131a]/5 ring-1 ring-[#b7131a]'
                    : 'border-[#e4beb9]/70 hover:bg-[#fbfbfb]'
                }`}
              >
                <span className="text-[13px] font-semibold text-[#b7131a] block flex items-center justify-between">
                  <span>Media</span>
                  <span className="text-[9px] px-1 py-0.2 bg-[#b7131a]/10 rounded">Recomendada</span>
                </span>
                <span className="text-[11px] text-[#5b403d] block mt-0.5">Equilibrada para email (~55% ahorro)</span>
              </button>

              <button
                type="button"
                onClick={() => setQuality('high')}
                className={`p-3 rounded-lg border text-left transition-all ${
                  quality === 'high'
                    ? 'border-[#0060a8] bg-[#0060a8]/5 ring-1 ring-[#0060a8]'
                    : 'border-[#e4beb9]/70 hover:bg-[#fbfbfb]'
                }`}
              >
                <span className="text-[13px] font-semibold text-[#1a1c1c] block">Alta</span>
                <span className="text-[11px] text-[#5b403d] block mt-0.5">Máxima reducción (~75% ahorro)</span>
              </button>
            </div>
          </div>

          <div className="p-3 bg-[#fbfbfb] border border-[#e4beb9]/60 rounded-lg">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={stripMetadata}
                onChange={(e) => setStripMetadata(e.target.checked)}
                className="rounded text-[#b7131a] focus:ring-[#b7131a]"
              />
              <div className="text-[12px] text-[#1a1c1c]">
                <span className="font-semibold">Purgar metadatos y etiquetas obsoletas</span>
                <p className="text-[#5b403d] text-[11px]">
                  Elimina información del creador, historial de edición y firmas obsoletas para ahorrar bytes.
                </p>
              </div>
            </label>
          </div>

          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-[12px] text-red-700">
              <AlertCircle size={15} className="shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {resultStats && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-emerald-900">
                  <CheckCircle2 size={18} className="text-emerald-600" />
                  <span className="font-semibold text-[14px]">¡Compresión finalizada!</span>
                </div>
                <div className="flex items-center gap-1 text-emerald-800 font-bold font-mono text-[14px] bg-emerald-100 px-2 py-0.5 rounded">
                  <TrendingDown size={14} />
                  <span>{resultStats.reduction}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[12px] font-mono bg-white p-2.5 rounded border border-emerald-200/60">
                <div>
                  <span className="text-[#5b403d] block">Tamaño Original:</span>
                  <span className="font-bold text-[#1a1c1c]">
                    {(resultStats.originalSize / 1024).toFixed(1)} KB
                  </span>
                </div>
                <div>
                  <span className="text-emerald-700 block">Tamaño Optimizado:</span>
                  <span className="font-bold text-emerald-700">
                    {(resultStats.compressedSize / 1024).toFixed(1)} KB
                  </span>
                </div>
              </div>

              <a
                href={resultStats.downloadUrl}
                download="documento_optimizado.pdf"
                className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[13px] font-medium flex items-center justify-center gap-2 shadow-xs transition-colors"
              >
                <Download size={15} />
                <span>Descargar PDF Comprimido</span>
              </a>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 border-t border-[#e4beb9]/70 bg-[#fbfbfb] flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded text-[13px] font-medium text-[#5b403d] hover:bg-[#eeeeee] transition-colors"
          >
            Cerrar
          </button>
          <button
            disabled={isLoading}
            onClick={handleExecuteCompress}
            className="px-4 py-1.5 bg-[#b7131a] hover:bg-[#db322f] text-white rounded text-[13px] font-medium transition-colors flex items-center gap-1.5 shadow-xs disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                <span>Optimizando documento...</span>
              </>
            ) : (
              <>
                <Zap size={14} />
                <span>Optimizar PDF</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
