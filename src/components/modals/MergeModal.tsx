import React, { useState, useRef } from 'react';
import {
  X,
  Combine,
  Plus,
  Trash2,
  MoveUp,
  MoveDown,
  Download,
  AlertCircle,
  CheckCircle2,
  FileText,
  Loader2,
} from 'lucide-react';
import { PDFDocument } from 'pdf-lib';

interface MergeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onMergedSuccess?: (blob: Blob, name: string) => void;
}

interface MergeFileItem {
  id: string;
  name: string;
  size: number;
  file?: File;
  isSample?: boolean;
}

export const MergeModal: React.FC<MergeModalProps> = ({
  isOpen,
  onClose,
  onMergedSuccess,
}) => {
  const [files, setFiles] = useState<MergeFileItem[]>([
    {
      id: 'sample-1',
      name: 'Contrato_Principal_Seccion_A.pdf',
      size: 485000,
      isSample: true,
    },
    {
      id: 'sample-2',
      name: 'Anexos_Firmas_Seccion_B.pdf',
      size: 320000,
      isSample: true,
    },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleAddFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const fileList: File[] = Array.from(e.target.files);
      const newItems: MergeFileItem[] = fileList.map((f: File) => ({
        id: `file-${Date.now()}-${Math.random()}`,
        name: f.name,
        size: f.size,
        file: f,
      }));
      setFiles((prev) => [...prev, ...newItems]);
      setErrorMsg(null);
    }
  };

  const handleRemove = (id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const handleMove = (index: number, direction: 'up' | 'down') => {
    const newFiles = [...files];
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= newFiles.length) return;
    const [moved] = newFiles.splice(index, 1);
    newFiles.splice(targetIdx, 0, moved);
    setFiles(newFiles);
  };

  const handleExecuteMerge = async () => {
    if (files.length < 2) {
      setErrorMsg('Se requieren al menos 2 archivos para realizar la unión.');
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);

    try {
      // Build FormData for real POST /api/pdf/merge call
      const formData = new FormData();
      let hasRealFiles = false;

      for (const item of files) {
        if (item.file) {
          formData.append('files', item.file);
          hasRealFiles = true;
        } else {
          // Generate a synthetic valid PDF blob for samples
          const doc = await PDFDocument.create();
          const page = doc.addPage([595, 842]);
          page.drawText(`PDF Professional Sample Document: ${item.name}`, { x: 50, y: 800 });
          const bytes = await doc.save();
          const sampleBlob = new Blob([bytes], { type: 'application/pdf' });
          formData.append('files', sampleBlob, item.name);
          hasRealFiles = true;
        }
      }

      const response = await fetch('/api/pdf/merge', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Error en el servidor: HTTP ${response.status}`);
      }

      const blob = await response.blob();
      const downloadUrl = URL.createObjectURL(blob);
      setResultUrl(downloadUrl);

      if (onMergedSuccess) {
        onMergedSuccess(blob, 'merged_document.pdf');
      }
    } catch (err: any) {
      console.error('Merge error:', err);
      setErrorMsg(err.message || 'Fallo durante la ejecución de unión de PDFs.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-xl rounded-xl shadow-2xl border border-[#e4beb9] overflow-hidden animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-[#e4beb9]/70 flex items-center justify-between bg-[#fbfbfb]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#b7131a]/10 text-[#b7131a] flex items-center justify-center">
              <Combine size={18} />
            </div>
            <div>
              <h3 className="text-[16px] font-semibold text-[#1a1c1c]">Unir Archivos PDF</h3>
              <p className="text-[12px] text-[#5b403d]">Combina varios documentos en un único archivo</p>
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
        <div className="p-5 overflow-y-auto space-y-4 flex-1">
          <p className="text-[13px] text-[#5b403d]">
            Sube y ordena los documentos PDF en la secuencia deseada para combinarlos en un único archivo consolidado.
          </p>

          {/* List of files */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-[12px] font-semibold text-[#1a1c1c]">
              <span>Documentos a combinar ({files.length})</span>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="text-[#0060a8] hover:underline flex items-center gap-1 font-medium"
              >
                <Plus size={13} />
                <span>Añadir archivo</span>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="application/pdf"
                className="hidden"
                onChange={handleAddFiles}
              />
            </div>

            <div className="border border-[#e4beb9]/70 rounded-lg overflow-hidden divide-y divide-[#e4beb9]/40 bg-[#fbfbfb]">
              {files.map((item, idx) => (
                <div
                  key={item.id}
                  className="px-3 py-2.5 flex items-center justify-between gap-3 hover:bg-white transition-colors"
                >
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <span className="w-5 h-5 rounded-full bg-[#eeeeee] text-[#5b403d] text-[11px] font-mono font-bold flex items-center justify-center shrink-0">
                      {idx + 1}
                    </span>
                    <FileText size={16} className="text-[#b7131a] shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-[13px] font-medium text-[#1a1c1c] truncate">{item.name}</p>
                      <p className="text-[11px] text-[#5b403d] font-mono">
                        {(item.size / 1024).toFixed(1)} KB {item.isSample ? '• Muestra' : ''}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      disabled={idx === 0}
                      onClick={() => handleMove(idx, 'up')}
                      className="p-1 text-[#5b403d] hover:bg-[#eeeeee] rounded disabled:opacity-30"
                      title="Mover arriba"
                    >
                      <MoveUp size={13} />
                    </button>
                    <button
                      disabled={idx === files.length - 1}
                      onClick={() => handleMove(idx, 'down')}
                      className="p-1 text-[#5b403d] hover:bg-[#eeeeee] rounded disabled:opacity-30"
                      title="Mover abajo"
                    >
                      <MoveDown size={13} />
                    </button>
                    <button
                      onClick={() => handleRemove(item.id)}
                      className="p-1 text-red-600 hover:bg-red-50 rounded"
                      title="Eliminar"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              ))}
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
                  <p className="font-semibold">¡PDFs unidos con éxito!</p>
                  <p className="text-[11px] text-emerald-700 font-mono">Archivo listo para descargar</p>
                </div>
              </div>
              <a
                href={resultUrl}
                download="documento_unido.pdf"
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[12px] font-medium flex items-center gap-1.5 shadow-xs"
              >
                <Download size={14} />
                <span>Descargar PDF</span>
              </a>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 border-t border-[#e4beb9]/70 bg-[#fbfbfb] flex items-center justify-between">
          <span className="text-[11px] font-mono text-[#5b403d]">Límite total: 20 MB</span>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded text-[13px] font-medium text-[#5b403d] hover:bg-[#eeeeee] transition-colors"
            >
              Cerrar
            </button>
            <button
              disabled={isLoading || files.length < 2}
              onClick={handleExecuteMerge}
              className="px-4 py-1.5 bg-[#b7131a] hover:bg-[#db322f] text-white rounded text-[13px] font-medium transition-colors flex items-center gap-1.5 shadow-xs disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  <span>Uniendo documentos...</span>
                </>
              ) : (
                <>
                  <Combine size={14} />
                  <span>Unir PDFs</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
