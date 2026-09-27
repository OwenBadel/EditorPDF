import React, { useState } from 'react';
import {
  X,
  Scissors,
  Download,
  AlertCircle,
  CheckCircle2,
  FileArchive,
  FileText,
  Loader2,
  Layers,
} from 'lucide-react';
import { PDFDocument } from 'pdf-lib';

interface SplitModalProps {
  isOpen: boolean;
  onClose: () => void;
  totalPages: number;
}

export const SplitModal: React.FC<SplitModalProps> = ({
  isOpen,
  onClose,
  totalPages,
}) => {
  const [pageRanges, setPageRanges] = useState('1-2');
  const [mode, setMode] = useState<'single' | 'zip'>('single');
  const [isLoading, setIsLoading] = useState(false);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [selectedFormat, setSelectedFormat] = useState<string>('pdf');

  if (!isOpen) return null;

  const handleExecuteSplit = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    setResultUrl(null);

    try {
      // Build sample PDF or current doc
      const doc = await PDFDocument.create();
      for (let i = 1; i <= Math.max(totalPages, 3); i++) {
        const page = doc.addPage([595, 842]);
        page.drawText(`PDF Professional - Página ${i}`, { x: 50, y: 800 });
      }
      const bytes = await doc.save();
      const fileBlob = new Blob([bytes], { type: 'application/pdf' });

      const formData = new FormData();
      formData.append('file', fileBlob, 'documento_fuente.pdf');
      formData.append('page_ranges', pageRanges);
      formData.append('mode', mode);

      const response = await fetch('/api/pdf/split', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Error en el servidor: HTTP ${response.status}`);
      }

      const outputBlob = await response.blob();
      const downloadUrl = URL.createObjectURL(outputBlob);
      setResultUrl(downloadUrl);
      setSelectedFormat(mode === 'zip' ? 'zip' : 'pdf');
    } catch (err: any) {
      console.error('Split error:', err);
      setErrorMsg(err.message || 'Fallo durante la división del PDF.');
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
            <div className="w-8 h-8 rounded-lg bg-[#0060a8]/10 text-[#0060a8] flex items-center justify-center">
              <Scissors size={18} />
            </div>
            <div>
              <h3 className="text-[16px] font-semibold text-[#1a1c1c]">Dividir / Extraer Páginas</h3>
              <p className="text-[12px] text-[#5b403d]">Extrae páginas concretas o separa tu documento</p>
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
            <label className="block text-[13px] font-semibold text-[#1a1c1c] mb-1">
              Rango de páginas a extraer
            </label>
            <input
              type="text"
              value={pageRanges}
              onChange={(e) => setPageRanges(e.target.value)}
              placeholder="ej. 1-3, 5"
              className="w-full px-3 py-2 border border-[#e4beb9] rounded-md text-[13px] font-mono focus:outline-none focus:border-[#0060a8]"
            />
            <p className="text-[11px] text-[#5b403d] mt-1">
              Usa comas para separar páginas y guiones para rangos (ej: <code className="bg-[#eeeeee] px-1 py-0.2 rounded font-mono">1-2, 3</code>). Total de páginas disponibles: {totalPages}.
            </p>
          </div>

          <div>
            <label className="block text-[13px] font-semibold text-[#1a1c1c] mb-2">
              Formato de entrega
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label
                className={`flex items-start gap-2.5 p-3 rounded-lg border cursor-pointer transition-all ${
                  mode === 'single'
                    ? 'border-[#0060a8] bg-[#0060a8]/5'
                    : 'border-[#e4beb9]/70 hover:border-[#0060a8]/40'
                }`}
              >
                <input
                  type="radio"
                  name="split-mode"
                  checked={mode === 'single'}
                  onChange={() => setMode('single')}
                  className="mt-0.5 text-[#0060a8]"
                />
                <div>
                  <div className="flex items-center gap-1.5 font-medium text-[13px] text-[#1a1c1c]">
                    <FileText size={14} className="text-[#0060a8]" />
                    <span>Un solo PDF extraído</span>
                  </div>
                  <p className="text-[11px] text-[#5b403d] mt-0.5">
                    Un único documento con las páginas seleccionadas.
                  </p>
                </div>
              </label>

              <label
                className={`flex items-start gap-2.5 p-3 rounded-lg border cursor-pointer transition-all ${
                  mode === 'zip'
                    ? 'border-[#0060a8] bg-[#0060a8]/5'
                    : 'border-[#e4beb9]/70 hover:border-[#0060a8]/40'
                }`}
              >
                <input
                  type="radio"
                  name="split-mode"
                  checked={mode === 'zip'}
                  onChange={() => setMode('zip')}
                  className="mt-0.5 text-[#0060a8]"
                />
                <div>
                  <div className="flex items-center gap-1.5 font-medium text-[13px] text-[#1a1c1c]">
                    <FileArchive size={14} className="text-[#0060a8]" />
                    <span>Archivo ZIP separado</span>
                  </div>
                  <p className="text-[11px] text-[#5b403d] mt-0.5">
                    Un archivo .zip con cada página como PDF individual.
                  </p>
                </div>
              </label>
            </div>
          </div>

          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-[12px] text-red-700">
              <AlertCircle size={15} className="shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {resultUrl && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center justify-between text-[13px] text-emerald-900">
              <div className="flex items-center gap-2">
                <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
                <div>
                  <p className="font-semibold">¡División completada con éxito!</p>
                  <p className="text-[11px] text-emerald-700 font-mono">
                    Formato: {selectedFormat.toUpperCase()}
                  </p>
                </div>
              </div>
              <a
                href={resultUrl}
                download={`split_output.${selectedFormat}`}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[12px] font-medium flex items-center gap-1.5 shadow-xs"
              >
                <Download size={14} />
                <span>Descargar {selectedFormat.toUpperCase()}</span>
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
            disabled={isLoading || !pageRanges.trim()}
            onClick={handleExecuteSplit}
            className="px-4 py-1.5 bg-[#0060a8] hover:bg-[#004e8a] text-white rounded text-[13px] font-medium transition-colors flex items-center gap-1.5 shadow-xs disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                <span>Dividiendo documento...</span>
              </>
            ) : (
              <>
                <Scissors size={14} />
                <span>Dividir PDF</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
