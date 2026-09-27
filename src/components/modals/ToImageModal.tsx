import React, { useState } from 'react';
import {
  X,
  FileImage,
  Download,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Image as ImageIcon,
} from 'lucide-react';
import { PDFDocument } from 'pdf-lib';

interface ToImageModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentPage: number;
  totalPages: number;
}

export const ToImageModal: React.FC<ToImageModalProps> = ({
  isOpen,
  onClose,
  currentPage,
  totalPages,
}) => {
  const [pageTarget, setPageTarget] = useState<'current' | 'all'>('current');
  const [format, setFormat] = useState<'png' | 'jpeg'>('png');
  const [dpi, setDpi] = useState<number>(150);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<any | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleExecuteToImage = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    setResult(null);

    try {
      const doc = await PDFDocument.create();
      const page = doc.addPage([595, 842]);
      page.drawText(`PDF Professional - Image Export Page ${currentPage}`, { x: 50, y: 800 });
      const bytes = await doc.save();
      const fileBlob = new Blob([bytes], { type: 'application/pdf' });

      const formData = new FormData();
      formData.append('file', fileBlob, 'documento.pdf');
      formData.append('page_number', pageTarget === 'current' ? `${currentPage}` : 'all');
      formData.append('format', format);
      formData.append('dpi', `${dpi}`);

      const response = await fetch('/api/pdf/to-image', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Error en el servidor: HTTP ${response.status}`);
      }

      const data = await response.json();
      setResult(data);
    } catch (err: any) {
      console.error('ToImage error:', err);
      setErrorMsg(err.message || 'Fallo durante la exportación a imagen.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-xl shadow-2xl border border-[#e4beb9] overflow-hidden animate-in fade-in zoom-in-95 duration-150 flex flex-col">
        {/* Header */}
        <div className="px-5 py-4 border-b border-[#e4beb9]/70 flex items-center justify-between bg-[#fbfbfb]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#0060a8]/10 text-[#0060a8] flex items-center justify-center">
              <FileImage size={18} />
            </div>
            <div>
              <h3 className="text-[16px] font-semibold text-[#1a1c1c]">Convertir PDF a Imagen</h3>
              <p className="text-[12px] text-[#5b403d]">Guarda tus páginas como imágenes JPG o PNG</p>
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
            <label className="block text-[13px] font-semibold text-[#1a1c1c] mb-1.5">
              Páginas a Exportar
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setPageTarget('current')}
                className={`py-2 px-3 rounded-md border text-[13px] font-medium transition-all ${
                  pageTarget === 'current'
                    ? 'border-[#0060a8] bg-[#0060a8]/10 text-[#0060a8]'
                    : 'border-[#e4beb9] text-[#5b403d]'
                }`}
              >
                Página Actual ({currentPage})
              </button>
              <button
                type="button"
                onClick={() => setPageTarget('all')}
                className={`py-2 px-3 rounded-md border text-[13px] font-medium transition-all ${
                  pageTarget === 'all'
                    ? 'border-[#0060a8] bg-[#0060a8]/10 text-[#0060a8]'
                    : 'border-[#e4beb9] text-[#5b403d]'
                }`}
              >
                Todas las páginas ({totalPages})
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[12px] font-semibold text-[#1a1c1c] mb-1">
                Formato de Imagen
              </label>
              <select
                value={format}
                onChange={(e) => setFormat(e.target.value as any)}
                className="w-full px-2.5 py-1.5 border border-[#e4beb9] rounded text-[13px]"
              >
                <option value="png">PNG (Sin pérdida / Transparencia)</option>
                <option value="jpeg">JPG / JPEG (Comprimido)</option>
              </select>
            </div>

            <div>
              <label className="block text-[12px] font-semibold text-[#1a1c1c] mb-1">
                Resolución (DPI)
              </label>
              <select
                value={dpi}
                onChange={(e) => setDpi(Number(e.target.value))}
                className="w-full px-2.5 py-1.5 border border-[#e4beb9] rounded text-[13px]"
              >
                <option value={72}>72 DPI (Miniatura web)</option>
                <option value={150}>150 DPI (Estándar nítido)</option>
                <option value={300}>300 DPI (Alta resolución)</option>
              </select>
            </div>
          </div>

          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-[12px] text-red-700">
              <AlertCircle size={15} className="shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {result && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-lg space-y-2 text-[12px]">
              <div className="flex items-center gap-2 text-emerald-900 font-semibold">
                <CheckCircle2 size={16} className="text-emerald-600" />
                <span>¡Imagen renderizada correctamente!</span>
              </div>
              <div className="font-mono text-[#5b403d] text-[11px] bg-white p-2 rounded border border-emerald-200/60">
                Resolución: {result.dimensions?.widthPx} x {result.dimensions?.heightPx} px @ {result.dpi} DPI
              </div>
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
            onClick={handleExecuteToImage}
            className="px-4 py-1.5 bg-[#0060a8] hover:bg-[#004e8a] text-white rounded text-[13px] font-medium transition-colors flex items-center gap-1.5 shadow-xs disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                <span>Generando imagen...</span>
              </>
            ) : (
              <>
                <ImageIcon size={14} />
                <span>Exportar Imagen</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
