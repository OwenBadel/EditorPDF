import React, { useState, useRef, useEffect } from 'react';
import {
  MessageSquare,
  Trash2,
  Check,
  Palette,
  Edit3,
  MousePointer,
  Sparkles,
  Loader2,
  AlertCircle,
  Type,
  PenTool,
  Highlighter,
  Eraser,
  Image as ImageIcon,
  Move,
  Maximize2,
  X,
} from 'lucide-react';
import {
  ToolType,
  AnnotationHighlight,
  DrawingPath,
  TextAnnotation,
  ImageAnnotation,
  LoadedDocument,
} from '../types';
import { getPdfJsDocument, renderPdfPage } from '../utils/pdfRenderer';

interface DocumentCanvasProps {
  currentPage: number;
  totalPages?: number;
  documentName?: string;
  loadedDocument?: LoadedDocument | null;
  isDarkMode?: boolean;
  pageRotation?: number;
  zoom: number;
  selectedTool: ToolType;
  onSelectTool: (tool: ToolType) => void;
  highlights: AnnotationHighlight[];
  onAddHighlight: (highlight: AnnotationHighlight) => void;
  onUpdateHighlight: (id: string, updates: Partial<AnnotationHighlight>) => void;
  onRemoveHighlight: (id: string) => void;
  drawings: DrawingPath[];
  onAddDrawing: (drawing: DrawingPath) => void;
  onRemoveDrawing: (id: string) => void;
  textAnnotations: TextAnnotation[];
  onAddTextAnnotation: (annotation: TextAnnotation) => void;
  onUpdateTextAnnotation: (id: string, text: string, fontSize?: number, color?: string) => void;
  onUpdateTextPosition: (id: string, x: number, y: number) => void;
  onDeleteTextAnnotation: (id: string) => void;
  imageAnnotations: ImageAnnotation[];
  onAddImageAnnotation: (annotation: ImageAnnotation) => void;
  onUpdateImagePosition: (id: string, x: number, y: number) => void;
  onUpdateImageSize: (id: string, width: number, height: number) => void;
  onDeleteImageAnnotation: (id: string) => void;
  onOpenSignatureModal: () => void;
}

interface InlineTextItemProps {
  anno: TextAnnotation;
  isEditing: boolean;
  zoom: number;
  selectedTool: ToolType;
  onStartEditing: () => void;
  onCommit: (text: string, fontSize?: number, color?: string) => void;
  onDelete: () => void;
  onStartDrag: (e: React.MouseEvent) => void;
}

const InlineTextItem: React.FC<InlineTextItemProps> = ({
  anno,
  isEditing,
  zoom,
  selectedTool,
  onStartEditing,
  onCommit,
  onDelete,
  onStartDrag,
}) => {
  const [localText, setLocalText] = useState(anno.text || '');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setLocalText(anno.text || '');
  }, [anno.text]);

  useEffect(() => {
    if (isEditing) {
      const timer = setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.focus();
          const len = textareaRef.current.value.length;
          textareaRef.current.setSelectionRange(len, len);
        }
      }, 20);
      return () => clearTimeout(timer);
    }
  }, [isEditing]);

  const handleFinish = (textToSave = localText) => {
    if (!textToSave.trim()) {
      onDelete();
    } else {
      onCommit(textToSave, anno.fontSize, anno.color);
    }
  };

  return (
    <div
      className="text-annotation-box absolute z-30"
      style={{
        left: `${anno.x * zoom}px`,
        top: `${anno.y * zoom}px`,
      }}
      onClick={(e) => {
        e.stopPropagation();
        if (selectedTool === 'eraser') {
          onDelete();
        } else if (selectedTool === 'text') {
          onStartEditing();
        }
      }}
      onDoubleClick={(e) => {
        e.stopPropagation();
        if (selectedTool !== 'eraser') {
          onStartEditing();
        }
      }}
    >
      {isEditing ? (
        <textarea
          ref={textareaRef}
          rows={1}
          value={localText}
          placeholder="Escribe aquí..."
          onChange={(e) => {
            setLocalText(e.target.value);
            onCommit(e.target.value, anno.fontSize, anno.color);
          }}
          onBlur={() => {
            handleFinish();
          }}
          onKeyDown={(e) => {
            if (e.key === 'Escape' || (e.key === 'Enter' && !e.shiftKey)) {
              e.preventDefault();
              handleFinish();
            }
          }}
          style={{
            fontSize: `${(anno.fontSize || 16) * zoom}px`,
            color: anno.color || '#1a1c1c',
            lineHeight: 1.2,
            minWidth: '60px',
            maxWidth: '650px',
          }}
          className="bg-transparent border border-dashed border-[#b7131a] dark:border-red-400 outline-none p-0.5 m-0 font-sans focus:ring-0 resize-none overflow-hidden block shadow-none transition-none placeholder:text-zinc-400/80 placeholder:italic select-text cursor-text"
        />
      ) : (
        <div
          onMouseDown={(e) => {
            if (selectedTool === 'select' || selectedTool === 'text') {
              onStartDrag(e);
            }
          }}
          className={`relative p-0.5 m-0 transition-none flex items-center select-text cursor-text ${
            selectedTool === 'eraser'
              ? 'hover:ring-2 hover:ring-red-500 hover:bg-red-50'
              : 'hover:outline hover:outline-1 hover:outline-blue-500/60 hover:bg-blue-500/5 cursor-move'
          }`}
        >
          <span
            style={{
              fontSize: `${(anno.fontSize || 16) * zoom}px`,
              color: anno.color || '#1a1c1c',
              lineHeight: 1.2,
            }}
            className="font-medium whitespace-pre-wrap select-text block cursor-text"
          >
            {anno.text || ''}
          </span>
        </div>
      )}
    </div>
  );
};

