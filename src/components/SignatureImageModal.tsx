import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  PenTool,
  Upload,
  Type,
  RotateCcw,
  Check,
  Stamp,
  Image as ImageIcon,
} from 'lucide-react';

interface SignatureImageModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInsert: (dataUrl: string, type: 'signature' | 'image', defaultWidth?: number, defaultHeight?: number) => void;
}

export const SignatureImageModal: React.FC<SignatureImageModalProps> = ({
  isOpen,
  onClose,
  onInsert,
}) => {
  const [activeTab, setActiveTab] = useState<'draw' | 'type' | 'upload' | 'stamps'>('draw');
  const [inkColor, setInkColor] = useState<string>('#0052cc');
  const [typedName, setTypedName] = useState<string>('');
  const [selectedFont, setSelectedFont] = useState<'cursive1' | 'cursive2' | 'formal'>('cursive1');
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);

  // Initialize and clear canvas when modal opens or tab changes
  useEffect(() => {
    if (isOpen && activeTab === 'draw') {
      const timer = setTimeout(() => {
        clearCanvas();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [isOpen, activeTab]);

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasDrawn(false);
  };

  const getCoordinates = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    if ('touches' in e) {
      const touch = e.touches[0];
      return {
        x: (touch.clientX - rect.left) * scaleX,
        y: (touch.clientY - rect.top) * scaleY,
      };
    } else {
      return {
        x: (e.clientX - rect.left) * scaleX,
        y: (e.clientY - rect.top) * scaleY,
      };
    }
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { x, y } = getCoordinates(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.strokeStyle = inkColor;
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    setIsDrawing(true);
    setHasDrawn(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { x, y } = getCoordinates(e);
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const handleInsertDrawnSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas || !hasDrawn) return;
    const dataUrl = canvas.toDataURL('image/png');
    onInsert(dataUrl, 'signature', 180, 80);
    onClose();
  };

  const handleInsertTypedSignature = () => {
    if (!typedName.trim()) return;
    const canvas = document.createElement('canvas');
    canvas.width = 400;
    canvas.height = 160;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = inkColor;

    let fontStyle = 'italic 48px "Brush Script MT", cursive, sans-serif';
    if (selectedFont === 'cursive2') {
      fontStyle = 'italic 44px "Lucida Handwriting", "Apple Chancery", cursive';
    } else if (selectedFont === 'formal') {
      fontStyle = 'bold 38px "Times New Roman", serif';
    }

    ctx.font = fontStyle;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(typedName.trim(), canvas.width / 2, canvas.height / 2);

    const dataUrl = canvas.toDataURL('image/png');
    onInsert(dataUrl, 'signature', 180, 75);
    onClose();
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      setPreviewImage(dataUrl);
    };
    reader.readAsDataURL(file);
  };

  const handleInsertUploadedImage = () => {
    if (!previewImage) return;
    onInsert(previewImage, 'image', 180, 140);
    onClose();
  };

  const handleInsertStamp = (text: string, color: string) => {
    const canvas = document.createElement('canvas');
    canvas.width = 300;
    canvas.height = 120;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Draw stamp border and text
    ctx.strokeStyle = color;
    ctx.lineWidth = 6;
    ctx.strokeRect(10, 10, 280, 100);

    ctx.lineWidth = 2;
    ctx.strokeRect(16, 16, 268, 88);

    ctx.fillStyle = color;
    ctx.font = '900 32px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, 150, 60);

    const dataUrl = canvas.toDataURL('image/png');
    onInsert(dataUrl, 'image', 160, 65);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white dark:bg-zinc-900 border border-[#e4beb9] dark:border-zinc-800 rounded-xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-5 py-4 border-b border-[#e4beb9]/70 dark:border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#b7131a]/10 dark:bg-red-950/50 text-[#b7131a] dark:text-red-400 flex items-center justify-center">
              <PenTool size={18} />
            </div>
            <div>
              <h2 className="text-[16px] font-semibold text-[#1a1c1c] dark:text-zinc-100">
                Insertar Firma o Imagen
              </h2>
              <p className="text-[12px] text-[#5b403d] dark:text-zinc-400">
                Agrega tu firma manuscrita, sello o logotipo al documento
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-[#5b403d] dark:text-zinc-400 hover:bg-[#f3f3f3] dark:hover:bg-zinc-800 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-[#e4beb9]/60 dark:border-zinc-800 bg-[#f9f9f9] dark:bg-zinc-950 px-3 pt-2 gap-1">
          <button
            onClick={() => setActiveTab('draw')}
            className={`px-3 py-2 text-[13px] font-medium rounded-t-md flex items-center gap-1.5 transition-all ${
              activeTab === 'draw'
                ? 'bg-white dark:bg-zinc-900 text-[#b7131a] dark:text-red-400 border-t-2 border-[#b7131a] dark:border-red-500 shadow-xs'
                : 'text-[#5b403d] dark:text-zinc-400 hover:text-[#1a1c1c] dark:hover:text-zinc-200'
            }`}
          >
            <PenTool size={14} />
            <span>Dibujar Firma</span>
          </button>

          <button
            onClick={() => setActiveTab('type')}
            className={`px-3 py-2 text-[13px] font-medium rounded-t-md flex items-center gap-1.5 transition-all ${
              activeTab === 'type'
                ? 'bg-white dark:bg-zinc-900 text-[#b7131a] dark:text-red-400 border-t-2 border-[#b7131a] dark:border-red-500 shadow-xs'
                : 'text-[#5b403d] dark:text-zinc-400 hover:text-[#1a1c1c] dark:hover:text-zinc-200'
            }`}
          >
            <Type size={14} />
            <span>Escribir Nombre</span>
          </button>

          <button
            onClick={() => setActiveTab('upload')}
            className={`px-3 py-2 text-[13px] font-medium rounded-t-md flex items-center gap-1.5 transition-all ${
              activeTab === 'upload'
                ? 'bg-white dark:bg-zinc-900 text-[#b7131a] dark:text-red-400 border-t-2 border-[#b7131a] dark:border-red-500 shadow-xs'
                : 'text-[#5b403d] dark:text-zinc-400 hover:text-[#1a1c1c] dark:hover:text-zinc-200'
            }`}
          >
            <Upload size={14} />
            <span>Subir Imagen</span>
          </button>

          <button
            onClick={() => setActiveTab('stamps')}
            className={`px-3 py-2 text-[13px] font-medium rounded-t-md flex items-center gap-1.5 transition-all ${
              activeTab === 'stamps'
                ? 'bg-white dark:bg-zinc-900 text-[#b7131a] dark:text-red-400 border-t-2 border-[#b7131a] dark:border-red-500 shadow-xs'
                : 'text-[#5b403d] dark:text-zinc-400 hover:text-[#1a1c1c] dark:hover:text-zinc-200'
            }`}
          >
            <Stamp size={14} />
            <span>Sellos</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 space-y-4">
          {/* TAB 1: DRAW SIGNATURE */}
          {activeTab === 'draw' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-[12px] text-[#5b403d] dark:text-zinc-400">
                <span>Dibuja tu firma en el recuadro blanco:</span>
                <div className="flex items-center gap-2">
                  <span>Tinta:</span>
                  <button
                    onClick={() => setInkColor('#0052cc')}
                    className={`w-5 h-5 rounded-full bg-[#0052cc] border ${
                      inkColor === '#0052cc' ? 'ring-2 ring-blue-400' : ''
                    }`}
                  />
                  <button
                    onClick={() => setInkColor('#111827')}
                    className={`w-5 h-5 rounded-full bg-[#111827] border ${
                      inkColor === '#111827' ? 'ring-2 ring-zinc-400' : ''
                    }`}
                  />
                  <button
                    onClick={() => setInkColor('#b7131a')}
                    className={`w-5 h-5 rounded-full bg-[#b7131a] border ${
                      inkColor === '#b7131a' ? 'ring-2 ring-red-400' : ''
                    }`}
                  />
                </div>
              </div>

              <div className="relative border-2 border-dashed border-[#e4beb9] dark:border-zinc-700 rounded-lg overflow-hidden bg-white shadow-inner">
                <canvas
                  ref={canvasRef}
                  width={460}
                  height={180}
                  onMouseDown={startDrawing}
                  onMouseMove={draw}
                  onMouseUp={stopDrawing}
                  onMouseLeave={stopDrawing}
                  onTouchStart={startDrawing}
                  onTouchMove={draw}
                  onTouchEnd={stopDrawing}
                  className="cursor-crosshair w-full h-[180px] touch-none block"
                />

                {!hasDrawn && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-zinc-400 text-[13px] italic">
                    Firma con el ratón o el dedo aquí
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between pt-1">
                <button
                  onClick={clearCanvas}
                  className="px-3 py-1.5 text-[12px] font-medium text-[#5b403d] dark:text-zinc-300 hover:bg-[#f3f3f3] dark:hover:bg-zinc-800 rounded-md border border-[#e4beb9] dark:border-zinc-700 flex items-center gap-1.5 transition-colors"
                >
                  <RotateCcw size={14} />
                  <span>Borrar y Reintentar</span>
                </button>

                <button
                  onClick={handleInsertDrawnSignature}
                  disabled={!hasDrawn}
                  className="px-4 py-2 bg-[#b7131a] hover:bg-[#a01017] disabled:opacity-40 text-white rounded-md text-[13px] font-medium flex items-center gap-1.5 transition-colors shadow-xs"
                >
                  <Check size={16} />
                  <span>Insertar en el Documento</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: TYPE SIGNATURE */}
          {activeTab === 'type' && (
            <div className="space-y-4">
              <div>
                <label className="block text-[12px] font-medium text-[#5b403d] dark:text-zinc-300 mb-1">
                  Ingresa tu Nombre y Apellido:
                </label>
                <input
                  type="text"
                  placeholder="Ej. Jane Doe"
                  value={typedName}
                  onChange={(e) => setTypedName(e.target.value)}
                  className="w-full px-3 py-2 border border-[#e4beb9] dark:border-zinc-700 rounded-md text-[14px] bg-white dark:bg-zinc-800 text-[#1a1c1c] dark:text-zinc-100 focus:outline-none focus:border-[#b7131a]"
                />
              </div>

              <div className="space-y-2">
                <span className="text-[12px] font-medium text-[#5b403d] dark:text-zinc-300">
                  Estilo de Caligrafía:
                </span>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => setSelectedFont('cursive1')}
                    className={`p-3 rounded-md border text-center transition-all bg-white dark:bg-zinc-800 ${
                      selectedFont === 'cursive1'
                        ? 'border-[#b7131a] ring-2 ring-red-400/20'
                        : 'border-[#e4beb9] dark:border-zinc-700'
                    }`}
                  >
                    <span className="text-[20px] italic font-serif" style={{ fontFamily: 'Brush Script MT, cursive' }}>
                      {typedName || 'Firma 1'}
                    </span>
                  </button>

                  <button
                    onClick={() => setSelectedFont('cursive2')}
                    className={`p-3 rounded-md border text-center transition-all bg-white dark:bg-zinc-800 ${
                      selectedFont === 'cursive2'
                        ? 'border-[#b7131a] ring-2 ring-red-400/20'
                        : 'border-[#e4beb9] dark:border-zinc-700'
                    }`}
                  >
                    <span className="text-[18px] italic" style={{ fontFamily: 'Lucida Handwriting, cursive' }}>
                      {typedName || 'Firma 2'}
                    </span>
                  </button>

                  <button
                    onClick={() => setSelectedFont('formal')}
                    className={`p-3 rounded-md border text-center transition-all bg-white dark:bg-zinc-800 ${
                      selectedFont === 'formal'
                        ? 'border-[#b7131a] ring-2 ring-red-400/20'
                        : 'border-[#e4beb9] dark:border-zinc-700'
                    }`}
                  >
                    <span className="text-[16px] font-bold font-serif">
                      {typedName || 'Firma 3'}
                    </span>
                  </button>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  onClick={handleInsertTypedSignature}
                  disabled={!typedName.trim()}
                  className="px-4 py-2 bg-[#b7131a] hover:bg-[#a01017] disabled:opacity-40 text-white rounded-md text-[13px] font-medium flex items-center gap-1.5 transition-colors shadow-xs"
                >
                  <Check size={16} />
                  <span>Insertar Firma</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: UPLOAD IMAGE */}
          {activeTab === 'upload' && (
            <div className="space-y-4">
              <label className="border-2 border-dashed border-[#e4beb9] dark:border-zinc-700 rounded-lg p-6 flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-[#b7131a] dark:hover:border-red-400 bg-[#fbfbfb] dark:bg-zinc-800/40 transition-colors">
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/svg+xml,image/webp"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <div className="w-12 h-12 rounded-full bg-[#b7131a]/10 dark:bg-red-950/50 text-[#b7131a] dark:text-red-400 flex items-center justify-center">
                  <ImageIcon size={24} />
                </div>
                <div className="text-center">
                  <p className="text-[13px] font-medium text-[#1a1c1c] dark:text-zinc-200">
                    Selecciona una imagen o logotipo (PNG, JPG, SVG)
                  </p>
                  <p className="text-[11px] text-[#5b403d] dark:text-zinc-400">
                    Recomendado: imágenes con fondo transparente para firmas o sellos
                  </p>
                </div>
              </label>

              {previewImage && (
                <div className="p-3 border border-[#e4beb9] dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-850 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <img
                      src={previewImage}
                      alt="Vista previa"
                      className="w-16 h-12 object-contain bg-zinc-100 rounded border border-zinc-300"
                    />
                    <span className="text-[13px] font-medium text-[#1a1c1c] dark:text-zinc-200">
                      Imagen lista para insertar
                    </span>
                  </div>

                  <button
                    onClick={handleInsertUploadedImage}
                    className="px-3 py-1.5 bg-[#b7131a] hover:bg-[#a01017] text-white rounded-md text-[12px] font-medium flex items-center gap-1.5"
                  >
                    <Check size={14} />
                    <span>Insertar</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: PRESET STAMPS */}
          {activeTab === 'stamps' && (
            <div className="space-y-3">
              <p className="text-[12px] text-[#5b403d] dark:text-zinc-400">
                Selecciona un sello prediseñado para estampar en la página:
              </p>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => handleInsertStamp('APROBADO', '#16a34a')}
                  className="p-3 border-2 border-green-600 rounded-lg bg-green-50/50 hover:bg-green-100 dark:bg-green-950/30 text-green-700 dark:text-green-400 font-black text-[16px] tracking-wider transition-all"
                >
                  ✓ APROBADO
                </button>

                <button
                  onClick={() => handleInsertStamp('CONFIDENCIAL', '#dc2626')}
                  className="p-3 border-2 border-red-600 rounded-lg bg-red-50/50 hover:bg-red-100 dark:bg-red-950/30 text-red-700 dark:text-red-400 font-black text-[16px] tracking-wider transition-all"
                >
                  🔒 CONFIDENCIAL
                </button>

                <button
                  onClick={() => handleInsertStamp('PAGADO', '#0284c7')}
                  className="p-3 border-2 border-sky-600 rounded-lg bg-sky-50/50 hover:bg-sky-100 dark:bg-sky-950/30 text-sky-700 dark:text-sky-400 font-black text-[16px] tracking-wider transition-all"
                >
                  💳 PAGADO
                </button>

                <button
                  onClick={() => handleInsertStamp('REVISADO', '#854d0e')}
                  className="p-3 border-2 border-amber-600 rounded-lg bg-amber-50/50 hover:bg-amber-100 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 font-black text-[16px] tracking-wider transition-all"
                >
                  ★ REVISADO
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
