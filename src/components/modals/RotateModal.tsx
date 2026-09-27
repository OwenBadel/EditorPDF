import React, { useState, useRef } from 'react';
import {
  X,
  RotateCw,
  Download,
  CheckCircle2,
  Loader2,
  AlertCircle,
  Upload,
} from 'lucide-react';
import { PDFDocument } from 'pdf-lib';

interface RotateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDocumentProcessed?: (pdfBytes: Uint8Array, fileName: string) => void;
}

export const RotateModal: React.FC<RotateModalProps> = ({
  isOpen,
  onClose,
  onDocumentProcessed,
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [rotationAngle, setRotationAngle] = useState<number>(90);
  const [pageScope, setPageScope] = useState<'all' | 'custom'>('all');
  const [customPages, setCustomPages] = useState<string>('1');
  const [isLoading, setIsLoading] = useState(false);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [resultBytes, setResultBytes] = useState<Uint8Array | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleExecuteRotate = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    setResultUrl(null);

    try {
      let fileToSend: Blob;
      let filename = 'documento.pdf';

      if (selectedFile) {
        fileToSend = selectedFile;
        filename = selectedFile.name;
      } else {
        const sampleDoc = await PDFDocument.create();
        for (let i = 1; i <= 3; i++) {
          const page = sampleDoc.addPage([595, 842]);
          page.drawText(`Documento PDF Rotación de Muestra - Página ${i}`, {
            x: 50,
            y: 800,
          });
        }
        const b = await sampleDoc.save();
        fileToSend = new Blob([b], { type: 'application/pdf' });
        filename = 'documento_rotado.pdf';
      }

      const formData = new FormData();
      formData.append('file', fileToSend, filename);
      formData.append('rotation', rotationAngle.toString());
      formData.append('pages', pageScope === 'all' ? 'all' : customPages);

      const res = await fetch('/api/pdf/rotate', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || 'Fallo durante la rotación del documento.');
      }

      const blob = await res.blob();
      const arrayBuffer = await blob.arrayBuffer();
      const bytes = new Uint8Array(arrayBuffer);
      const url = URL.createObjectURL(blob);

      setResultUrl(url);
      setResultBytes(bytes);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Error inesperado al rotar el documento.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-zinc-900 w-full max-w-lg rounded-2xl shadow-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100 dark:border-zinc-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-100 dark:bg-blue-950/60 text-[#0060a8] flex items-center justify-center">
              <RotateCw size={20} />
            </div>
            <div>
              <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
                Rotar Páginas de Documento PDF
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Gira todas las páginas o un rango determinado en 90°, 180° o 270°
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          {errorMsg && (
            <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 rounded-xl text-red-700 dark:text-red-300 text-xs flex items-center gap-2">
              <AlertCircle size={16} className="shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Archivo Seleccionado */}
          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
              Documento PDF Fuente
            </label>
            <input
              type="file"
              ref={fileInputRef}
              accept="application/pdf"
              className="hidden"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  setSelectedFile(e.target.files[0]);
                }
              }}
            />
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-zinc-300 dark:border-zinc-700 hover:border-[#0060a8] rounded-xl p-3 text-center cursor-pointer transition-colors"
            >
              <Upload size={18} className="mx-auto text-zinc-400 mb-1" />
              <p className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                {selectedFile ? selectedFile.name : 'Haz clic para seleccionar un PDF local (o usar documento activo)'}
              </p>
            </div>
          </div>

          {/* Ángulo de Rotación */}
          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
              Ángulo de Giro
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { angle: 90, label: '90° Horario' },
                { angle: 180, label: '180° Invertido' },
                { angle: 270, label: '270° Antihorario' },
              ].map((opt) => (
                <button
                  key={opt.angle}
                  type="button"
                  onClick={() => setRotationAngle(opt.angle)}
                  className={`py-2 px-3 rounded-lg border text-xs font-medium transition-all ${
                    rotationAngle === opt.angle
                      ? 'border-[#0060a8] bg-blue-50 dark:bg-blue-950/40 text-[#0060a8] dark:text-blue-400 shadow-2xs font-semibold'
                      : 'border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Alcance de Páginas */}
          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
              Páginas a Rotar
            </label>
            <div className="flex gap-4 mb-2">
              <label className="flex items-center gap-1.5 text-xs text-zinc-700 dark:text-zinc-300 cursor-pointer">
                <input
                  type="radio"
                  name="pageScope"
                  checked={pageScope === 'all'}
                  onChange={() => setPageScope('all')}
                  className="accent-[#0060a8]"
                />
                <span>Todas las páginas</span>
              </label>
              <label className="flex items-center gap-1.5 text-xs text-zinc-700 dark:text-zinc-300 cursor-pointer">
                <input
                  type="radio"
                  name="pageScope"
                  checked={pageScope === 'custom'}
                  onChange={() => setPageScope('custom')}
                  className="accent-[#0060a8]"
                />
                <span>Páginas específicas</span>
              </label>
            </div>
            {pageScope === 'custom' && (
              <input
                type="text"
                value={customPages}
                onChange={(e) => setCustomPages(e.target.value)}
                placeholder="Ej: 1, 3, 5-7"
                className="w-full px-3 py-2 text-xs rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
              />
            )}
          </div>

          {/* Resultado Exitoso */}
          {resultUrl && (
            <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl space-y-3">
              <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 font-semibold text-xs">
                <CheckCircle2 size={16} />
                <span>¡Documento rotado exitosamente!</span>
              </div>
              <div className="flex gap-2">
                <a
                  href={resultUrl}
                  download="documento_rotado.pdf"
                  className="flex-1 py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Download size={14} />
                  <span>Descargar PDF</span>
                </a>
                {onDocumentProcessed && resultBytes && (
                  <button
                    onClick={() => {
                      onDocumentProcessed(resultBytes, 'documento_rotado.pdf');
                      onClose();
                    }}
                    className="py-2 px-3 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg text-xs font-medium transition-colors"
                  >
                    Abrir en Editor
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-zinc-50 dark:bg-zinc-900/60 border-t border-zinc-100 dark:border-zinc-800 flex justify-end gap-2.5">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleExecuteRotate}
            disabled={isLoading}
            className="px-5 py-2 rounded-lg text-xs font-semibold bg-[#0060a8] hover:bg-[#004e8a] text-white flex items-center gap-1.5 shadow-sm transition-all disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                <span>Rotando...</span>
              </>
            ) : (
              <>
                <RotateCw size={14} />
                <span>Rotar Documento</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