export const DocumentCanvas: React.FC<DocumentCanvasProps> = ({
  currentPage,
  totalPages = 3,
  documentName,
  loadedDocument,
  isDarkMode = false,
  pageRotation = 0,
  zoom,
  selectedTool,
  onSelectTool,
  highlights,
  onAddHighlight,
  onUpdateHighlight,
  onRemoveHighlight,
  drawings,
  onAddDrawing,
  onRemoveDrawing,
  textAnnotations,
  onAddTextAnnotation,
  onUpdateTextAnnotation,
  onUpdateTextPosition,
  onDeleteTextAnnotation,
  imageAnnotations,
  onAddImageAnnotation,
  onUpdateImagePosition,
  onUpdateImageSize,
  onDeleteImageAnnotation,
  onOpenSignatureModal,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const pdfCanvasRef = useRef<HTMLCanvasElement>(null);
  const drawingCanvasRef = useRef<HTMLCanvasElement>(null);

  // Tool specific configurations
  const [penColor, setPenColor] = useState<string>('#b7131a');
  const [penWidth, setPenWidth] = useState<number>(2.5);
  const [highlightColor, setHighlightColor] = useState<string>('#fde047');
  const [textColor, setTextColor] = useState<string>('#1a1c1c');
  const [textFontSize, setTextFontSize] = useState<number>(16);

  // State for active freehand drawing
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentPath, setCurrentPath] = useState<{ x: number; y: number }[]>([]);

  // State for highlight dragging rectangle
  const [isHighlighting, setIsHighlighting] = useState(false);
  const [highlightStart, setHighlightStart] = useState<{ x: number; y: number } | null>(null);
  const [highlightCurrent, setHighlightCurrent] = useState<{ x: number; y: number } | null>(null);

  // Active contextual item (selected text, highlight, or image)
  const [activeHighlightId, setActiveHighlightId] = useState<string | null>(null);
  const [editingTextId, setEditingTextId] = useState<string | null>(null);
  const [editingTextValue, setEditingTextValue] = useState<string>('');

  // Dragging text or image
  const [draggedItem, setDraggedItem] = useState<{
    type: 'text' | 'image';
    id: string;
    offsetX: number;
    offsetY: number;
  } | null>(null);

  // Resizing image
  const [resizingImage, setResizingImage] = useState<{
    id: string;
    startX: number;
    startY: number;
    startW: number;
    startH: number;
  } | null>(null);

  // Real PDF rendering state
  const [isLoadingPdfPage, setIsLoadingPdfPage] = useState(false);
  const [pdfRenderError, setPdfRenderError] = useState<string | null>(null);
  const [pageSize, setPageSize] = useState<{ width: number; height: number }>({ width: 800, height: 1131 });

  const hasRealPdfBytes = Boolean(loadedDocument?.fileBytes && loadedDocument.fileBytes.length > 0);

  // Render Real PDF page onto pdfCanvasRef
  useEffect(() => {
    let isCancelled = false;

    if (!hasRealPdfBytes || !loadedDocument?.fileBytes) {
      setPdfRenderError(null);
      setIsLoadingPdfPage(false);
      setPageSize({ width: 800, height: 1131 });
      return;
    }

    const renderPage = async () => {
      setIsLoadingPdfPage(true);
      setPdfRenderError(null);

      try {
        const pdfDoc = await getPdfJsDocument(loadedDocument.fileBytes!);
        if (isCancelled) return;

        if (currentPage < 1 || currentPage > pdfDoc.numPages) {
          throw new Error(`Página ${currentPage} fuera de rango (1 - ${pdfDoc.numPages})`);
        }

        if (pdfCanvasRef.current) {
          const targetWidth = 800 * zoom;
          const renderedSize = await renderPdfPage(
            pdfDoc,
            currentPage,
            pdfCanvasRef.current,
            targetWidth,
            pageRotation
          );

          if (!isCancelled) {
            setPageSize({
              width: renderedSize.width / zoom,
              height: renderedSize.height / zoom,
            });
          }
        }
      } catch (err: any) {
        console.error('Error rendering PDF page:', err);
        if (!isCancelled) {
          setPdfRenderError(err?.message || 'No se pudo renderizar la página del documento.');
        }
      } finally {
        if (!isCancelled) {
          setIsLoadingPdfPage(false);
        }
      }
    };

    renderPage();

    return () => {
      isCancelled = true;
    };
  }, [loadedDocument?.fileBytes, currentPage, zoom, pageRotation, hasRealPdfBytes]);

  // Redraw freehand drawings layer
  useEffect(() => {
    const canvas = drawingCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const pageDrawings = drawings.filter((d) => d.pageNumber === currentPage);
    for (const d of pageDrawings) {
      if (d.points.length < 2) continue;
      ctx.beginPath();
      ctx.strokeStyle = d.color;
      ctx.lineWidth = d.strokeWidth * zoom;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.moveTo(d.points[0].x * zoom, d.points[0].y * zoom);
      for (let i = 1; i < d.points.length; i++) {
        ctx.lineTo(d.points[i].x * zoom, d.points[i].y * zoom);
      }
      ctx.stroke();
    }

    if (currentPath.length > 1) {
      ctx.beginPath();
      ctx.strokeStyle = penColor;
      ctx.lineWidth = penWidth * zoom;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.moveTo(currentPath[0].x * zoom, currentPath[0].y * zoom);
      for (let i = 1; i < currentPath.length; i++) {
        ctx.lineTo(currentPath[i].x * zoom, currentPath[i].y * zoom);
      }
      ctx.stroke();
    }
  }, [drawings, currentPath, currentPage, zoom, penColor, penWidth]);

  // Helper to get coordinates on document sheet
  const getDocCoordinates = (e: React.MouseEvent) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return { x: 0, y: 0 };
    return {
      x: (e.clientX - rect.left) / zoom,
      y: (e.clientY - rect.top) / zoom,
    };
  };

  // MOUSE DOWN HANDLER ON SHEET
  const handleSheetMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    const { x, y } = getDocCoordinates(e);
    const target = e.target as HTMLElement;

    // If there is an active editing text and clicking outside of it, commit or remove if empty
    if (editingTextId && !target.closest('.text-annotation-box')) {
      if (!editingTextValue.trim()) {
        onDeleteTextAnnotation(editingTextId);
      } else {
        onUpdateTextAnnotation(editingTextId, editingTextValue);
      }
      setEditingTextId(null);
    }

    // 1. TOOL: DRAW
    if (selectedTool === 'draw') {
      setIsDrawing(true);
      setCurrentPath([{ x, y }]);
      return;
    }

    // 2. TOOL: HIGHLIGHT (Drag rectangle)
    if (selectedTool === 'highlight') {
      setIsHighlighting(true);
      setHighlightStart({ x, y });
      setHighlightCurrent({ x, y });
      return;
    }

    // 3. TOOL: TEXT (Place new direct inline text box if not clicking existing text)
    if (selectedTool === 'text') {
      if (!target.closest('.text-annotation-box')) {
        const newId = `text-${Date.now()}`;
        onAddTextAnnotation({
          id: newId,
          pageNumber: currentPage,
          x: Math.max(10, x),
          y: Math.max(10, y),
          text: '',
          fontSize: textFontSize,
          color: textColor,
        });
        setEditingTextId(newId);
        setEditingTextValue('');
      }
      return;
    }

    // 4. TOOL: IMAGE / SIGNATURE (Clicking canvas triggers modal)
    if (selectedTool === 'image') {
      const target = e.target as HTMLElement;
      if (!target.closest('.image-annotation-box')) {
        onOpenSignatureModal();
      }
      return;
    }

    // 5. TOOL: ERASER (Drag to erase drawings)
    if (selectedTool === 'eraser') {
      eraseAtPoint(x, y);
    }
  };

  // MOUSE MOVE HANDLER
  const handleSheetMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const { x, y } = getDocCoordinates(e);

    // Freehand drawing in progress
    if (isDrawing && selectedTool === 'draw') {
      setCurrentPath((prev) => [...prev, { x, y }]);
      return;
    }

    // Highlight rectangle dragging in progress
    if (isHighlighting && selectedTool === 'highlight') {
      setHighlightCurrent({ x, y });
      return;
    }

    // Eraser dragging over drawings or highlights
    if (selectedTool === 'eraser' && e.buttons === 1) {
      eraseAtPoint(x, y);
      return;
    }

    // Dragging text or image annotation
    if (draggedItem) {
      const newX = Math.max(0, x - draggedItem.offsetX);
      const newY = Math.max(0, y - draggedItem.offsetY);
      if (draggedItem.type === 'text') {
        onUpdateTextPosition(draggedItem.id, newX, newY);
      } else if (draggedItem.type === 'image') {
        onUpdateImagePosition(draggedItem.id, newX, newY);
      }
      return;
    }

    // Resizing image
    if (resizingImage) {
      const deltaX = x - resizingImage.startX;
      const deltaY = y - resizingImage.startY;
      const newWidth = Math.max(40, resizingImage.startW + deltaX);
      const newHeight = Math.max(20, resizingImage.startH + deltaY);
      onUpdateImageSize(resizingImage.id, newWidth, newHeight);
      return;
    }
  };

  // MOUSE UP HANDLER
  const handleSheetMouseUp = () => {
    // Finish drawing
    if (isDrawing && selectedTool === 'draw') {
      setIsDrawing(false);
      if (currentPath.length > 1) {
        onAddDrawing({
          id: `draw-${Date.now()}`,
          pageNumber: currentPage,
          points: currentPath,
          color: penColor,
          strokeWidth: penWidth,
        });
      }
      setCurrentPath([]);
    }

    // Finish highlight rect
    if (isHighlighting && selectedTool === 'highlight') {
      setIsHighlighting(false);
      if (highlightStart && highlightCurrent) {
        const x = Math.min(highlightStart.x, highlightCurrent.x);
        const y = Math.min(highlightStart.y, highlightCurrent.y);
        const width = Math.abs(highlightCurrent.x - highlightStart.x);
        const height = Math.abs(highlightCurrent.y - highlightStart.y);

        if (width > 8 && height > 6) {
          const newHlId = `hl-${Date.now()}`;
          onAddHighlight({
            id: newHlId,
            pageNumber: currentPage,
            rect: { x, y, width, height },
            text: 'Área resaltada',
            color: highlightColor,
          });
          setActiveHighlightId(newHlId);
        }
      }
      setHighlightStart(null);
      setHighlightCurrent(null);
    }

    // Clear dragging / resizing
    setDraggedItem(null);
    setResizingImage(null);
  };

  // Eraser point check
  const eraseAtPoint = (x: number, y: number) => {
    // Check drawings on this page
    const pageDrawings = drawings.filter((d) => d.pageNumber === currentPage);
    for (const d of pageDrawings) {
      const touched = d.points.some((p) => Math.hypot(p.x - x, p.y - y) < 18);
      if (touched) {
        onRemoveDrawing(d.id);
      }
    }

    // Check highlights on this page
    const pageHighlights = highlights.filter((h) => h.pageNumber === currentPage);
    for (const h of pageHighlights) {
      if (
        x >= h.rect.x &&
        x <= h.rect.x + h.rect.width &&
        y >= h.rect.y &&
        y <= h.rect.y + h.rect.height
      ) {
        onRemoveHighlight(h.id);
      }
    }
  };

  const displayWidth = pageSize.width * zoom;
  const displayHeight = pageSize.height * zoom;

  // Render current highlight preview while dragging
  const highlightPreviewStyle =
    highlightStart && highlightCurrent
      ? {
          left: `${Math.min(highlightStart.x, highlightCurrent.x) * zoom}px`,
          top: `${Math.min(highlightStart.y, highlightCurrent.y) * zoom}px`,
          width: `${Math.abs(highlightCurrent.x - highlightStart.x) * zoom}px`,
          height: `${Math.abs(highlightCurrent.y - highlightStart.y) * zoom}px`,
          backgroundColor: highlightColor + '55',
        }
      : null;

  return (
    <main
      id="main-workspace-canvas"
      className="flex-1 ml-[240px] bg-[#f5f5f5] dark:bg-[#0e0e11] relative overflow-auto p-6 flex flex-col items-center min-h-[calc(100vh-48px)] select-none transition-colors duration-200"
    >
      {/* FLOATING ACTIVE TOOL CONFIGURATION BAR */}
      <div
        id="active-tool-banner"
        className="mb-3 px-4 py-2 bg-white dark:bg-zinc-850 border border-[#e4beb9] dark:border-zinc-700 rounded-full shadow-md flex items-center gap-4 text-[13px] z-30 animate-in fade-in slide-in-from-top-2 duration-150"
      >
        {/* Tool Indicator */}
        <div className="flex items-center gap-1.5 font-semibold text-[#b7131a] dark:text-red-400 border-r border-[#e4beb9]/80 dark:border-zinc-700 pr-3">
          {selectedTool === 'draw' && <PenTool size={16} />}
          {selectedTool === 'text' && <Type size={16} />}
          {selectedTool === 'highlight' && <Highlighter size={16} />}
          {selectedTool === 'image' && <ImageIcon size={16} />}
          {selectedTool === 'eraser' && <Eraser size={16} />}
          <span className="capitalize">
            {selectedTool === 'draw'
              ? 'Dibujar'
              : selectedTool === 'text'
              ? 'Texto'
              : selectedTool === 'highlight'
              ? 'Resaltar'
              : selectedTool === 'image'
              ? 'Imagen / Firma'
              : selectedTool === 'eraser'
              ? 'Borrador'
              : 'Seleccionar'}
          </span>
        </div>

        {/* 1. DRAW CONTROLS */}
        {selectedTool === 'draw' && (
          <div className="flex items-center gap-3">
            <span className="text-[#5b403d] dark:text-zinc-400 text-[12px]">Color:</span>
            <div className="flex items-center gap-1.5">
              {[
                { color: '#b7131a', name: 'Rojo' },
                { color: '#0052cc', name: 'Azul' },
                { color: '#1a1c1c', name: 'Negro' },
                { color: '#16a34a', name: 'Verde' },
              ].map((c) => (
                <button
                  key={c.color}
                  onClick={() => setPenColor(c.color)}
                  style={{ backgroundColor: c.color }}
                  className={`w-5 h-5 rounded-full border border-white shadow-xs transition-transform ${
                    penColor === c.color ? 'scale-125 ring-2 ring-red-500 ring-offset-1' : 'hover:scale-110'
                  }`}
                  title={c.name}
                />
              ))}
            </div>

            <div className="w-px h-4 bg-[#e4beb9] dark:bg-zinc-700 mx-1"></div>

            <span className="text-[#5b403d] dark:text-zinc-400 text-[12px]">Grosor:</span>
            <div className="flex items-center gap-1">
              {[
                { w: 1.5, label: 'Fino' },
                { w: 3, label: 'Medio' },
                { w: 6, label: 'Grueso' },
              ].map((item) => (
                <button
                  key={item.w}
                  onClick={() => setPenWidth(item.w)}
                  className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
                    penWidth === item.w
                      ? 'bg-[#b7131a] text-white'
                      : 'text-[#5b403d] dark:text-zinc-300 hover:bg-[#f3f3f3] dark:hover:bg-zinc-700'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 2. TEXT CONTROLS */}
        {selectedTool === 'text' && (
          <div className="flex items-center gap-3">
            <span className="text-[#5b403d] dark:text-zinc-400 text-[12px]">
              Haz clic en cualquier punto del PDF para escribir:
            </span>
            <div className="flex items-center gap-1.5">
              {[
                { color: '#1a1c1c', name: 'Negro' },
                { color: '#b7131a', name: 'Rojo' },
                { color: '#0052cc', name: 'Azul' },
                { color: '#16a34a', name: 'Verde' },
              ].map((c) => (
                <button
                  key={c.color}
                  onClick={() => {
                    setTextColor(c.color);
                    if (editingTextId) {
                      onUpdateTextAnnotation(editingTextId, editingTextValue, textFontSize, c.color);
                    }
                  }}
                  style={{ backgroundColor: c.color }}
                  className={`w-5 h-5 rounded-full border border-white shadow-xs transition-transform ${
                    textColor === c.color ? 'scale-125 ring-2 ring-red-500 ring-offset-1' : 'hover:scale-110'
                  }`}
                  title={c.name}
                />
              ))}
            </div>

            <div className="w-px h-4 bg-[#e4beb9] dark:bg-zinc-700 mx-1"></div>

            <select
              value={textFontSize}
              onChange={(e) => {
                const size = Number(e.target.value);
                setTextFontSize(size);
                if (editingTextId) {
                  onUpdateTextAnnotation(editingTextId, editingTextValue, size, textColor);
                }
              }}
              className="text-[12px] bg-zinc-100 dark:bg-zinc-750 text-[#1a1c1c] dark:text-zinc-200 px-2 py-0.5 rounded border border-[#e4beb9] dark:border-zinc-700"
            >
              <option value={12}>12 px</option>
              <option value={14}>14 px</option>
              <option value={16}>16 px</option>
              <option value={20}>20 px</option>
              <option value={26}>26 px</option>
              <option value={32}>32 px</option>
            </select>
          </div>
        )}

        {/* 3. HIGHLIGHT CONTROLS */}
        {selectedTool === 'highlight' && (
          <div className="flex items-center gap-3">
            <span className="text-[#5b403d] dark:text-zinc-400 text-[12px]">
              Arrastra un recuadro sobre el texto para resaltar:
            </span>
            <div className="flex items-center gap-1.5">
              {[
                { color: '#fde047', name: 'Amarillo' },
                { color: '#4ade80', name: 'Verde' },
                { color: '#f472b6', name: 'Rosa' },
                { color: '#38bdf8', name: 'Celeste' },
                { color: '#f87171', name: 'Rojo' },
              ].map((c) => (
                <button
                  key={c.color}
                  onClick={() => setHighlightColor(c.color)}
                  style={{ backgroundColor: c.color }}
                  className={`w-5 h-5 rounded-full border border-white shadow-xs transition-transform ${
                    highlightColor === c.color ? 'scale-125 ring-2 ring-red-500 ring-offset-1' : 'hover:scale-110'
                  }`}
                  title={c.name}
                />
              ))}
            </div>
          </div>
        )}

        {/* 4. IMAGE / SIGNATURE CONTROLS */}
        {selectedTool === 'image' && (
          <div className="flex items-center gap-2">
            <span className="text-[#5b403d] dark:text-zinc-400 text-[12px]">
              Inserta firmas dibujadas, caligráficas, sellos o logos:
            </span>
            <button
              onClick={onOpenSignatureModal}
              className="px-3 py-1 bg-[#b7131a] hover:bg-[#a01017] text-white rounded-md text-[12px] font-medium flex items-center gap-1.5 shadow-xs transition-colors"
            >
              <PenTool size={13} />
              <span>Abrir Creador de Firmas</span>
            </button>
          </div>
        )}

        {/* 5. ERASER CONTROLS */}
        {selectedTool === 'eraser' && (
          <div className="flex items-center gap-2 text-[#5b403d] dark:text-zinc-400 text-[12px]">
            <span>Haz clic en cualquier dibujo, texto, firma o resaltado para borrarlo al instante.</span>
          </div>
        )}
      </div>

      {/* DOCUMENT SHEET CONTAINER (ALWAYS CRISP WHITE BG) */}
      <div
        id="document-page-sheet"
        ref={containerRef}
        onMouseDown={handleSheetMouseDown}
        onMouseMove={handleSheetMouseMove}
        onMouseUp={handleSheetMouseUp}
        style={{
          width: `${displayWidth}px`,
          minHeight: `${displayHeight}px`,
          transformOrigin: 'top center',
        }}
        className={`relative my-2 rounded-xs shadow-[0_10px_35px_rgba(0,0,0,0.12)] border border-[#d8d8d8] bg-white text-[#1a1c1c] select-none transition-all ${
          selectedTool === 'draw'
            ? 'cursor-crosshair'
            : selectedTool === 'text'
            ? 'cursor-text'
            : selectedTool === 'highlight'
            ? 'cursor-crosshair'
            : selectedTool === 'eraser'
            ? 'cursor-pointer'
            : selectedTool === 'image'
            ? 'cursor-copy'
            : 'cursor-default'
        } ${hasRealPdfBytes ? 'p-0 overflow-hidden flex items-center justify-center' : 'p-12 sm:p-16 flex flex-col gap-6'}`}
      >
        {/* CASE 1: REAL PDF DOCUMENT RENDERED (ALWAYS CRISP WHITE, NO INVERSION) */}
        {hasRealPdfBytes ? (
          <div className="relative w-full h-full flex items-center justify-center bg-white">
            {/* The Real PDF Canvas Layer */}
            <canvas
              ref={pdfCanvasRef}
              id="pdf-rendered-layer"
              className="block max-w-full h-auto bg-white"
            />

            {/* Loading Indicator */}
            {isLoadingPdfPage && (
              <div className="absolute inset-0 bg-white/80 z-30 flex flex-col items-center justify-center gap-3 backdrop-blur-xs">
                <Loader2 size={32} className="animate-spin text-[#b7131a]" />
                <span className="text-[13px] font-medium text-[#1a1c1c]">
                  Cargando página {currentPage}...
                </span>
              </div>
            )}

            {/* Error Message if render fails */}
            {pdfRenderError && (
              <div className="absolute inset-0 bg-white z-30 flex flex-col items-center justify-center p-8 text-center gap-3">
                <AlertCircle size={36} className="text-red-500" />
                <p className="text-[14px] font-semibold text-[#1a1c1c]">
                  No se pudo renderizar la página {currentPage}
                </p>
                <p className="text-[12px] text-[#5b403d] max-w-md">
                  {pdfRenderError}
                </p>
              </div>
            )}
          </div>
        ) : (
          /* CASE 2: SAMPLE DEFAULT DOCUMENT TEMPLATE (ALWAYS CLEAN WHITE) */
          <>
            {currentPage === 1 && (
              <>
                <header className="border-b border-[#e4beb9] pb-4 mb-2">
                  <h1 className="text-[26px] font-semibold text-[#1a1c1c] mb-1.5 tracking-tight font-sans">
                    {documentName ? documentName.replace(/\.pdf$/i, '') : 'Acuerdo de Confidencialidad'}
                  </h1>
                  <p className="text-[14px] text-[#5b403d]">
                    Página 1 de {totalPages} • Documento Verificado
                  </p>
                </header>

                <div className="text-[15px] leading-relaxed text-[#1a1c1c] space-y-5">
                  <p>
                    Este documento ha sido cargado y procesado de forma segura en PDF Professional. Todas
                    las herramientas de edición, texto, dibujo, resaltado, firma y borrado están habilitadas en esta página.
                  </p>

                  <h2 className="text-[17px] font-semibold text-[#1a1c1c] pt-2">
                    1. Definición y Alcance
                  </h2>
                  <p>
                    A los efectos de este documento, los términos y condiciones estipulados abarcan
                    la totalidad de los acuerdos entre las partes interesadas.
                  </p>

                  <h2 className="text-[17px] font-semibold text-[#1a1c1c] pt-2">
                    2. Obligaciones y Cláusulas Principales
                  </h2>
                  <p>
                    La parte receptora mantendrá toda la información en estricta reserva y conformidad
                    con los estándares de seguridad establecidos.
                  </p>
                  <p>
                    Se restringirá cuidadosamente el acceso a los datos únicamente a los usuarios
                    autorizados y designados.
                  </p>

                  <h2 className="text-[17px] font-semibold text-[#1a1c1c] pt-2">
                    3. Periodos de Validez y Cierre
                  </h2>
                  <p>
                    Las disposiciones contenidas en esta sección mantendrán su vigencia durante todo
                    el ciclo de vida del presente documento.
                  </p>
                </div>

                <div className="mt-auto pt-10 flex justify-between items-end border-t border-[#e4beb9]/40">
                  <div className="w-[280px]">
                    <p className="text-[11px] font-medium text-[#5b403d] mb-3 uppercase tracking-wider">
                      Parte Divulgadora
                    </p>
                    <div className="border-b border-[#1a1c1c] pb-1 mb-1.5 h-14 flex items-end">
                      <svg
                        viewBox="0 0 200 60"
                        className="h-10 text-[#0060a8] stroke-current fill-none stroke-[2] opacity-85"
                      >
                        <path d="M10 40 C 30 10, 40 50, 70 25 C 90 10, 110 45, 140 20 C 160 10, 180 35, 190 30 M50 35 Q 90 20 130 35" />
                      </svg>
                    </div>
                    <p className="text-[13px] font-medium text-[#1a1c1c]">Jane Doe, Dirección</p>
                  </div>

                  <div className="w-[280px]">
                    <p className="text-[11px] font-medium text-[#5b403d] mb-3 uppercase tracking-wider">
                      Parte Receptora
                    </p>
                    <div className="border-b border-[#1a1c1c] pb-1 mb-1.5 h-14 flex items-end justify-center">
                      <span className="text-[13px] text-[#5b403d]/70 italic">Firme o estampe aquí</span>
                    </div>
                    <p className="text-[13px] text-[#5b403d]">Representante Legal Autorizado</p>
                  </div>
                </div>
              </>
            )}

            {currentPage === 2 && (
              <div className="space-y-6">
                <header className="border-b border-[#e4beb9] pb-3 mb-2">
                  <h2 className="text-[20px] font-semibold text-[#1a1c1c]">
                    Sección 2: Disposiciones Específicas
                  </h2>
                  <p className="text-[13px] text-[#5b403d]">Página 2 de {totalPages}</p>
                </header>
                <div className="text-[14px] leading-relaxed text-[#1a1c1c] space-y-4">
                  <p>
                    4. Propiedad de los Derechos: Todos los derechos, títulos e intereses sobre cualquier
                    material divulgado continuarán perteneciendo a la Parte Divulgadora.
                  </p>
                  <div className="p-4 bg-[#f3f3f3] border border-[#e4beb9]/70 rounded-md font-mono text-[12px] text-[#5b403d]">
                    // Declaración de Cifrado y Cadena de Custodia:
                    <br />
                    SHA256: 8f4a2b91c3d4e5f67a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f
                  </div>
                  <p>
                    5. Jurisdicción y Ley Aplicable: El presente Acuerdo se regirá por la normativa aplicable.
                  </p>
                </div>
              </div>
            )}

            {currentPage >= 3 && (
              <div className="space-y-6">
                <header className="border-b border-[#e4beb9] pb-3 mb-2">
                  <h2 className="text-[20px] font-semibold text-[#1a1c1c]">
                    Sección {currentPage}: Resumen y Anexos
                  </h2>
                  <p className="text-[13px] text-[#5b403d]">Página {currentPage} de {totalPages}</p>
                </header>
                <div className="text-[14px] leading-relaxed text-[#1a1c1c] space-y-4">
                  <p>
                    Contenido y anexos correspondientes a la página {currentPage}. Utiliza las herramientas
                    de la barra lateral para firmar, dibujar o anotar notas de texto.
                  </p>
                  <div className="h-48 border-2 border-dashed border-[#e4beb9] rounded-lg flex items-center justify-center text-[#5b403d] text-[13px]">
                    Espacio reservado para firmas electrónicas y sellos
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {/* ============================================================ */}
        {/* OVERLAYS: HIGHLIGHTS, DRAWINGS, IMAGES, TEXT ANNOTATIONS     */}
        {/* ============================================================ */}

        {/* 1. SAVED HIGHLIGHT RECTANGLES */}
        {highlights
          .filter((h) => h.pageNumber === currentPage)
          .map((hl) => {
            const isActive = activeHighlightId === hl.id;
            return (
              <div
                key={hl.id}
                onClick={(e) => {
                  e.stopPropagation();
                  if (selectedTool === 'eraser') {
                    onRemoveHighlight(hl.id);
                  } else {
                    setActiveHighlightId(isActive ? null : hl.id);
                  }
                }}
                style={{
                  left: `${hl.rect.x * zoom}px`,
                  top: `${hl.rect.y * zoom}px`,
                  width: `${hl.rect.width * zoom}px`,
                  height: `${hl.rect.height * zoom}px`,
                  backgroundColor: hl.color + '66',
                }}
                className={`absolute z-10 rounded-xs mix-blend-multiply transition-all cursor-pointer ${
                  selectedTool === 'eraser'
                    ? 'hover:ring-2 hover:ring-red-500 hover:opacity-50'
                    : isActive
                    ? 'ring-2 ring-[#b7131a]'
                    : 'hover:brightness-95'
                }`}
              >
                {/* Floating contextual controls for selected highlight */}
                {isActive && selectedTool !== 'eraser' && (
                  <div
                    onClick={(e) => e.stopPropagation()}
                    className="absolute -top-[42px] left-0 bg-white border border-[#e4beb9] rounded-md shadow-lg px-2 py-1 flex items-center gap-1.5 z-40 whitespace-nowrap"
                  >
                    {/* Colors */}
                    <div className="flex items-center gap-1">
                      {['#fde047', '#4ade80', '#f472b6', '#38bdf8', '#f87171'].map((c) => (
                        <button
                          key={c}
                          onClick={() => onUpdateHighlight(hl.id, { color: c })}
                          style={{ backgroundColor: c }}
                          className="w-4 h-4 rounded-full border border-zinc-300"
                        />
                      ))}
                    </div>

                    <div className="w-px h-3 bg-zinc-300 mx-1"></div>

                    <button
                      onClick={() => onRemoveHighlight(hl.id)}
                      className="p-1 text-red-600 hover:bg-red-50 rounded"
                      title="Eliminar Resaltado"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                )}
              </div>
            );
          })}

        {/* 2. HIGHLIGHT DRAG PREVIEW */}
        {highlightPreviewStyle && (
          <div
            style={highlightPreviewStyle}
            className="absolute z-15 border border-dashed border-amber-500 pointer-events-none mix-blend-multiply"
          />
        )}

        {/* 3. FREEHAND DRAWINGS CANVAS LAYER */}
        <canvas
          ref={drawingCanvasRef}
          id="drawing-overlay-canvas"
          width={displayWidth}
          height={displayHeight}
          className={`absolute inset-0 z-20 pointer-events-none`}
        />

        {/* 4. IMAGE & SIGNATURE ANNOTATIONS */}
        {imageAnnotations
          .filter((img) => img.pageNumber === currentPage)
          .map((item) => {
            return (
              <div
                key={item.id}
                className="image-annotation-box absolute z-25 group select-none"
                style={{
                  left: `${item.x * zoom}px`,
                  top: `${item.y * zoom}px`,
                  width: `${item.width * zoom}px`,
                  height: `${item.height * zoom}px`,
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  if (selectedTool === 'eraser') {
                    onDeleteImageAnnotation(item.id);
                  }
                }}
              >
                <div
                  className={`w-full h-full relative border ${
                    selectedTool === 'eraser'
                      ? 'border-transparent hover:border-red-500 hover:bg-red-500/10'
                      : 'border-dashed border-transparent group-hover:border-[#b7131a]/80'
                  }`}
                >
                  <img
                    src={item.dataUrl}
                    alt="Firma / Imagen"
                    className="w-full h-full object-contain pointer-events-none"
                    draggable={false}
                  />

                  {/* Drag Handle (top-left) */}
                  <div
                    onMouseDown={(e) => {
                      e.stopPropagation();
                      const { x, y } = getDocCoordinates(e);
                      setDraggedItem({
                        type: 'image',
                        id: item.id,
                        offsetX: x - item.x,
                        offsetY: y - item.y,
                      });
                    }}
                    className="absolute -top-3 -left-3 w-6 h-6 bg-[#b7131a] text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 cursor-move shadow-md transition-opacity"
                    title="Arrastrar para mover"
                  >
                    <Move size={12} />
                  </div>

                  {/* Delete Button (top-right) */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteImageAnnotation(item.id);
                    }}
                    className="absolute -top-3 -right-3 w-6 h-6 bg-red-600 hover:bg-red-700 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 cursor-pointer shadow-md transition-opacity"
                    title="Eliminar"
                  >
                    <Trash2 size={12} />
                  </button>

                  {/* Resize Handle (bottom-right) */}
                  <div
                    onMouseDown={(e) => {
                      e.stopPropagation();
                      const { x, y } = getDocCoordinates(e);
                      setResizingImage({
                        id: item.id,
                        startX: x,
                        startY: y,
                        startW: item.width,
                        startH: item.height,
                      });
                    }}
                    className="absolute -bottom-2 -right-2 w-5 h-5 bg-[#0060a8] text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 cursor-nwse-resize shadow-md transition-opacity"
                    title="Redimensionar"
                  >
                    <Maximize2 size={10} />
                  </div>
                </div>
              </div>
            );
          })}

        {/* 5. TEXT ANNOTATIONS (DIRECT INLINE WRITING ON PDF) */}
        {textAnnotations
          .filter((t) => t.pageNumber === currentPage)
          .map((anno) => (
            <InlineTextItem
              key={anno.id}
              anno={anno}
              isEditing={editingTextId === anno.id}
              zoom={zoom}
              selectedTool={selectedTool}
              onStartEditing={() => {
                setEditingTextId(anno.id);
                setEditingTextValue(anno.text);
              }}
              onCommit={(text, fontSize, color) => {
                onUpdateTextAnnotation(anno.id, text, fontSize, color);
                setEditingTextId(null);
              }}
              onDelete={() => {
                onDeleteTextAnnotation(anno.id);
                if (editingTextId === anno.id) setEditingTextId(null);
              }}
              onStartDrag={(e) => {
                e.stopPropagation();
                const { x, y } = getDocCoordinates(e);
                setDraggedItem({
                  type: 'text',
                  id: anno.id,
                  offsetX: x - anno.x,
                  offsetY: y - anno.y,
                });
              }}
            />
          ))}
      </div>
    </main>
  );
};
