import React, { useState, useRef } from 'react';
import {
  UploadCloud,
  FileText,
  Lock,
  Zap,
  CheckCircle,
  FileCheck,
  Layers,
  ArrowRight,
  ShieldCheck,
  Loader2,
} from 'lucide-react';
import { PDFDocument } from 'pdf-lib';
import { LoadedDocument } from '../types';

interface UploadViewProps {
  onDocumentLoaded: (doc: LoadedDocument) => void;
  onOpenSampleDocument: () => void;
  onOpenMergeModal: () => void;
  onOpenApiPlayground: () => void;
}

export const UploadView: React.FC<UploadViewProps> = ({
  onDocumentLoaded,
  onOpenSampleDocument,
  onOpenMergeModal,
  onOpenApiPlayground,
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  const [showUrlInput, setShowUrlInput] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.pdf') && file.type !== 'application/pdf') {
      alert('Por favor selecciona un archivo en formato PDF válido.');
      return;
    }

    if (file.size > 25 * 1024 * 1024) {
      alert('El archivo excede el límite máximo permitido de 25MB.');
      return;
    }

    setIsProcessing(true);
    try {
      const arrayBuffer = await file.arrayBuffer();
      const bytes = new Uint8Array(arrayBuffer);

      let detectedPages = 1;
      try {
        const loadedPdf = await PDFDocument.load(bytes, { ignoreEncryption: true });
        detectedPages = Math.max(1, loadedPdf.getPageCount());
      } catch (parseErr) {
        console.warn('PDF parsing page count fallback:', parseErr);
        detectedPages = 3;
      }

      onDocumentLoaded({
        name: file.name,
        size: file.size,
        totalPages: detectedPages,
        fileBytes: bytes,
        fileBlob: file,
      });
    } catch (err) {
      console.error('Error reading PDF file:', err);
      alert('No se pudo procesar el archivo PDF. Intente con otro archivo.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleUrlSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!urlInput.trim()) return;
    onOpenSampleDocument();
  };

  return (
    <main
      id="upload-canvas-view"
      className="flex-1 flex flex-col items-center justify-center p-6 sm:p-10 select-none bg-[#f9f9f9] dark:bg-[#121214] min-h-[calc(100vh-48px)] transition-colors"
    >
      <div className="w-full max-w-2xl bg-white dark:bg-zinc-900 rounded-xl shadow-[0_2px_16px_rgba(0,0,0,0.04)] border border-[#e4beb9]/60 dark:border-zinc-800 p-2">
        {/* Dashed Dropzone matching Image 1 */}
        <div
          id="dropzone-area"
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`w-full h-[320px] sm:h-[390px] flex flex-col items-center justify-center gap-5 p-8 transition-all duration-200 cursor-pointer rounded-lg border-2 border-dashed group relative ${
            isDragOver
              ? 'bg-[#b7131a]/5 dark:bg-red-950/20 border-[#b7131a] dark:border-red-500'
              : 'border-[#e4beb9] dark:border-zinc-700 hover:border-[#b7131a]/60 dark:hover:border-red-400 bg-[#fbfbfb] dark:bg-zinc-800/40'
          }`}
        >
          {/* Graphic Icon */}
          <div className="w-20 h-20 rounded-2xl bg-[#eeeeee] dark:bg-zinc-800 flex items-center justify-center shadow-xs group-hover:-translate-y-1 transition-transform duration-300">
            <div className="w-12 h-14 bg-white dark:bg-zinc-900 border border-[#e4beb9] dark:border-zinc-700 rounded flex flex-col items-center justify-center shadow-xs">
              <div className="w-7 h-2 bg-[#b7131a] dark:bg-red-500 rounded-xs mb-1"></div>
              <span className="text-[10px] font-black text-[#b7131a] dark:text-red-400 font-mono tracking-tighter">
                PDF
              </span>
            </div>
          </div>

          {/* Heading & Subtitle */}
          <div className="text-center space-y-1.5 max-w-md">
            <h2 className="text-[20px] font-semibold text-[#1a1c1c] dark:text-zinc-100 tracking-tight">
              Arrastra y suelta tu archivo PDF aquí
            </h2>
            <p className="text-[14px] text-[#5b403d] dark:text-zinc-400 leading-relaxed">
              Sube y edita tus documentos de forma rápida, privada y segura.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="mt-2 flex flex-col sm:flex-row items-center gap-3">
            <button
              type="button"
              disabled={isProcessing}
              className="bg-[#b7131a] text-white px-6 py-2.5 rounded-md hover:bg-[#db322f] active:scale-95 transition-all duration-150 text-[13px] font-medium flex items-center gap-2 shadow-sm disabled:opacity-50"
            >
              {isProcessing ? <Loader2 size={17} className="animate-spin" /> : <UploadCloud size={17} />}
              <span>{isProcessing ? 'Procesando archivo...' : 'Seleccionar archivo desde el equipo'}</span>
            </button>

            <span
              onClick={(e) => {
                e.stopPropagation();
                setShowUrlInput(!showUrlInput);
              }}
              className="text-[13px] text-[#906f6c] dark:text-zinc-400 hover:text-[#1a1c1c] dark:hover:text-zinc-200 underline underline-offset-4 cursor-pointer"
            >
              o pegar enlace URL
            </span>
          </div>

          {/* Hidden File Input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="application/pdf"
            className="hidden"
            onChange={(e) => {
              if (e.target.files && e.target.files.length > 0) {
                handleFile(e.target.files[0]);
              }
            }}
          />
        </div>
      </div>

      {/* Paste URL Input Drawer */}
      {showUrlInput && (
        <form
          onSubmit={handleUrlSubmit}
          className="w-full max-w-2xl mt-3 flex items-center gap-2 bg-white dark:bg-zinc-900 p-2 rounded-lg border border-[#e4beb9] dark:border-zinc-800"
        >
          <input
            type="url"
            placeholder="https://ejemplo.com/documento.pdf"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            className="flex-1 px-3 py-1.5 text-[13px] border border-[#e4beb9] dark:border-zinc-700 bg-white dark:bg-zinc-800 text-[#1a1c1c] dark:text-zinc-100 rounded focus:outline-none focus:border-[#b7131a]"
          />
          <button
            type="submit"
            className="bg-[#b7131a] text-white px-4 py-1.5 rounded text-[13px] font-medium hover:bg-[#db322f]"
          >
            Cargar
          </button>
        </form>
      )}

      {/* Quick Launch Sample Document & Heavy Operations banner */}
      <div className="w-full max-w-2xl mt-4 flex flex-wrap items-center justify-between gap-2 p-3 bg-white dark:bg-zinc-900 rounded-lg border border-[#e4beb9]/70 dark:border-zinc-800 shadow-xs">
        <div className="flex items-center gap-2 text-[13px] text-[#1a1c1c] dark:text-zinc-200">
          <FileCheck size={16} className="text-[#b7131a] dark:text-red-400" />
          <span className="font-medium">Documento de prueba:</span>
          <span className="text-[#5b403d] dark:text-zinc-400 text-[12px]">Acuerdo de Confidencialidad NDA</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            id="load-sample-doc-btn"
            onClick={onOpenSampleDocument}
            className="px-3 py-1 bg-[#b7131a]/10 dark:bg-red-950/40 hover:bg-[#b7131a]/20 text-[#b7131a] dark:text-red-400 text-[12px] font-semibold rounded transition-colors flex items-center gap-1"
          >
            <span>Cargar en Editor</span>
            <ArrowRight size={13} />
          </button>
          <button
            onClick={onOpenMergeModal}
            className="px-3 py-1 bg-[#0060a8]/10 dark:bg-blue-950/40 hover:bg-[#0060a8]/20 text-[#0060a8] dark:text-blue-400 text-[12px] font-semibold rounded transition-colors flex items-center gap-1"
          >
            <Layers size={13} />
            <span>Unir varios</span>
          </button>
        </div>
      </div>

      {/* Contextual Trust Indicators */}
      <div className="mt-6 flex items-center gap-8 text-[#5b403d] dark:text-zinc-400 text-[13px] opacity-90">
        <div className="flex items-center gap-1.5">
          <Lock size={15} className="text-[#b7131a] dark:text-red-400" />
          <span>Procesamiento seguro</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Zap size={15} className="text-[#0060a8] dark:text-blue-400" />
          <span>Rápido y optimizado</span>
        </div>
        <div className="flex items-center gap-1.5">
          <ShieldCheck size={15} className="text-emerald-600 dark:text-emerald-400" />
          <span>100% Confidencial</span>
        </div>
      </div>
    </main>
  );
};
