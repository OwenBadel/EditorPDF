import React from 'react';
import {
  Undo,
  Redo,
  ZoomIn,
  ZoomOut,
  Download,
  ChevronLeft,
  ChevronRight,
  SlidersHorizontal,
  FileText,
  ShieldCheck,
  Sun,
  Moon,
  FileCode,
} from 'lucide-react';
import { ActiveTab } from '../types';

interface TopAppBarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  zoom: number;
  setZoom: React.Dispatch<React.SetStateAction<number>>;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onDownload: () => void;
  hasDocument: boolean;
  documentName?: string;
  onNewDocument: () => void;
  isDarkMode: boolean;
  onToggleTheme: () => void;
}

export const TopAppBar: React.FC<TopAppBarProps> = ({
  activeTab,
  setActiveTab,
  currentPage,
  totalPages,
  onPageChange,
  zoom,
  setZoom,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onDownload,
  hasDocument,
  documentName,
  onNewDocument,
  isDarkMode,
  onToggleTheme,
}) => {
  return (
    <header
      id="top-app-bar"
      className="bg-white dark:bg-[#18181b] border-b border-[#e4beb9] dark:border-zinc-800 fixed top-0 w-full h-[48px] flex justify-between items-center px-4 z-50 select-none shadow-[0_1px_3px_rgba(0,0,0,0.02)] transition-colors"
    >
      {/* Brand & Navigation Links */}
      <div className="flex items-center gap-4 sm:gap-6 h-full">
        <div
          id="brand-logo"
          onClick={() => setActiveTab(hasDocument ? 'editor' : 'upload')}
          className="flex items-center gap-2 cursor-pointer group"
        >
          <div className="w-6 h-6 rounded bg-[#b7131a] flex items-center justify-center text-white text-[12px] font-black tracking-tighter shadow-sm">
            PDF
          </div>
          <span className="font-semibold text-[16px] sm:text-[17px] text-[#b7131a] dark:text-red-400 tracking-tight">
            PDF Professional
          </span>
        </div>

        {/* Navigation tabs matching design system */}
        <nav className="flex items-center h-full gap-1 text-[13px] font-medium text-[#5b403d] dark:text-zinc-300">
          <button
            id="nav-file-btn"
            onClick={onNewDocument}
            className={`h-[calc(100%-2px)] px-2.5 sm:px-3 mt-[2px] transition-colors flex items-center gap-1.5 ${
              activeTab === 'upload'
                ? 'text-[#b7131a] dark:text-red-400 border-b-2 border-[#b7131a] dark:border-red-400 font-semibold'
                : 'text-[#5b403d] dark:text-zinc-400 hover:text-[#1a1c1c] dark:hover:text-zinc-100 hover:bg-[#f3f3f3] dark:hover:bg-zinc-800'
            }`}
          >
            <FileText size={14} />
            <span className="hidden sm:inline">Archivo</span>
          </button>

          {hasDocument && (
            <button
              id="nav-editor-btn"
              onClick={() => setActiveTab('editor')}
              className={`h-[calc(100%-2px)] px-2.5 sm:px-3 mt-[2px] transition-colors flex items-center gap-1.5 ${
                activeTab === 'editor'
                  ? 'text-[#b7131a] dark:text-red-400 border-b-2 border-[#b7131a] dark:border-red-400 font-semibold'
                  : 'text-[#5b403d] dark:text-zinc-400 hover:text-[#1a1c1c] dark:hover:text-zinc-100 hover:bg-[#f3f3f3] dark:hover:bg-zinc-800'
              }`}
            >
              <span>Editor</span>
            </button>
          )}

          <button
            id="nav-operations-btn"
            onClick={() => setActiveTab('operations')}
            className={`h-[calc(100%-2px)] px-2.5 sm:px-3 mt-[2px] transition-colors flex items-center gap-1.5 ${
              activeTab === 'operations'
                ? 'text-[#b7131a] dark:text-red-400 border-b-2 border-[#b7131a] dark:border-red-400 font-semibold'
                : 'text-[#5b403d] dark:text-zinc-400 hover:text-[#1a1c1c] dark:hover:text-zinc-100 hover:bg-[#f3f3f3] dark:hover:bg-zinc-800'
            }`}
          >
            <SlidersHorizontal size={14} />
            <span>Operaciones</span>
          </button>

          <a
            id="nav-api-docs-btn"
            href="/api/docs"
            target="_blank"
            rel="noopener noreferrer"
            className="h-[calc(100%-2px)] px-2 sm:px-2.5 mt-[2px] transition-colors flex items-center gap-1 text-[#5b403d] dark:text-zinc-400 hover:text-[#b7131a] dark:hover:text-red-400 hover:bg-[#f3f3f3] dark:hover:bg-zinc-800 rounded-sm"
            title="Explorar API REST y Swagger UI interactivo"
          >
            <FileCode size={14} />
            <span className="hidden md:inline">API Docs</span>
          </a>

          {/* Theme Toggle Button next to Operaciones with Sun and Moon */}
          <button
            id="theme-toggle-btn"
            type="button"
            onClick={onToggleTheme}
            title={isDarkMode ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
            aria-label="Alternar modo claro y oscuro"
            className={`ml-1.5 sm:ml-2.5 px-2 py-1 rounded-full flex items-center gap-1.5 border transition-all text-[11px] font-medium shadow-2xs active:scale-95 ${
              isDarkMode
                ? 'bg-zinc-800 border-zinc-700 text-amber-300 hover:bg-zinc-750 hover:border-zinc-600'
                : 'bg-[#f4f4f4] border-[#e4beb9] text-[#5b403d] hover:bg-[#eaeaea] hover:text-[#1a1c1c]'
            }`}
          >
            <Sun
              size={13}
              className={`transition-transform duration-200 ${
                !isDarkMode ? 'text-amber-500 scale-110' : 'text-zinc-500 opacity-40'
              }`}
            />
            {/* Sliding Pill Switch */}
            <div
              className={`w-7 h-3.5 rounded-full p-0.5 flex items-center transition-colors ${
                isDarkMode ? 'bg-[#b7131a] justify-end' : 'bg-[#cfcfcf] justify-start'
              }`}
            >
              <div className="w-2.5 h-2.5 rounded-full bg-white shadow-xs"></div>
            </div>
            <Moon
              size={13}
              className={`transition-transform duration-200 ${
                isDarkMode ? 'text-indigo-300 scale-110' : 'text-zinc-400 opacity-40'
              }`}
            />
          </button>
        </nav>
      </div>

      {/* Center Page Nav (Active when in editor) */}
      {hasDocument && activeTab === 'editor' && (
        <div
          id="page-navigation-controls"
          className="hidden sm:flex items-center gap-2 bg-[#f3f3f3] dark:bg-zinc-800 px-3 py-1 rounded border border-[#e4beb9]/60 dark:border-zinc-700"
        >
          <button
            id="prev-page-btn"
            disabled={currentPage <= 1}
            onClick={() => onPageChange(currentPage - 1)}
            className="text-[#5b403d] dark:text-zinc-300 hover:text-[#1a1c1c] dark:hover:text-zinc-100 p-0.5 rounded hover:bg-[#e2e2e2] dark:hover:bg-zinc-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            title="Página anterior"
          >
            <ChevronLeft size={16} />
          </button>
          <span className="font-mono text-[12px] text-[#1a1c1c] dark:text-zinc-200 font-medium tracking-tight">
            Página {currentPage} de {totalPages}
          </span>
          <button
            id="next-page-btn"
            disabled={currentPage >= totalPages}
            onClick={() => onPageChange(currentPage + 1)}
            className="text-[#5b403d] dark:text-zinc-300 hover:text-[#1a1c1c] dark:hover:text-zinc-100 p-0.5 rounded hover:bg-[#e2e2e2] dark:hover:bg-zinc-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            title="Página siguiente"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      )}

      {/* Trailing Actions */}
      <div className="flex items-center gap-1.5">
        <div className="hidden xl:flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-800 rounded-full text-emerald-800 dark:text-emerald-300 text-[11px] font-medium mr-2">
          <ShieldCheck size={13} className="text-emerald-600 dark:text-emerald-400" />
          <span>Procesamiento Seguro</span>
        </div>

        {hasDocument && activeTab === 'editor' && (
          <>
            <button
              id="undo-btn"
              disabled={!canUndo}
              onClick={onUndo}
              aria-label="undo"
              title="Deshacer (Ctrl+Z)"
              className="w-8 h-8 flex items-center justify-center rounded-full text-[#5b403d] dark:text-zinc-300 hover:text-[#1a1c1c] dark:hover:text-zinc-100 hover:bg-[#f3f3f3] dark:hover:bg-zinc-800 transition-colors active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Undo size={17} />
            </button>
            <button
              id="redo-btn"
              disabled={!canRedo}
              onClick={onRedo}
              aria-label="redo"
              title="Rehacer (Ctrl+Y)"
              className="w-8 h-8 flex items-center justify-center rounded-full text-[#5b403d] dark:text-zinc-300 hover:text-[#1a1c1c] dark:hover:text-zinc-100 hover:bg-[#f3f3f3] dark:hover:bg-zinc-800 transition-colors active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Redo size={17} />
            </button>

            <div className="w-[1px] h-4 bg-[#e4beb9] dark:bg-zinc-700 mx-1"></div>

            <button
              id="zoom-out-btn"
              onClick={() => setZoom((z) => Math.max(0.5, Number((z - 0.1).toFixed(1))))}
              aria-label="zoom_out"
              title="Reducir zoom"
              className="w-8 h-8 flex items-center justify-center rounded-full text-[#5b403d] dark:text-zinc-300 hover:text-[#1a1c1c] dark:hover:text-zinc-100 hover:bg-[#f3f3f3] dark:hover:bg-zinc-800 transition-colors active:scale-95"
            >
              <ZoomOut size={17} />
            </button>
            <span className="text-[12px] font-mono text-[#5b403d] dark:text-zinc-300 px-1 w-12 text-center">
              {Math.round(zoom * 100)}%
            </span>
            <button
              id="zoom-in-btn"
              onClick={() => setZoom((z) => Math.min(2.0, Number((z + 0.1).toFixed(1))))}
              aria-label="zoom_in"
              title="Aumentar zoom"
              className="w-8 h-8 flex items-center justify-center rounded-full text-[#5b403d] dark:text-zinc-300 hover:text-[#1a1c1c] dark:hover:text-zinc-100 hover:bg-[#f3f3f3] dark:hover:bg-zinc-800 transition-colors active:scale-95"
            >
              <ZoomIn size={17} />
            </button>

            <div className="w-[1px] h-4 bg-[#e4beb9] dark:bg-zinc-700 mx-1"></div>
          </>
        )}

        <button
          id="global-download-btn"
          onClick={onDownload}
          aria-label="download"
          className="bg-[#b7131a] hover:bg-[#db322f] text-white font-medium text-[13px] px-3.5 py-1.5 rounded transition-all duration-150 flex items-center gap-1.5 shadow-sm active:scale-95"
        >
          <Download size={15} />
          <span>{hasDocument ? 'Descargar' : 'Guardar PDF'}</span>
        </button>
      </div>
    </header>
  );
};
