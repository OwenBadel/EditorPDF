import React, { useState, useRef } from 'react';
import {
  X,
  Binary,
  Download,
  CheckCircle2,
  Loader2,
  AlertCircle,
  Upload,
} from 'lucide-react';
import { PDFDocument } from 'pdf-lib';

interface PageNumberModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDocumentProcessed?: (pdfBytes: Uint8Array, fileName: string) => void;
}

export const PageNumberModal: React.FC<PageNumberModalProps> = ({
  isOpen,
  onClose,
  onDocumentProcessed,
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [format, setFormat] = useState<'detailed' | 'simple' | 'numbers'>('detailed');
  const [position, setPosition] = useState<'bottom-center' | 'bottom-right' | 'top-right'>('bottom-center');
  const [startNumber, setStartNumber] = useState<number>(1);
  const [fontSize, setFontSize] = useState<number>(10);
  const [isLoading, setIsLoading] = useState(false);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [resultBytes, setResultBytes] = useState<Uint8Array | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleApplyPageNumbers = async () => {
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
        for (let i = 1; i <= 4; i++) {
          const page = sampleDoc.addPage([595, 842]);
          page.drawText(`Documento PDF Paginación de Muestra - Página ${i}`, {
            x: 50,
            y: 800,
          });
        }
        const b = await sampleDoc.save();
        fileToSend = new Blob([b], { type: 'application/pdf' });
        filename = 'documento_paginado.pdf';
      }

      const formData = new FormData();
      formData.append('file', fileToSend, filename);
      formData.append('format', format);
      formData.append('position', position);
      formData.append('start_number', startNumber.toString());
      formData.append('font_size', fontSize.toString());

      const res = await fetch('/api/pdf/paginate', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || 'Fallo durante la paginación del documento.');
      }

      const blob = await res.blob();
      const arrayBuffer = await blob.arrayBuffer();
      const bytes = new Uint8Array(arrayBuffer);
      const url = URL.createObjectURL(blob);

      setResultUrl(url);
      setResultBytes(bytes);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Error inesperado al paginar el documento.');
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
            <div className="w-9 h-9 rounded-xl bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-400 flex items-center justify-center">
              <Binary size={20} />
            </div>
            <div>
              <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
                Insertar Numeración de Páginas
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Estampa números de página correlativos de forma automática
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
              className="border-2 border-dashed border-zinc-300 dark:border-zinc-700 hover:border-purple-600 rounded-xl p-3 text-center cursor-pointer transition-colors"
            >
              <Upload size={18} className="mx-auto text-zinc-400 mb-1" />
              <p className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                {selectedFile ? selectedFile.name : 'Haz clic para seleccionar un PDF local (o usar documento activo)'}
              </p>
            </div>
          </div>

          {/* Formato y Posición */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                Formato de Texto
              </label>
              <select
                value={format}
                onChange={(e) => setFormat(e.target.value as any)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
              >
                <option value="detailed">"Página 1 de 10"</option>
                <option value="simple">"1 / 10"</option>
                <option value="numbers">"1, 2, 3..."</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                Posición
              </label>
              <select
                value={position}
                onChange={(e) => setPosition(e.target.value as any)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
              >
                <option value="bottom-center">Inferior Centro</option>
                <option value="bottom-right">Inferior Derecha</option>
                <option value="top-right">Superior Derecha</option>
              </select>
            </div>
          </div>

          {/* Número Inicial y Tamaño */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                Iniciar en Página N°
              </label>
              <input
                type="number"
                min="1"
                value={startNumber}
                onChange={(e) => setStartNumber(parseInt(e.target.value, 10) || 1)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                Tamaño ({fontSize}pt)
              </label>
              <input
                type="number"
                min="8"
                max="18"
                value={fontSize}
                onChange={(e) => setFontSize(parseInt(e.target.value, 10) || 10)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
              />
            </div>
          </div>

          {/* Resultado Exitoso */}
          {resultUrl && (
            <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl space-y-3">
              <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 font-semibold text-xs">
                <CheckCircle2 size={16} />
                <span>¡Páginas numeradas exitosamente!</span>
              </div>
              <div className="flex gap-2">
                <a
                  href={resultUrl}
                  download="documento_paginado.pdf"
                  className="flex-1 py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Download size={14} />
                  <span>Descargar PDF</span>
                </a>
                {onDocumentProcessed && resultBytes && (
                  <button
                    onClick={() => {
                      onDocumentProcessed(resultBytes, 'documento_paginado.pdf');
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
            onClick={handleApplyPageNumbers}
            disabled={isLoading}
            className="px-5 py-2 rounded-lg text-xs font-semibold bg-purple-600 hover:bg-purple-700 text-white flex items-center gap-1.5 shadow-sm transition-all disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                <span>Numerando...</span>
              </>
            ) : (
              <>
                <Binary size={14} />
                <span>Insertar Números</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
