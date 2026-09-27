import React from 'react';
import {
  Combine,
  Scissors,
  FileArchive,
  FileImage,
  ScanText,
  FileUp,
  ArrowRight,
  ShieldCheck,
  Zap,
  RotateCw,
  Stamp,
  FileCode,
} from 'lucide-react';

interface OperationsViewProps {
  onOpenMerge: () => void;
  onOpenSplit: () => void;
  onOpenCompress: () => void;
  onOpenToImage: () => void;
  onOpenOcr: () => void;
  onOpenConvertToPdf: () => void;
}

export const OperationsView: React.FC<OperationsViewProps> = ({
  onOpenMerge,
  onOpenSplit,
  onOpenCompress,
  onOpenToImage,
  onOpenOcr,
  onOpenConvertToPdf,
}) => {
  const operations = [
    {
      id: 'convert-to-pdf',
      title: 'Convertir Imagen / Word a PDF',
      description:
        'Transforma imágenes (JPG, PNG, WebP) o documentos Word (.docx) en un archivo PDF listo para compartir.',
      icon: FileUp,
      action: onOpenConvertToPdf,
      btnText: 'Convertir a PDF',
      badge: 'Nuevo',
      accentColor: 'text-[#b7131a]',
      bgIcon: 'bg-[#b7131a]/10',
      btnColor: 'bg-[#b7131a] hover:bg-[#db322f] text-white',
    },
    {
      id: 'merge',
      title: 'Unir PDFs',
      description:
        'Combina dos o más documentos PDF en un solo archivo organizado en el orden que tú decidas.',
      icon: Combine,
      action: onOpenMerge,
      btnText: 'Unir archivos',
      badge: 'Más utilizado',
      accentColor: 'text-[#0060a8]',
      bgIcon: 'bg-[#0060a8]/10',
      btnColor: 'bg-[#0060a8] hover:bg-[#004e8a] text-white',
    },
    {
      id: 'split',
      title: 'Dividir PDF',
      description:
        'Extrae páginas concretas o separa tu documento en varios archivos individuales de manera rápida.',
      icon: Scissors,
      action: onOpenSplit,
      btnText: 'Dividir páginas',
      accentColor: 'text-[#0060a8]',
      bgIcon: 'bg-[#0060a8]/10',
      btnColor: 'bg-[#0060a8] hover:bg-[#004e8a] text-white',
    },
    {
      id: 'compress',
      title: 'Comprimir y Reducir Tamaño',
      description:
        'Reduce el peso de tu PDF para enviarlo fácilmente por correo o mensajería sin perder legibilidad.',
      icon: FileArchive,
      action: onOpenCompress,
      btnText: 'Comprimir PDF',
      badge: 'Ahorro de espacio',
      accentColor: 'text-[#b7131a]',
      bgIcon: 'bg-[#b7131a]/10',
      btnColor: 'bg-[#b7131a] hover:bg-[#db322f] text-white',
    },
    {
      id: 'to-image',
      title: 'Convertir a Imagen',
      description:
        'Transforma cualquier página de tu documento en imágenes de alta resolución en formato JPG o PNG.',
      icon: FileImage,
      action: onOpenToImage,
      btnText: 'Convertir a imagen',
      accentColor: 'text-[#0060a8]',
      bgIcon: 'bg-[#0060a8]/10',
      btnColor: 'bg-[#0060a8] hover:bg-[#004e8a] text-white',
    },
    {
      id: 'ocr',
      title: 'Extraer Texto de Documentos',
      description:
        'Detecta y convierte el texto de PDFs escaneados o imágenes para que puedas copiarlo y editarlo.',
      icon: ScanText,
      action: onOpenOcr,
      btnText: 'Extraer texto',
      badge: 'Reconocimiento visual',
      accentColor: 'text-emerald-700',
      bgIcon: 'bg-emerald-100 dark:bg-emerald-950/40',
      btnColor: 'bg-emerald-700 hover:bg-emerald-800 text-white',
    },
    {
      id: 'swagger-docs',
      title: 'API REST & Swagger Explorer',
      description:
        'Explora la documentación OpenAPI interactiva y prueba en vivo los microservicios REST para unir, comprimir, rotar y OCR.',
      icon: FileCode,
      action: () => window.open('/api/docs', '_blank'),
      btnText: 'Abrir Swagger UI',
      badge: 'Microservicios',
      accentColor: 'text-indigo-600 dark:text-indigo-400',
      bgIcon: 'bg-indigo-50 dark:bg-indigo-950/40',
      btnColor: 'bg-indigo-600 hover:bg-indigo-700 text-white',
    },
  ];

  return (
    <div id="operations-view" className="flex-1 bg-[#f9f9f9] dark:bg-[#121214] p-6 sm:p-10 overflow-y-auto min-h-[calc(100vh-48px)] select-none transition-colors">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Header Section */}
        <div className="text-center space-y-2 max-w-2xl mx-auto">
          <h1 className="text-[26px] font-semibold text-[#1a1c1c] dark:text-zinc-100 tracking-tight">
            Operaciones con tus Documentos
          </h1>
          <p className="text-[14px] text-[#5b403d] dark:text-zinc-400 leading-relaxed">
            Elige la herramienta que necesitas para modificar, organizar o transformar tus archivos PDF de forma rápida y sencilla.
          </p>
        </div>

        {/* Operations Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {operations.map((op) => {
            const Icon = op.icon;
            return (
              <div
                key={op.id}
                className="bg-white dark:bg-zinc-900 rounded-xl border border-[#e4beb9]/70 dark:border-zinc-800 shadow-xs hover:shadow-md transition-all duration-200 p-5 flex flex-col justify-between group relative"
              >
                {op.badge && (
                  <span className="absolute top-4 right-4 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#f3f3f3] dark:bg-zinc-800 text-[#5b403d] dark:text-zinc-300 border border-[#e4beb9]/60 dark:border-zinc-700">
                    {op.badge}
                  </span>
                )}

                <div className="space-y-3">
                  <div className={`w-11 h-11 rounded-xl ${op.bgIcon} dark:bg-zinc-800 ${op.accentColor} flex items-center justify-center transition-transform group-hover:scale-105 duration-200`}>
                    <Icon size={22} />
                  </div>

                  <div>
                    <h3 className="text-[16px] font-semibold text-[#1a1c1c] dark:text-zinc-100 group-hover:text-[#b7131a] dark:group-hover:text-red-400 transition-colors">
                      {op.title}
                    </h3>
                    <p className="text-[13px] text-[#5b403d] dark:text-zinc-400 mt-1.5 leading-relaxed">
                      {op.description}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={op.action}
                  className={`mt-5 w-full py-2 px-3 rounded-lg text-[13px] font-medium flex items-center justify-center gap-1.5 transition-all ${op.btnColor} shadow-xs active:scale-95`}
                >
                  <span>{op.btnText}</span>
                  <ArrowRight size={14} />
                </button>
              </div>
            );
          })}
        </div>

        {/* Security & Privacy Footer Banner */}
        <div className="bg-white dark:bg-zinc-900 rounded-xl p-5 border border-[#e4beb9]/70 dark:border-zinc-800 shadow-xs flex flex-col sm:flex-row items-center justify-around gap-4 text-center sm:text-left">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <ShieldCheck size={20} />
            </div>
            <div>
              <p className="text-[13px] font-semibold text-[#1a1c1c] dark:text-zinc-200">Privacidad Garantizada</p>
              <p className="text-[12px] text-[#5b403d] dark:text-zinc-400">Tus archivos se procesan de forma privada y no se almacenan.</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#b7131a]/10 dark:bg-red-950/60 text-[#b7131a] dark:text-red-400 flex items-center justify-center shrink-0">
              <Zap size={20} />
            </div>
            <div>
              <p className="text-[13px] font-semibold text-[#1a1c1c] dark:text-zinc-200">Resultados Inmediatos</p>
              <p className="text-[12px] text-[#5b403d] dark:text-zinc-400">Descarga tus documentos optimizados al instante.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
