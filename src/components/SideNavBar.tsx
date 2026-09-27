import React, { useEffect, useState } from 'react';
import {
  Type,
  PenTool,
  Image as ImageIcon,
  Eraser,
  Highlighter,
  HelpCircle,
  RotateCw,
  Trash2,
} from 'lucide-react';
import { ToolType, PageThumbnail, LoadedDocument } from '../types';
import { getPdfJsDocument, generateThumbnailDataUrl } from '../utils/pdfRenderer';

interface SideNavBarProps {
  selectedTool: ToolType;
  setSelectedTool: (tool: ToolType) => void;
  thumbnails: PageThumbnail[];
  currentPage: number;
  onSelectPage: (page: number) => void;
  onRotatePage: (page: number) => void;
  onDeletePage: (page: number) => void;
  loadedDocument?: LoadedDocument | null;
  isDarkMode?: boolean;
}

export const SideNavBar: React.FC<SideNavBarProps> = ({
  selectedTool,
  setSelectedTool,
  thumbnails,
  currentPage,
  onSelectPage,
  onRotatePage,
  onDeletePage,
  loadedDocument,
  isDarkMode = false,
}) => {
  const [renderedThumbnails, setRenderedThumbnails] = useState<Record<number, string>>({});

  // Generate real PDF page thumbnails if loadedDocument has bytes
  useEffect(() => {
    let isCancelled = false;

    if (!loadedDocument?.fileBytes || loadedDocument.fileBytes.length === 0) {
      setRenderedThumbnails({});
      return;
    }

    const loadThumbnails = async () => {
      try {
        const pdfDoc = await getPdfJsDocument(loadedDocument.fileBytes!);
        if (isCancelled) return;

        const thumbs: Record<number, string> = {};
        for (let i = 1; i <= Math.min(thumbnails.length, pdfDoc.numPages); i++) {
          try {
            const dataUrl = await generateThumbnailDataUrl(pdfDoc, i, 160);
            if (dataUrl) thumbs[i] = dataUrl;
          } catch (e) {
            console.warn(`Failed thumb for page ${i}:`, e);
          }
        }

        if (!isCancelled) {
          setRenderedThumbnails(thumbs);
        }
      } catch (err) {
        console.error('Error generating PDF thumbnails:', err);
      }
    };

    loadThumbnails();

    return () => {
      isCancelled = true;
    };
  }, [loadedDocument?.fileBytes, thumbnails.length]);

  return (
    <aside
      id="side-nav-bar"
      className="bg-[#f3f3f3] dark:bg-[#151518] text-[13px] fixed left-0 top-[48px] h-[calc(100vh-48px)] w-[240px] border-r border-[#e4beb9] dark:border-zinc-800 flex flex-col py-3 z-40 select-none overflow-hidden transition-colors duration-200"
    >
      {/* 1. Herramientas de Edición */}
      <div id="side-tools-container" className="px-3 pb-3 border-b border-[#e4beb9]/60 dark:border-zinc-800 flex flex-col gap-0.5">
        <div className="px-2 mb-1.5 font-semibold text-[13px] text-[#b7131a] dark:text-red-400 flex items-center justify-between">
          <span>Herramientas</span>
          <span className="text-[10px] text-[#5b403d] dark:text-zinc-400 font-normal uppercase tracking-wider">
            Edición
          </span>
        </div>

        <button
          id="tool-text-btn"
          onClick={() => setSelectedTool('text')}
          className={`flex items-center gap-2.5 px-3 py-1.5 w-full text-left rounded-md transition-all duration-150 ${
            selectedTool === 'text'
              ? 'border-l-2 border-[#b7131a] dark:border-red-500 bg-[#b7131a]/10 dark:bg-red-950/40 text-[#b7131a] dark:text-red-400 font-semibold'
              : 'text-[#5b403d] dark:text-zinc-300 hover:bg-[#e8e8e8] dark:hover:bg-zinc-800 hover:text-[#1a1c1c] dark:hover:text-zinc-100'
          }`}
        >
          <Type size={17} />
          <span>Texto</span>
        </button>

        <button
          id="tool-draw-btn"
          onClick={() => setSelectedTool('draw')}
          className={`flex items-center gap-2.5 px-3 py-1.5 w-full text-left rounded-md transition-all duration-150 ${
            selectedTool === 'draw'
              ? 'border-l-2 border-[#b7131a] dark:border-red-500 bg-[#b7131a]/10 dark:bg-red-950/40 text-[#b7131a] dark:text-red-400 font-semibold'
              : 'text-[#5b403d] dark:text-zinc-300 hover:bg-[#e8e8e8] dark:hover:bg-zinc-800 hover:text-[#1a1c1c] dark:hover:text-zinc-100'
          }`}
        >
          <PenTool size={17} />
          <span>Dibujar</span>
        </button>

        <button
          id="tool-image-btn"
          onClick={() => setSelectedTool('image')}
          className={`flex items-center gap-2.5 px-3 py-1.5 w-full text-left rounded-md transition-all duration-150 ${
            selectedTool === 'image'
              ? 'border-l-2 border-[#b7131a] dark:border-red-500 bg-[#b7131a]/10 dark:bg-red-950/40 text-[#b7131a] dark:text-red-400 font-semibold'
              : 'text-[#5b403d] dark:text-zinc-300 hover:bg-[#e8e8e8] dark:hover:bg-zinc-800 hover:text-[#1a1c1c] dark:hover:text-zinc-100'
          }`}
        >
          <ImageIcon size={17} />
          <span>Imagen / Firma</span>
        </button>

        <button
          id="tool-eraser-btn"
          onClick={() => setSelectedTool('eraser')}
          className={`flex items-center gap-2.5 px-3 py-1.5 w-full text-left rounded-md transition-all duration-150 ${
            selectedTool === 'eraser'
              ? 'border-l-2 border-[#b7131a] dark:border-red-500 bg-[#b7131a]/10 dark:bg-red-950/40 text-[#b7131a] dark:text-red-400 font-semibold'
              : 'text-[#5b403d] dark:text-zinc-300 hover:bg-[#e8e8e8] dark:hover:bg-zinc-800 hover:text-[#1a1c1c] dark:hover:text-zinc-100'
          }`}
        >
          <Eraser size={17} />
          <span>Borrar</span>
        </button>

        <button
          id="tool-highlight-btn"
          onClick={() => setSelectedTool('highlight')}
          className={`flex items-center gap-2.5 px-3 py-1.5 w-full text-left rounded-md transition-all duration-150 ${
            selectedTool === 'highlight'
              ? 'border-l-2 border-[#b7131a] dark:border-red-500 bg-[#b7131a]/10 dark:bg-red-950/40 text-[#b7131a] dark:text-red-400 font-semibold'
              : 'text-[#5b403d] dark:text-zinc-300 hover:bg-[#e8e8e8] dark:hover:bg-zinc-800 hover:text-[#1a1c1c] dark:hover:text-zinc-100'
          }`}
        >
          <Highlighter size={17} />
          <span>Resaltar</span>
        </button>
      </div>

      {/* 2. Galería de Miniaturas de Páginas */}
      <div id="side-pages-container" className="flex-1 overflow-y-auto px-3 flex flex-col gap-2.5 py-2.5">
        <div className="px-2 font-semibold text-[13px] text-[#1a1c1c] dark:text-zinc-200 flex items-center justify-between">
          <span>Páginas ({thumbnails.length})</span>
          <span className="text-[11px] text-[#5b403d] dark:text-zinc-400">PDF</span>
        </div>

        {thumbnails.map((thumb) => {
          const isActive = thumb.pageNumber === currentPage;
          const realThumbnailUrl = renderedThumbnails[thumb.pageNumber];

          return (
            <div
              key={thumb.pageNumber}
              id={`thumbnail-page-${thumb.pageNumber}`}
              onClick={() => onSelectPage(thumb.pageNumber)}
              className="group relative cursor-pointer flex flex-col items-center gap-1"
            >
              <div
                className={`w-[176px] h-[220px] bg-white rounded shadow-xs overflow-hidden flex items-center justify-center p-1.5 relative transition-all duration-150 ${
                  isActive
                    ? 'border-2 border-[#b7131a] dark:border-red-500 shadow-sm ring-2 ring-red-500/20'
                    : 'border border-[#e4beb9] dark:border-zinc-700 hover:border-[#b7131a]/50 dark:hover:border-red-500/50'
                }`}
                style={{ transform: `rotate(${thumb.rotation}deg)` }}
              >
                {/* Real page thumbnail is always light & clear */}
                {realThumbnailUrl ? (
                  <img
                    src={realThumbnailUrl}
                    alt={`Página ${thumb.pageNumber}`}
                    className="w-full h-full object-contain rounded-xs bg-white"
                  />
                ) : (
                  /* Fallback mini vector layout representation (always crisp light) */
                  <div className="w-full h-full border border-[#e4beb9]/30 flex flex-col gap-1.5 p-2 bg-[#ffffff] text-zinc-800 rounded-xs">
                    <div className="w-2/3 h-1.5 bg-[#b7131a]/70 rounded-xs"></div>
                    <div className="w-full h-1 bg-[#e2e2e2] rounded-xs mt-1"></div>
                    <div className="w-5/6 h-1 bg-[#e2e2e2] rounded-xs"></div>
                    <div className="w-full h-1 bg-[#e2e2e2] rounded-xs"></div>
                    {thumb.pageNumber === 1 && (
                      <div className="w-full h-5 bg-[#b7131a]/15 rounded-xs mt-2 border border-[#b7131a]/20"></div>
                    )}
                    {thumb.pageNumber === 2 && (
                      <div className="w-3/4 h-12 bg-[#f5f5f5] rounded-xs mt-2 mx-auto border border-[#e4beb9]/40 flex items-center justify-center">
                        <div className="w-4 h-4 rounded-full border border-dashed border-[#b7131a]/40"></div>
                      </div>
                    )}
                    {thumb.pageNumber > 2 && (
                      <div className="w-full h-8 bg-[#f5f5f5] rounded-xs mt-2"></div>
                    )}
                  </div>
                )}

                {/* Page number badge */}
                <div
                  className={`absolute bottom-1 right-1 text-[10px] font-mono px-1.5 py-0.2 rounded-xs font-semibold shadow-xs ${
                    isActive
                      ? 'bg-[#b7131a] dark:bg-red-600 text-white'
                      : 'bg-[#e2e2e2] dark:bg-zinc-800 text-[#5b403d] dark:text-zinc-300'
                  }`}
                >
                  {thumb.pageNumber}
                </div>

                {/* Quick actions hover overlay */}
                <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 bg-white/95 dark:bg-zinc-800/95 rounded p-0.5 border border-[#e4beb9]/60 dark:border-zinc-700 shadow-xs">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onRotatePage(thumb.pageNumber);
                    }}
                    title="Rotar 90°"
                    className="p-1 hover:bg-[#f3f3f3] dark:hover:bg-zinc-700 text-[#5b403d] dark:text-zinc-300 rounded"
                  >
                    <RotateCw size={12} />
                  </button>
                  {thumbnails.length > 1 && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeletePage(thumb.pageNumber);
                      }}
                      title="Eliminar página"
                      className="p-1 hover:bg-red-50 dark:hover:bg-red-950/60 text-red-600 dark:text-red-400 rounded"
                    >
                      <Trash2 size={12} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* 3. Footer Link */}
      <div className="px-3 pt-2 border-t border-[#e4beb9]/60 dark:border-zinc-800 flex flex-col gap-0.5">
        <button
          id="side-nav-support-btn"
          onClick={() => {
            alert(
              'PDF Professional:\nEdita, une, divide, comprime, convierte y extrae texto de tus documentos PDF de manera rápida, privada y segura.'
            );
          }}
          className="flex items-center gap-2.5 px-3 py-1.5 w-full text-left rounded-md text-[#5b403d] dark:text-zinc-400 hover:bg-[#e8e8e8] dark:hover:bg-zinc-800 hover:text-[#1a1c1c] dark:hover:text-zinc-100 transition-all text-[12px]"
        >
          <HelpCircle size={15} />
          <span>Ayuda & Guía</span>
        </button>
      </div>
    </aside>
  );
};
