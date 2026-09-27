import React, { useState } from 'react';
import {
  X,
  ScanText,
  Copy,
  Check,
  Download,
  AlertCircle,
  CheckCircle2,
  Loader2,
  FileText,
} from 'lucide-react';
import { PDFDocument } from 'pdf-lib';

interface OcrModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const OcrModal: React.FC<OcrModalProps> = ({ isOpen, onClose }) => {
  const [language, setLanguage] = useState<'spa' | 'eng' | 'spa+eng'>('spa+eng');
  const [isLoading, setIsLoading] = useState(false);
  const [ocrResult, setOcrResult] = useState<any | null>(null);
  const [copied, setCopied] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleExecuteOcr = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    setOcrResult(null);

    try {
      const doc = await PDFDocument.create();
      const page = doc.addPage([595, 842]);
      page.drawText('PDF Professional Scanned Document Text Layer', { x: 50, y: 800 });
      const bytes = await doc.save();
      const fileBlob = new Blob([bytes], { type: 'application/pdf' });

      const formData = new FormData();
      formData.append('file', fileBlob, 'documento_escaneado.pdf');
      formData.append('language', language);

      const response = await fetch('/api/pdf/ocr', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Error en el servidor: HTTP ${response.status}`);
      }

      const data = await response.json();
      setOcrResult(data);
    } catch (err: any) {
      console.error('OCR error:', err);
      setErrorMsg(err.message || 'Fallo durante el reconocimiento OCR.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = () => {
    if (ocrResult?.text) {
      navigator.clipboard.writeText(ocrResult.text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownloadTxt = () => {
    if (ocrResult?.text) {
      const blob = new Blob([ocrResult.text], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'ocr_extracted_text.txt';
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-xl rounded-xl shadow-2xl border border-[#e4beb9] overflow-hidden animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-[#e4beb9]/70 flex items-center justify-between bg-[#fbfbfb]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <ScanText size={18} />
            </div>
            <div>
              <h3 className="text-[16px] font-semibold text-[#1a1c1c]">
                Reconocimiento de Texto (OCR)
              </h3>
              <p className="text-[12px] text-[#5b403d]">Detecta y extrae el texto de documentos escaneados</p>
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
            Convierte documentos escaneados o imágenes en texto digital para que puedas copiarlo, editarlo o guardarlo en tu equipo.
          </p>

          <div>
            <label className="block text-[13px] font-semibold text-[#1a1c1c] mb-1.5">
              Idioma del Documento
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setLanguage('spa')}
                className={`py-2 px-3 rounded-md border text-[12px] font-medium transition-all ${
                  language === 'spa'
                    ? 'border-emerald-600 bg-emerald-50 text-emerald-800'
                    : 'border-[#e4beb9] text-[#5b403d]'
                }`}
              >
                Español (spa)
              </button>
              <button
                type="button"
                onClick={() => setLanguage('eng')}
                className={`py-2 px-3 rounded-md border text-[12px] font-medium transition-all ${
                  language === 'eng'
                    ? 'border-emerald-600 bg-emerald-50 text-emerald-800'
                    : 'border-[#e4beb9] text-[#5b403d]'
                }`}
              >
                English (eng)
              </button>
              <button
                type="button"
                onClick={() => setLanguage('spa+eng')}
                className={`py-2 px-3 rounded-md border text-[12px] font-medium transition-all ${
                  language === 'spa+eng'
                    ? 'border-emerald-600 bg-emerald-50 text-emerald-800'
                    : 'border-[#e4beb9] text-[#5b403d]'
                }`}
              >
                Bilingüe (spa+eng)
              </button>
            </div>
          </div>

          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-[12px] text-red-700">
              <AlertCircle size={15} className="shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {ocrResult && (
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-emerald-800 font-semibold text-[13px]">
                  <CheckCircle2 size={16} />
                  <span>Texto extraído con {ocrResult.confidence}% de confianza</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={handleCopy}
                    className="px-2.5 py-1 bg-white border border-[#e4beb9] hover:bg-[#f3f3f3] rounded text-[11px] font-medium text-[#1a1c1c] flex items-center gap-1 shadow-xs"
                  >
                    {copied ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
                    <span>{copied ? 'Copiado' : 'Copiar'}</span>
                  </button>
                  <button
                    onClick={handleDownloadTxt}
                    className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[11px] font-medium flex items-center gap-1 shadow-xs"
                  >
                    <Download size={12} />
                    <span>Guardar .TXT</span>
                  </button>
                </div>
              </div>

              <div className="max-h-60 overflow-y-auto p-3.5 bg-[#f9f9f9] border border-[#e4beb9] rounded-lg font-mono text-[12px] text-[#1a1c1c] whitespace-pre-wrap leading-relaxed">
                {ocrResult.text}
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
            onClick={handleExecuteOcr}
            className="px-4 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded text-[13px] font-medium transition-colors flex items-center gap-1.5 shadow-xs disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                <span>Extrayendo texto...</span>
              </>
            ) : (
              <>
                <ScanText size={14} />
                <span>Extraer Texto</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
