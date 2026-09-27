import * as pdfjsLib from 'pdfjs-dist';

// Configure worker using CDN or bundled worker
if (typeof window !== 'undefined') {
  const version = pdfjsLib.version || '4.10.38';
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${version}/build/pdf.worker.min.mjs`;
}

// In-memory cache for loaded PDF documents to avoid re-parsing on page navigation
let cachedDoc: { bytes: Uint8Array; doc: any } | null = null;

export async function getPdfJsDocument(bytes: Uint8Array): Promise<any> {
  if (cachedDoc && cachedDoc.bytes === bytes) {
    return cachedDoc.doc;
  }

  try {
    // Clone bytes buffer to prevent detached buffer issues
    const data = new Uint8Array(bytes.slice(0));
    const loadingTask = pdfjsLib.getDocument({
      data,
      cMapUrl: 'https://unpkg.com/pdfjs-dist@' + (pdfjsLib.version || '4.10.38') + '/cmaps/',
      cMapPacked: true,
      standardFontDataUrl: 'https://unpkg.com/pdfjs-dist@' + (pdfjsLib.version || '4.10.38') + '/standard_fonts/',
    });

    const doc = await loadingTask.promise;
    cachedDoc = { bytes, doc };
    return doc;
  } catch (error) {
    console.error('Error in getPdfJsDocument:', error);
    throw error;
  }
}

export async function renderPdfPage(
  pdfDoc: any,
  pageNumber: number,
  canvas: HTMLCanvasElement,
  targetWidth = 800,
  rotation = 0
): Promise<{ width: number; height: number }> {
  try {
    const page = await pdfDoc.getPage(pageNumber);
    const unscaledViewport = page.getViewport({ scale: 1, rotation });
    
    // Calculate scale to fit targetWidth (default 800px)
    const scale = targetWidth / unscaledViewport.width;
    const viewport = page.getViewport({ scale, rotation });

    // Handle high DPI displays
    const pixelRatio = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
    canvas.width = viewport.width * pixelRatio;
    canvas.height = viewport.height * pixelRatio;
    canvas.style.width = `${viewport.width}px`;
    canvas.style.height = `${viewport.height}px`;

    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) throw new Error('Could not get 2D canvas context');

    ctx.save();
    ctx.scale(pixelRatio, pixelRatio);

    // Fill white background before rendering PDF
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, viewport.width, viewport.height);

    const renderContext = {
      canvasContext: ctx,
      viewport: viewport,
    };

    await page.render(renderContext).promise;
    ctx.restore();

    return { width: viewport.width, height: viewport.height };
  } catch (error) {
    console.error(`Error rendering page ${pageNumber}:`, error);
    throw error;
  }
}

export async function generateThumbnailDataUrl(
  pdfDoc: any,
  pageNumber: number,
  targetWidth = 180
): Promise<string> {
  try {
    const page = await pdfDoc.getPage(pageNumber);
    const unscaledViewport = page.getViewport({ scale: 1 });
    const scale = targetWidth / unscaledViewport.width;
    const viewport = page.getViewport({ scale });

    const canvas = document.createElement('canvas');
    canvas.width = viewport.width;
    canvas.height = viewport.height;

    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return '';

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, viewport.width, viewport.height);

    await page.render({
      canvasContext: ctx,
      viewport,
    }).promise;

    return canvas.toDataURL('image/jpeg', 0.8);
  } catch (err) {
    console.warn(`Thumbnail generation failed for page ${pageNumber}:`, err);
    return '';
  }
}
