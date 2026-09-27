import React, { useState, useRef } from 'react';
import {
  X,
  FileText,
  Upload,
  ArrowUpDown,
  Trash2,
  Download,
  CheckCircle2,
  Loader2,
  FileImage,
  Sparkles,
  Layers,
  Edit3,
  FileUp,
} from 'lucide-react';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import mammoth from 'mammoth';

interface ConvertToPdfModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDocumentConverted?: (pdfBytes: Uint8Array, fileName: string) => void;
}

interface UploadedSourceFile {
  id: string;
  file: File;
  name: string;
  size: number;
  type: 'image' | 'word' | 'text';
  previewUrl?: string;
}

export const ConvertToPdfModal: React.FC<ConvertToPdfModalProps> = ({
  isOpen,
  onClose,
  onDocumentConverted,
}) => {
  const [sourceFiles, setSourceFiles] = useState<UploadedSourceFile[]>([]);
  const [pageSize, setPageSize] = useState<'a4' | 'letter'>('a4');
  const [pageMargin, setPageMargin] = useState<'normal' | 'narrow' | 'none'>('normal');
  const [imageFit, setImageFit] = useState<'contain' | 'cover'>('contain');
  const [combineAll, setCombineAll] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [progressText, setProgressText] = useState<string>('');
  const [resultPdfUrl, setResultPdfUrl] = useState<string | null>(null);
  const [resultPdfBytes, setResultPdfBytes] = useState<Uint8Array | null>(null);
  const [resultFileName, setResultFileName] = useState<string>('');
  const [resultPageCount, setResultPageCount] = useState<number>(0);
  const [resultFileSize, setResultFileSize] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const determineFileType = (file: File): 'image' | 'word' | 'text' => {
    const ext = file.name.split('.').pop()?.toLowerCase() || '';
    if (['jpg', 'jpeg', 'png', 'webp', 'gif', 'bmp', 'svg'].includes(ext) || file.type.startsWith('image/')) {
      return 'image';
    }
    if (['docx', 'doc'].includes(ext) || file.type.includes('word') || file.type.includes('officedocument')) {
      return 'word';
    }
    return 'text';
  };

  const handleAddFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setError(null);

    const newFiles: UploadedSourceFile[] = [];
    for (let i = 0; i < files.length; i++) {
      const f = files[i];
      const type = determineFileType(f);
      let previewUrl: string | undefined;

      if (type === 'image') {
        previewUrl = URL.createObjectURL(f);
      }

      newFiles.push({
        id: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        file: f,
        name: f.name,
        size: f.size,
        type,
        previewUrl,
      });
    }

    setSourceFiles((prev) => [...prev, ...newFiles]);
  };

  const handleRemoveFile = (id: string) => {
    setSourceFiles((prev) => {
      const target = prev.find((f) => f.id === id);
      if (target?.previewUrl) {
        URL.revokeObjectURL(target.previewUrl);
      }
      return prev.filter((f) => f.id !== id);
    });
  };

  const handleMoveFile = (index: number, direction: 'up' | 'down') => {
    if (
      (direction === 'up' && index === 0) ||
      (direction === 'down' && index === sourceFiles.length - 1)
    ) {
      return;
    }
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    const newItems = [...sourceFiles];
    const temp = newItems[index];
    newItems[index] = newItems[targetIndex];
    newItems[targetIndex] = temp;
    setSourceFiles(newItems);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  // Convert an Image file to an embeddable ArrayBuffer and image type
  const processImageToBytes = async (file: File): Promise<{ bytes: Uint8Array; format: 'png' | 'jpg' }> => {
    const isPng = file.type === 'image/png' || file.name.toLowerCase().endsWith('.png');
    const isJpg =
      file.type === 'image/jpeg' ||
      file.name.toLowerCase().endsWith('.jpg') ||
      file.name.toLowerCase().endsWith('.jpeg');

    if (isPng || isJpg) {
      const buffer = await file.arrayBuffer();
      return {
        bytes: new Uint8Array(buffer),
        format: isPng ? 'png' : 'jpg',
      };
    }

    // For WebP / GIF / BMP, convert to PNG via HTML Image & Canvas
    return new Promise((resolve, reject) => {
      const img = new Image();
      const url = URL.createObjectURL(file);
      img.onload = () => {
        URL.revokeObjectURL(url);
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth || img.width;
        canvas.height = img.naturalHeight || img.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('No se pudo procesar el lienzo gráfico'));
          return;
        }
        ctx.drawImage(img, 0, 0);
        canvas.toBlob((blob) => {
          if (!blob) {
            reject(new Error('Fallo al convertir imagen'));
            return;
          }
          blob.arrayBuffer().then((buf) => {
            resolve({
              bytes: new Uint8Array(buf),
              format: 'png',
            });
          });
        }, 'image/png');
      };
      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error(`No se pudo leer la imagen ${file.name}`));
      };
      img.src = url;
    });
  };

  // Convert Word (.docx) to structured text paragraphs
  const extractWordContent = async (file: File): Promise<string[]> => {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const result = await mammoth.extractRawText({ arrayBuffer });
      const rawText = result.value || '';
      // Split into clean paragraphs
      const paragraphs = rawText
        .split(/\r?\n/)
        .map((p) => p.trim())
        .filter((p) => p.length > 0);
      return paragraphs.length > 0 ? paragraphs : ['(Documento sin contenido de texto detectable)'];
    } catch (err: any) {
      console.warn('Mammoth extraction fallback:', err);
      // Fallback text reading
      const text = await file.text();
      const clean = text.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x9F]/g, ' ');
      return [clean.slice(0, 3000)];
    }
  };

  const handleConvert = async () => {
    if (sourceFiles.length === 0) {
      setError('Por favor selecciona al menos una imagen o documento Word.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setProgressText('Inicializando generador de PDF...');

    try {
      const pdfDoc = await PDFDocument.create();
      const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

      // Page dimension config (Points: 72 points per inch)
      // A4 = 595.28 x 841.89 pt | Letter = 612 x 792 pt
      const pageWidth = pageSize === 'a4' ? 595.28 : 612.0;
      const pageHeight = pageSize === 'a4' ? 841.89 : 792.0;

      const marginSize = pageMargin === 'normal' ? 36 : pageMargin === 'narrow' ? 18 : 0;
      const printableWidth = pageWidth - marginSize * 2;
      const printableHeight = pageHeight - marginSize * 2;

      for (let fileIdx = 0; fileIdx < sourceFiles.length; fileIdx++) {
        const item = sourceFiles[fileIdx];
        setProgressText(`Procesando (${fileIdx + 1}/${sourceFiles.length}): ${item.name}...`);

        if (item.type === 'image') {
          const { bytes, format } = await processImageToBytes(item.file);
          let embeddedImage;
          if (format === 'png') {
            embeddedImage = await pdfDoc.embedPng(bytes);
          } else {
            embeddedImage = await pdfDoc.embedJpg(bytes);
          }

          const imgWidth = embeddedImage.width;
          const imgHeight = embeddedImage.height;

          const page = pdfDoc.addPage([pageWidth, pageHeight]);

          if (marginSize === 0 && imageFit === 'cover') {
            // Full bleed
            const scale = Math.max(pageWidth / imgWidth, pageHeight / imgHeight);
            const w = imgWidth * scale;
            const h = imgHeight * scale;
            const x = (pageWidth - w) / 2;
            const y = (pageHeight - h) / 2;
            page.drawImage(embeddedImage, { x, y, width: w, height: h });
          } else {
            // Contain within printable bounds
            const scale = Math.min(printableWidth / imgWidth, printableHeight / imgHeight, 1);
            const w = imgWidth * scale;
            const h = imgHeight * scale;
            const x = marginSize + (printableWidth - w) / 2;
            const y = marginSize + (printableHeight - h) / 2;
            page.drawImage(embeddedImage, { x, y, width: w, height: h });
          }
        } else {
          // Word or text document
          const paragraphs = await extractWordContent(item.file);
          let currentPage = pdfDoc.addPage([pageWidth, pageHeight]);
          let currentY = pageHeight - marginSize - 20;

          // Document title header
          currentPage.drawText(item.name.replace(/\.[^/.]+$/, ''), {
            x: marginSize,
            y: currentY,
            size: 16,
            font: fontBold,
            color: rgb(0.1, 0.1, 0.1),
          });
          currentY -= 28;

          // Divider line
          currentPage.drawLine({
            start: { x: marginSize, y: currentY + 10 },
            end: { x: pageWidth - marginSize, y: currentY + 10 },
            thickness: 1,
            color: rgb(0.8, 0.8, 0.8),
          });

          const fontSize = 11;
          const lineHeight = 16;

          for (const paragraph of paragraphs) {
            // Simple word wrapping
            const words = paragraph.split(' ');
            let line = '';

            for (const word of words) {
              const testLine = line ? `${line} ${word}` : word;
              const testWidth = fontRegular.widthOfTextAtSize(testLine, fontSize);

              if (testWidth > printableWidth && line.length > 0) {
                // Check if page overflow
                if (currentY - lineHeight < marginSize + 20) {
                  currentPage = pdfDoc.addPage([pageWidth, pageHeight]);
                  currentY = pageHeight - marginSize - 20;
                }

                currentPage.drawText(line, {
                  x: marginSize,
                  y: currentY,
                  size: fontSize,
                  font: fontRegular,
                  color: rgb(0.2, 0.2, 0.2),
                });
                currentY -= lineHeight;
                line = word;
              } else {
                line = testLine;
              }
            }

            if (line.length > 0) {
              if (currentY - lineHeight < marginSize + 20) {
                currentPage = pdfDoc.addPage([pageWidth, pageHeight]);
                currentY = pageHeight - marginSize - 20;
              }
              currentPage.drawText(line, {
                x: marginSize,
                y: currentY,
                size: fontSize,
                font: fontRegular,
                color: rgb(0.2, 0.2, 0.2),
              });
              currentY -= lineHeight + 6; // Extra space between paragraphs
            }
          }
        }
      }

      setProgressText('Generando archivo PDF final...');
      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);

      const generatedName =
        sourceFiles.length === 1
          ? `${sourceFiles[0].name.replace(/\.[^/.]+$/, '')}.pdf`
          : `documentos_convertidos_${Date.now()}.pdf`;

      setResultPdfUrl(url);
      setResultPdfBytes(pdfBytes);
      setResultFileName(generatedName);
      setResultPageCount(pdfDoc.getPageCount());
      setResultFileSize(formatFileSize(pdfBytes.byteLength));
      setIsLoading(false);
    } catch (err: any) {
      console.error('Error during convert to pdf:', err);
      setIsLoading(false);
      setError(`Ocurrió un error durante la conversión: ${err.message || err}`);
    }
  };

  const handleDownload = () => {
    if (!resultPdfUrl || !resultFileName) return;
    const a = document.createElement('a');
    a.href = resultPdfUrl;
    a.download = resultFileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleOpenInEditor = () => {
    if (resultPdfBytes && onDocumentConverted) {
      onDocumentConverted(resultPdfBytes, resultFileName);
      handleResetAndClose();
    }
  };

  const handleResetAndClose = () => {
    if (resultPdfUrl) {
      URL.revokeObjectURL(resultPdfUrl);
    }
    sourceFiles.forEach((f) => {
      if (f.previewUrl) URL.revokeObjectURL(f.previewUrl);
    });
    setSourceFiles([]);
    setResultPdfUrl(null);
    setResultPdfBytes(null);
    setError(null);
    onClose();
  };

  return (
    <div
      id="convert-to-pdf-modal"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 select-none backdrop-blur-xs animate-in fade-in duration-150"
    >
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col border border-[#e4beb9] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#e4beb9] flex items-center justify-between bg-[#fbfbfb]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-[#b7131a]/10 text-[#b7131a] flex items-center justify-center">
              <FileUp size={20} />
            </div>
            <div>
              <h3 className="text-[16px] font-semibold text-[#1a1c1c]">
                Convertir Imagen o Word a PDF
              </h3>
              <p className="text-[12px] text-[#5b403d]">
                Transforma imágenes (JPG, PNG, WebP) o archivos Word (.docx) a formato PDF
              </p>
            </div>
          </div>
          <button
            onClick={handleResetAndClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-[#5b403d] hover:bg-[#eeeeee] hover:text-[#1a1c1c] transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-[13px] text-red-700 flex items-center gap-2">
              <X size={16} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {resultPdfUrl ? (
            /* Success & Download Screen */
            <div className="space-y-6 text-center py-4">
              <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto border border-emerald-200">
                <CheckCircle2 size={36} />
              </div>

              <div className="space-y-1">
                <h4 className="text-[18px] font-semibold text-[#1a1c1c]">
                  ¡Conversión completada con éxito!
                </h4>
                <p className="text-[13px] text-[#5b403d]">
                  Tu documento PDF está listo para descargar o para seguir editándolo en el lienzo.
                </p>
              </div>

              {/* Document Summary Card */}
              <div className="bg-[#f9f9f9] border border-[#e4beb9]/70 rounded-xl p-4 max-w-md mx-auto flex items-center justify-between text-left">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-[#b7131a]/10 text-[#b7131a] flex items-center justify-center font-bold text-[12px]">
                    PDF
                  </div>
                  <div>
                    <p className="text-[13px] font-semibold text-[#1a1c1c] truncate max-w-[200px]">
                      {resultFileName}
                    </p>
                    <p className="text-[12px] text-[#5b403d]">
                      {resultPageCount} {resultPageCount === 1 ? 'página' : 'páginas'} • {resultFileSize}
                    </p>
                  </div>
                </div>

                <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                  Listo
                </span>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleDownload}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-lg bg-[#b7131a] hover:bg-[#db322f] text-white text-[13px] font-medium flex items-center justify-center gap-2 shadow-xs transition-all active:scale-95"
                >
                  <Download size={16} />
                  <span>Descargar PDF</span>
                </button>

                {onDocumentConverted && (
                  <button
                    type="button"
                    onClick={handleOpenInEditor}
                    className="w-full sm:w-auto px-5 py-2.5 rounded-lg bg-[#0060a8] hover:bg-[#004e8a] text-white text-[13px] font-medium flex items-center justify-center gap-2 shadow-xs transition-all active:scale-95"
                  >
                    <Edit3 size={16} />
                    <span>Abrir en el Editor</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => {
                    setResultPdfUrl(null);
                    setResultPdfBytes(null);
                  }}
                  className="w-full sm:w-auto px-4 py-2.5 rounded-lg border border-[#e4beb9] text-[#5b403d] hover:bg-[#f3f3f3] text-[13px] font-medium transition-all"
                >
                  <span>Convertir otros</span>
                </button>
              </div>
            </div>
          ) : (
            /* Upload & Config Screen */
            <>
              {/* Dropzone */}
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  handleAddFiles(e.dataTransfer.files);
                }}
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-[#e4beb9] hover:border-[#b7131a] rounded-xl p-6 text-center cursor-pointer transition-colors bg-[#fdfdfd] hover:bg-[#fff9f9] group"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept=".jpg,.jpeg,.png,.webp,.bmp,.gif,.docx,.doc,.txt"
                  onChange={(e) => handleAddFiles(e.target.files)}
                  className="hidden"
                />
                <div className="w-12 h-12 rounded-full bg-[#b7131a]/10 text-[#b7131a] flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
                  <Upload size={22} />
                </div>
                <p className="text-[14px] font-semibold text-[#1a1c1c]">
                  Arrastra tus imágenes o archivos Word aquí
                </p>
                <p className="text-[12px] text-[#5b403d] mt-1">
                  Formatos soportados: JPG, PNG, WebP, GIF, BMP, Word (.docx) y texto
                </p>
                <button
                  type="button"
                  className="mt-3 px-3.5 py-1.5 rounded-md bg-white border border-[#e4beb9] text-[12px] font-medium text-[#1a1c1c] shadow-2xs group-hover:border-[#b7131a] transition-colors"
                >
                  Explorar en el equipo
                </button>
              </div>

              {/* Selected Files List */}
              {sourceFiles.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[13px] font-semibold text-[#1a1c1c]">
                      Archivos seleccionados ({sourceFiles.length})
                    </span>
                    <button
                      type="button"
                      onClick={() => setSourceFiles([])}
                      className="text-[12px] text-red-600 hover:underline"
                    >
                      Limpiar lista
                    </button>
                  </div>

                  <div className="max-h-44 overflow-y-auto space-y-2 pr-1">
                    {sourceFiles.map((item, idx) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between p-2.5 bg-[#f9f9f9] border border-[#e4beb9]/70 rounded-lg text-[13px]"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          {item.previewUrl ? (
                            <img
                              src={item.previewUrl}
                              alt={item.name}
                              className="w-9 h-9 object-cover rounded border border-[#e4beb9]"
                            />
                          ) : (
                            <div className="w-9 h-9 rounded bg-[#0060a8]/10 text-[#0060a8] flex items-center justify-center shrink-0">
                              <FileText size={18} />
                            </div>
                          )}
                          <div className="truncate">
                            <p className="font-medium text-[#1a1c1c] truncate">{item.name}</p>
                            <p className="text-[11px] text-[#5b403d]">
                              {formatFileSize(item.size)} • {item.type === 'image' ? 'Imagen' : 'Word/Texto'}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 shrink-0 ml-2">
                          <button
                            type="button"
                            disabled={idx === 0}
                            onClick={() => handleMoveFile(idx, 'up')}
                            className="p-1 text-[#5b403d] hover:text-[#1a1c1c] disabled:opacity-30"
                            title="Mover arriba"
                          >
                            <ArrowUpDown size={14} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRemoveFile(item.id)}
                            className="p-1 text-red-600 hover:bg-red-50 rounded"
                            title="Eliminar"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Conversion Settings */}
              <div className="bg-[#f9f9f9] p-4 rounded-xl border border-[#e4beb9]/70 space-y-3">
                <div className="flex items-center gap-2 text-[13px] font-semibold text-[#1a1c1c]">
                  <Sparkles size={15} className="text-[#b7131a]" />
                  <span>Opciones del Documento PDF</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[12px]">
                  <div>
                    <label className="block text-[#5b403d] font-medium mb-1">
                      Tamaño de Página
                    </label>
                    <select
                      value={pageSize}
                      onChange={(e) => setPageSize(e.target.value as any)}
                      className="w-full px-2.5 py-1.5 rounded border border-[#e4beb9] bg-white text-[#1a1c1c] focus:outline-none focus:border-[#b7131a]"
                    >
                      <option value="a4">A4 (Estándar internacional)</option>
                      <option value="letter">Carta (Letter)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[#5b403d] font-medium mb-1">
                      Márgenes de Página
                    </label>
                    <select
                      value={pageMargin}
                      onChange={(e) => setPageMargin(e.target.value as any)}
                      className="w-full px-2.5 py-1.5 rounded border border-[#e4beb9] bg-white text-[#1a1c1c] focus:outline-none focus:border-[#b7131a]"
                    >
                      <option value="normal">Normal (Estándar)</option>
                      <option value="narrow">Estrecho (Más espacio)</option>
                      <option value="none">Sin márgenes (Borde completo para fotos)</option>
                    </select>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        {!resultPdfUrl && (
          <div className="px-6 py-3.5 border-t border-[#e4beb9] bg-[#fbfbfb] flex items-center justify-between">
            <button
              type="button"
              onClick={handleResetAndClose}
              className="px-4 py-2 text-[13px] text-[#5b403d] hover:text-[#1a1c1c] font-medium"
            >
              Cancelar
            </button>

            <button
              type="button"
              disabled={sourceFiles.length === 0 || isLoading}
              onClick={handleConvert}
              className="bg-[#b7131a] hover:bg-[#db322f] disabled:opacity-50 text-white px-5 py-2 rounded-lg text-[13px] font-medium flex items-center gap-2 transition-all shadow-xs active:scale-95"
            >
              {isLoading ? (
                <>
                  <Loader2 size={15} className="animate-spin" />
                  <span>{progressText || 'Convirtiendo...'}</span>
                </>
              ) : (
                <>
                  <FileUp size={15} />
                  <span>Convertir a PDF</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
