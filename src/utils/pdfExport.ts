import { PDFDocument, rgb, degrees, StandardFonts, LineCapStyle } from 'pdf-lib';
import {
  LoadedDocument,
  PageThumbnail,
  TextAnnotation,
  DrawingPath,
  AnnotationHighlight,
  ImageAnnotation,
} from '../types';

/**
 * Parses a hex color string (#rrggbb or #rgb) to pdf-lib rgb(r, g, b) object (0..1)
 */
function hexToRgbColor(hex: string) {
  let cleanHex = hex.replace('#', '').trim();
  if (cleanHex.length === 3) {
    cleanHex = cleanHex
      .split('')
      .map((c) => c + c)
      .join('');
  }
  const r = parseInt(cleanHex.substring(0, 2) || '0', 16) / 255;
  const g = parseInt(cleanHex.substring(2, 4) || '0', 16) / 255;
  const b = parseInt(cleanHex.substring(4, 6) || '0', 16) / 255;
  return rgb(isNaN(r) ? 0 : r, isNaN(g) ? 0 : g, isNaN(b) ? 0 : b);
}

/**
 * Converts a data URL (PNG or JPEG) to Uint8Array bytes
 */
function dataUrlToBytes(dataUrl: string): { bytes: Uint8Array; format: 'png' | 'jpg' } {
  const isPng = dataUrl.startsWith('data:image/png');
  const base64Data = dataUrl.split(',')[1] || dataUrl;
  const binaryString = atob(base64Data);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return { bytes, format: isPng ? 'png' : 'jpg' };
}

/**
 * Converts canvas image or SVG data to PNG bytes if format is unknown
 */
async function ensurePngBytes(dataUrl: string): Promise<Uint8Array> {
  if (dataUrl.startsWith('data:image/png')) {
    return dataUrlToBytes(dataUrl).bytes;
  }
  // Convert any image format to PNG via HTMLCanvasElement
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth || 200;
      canvas.height = img.naturalHeight || 90;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(dataUrlToBytes(dataUrl).bytes);
        return;
      }
      ctx.drawImage(img, 0, 0);
      const pngUrl = canvas.toDataURL('image/png');
      resolve(dataUrlToBytes(pngUrl).bytes);
    };
    img.onerror = () => {
      resolve(dataUrlToBytes(dataUrl).bytes);
    };
    img.src = dataUrl;
  });
}

export interface ExportPdfOptions {
  loadedDocument: LoadedDocument | null;
  thumbnails: PageThumbnail[];
  textAnnotations: TextAnnotation[];
  drawings: DrawingPath[];
  highlights: AnnotationHighlight[];
  imageAnnotations: ImageAnnotation[];
  referenceWidth?: number; // Base width used on canvas (default 800)
}

/**
 * Compiles and bakes all annotations, drawings, text, images, and page transformations
 * directly into the PDF bytes for permanent export.
 */
