export type ToolType = 'select' | 'text' | 'draw' | 'image' | 'eraser' | 'highlight';

export type ActiveTab = 'editor' | 'upload' | 'operations';

export interface PageThumbnail {
  pageNumber: number;
  rotation: number;
  thumbnailUrl?: string;
  linesCount: number;
}

export interface AnnotationHighlight {
  id: string;
  pageNumber: number;
  rect: { x: number; y: number; width: number; height: number };
  text: string;
  color: string;
  comment?: string;
}

export interface DrawingPath {
  id: string;
  pageNumber: number;
  points: { x: number; y: number }[];
  color: string;
  strokeWidth: number;
}

export interface TextAnnotation {
  id: string;
  pageNumber: number;
  x: number;
  y: number;
  text: string;
  fontSize: number;
  color: string;
}

export interface ImageAnnotation {
  id: string;
  pageNumber: number;
  x: number;
  y: number;
  width: number;
  height: number;
  dataUrl: string;
  type: 'image' | 'signature';
}

export interface LoadedDocument {
  name: string;
  size: number;
  totalPages: number;
  fileBytes?: Uint8Array;
  fileBlob?: Blob;
}

export interface ApiTestResult {
  endpoint: string;
  status: number;
  timeMs: number;
  headers: Record<string, string>;
  dataSummary?: string;
  downloadUrl?: string;
  downloadName?: string;
  jsonResult?: any;
  error?: string;
}
