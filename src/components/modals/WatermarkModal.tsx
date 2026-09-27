import React, { useState, useRef } from 'react';
import {
  X,
  Stamp,
  Download,
  CheckCircle2,
  Loader2,
  AlertCircle,
  Upload,
} from 'lucide-react';
import { PDFDocument } from 'pdf-lib';

interface WatermarkModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDocumentProcessed?: (pdfBytes: Uint8Array, fileName: string) => void;
}

export const WatermarkModal: React.FC<WatermarkModalProps> = ({
  isOpen,
  onClose,
  onDocumentProcessed,
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [watermarkText, setWatermarkText] = useState('CONFIDENCIAL');
  const [opacity, setOpacity] = useState<number>(0.25);
  const [fontSize, setFontSize] = useState<number>(48);
  const [angle, setAngle] = useState<number>(45);
  const [color, setColor] = useState<'gray' | 'red' | 'blue'>('gray');
  const [isLoading, setIsLoading] = useState(false);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [resultBytes, setResultBytes] = useState<Uint8Array | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleApplyWatermark = async () => {
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
        // Generar muestra base si no subió archivo
        const sampleDoc = await PDFDocument.create();
        for (let i = 1; i <= 3; i++) {
          const page = sampleDoc.addPage([595, 842]);
          page.drawText(`PDF Professional - Documento de Muestra (Página ${i})`, {
            x: 50,
            y: 800,
          });
        }
        const b = await sampleDoc.save();
        fileToSend = new Blob([b], { type: 'application/pdf' });
        filename = 'documento_marca_agua.pdf';
      }

      const formData = new FormData();
      formData.append('file', fileToSend, filename);
      formData.append('text', watermarkText || 'CONFIDENCIAL');
      formData.append('opacity', opacity.toString());
      formData.append('font_size', fontSize.toString());
      formData.append('angle', angle.toString());
      formData.append('color', color);

      const res = await fetch('/api/pdf/watermark', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || 'Error al procesar la marca de agua.');
      }

      const blob = await res.blob();
      const arrayBuffer = await blob.arrayBuffer();
      const bytes = new Uint8Array(arrayBuffer);
      const url = URL.createObjectURL(blob);

      setResultUrl(url);
      setResultBytes(bytes);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Error inesperado al aplicar la marca de agua.');
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
            <div className="w-9 h-9 rounded-xl bg-red-100 dark:bg-red-950/60 text-[#b7131a] flex items-center justify-center">
              <Stamp size={20} />
            </div>
            <div>
              <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
                Aplicar Marca de Agua de Seguridad
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Estampa texto diagonal centrado en todas las páginas del documento
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
              className="border-2 border-dashed border-zinc-300 dark:border-zinc-700 hover:border-[#b7131a] rounded-xl p-3 text-center cursor-pointer transition-colors"
            >
              <Upload size={18} className="mx-auto text-zinc-400 mb-1" />
              <p className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                {selectedFile ? selectedFile.name : 'Haz clic para seleccionar un PDF local (o usar documento activo)'}
              </p>
            </div>
          </div>

          {/* Texto de Marca de Agua */}
          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
              Texto de la Marca de Agua
            </label>
            <input
              type="text"
              value={watermarkText}
              onChange={(e) => setWatermarkText(e.target.value)}
              placeholder="Ej: CONFIDENCIAL, COPIA, BORRADOR..."
              className="w-full px-3 py-2 text-sm rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-[#b7131a]"
            />
          </div>

          {/* Color y Ángulo */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                Color
              </label>
              <select
                value={color}
                onChange={(e) => setColor(e.target.value as any)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
              >
                <option value="gray">Gris Neutro</option>
                <option value="red">Rojo Alerta</option>
                <option value="blue">Azul Corporativo</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                Inclinación
              </label>
              <select
                value={angle}
                onChange={(e) => setAngle(parseInt(e.target.value, 10))}
                className="w-full px-3 py-2 text-xs rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
              >
                <option value={45}>Diagonal 45°</option>
                <option value={-45}>Diagonal -45°</option>
                <option value={0}>Horizontal 0°</option>
                <option value={90}>Vertical 90°</option>
              </select>
            </div>
          </div>

          {/* Opacidad y Tamaño */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                Opacidad ({Math.round(opacity * 100)}%)
              </label>
              <input
                type="range"
                min="0.05"
                max="0.80"
                step="0.05"
                value={opacity}
                onChange={(e) => setOpacity(parseFloat(e.target.value))}
                className="w-full accent-[#b7131a]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                Tamaño de Fuente ({fontSize}pt)
              </label>
              <input
                type="range"
                min="24"
                max="72"
                step="4"
                value={fontSize}
                onChange={(e) => setFontSize(parseInt(e.target.value, 10))}
                className="w-full accent-[#b7131a]"
              />
            </div>
          </div>

          {/* Resultado Exitoso */}
          {resultUrl && (
            <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl space-y-3">
              <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 font-semibold text-xs">
                <CheckCircle2 size={16} />
                <span>¡Marca de agua aplicada exitosamente!</span>
              </div>
              <div className="flex gap-2">
                <a
                  href={resultUrl}
                  download="documento_marca_agua.pdf"
                  className="flex-1 py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Download size={14} />
                  <span>Descargar PDF</span>
                </a>
                {onDocumentProcessed && resultBytes && (
                  <button
                    onClick={() => {
                      onDocumentProcessed(resultBytes, 'documento_marca_agua.pdf');
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
            onClick={handleApplyWatermark}
            disabled={isLoading}
            className="px-5 py-2 rounded-lg text-xs font-semibold bg-[#b7131a] hover:bg-[#961016] text-white flex items-center gap-1.5 shadow-sm transition-all disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                <span>Procesando...</span>
              </>
            ) : (
              <>
                <Stamp size={14} />
                <span>Estampar Marca de Agua</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