export async function exportPdfWithAnnotations(options: ExportPdfOptions): Promise<Uint8Array> {
  const {
    loadedDocument,
    thumbnails,
    textAnnotations,
    drawings,
    highlights,
    imageAnnotations,
    referenceWidth = 800,
  } = options;

  let pdfDoc: PDFDocument;

  if (loadedDocument?.fileBytes && loadedDocument.fileBytes.length > 0) {
    const originalDoc = await PDFDocument.load(loadedDocument.fileBytes, { ignoreEncryption: true });
    
    // If pages were deleted or reordered, create new document and copy selected pages
    const hasModifications =
      thumbnails.length !== originalDoc.getPageCount() ||
      thumbnails.some((t, idx) => t.pageNumber !== idx + 1 || t.rotation !== 0);

    if (hasModifications) {
      pdfDoc = await PDFDocument.create();
      const pageIndices = thumbnails
        .map((t) => t.pageNumber - 1)
        .filter((idx) => idx >= 0 && idx < originalDoc.getPageCount());

      const copiedPages = await pdfDoc.copyPages(originalDoc, pageIndices);
      copiedPages.forEach((page, i) => {
        const thumb = thumbnails[i];
        if (thumb && thumb.rotation) {
          const currentRot = page.getRotation().angle;
          page.setRotation(degrees((currentRot + thumb.rotation) % 360));
        }
        pdfDoc.addPage(page);
      });
    } else {
      pdfDoc = originalDoc;
    }
  } else {
    // Generate fallback template document
    pdfDoc = await PDFDocument.create();
    const fontTitle = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const fontBody = await pdfDoc.embedFont(StandardFonts.Helvetica);

    for (let i = 0; i < thumbnails.length; i++) {
      const page = pdfDoc.addPage([595, 842]);
      const thumb = thumbnails[i];
      if (thumb?.rotation) {
        page.setRotation(degrees(thumb.rotation));
      }

      if (i === 0) {
        page.drawText('Documento PDF - PDF Professional', {
          x: 50,
          y: 790,
          size: 18,
          font: fontTitle,
          color: rgb(0.1, 0.1, 0.1),
        });
        page.drawText(
          `Archivo: ${loadedDocument?.name || 'documento.pdf'} • Procesado y firmado digitalmente.`,
          {
            x: 50,
            y: 765,
            size: 10,
            font: fontBody,
            color: rgb(0.35, 0.35, 0.35),
          }
        );
      } else {
        page.drawText(`Página ${i + 1} de ${thumbnails.length}`, {
          x: 50,
          y: 800,
          size: 12,
          font: fontTitle,
          color: rgb(0.2, 0.2, 0.2),
        });
      }
    }
  }

  // Embed Helvetica font for text annotations
  const standardFont = await pdfDoc.embedFont(StandardFonts.Helvetica);

  const totalPages = pdfDoc.getPageCount();

  // Iterate over each page and apply annotations mapped to that page index
  for (let pageIdx = 0; pageIdx < totalPages; pageIdx++) {
    const pageNumber = pageIdx + 1;
    const page = pdfDoc.getPage(pageIdx);
    const { width: pdfWidth, height: pdfHeight } = page.getSize();

    // The scale factor mapping screen coordinate space (referenceWidth) to PDF points
    const scale = pdfWidth / referenceWidth;

    // 1. HIGHLIGHTS (Translucent Rectangles)
    const pageHighlights = highlights.filter((h) => h.pageNumber === pageNumber);
    for (const hl of pageHighlights) {
      try {
        const xPdf = hl.rect.x * scale;
        const wPdf = hl.rect.width * scale;
        const hPdf = hl.rect.height * scale;
        // In PDF coords, origin (0, 0) is bottom-left
        const yPdf = pdfHeight - (hl.rect.y + hl.rect.height) * scale;
        const color = hexToRgbColor(hl.color);

        page.drawRectangle({
          x: xPdf,
          y: yPdf,
          width: wPdf,
          height: hPdf,
          color: color,
          opacity: 0.35,
        });
      } catch (err) {
        console.warn('Error baking highlight:', err);
      }
    }

    // 2. FREEHAND DRAWINGS (Vector line segments)
    const pageDrawings = drawings.filter((d) => d.pageNumber === pageNumber);
    for (const draw of pageDrawings) {
      if (!draw.points || draw.points.length < 2) continue;
      const color = hexToRgbColor(draw.color);
      const thickness = Math.max(1, (draw.strokeWidth || 2.5) * scale);

      for (let i = 0; i < draw.points.length - 1; i++) {
        const p1 = draw.points[i];
        const p2 = draw.points[i + 1];

        const x1 = p1.x * scale;
        const y1 = pdfHeight - p1.y * scale;
        const x2 = p2.x * scale;
        const y2 = pdfHeight - p2.y * scale;

        page.drawLine({
          start: { x: x1, y: y1 },
          end: { x: x2, y: y2 },
          thickness: thickness,
          color: color,
          lineCap: LineCapStyle.Round,
        });
      }
    }

    // 3. TEXT ANNOTATIONS
    const pageTexts = textAnnotations.filter(
      (t) => t.pageNumber === pageNumber && t.text && t.text.trim().length > 0
    );
    for (const item of pageTexts) {
      try {
        const fontSizePdf = Math.max(8, (item.fontSize || 16) * scale);
        const color = hexToRgbColor(item.color || '#1a1c1c');

        const lines = item.text.split('\n');
        const lineHeight = fontSizePdf * 1.25;

        // Calculate baseline Y
        // Screen item.y is top of first line bounding box.
        // PDF drawText Y is the baseline of the first line.
        let currentY = pdfHeight - (item.y * scale) - fontSizePdf * 0.85;

        for (const line of lines) {
          if (line.trim().length > 0) {
            page.drawText(line, {
              x: item.x * scale,
              y: currentY,
              size: fontSizePdf,
              font: standardFont,
              color: color,
            });
          }
          currentY -= lineHeight;
        }
      } catch (err) {
        console.warn('Error baking text annotation:', err);
      }
    }

    // 4. SIGNATURES AND IMAGES
    const pageImages = imageAnnotations.filter((img) => img.pageNumber === pageNumber);
    for (const imgAnno of pageImages) {
      try {
        const xPdf = imgAnno.x * scale;
        const wPdf = imgAnno.width * scale;
        const hPdf = imgAnno.height * scale;
        const yPdf = pdfHeight - (imgAnno.y + imgAnno.height) * scale;

        let embeddedImage;
        if (imgAnno.dataUrl.startsWith('data:image/jpeg') || imgAnno.dataUrl.startsWith('data:image/jpg')) {
          const { bytes } = dataUrlToBytes(imgAnno.dataUrl);
          embeddedImage = await pdfDoc.embedJpg(bytes);
        } else {
          const pngBytes = await ensurePngBytes(imgAnno.dataUrl);
          embeddedImage = await pdfDoc.embedPng(pngBytes);
        }

        page.drawImage(embeddedImage, {
          x: xPdf,
          y: yPdf,
          width: wPdf,
          height: hPdf,
        });
      } catch (err) {
        console.warn('Error baking image/signature annotation:', err);
      }
    }
  }

  return await pdfDoc.save();
}

/**
 * Triggers a browser download of a PDF Uint8Array buffer
 */
export function downloadPdfBlob(pdfBytes: Uint8Array, fileName: string) {
  const blob = new Blob([pdfBytes], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName.toLowerCase().endsWith('.pdf') ? fileName : `${fileName}.pdf`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
