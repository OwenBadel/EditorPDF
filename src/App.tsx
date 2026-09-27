/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { TopAppBar } from './components/TopAppBar';
import { SideNavBar } from './components/SideNavBar';
import { UploadView } from './components/UploadView';
import { DocumentCanvas } from './components/DocumentCanvas';
import { OperationsView } from './components/OperationsView';

import { MergeModal } from './components/modals/MergeModal';
import { SplitModal } from './components/modals/SplitModal';
import { CompressModal } from './components/modals/CompressModal';
import { ToImageModal } from './components/modals/ToImageModal';
import { OcrModal } from './components/modals/OcrModal';
import { ConvertToPdfModal } from './components/modals/ConvertToPdfModal';
import { SignatureImageModal } from './components/SignatureImageModal';

import {
  ToolType,
  ActiveTab,
  PageThumbnail,
  AnnotationHighlight,
  DrawingPath,
  TextAnnotation,
  ImageAnnotation,
  LoadedDocument,
} from './types';
import { PDFDocument } from 'pdf-lib';
import { exportPdfWithAnnotations, downloadPdfBlob } from './utils/pdfExport';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('editor');
  const [loadedDocument, setLoadedDocument] = useState<LoadedDocument | null>({
    name: 'Acuerdo_de_Confidencialidad_NDA.pdf',
    size: 1420000,
    totalPages: 3,
  });

  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(3);
  const [zoom, setZoom] = useState<number>(1.0);
  const [selectedTool, setSelectedTool] = useState<ToolType>('highlight');

  // Dark Mode state with persistence
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('pdf_theme');
      if (saved) return saved === 'dark';
      return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    } catch {
      return false;
    }
  });

  useEffect(() => {
    try {
      if (isDarkMode) {
        document.documentElement.classList.add('dark');
        localStorage.setItem('pdf_theme', 'dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    } catch (e) {
      console.error('Theme persist error:', e);
    }
  }, [isDarkMode]);

  const toggleTheme = () => {
    setIsDarkMode((prev) => !prev);
  };

  const [thumbnails, setThumbnails] = useState<PageThumbnail[]>([
    { pageNumber: 1, rotation: 0, linesCount: 18 },
    { pageNumber: 2, rotation: 0, linesCount: 12 },
    { pageNumber: 3, rotation: 0, linesCount: 8 },
  ]);

  // Annotation states
  const [highlights, setHighlights] = useState<AnnotationHighlight[]>([
    {
      id: 'default-hl-1',
      pageNumber: 1,
      rect: { x: 50, y: 320, width: 700, height: 28 },
      text: 'La Parte Receptora mantendrá la Información Confidencial en la más estricta confidencialidad para el beneficio único y exclusivo de la Parte Divulgadora.',
      color: '#fde047',
    },
  ]);

  const [drawings, setDrawings] = useState<DrawingPath[]>([]);
  const [textAnnotations, setTextAnnotations] = useState<TextAnnotation[]>([]);
  const [imageAnnotations, setImageAnnotations] = useState<ImageAnnotation[]>([]);

  // Undo / Redo history stacks
  const [history, setHistory] = useState<any[]>([]);
  const [redoStack, setRedoStack] = useState<any[]>([]);

  // Modals state
  const [isMergeOpen, setIsMergeOpen] = useState(false);
  const [isSplitOpen, setIsSplitOpen] = useState(false);
  const [isCompressOpen, setIsCompressOpen] = useState(false);
  const [isToImageOpen, setIsToImageOpen] = useState(false);
  const [isOcrOpen, setIsOcrOpen] = useState(false);
  const [isConvertToPdfOpen, setIsConvertToPdfOpen] = useState(false);
  const [isSignatureModalOpen, setIsSignatureModalOpen] = useState(false);

  const saveHistory = () => {
    setHistory((prev) => [
      ...prev,
      {
        highlights: [...highlights],
        drawings: [...drawings],
        textAnnotations: [...textAnnotations],
        imageAnnotations: [...imageAnnotations],
      },
    ]);
    setRedoStack([]);
  };

  const handleUndo = () => {
    if (history.length === 0) return;
    const previous = history[history.length - 1];
    setRedoStack((prev) => [
      ...prev,
      {
        highlights: [...highlights],
        drawings: [...drawings],
        textAnnotations: [...textAnnotations],
        imageAnnotations: [...imageAnnotations],
      },
    ]);
    setHighlights(previous.highlights);
    setDrawings(previous.drawings);
    setTextAnnotations(previous.textAnnotations);
    setImageAnnotations(previous.imageAnnotations || []);
    setHistory((prev) => prev.slice(0, prev.length - 1));
  };

  const handleRedo = () => {
    if (redoStack.length === 0) return;
    const next = redoStack[redoStack.length - 1];
    setHistory((prev) => [
      ...prev,
      {
        highlights: [...highlights],
        drawings: [...drawings],
        textAnnotations: [...textAnnotations],
        imageAnnotations: [...imageAnnotations],
      },
    ]);
    setHighlights(next.highlights);
    setDrawings(next.drawings);
    setTextAnnotations(next.textAnnotations);
    setImageAnnotations(next.imageAnnotations || []);
    setRedoStack((prev) => prev.slice(0, prev.length - 1));
  };

  const handleSelectTool = (tool: ToolType) => {
    setSelectedTool(tool);
    if (tool === 'image') {
      setIsSignatureModalOpen(true);
    }
  };

  const handleRotatePage = (pageNumber: number) => {
    setThumbnails((prev) =>
      prev.map((p) =>
        p.pageNumber === pageNumber ? { ...p, rotation: (p.rotation + 90) % 360 } : p
      )
    );
  };

  const handleDeletePage = (pageNumber: number) => {
    if (thumbnails.length <= 1) return;
    const updated = thumbnails
      .filter((p) => p.pageNumber !== pageNumber)
      .map((p, idx) => ({ ...p, pageNumber: idx + 1 }));
    setThumbnails(updated);
    setTotalPages(updated.length);
    if (currentPage > updated.length) {
      setCurrentPage(updated.length);
    }
  };

  const handleDocumentLoaded = (doc: LoadedDocument) => {
    setLoadedDocument(doc);
    const pages = Math.max(1, doc.totalPages || 1);
    setTotalPages(pages);
    setCurrentPage(1);
    const newThumbs: PageThumbnail[] = Array.from({ length: pages }, (_, i) => ({
      pageNumber: i + 1,
      rotation: 0,
      linesCount: 15,
    }));
    setThumbnails(newThumbs);
    setHighlights([]);
    setDrawings([]);
    setTextAnnotations([]);
    setHistory([]);
    setRedoStack([]);
    setActiveTab('editor');
  };

  const handleLoadSampleDocument = async () => {
    try {
      const doc = await PDFDocument.create();
      
      // Page 1
      const page1 = doc.addPage([595, 842]);
      page1.drawText('ACUERDO DE CONFIDENCIALIDAD (NDA)', { x: 50, y: 780, size: 18 });
      page1.drawText('Fecha de entrada en vigor: 24 de Octubre de 2024', { x: 50, y: 755, size: 11 });
      page1.drawText('1. OBJETO Y DEFINICIONES', { x: 50, y: 710, size: 13 });
      page1.drawText(
        'El presente Acuerdo establece las condiciones bajo las cuales las partes intercambiarán',
        { x: 50, y: 685, size: 10 }
      );
      page1.drawText(
        'información comercial, técnica y operativa confidencial para fines exclusivos de evaluación.',
        { x: 50, y: 670, size: 10 }
      );
      page1.drawText('2. OBLIGACIONES DE CONFIDENCIALIDAD', { x: 50, y: 630, size: 13 });
      page1.drawText(
        'La Parte Receptora mantendrá la Información Confidencial en la más estricta reserva',
        { x: 50, y: 605, size: 10 }
      );
      page1.drawText(
        'para el beneficio único y exclusivo de la Parte Divulgadora, aplicando los más altos estándares.',
        { x: 50, y: 590, size: 10 }
      );
      page1.drawText('3. FIRMAS AUTORIZADAS', { x: 50, y: 530, size: 13 });
      page1.drawText('Parte Divulgadora: Dirección General', { x: 50, y: 490, size: 10 });
      page1.drawText('Parte Receptora: Representante Legal', { x: 320, y: 490, size: 10 });

      // Page 2
      const page2 = doc.addPage([595, 842]);
      page2.drawText('ANEXO A: PROPIEDAD INTELECTUAL', { x: 50, y: 780, size: 16 });
      page2.drawText(
        'Todos los derechos de propiedad intelectual, marcas y secretos comerciales continuarán',
        { x: 50, y: 740, size: 10 }
      );
      page2.drawText(
        'siendo de titularidad exclusiva de la Parte Divulgadora.',
        { x: 50, y: 725, size: 10 }
      );

      // Page 3
      const page3 = doc.addPage([595, 842]);
      page3.drawText('ANEXO B: JURISDICCIÓN Y CIERRE', { x: 50, y: 780, size: 16 });
      page3.drawText(
        'El presente documento se rige por la legislación aplicable en materia de protección de datos.',
        { x: 50, y: 740, size: 10 }
      );

      const pdfBytes = await doc.save();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });

      setLoadedDocument({
        name: 'Acuerdo_de_Confidencialidad_NDA.pdf',
        size: pdfBytes.byteLength,
        totalPages: 3,
        fileBytes: pdfBytes,
        fileBlob: blob,
      });
      setTotalPages(3);
      setCurrentPage(1);
      setThumbnails([
        { pageNumber: 1, rotation: 0, linesCount: 18 },
        { pageNumber: 2, rotation: 0, linesCount: 12 },
        { pageNumber: 3, rotation: 0, linesCount: 8 },
      ]);
      setHighlights([]);
      setDrawings([]);
      setTextAnnotations([]);
      setActiveTab('editor');
    } catch (e) {
      console.error('Error generating sample:', e);
      setLoadedDocument({
        name: 'Acuerdo_de_Confidencialidad_NDA.pdf',
        size: 1420000,
        totalPages: 3,
      });
      setTotalPages(3);
      setCurrentPage(1);
      setActiveTab('editor');
    }
  };

  const handleDownload = async () => {
    try {
      const exportedBytes = await exportPdfWithAnnotations({
        loadedDocument,
        thumbnails,
        textAnnotations,
        drawings,
        highlights,
        imageAnnotations,
        referenceWidth: 800,
      });
      const fileName = loadedDocument?.name || 'documento_editado.pdf';
      downloadPdfBlob(exportedBytes, fileName);
    } catch (err) {
      console.error('Download error:', err);
    }
  };

  const currentRotation = thumbnails.find((t) => t.pageNumber === currentPage)?.rotation || 0;

  return (
    <div className="bg-[#f9f9f9] dark:bg-[#121214] text-[#1a1c1c] dark:text-zinc-100 font-sans min-h-screen flex flex-col antialiased selection:bg-[#b7131a]/20 transition-colors duration-200">
      {/* Top Global Bar */}
      <TopAppBar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
        zoom={zoom}
        setZoom={setZoom}
        canUndo={history.length > 0}
        canRedo={redoStack.length > 0}
        onUndo={handleUndo}
        onRedo={handleRedo}
        onDownload={handleDownload}
        hasDocument={!!loadedDocument}
        documentName={loadedDocument?.name}
        onNewDocument={() => setActiveTab('upload')}
        isDarkMode={isDarkMode}
        onToggleTheme={toggleTheme}
      />

      {/* Main Content Area */}
      <div className="flex flex-1 pt-[48px] overflow-hidden">
        {activeTab === 'upload' && (
          <UploadView
            onDocumentLoaded={handleDocumentLoaded}
            onOpenSampleDocument={handleLoadSampleDocument}
            onOpenMergeModal={() => setIsMergeOpen(true)}
            onOpenApiPlayground={() => setActiveTab('operations')}
          />
        )}

        {activeTab === 'editor' && loadedDocument && (
          <>
            <SideNavBar
              selectedTool={selectedTool}
              setSelectedTool={handleSelectTool}
              thumbnails={thumbnails}
              currentPage={currentPage}
              onSelectPage={setCurrentPage}
              onRotatePage={handleRotatePage}
              onDeletePage={handleDeletePage}
              loadedDocument={loadedDocument}
              isDarkMode={isDarkMode}
            />

            <DocumentCanvas
              currentPage={currentPage}
              totalPages={totalPages}
              documentName={loadedDocument?.name}
              loadedDocument={loadedDocument}
              isDarkMode={isDarkMode}
              pageRotation={currentRotation}
              zoom={zoom}
              selectedTool={selectedTool}
              onSelectTool={handleSelectTool}
              highlights={highlights}
              onAddHighlight={(hl) => {
                saveHistory();
                setHighlights((prev) => [...prev, hl]);
              }}
              onUpdateHighlight={(id, updates) => {
                saveHistory();
                setHighlights((prev) =>
                  prev.map((h) => (h.id === id ? { ...h, ...updates } : h))
                );
              }}
              onRemoveHighlight={(id) => {
                saveHistory();
                setHighlights((prev) => prev.filter((h) => h.id !== id));
              }}
              drawings={drawings}
              onAddDrawing={(dr) => {
                saveHistory();
                setDrawings((prev) => [...prev, dr]);
              }}
              onRemoveDrawing={(id) => {
                saveHistory();
                setDrawings((prev) => prev.filter((d) => d.id !== id));
              }}
              textAnnotations={textAnnotations}
              onAddTextAnnotation={(ta) => {
                saveHistory();
                setTextAnnotations((prev) => [...prev, ta]);
              }}
              onUpdateTextAnnotation={(id, txt, fontSize, color) => {
                setTextAnnotations((prev) =>
                  prev.map((t) =>
                    t.id === id
                      ? {
                          ...t,
                          text: txt,
                          fontSize: fontSize !== undefined ? fontSize : t.fontSize,
                          color: color !== undefined ? color : t.color,
                        }
                      : t
                  )
                );
              }}
              onUpdateTextPosition={(id, x, y) => {
                setTextAnnotations((prev) =>
                  prev.map((t) => (t.id === id ? { ...t, x, y } : t))
                );
              }}
              onDeleteTextAnnotation={(id) => {
                saveHistory();
                setTextAnnotations((prev) => prev.filter((t) => t.id !== id));
              }}
              imageAnnotations={imageAnnotations}
              onAddImageAnnotation={(img) => {
                saveHistory();
                setImageAnnotations((prev) => [...prev, img]);
              }}
              onUpdateImagePosition={(id, x, y) => {
                setImageAnnotations((prev) =>
                  prev.map((i) => (i.id === id ? { ...i, x, y } : i))
                );
              }}
              onUpdateImageSize={(id, width, height) => {
                setImageAnnotations((prev) =>
                  prev.map((i) => (i.id === id ? { ...i, width, height } : i))
                );
              }}
              onDeleteImageAnnotation={(id) => {
                saveHistory();
                setImageAnnotations((prev) => prev.filter((i) => i.id !== id));
              }}
              onOpenSignatureModal={() => setIsSignatureModalOpen(true)}
            />
          </>
        )}

        {activeTab === 'operations' && (
          <OperationsView
            onOpenMerge={() => setIsMergeOpen(true)}
            onOpenSplit={() => setIsSplitOpen(true)}
            onOpenCompress={() => setIsCompressOpen(true)}
            onOpenToImage={() => setIsToImageOpen(true)}
            onOpenOcr={() => setIsOcrOpen(true)}
            onOpenConvertToPdf={() => setIsConvertToPdfOpen(true)}
          />
        )}
      </div>

      {/* Operations Modals */}
      <ConvertToPdfModal
        isOpen={isConvertToPdfOpen}
        onClose={() => setIsConvertToPdfOpen(false)}
        onDocumentConverted={(pdfBytes, fileName) => {
          const blob = new Blob([pdfBytes], { type: 'application/pdf' });
          handleDocumentLoaded({
            name: fileName,
            size: pdfBytes.byteLength,
            totalPages: 2,
            fileBytes: pdfBytes,
            fileBlob: blob,
          });
          setIsConvertToPdfOpen(false);
        }}
      />
      <MergeModal
        isOpen={isMergeOpen}
        onClose={() => setIsMergeOpen(false)}
        onMergedSuccess={(blob, name) => {
          handleDocumentLoaded({
            name,
            size: blob.size,
            totalPages: 4,
            fileBlob: blob,
          });
          setIsMergeOpen(false);
        }}
      />

      <SplitModal
        isOpen={isSplitOpen}
        onClose={() => setIsSplitOpen(false)}
        totalPages={totalPages}
      />

      <CompressModal
        isOpen={isCompressOpen}
        onClose={() => setIsCompressOpen(false)}
        documentSize={loadedDocument?.size}
      />

      <ToImageModal
        isOpen={isToImageOpen}
        onClose={() => setIsToImageOpen(false)}
        currentPage={currentPage}
        totalPages={totalPages}
      />

      <OcrModal isOpen={isOcrOpen} onClose={() => setIsOcrOpen(false)} />

      {/* Signature & Image Insertion Modal */}
      <SignatureImageModal
        isOpen={isSignatureModalOpen}
        onClose={() => setIsSignatureModalOpen(false)}
        onInsert={(dataUrl, type, defaultWidth = 200, defaultHeight = 90) => {
          saveHistory();
          const newImg: ImageAnnotation = {
            id: `img-${Date.now()}`,
            pageNumber: currentPage,
            x: 80,
            y: 220,
            width: defaultWidth,
            height: defaultHeight,
            dataUrl,
            type,
          };
          setImageAnnotations((prev) => [...prev, newImg]);
        }}
      />
    </div>
  );
}
