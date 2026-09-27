"""
PDF REST API Router with Pydantic & FastAPI Endpoints
"""

from typing import List, Optional
from fastapi import APIRouter, UploadFile, File, Form, HTTPException, BackgroundTasks, status
from fastapi.responses import FileResponse, JSONResponse
from pydantic import BaseModel, Field

from services.pdf_engine import (
    validate_pdf_mime,
    merge_pdf_documents,
    split_pdf_document,
    compress_pdf_document,
    convert_pdf_to_images,
    extract_ocr_from_pdf,
    cleanup_temp_files
)

router = APIRouter()

@router.post("/merge", summary="Unir múltiples archivos PDF")
async def merge_pdfs(
    background_tasks: BackgroundTasks,
    files: List[UploadFile] = File(..., description="Array de archivos PDF para unir en secuencia")
):
    """
    Recibe un array de archivos PDF y genera un único PDF consolidado.
    - **Validación**: Verifica tipo MIME application/pdf en cada archivo.
    - **Memoria**: Procesa en directorio temporal con `tempfile` y limpia en BackgroundTasks.
    """
    if len(files) < 2:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Se requieren al menos 2 archivos PDF para realizar la unión."
        )

    for f in files:
        await validate_pdf_mime(f)

    merged_file_path, temp_inputs = await merge_pdf_documents(files)
    
    # Register immediate cleanup of all created temporary files
    background_tasks.add_task(cleanup_temp_files, temp_inputs + [merged_file_path])

    return FileResponse(
        path=merged_file_path,
        media_type="application/pdf",
        filename="merged_document.pdf",
        background=background_tasks
    )

@router.post("/split", summary="Dividir o extraer páginas de un PDF")
async def split_pdf(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(..., description="Archivo PDF fuente"),
    page_ranges: str = Form(..., example="1-3, 5", description="Rangos de páginas a extraer (ej: '1-3, 5')"),
    mode: str = Form("single", description="Modo: 'single' (un solo PDF extraído) o 'zip' (ZIP con archivos individuales)")
):
    """
    Extrae páginas especificadas de un PDF.
    - `mode='single'`: Devuelve un PDF que contiene únicamente las páginas solicitadas.
    - `mode='zip'`: Devuelve un archivo ZIP con un PDF por cada página seleccionada.
    """
    await validate_pdf_mime(file)

    output_path, temp_inputs, is_zip = await split_pdf_document(file, page_ranges, mode)
    
    background_tasks.add_task(cleanup_temp_files, temp_inputs + [output_path])

    media_type = "application/zip" if is_zip else "application/pdf"
    filename = "split_pages.zip" if is_zip else "extracted_pages.pdf"

    return FileResponse(
        path=output_path,
        media_type=media_type,
        filename=filename,
        background=background_tasks
    )

@router.post("/compress", summary="Comprimir y reducir tamaño de PDF")
async def compress_pdf(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(..., description="Archivo PDF a optimizar"),
    quality: str = Form("medium", description="Nivel de compresión: 'low', 'medium' o 'high'"),
    strip_metadata: bool = Form(True, description="Eliminar metadatos innecesarios para reducir peso")
):
    """
    Reduce el peso del archivo PDF:
    - Optimiza flujos de objetos y desinfla streams redundantes.
    - Opcionalmente remuestrea imágenes internas (Ghostscript / PyMuPDF Deflate).
    - Elimina metadatos y etiquetas obsoletas.
    """
    await validate_pdf_mime(file)

    compressed_path, original_size, compressed_size, temp_inputs = await compress_pdf_document(
        file, quality, strip_metadata
    )

    background_tasks.add_task(cleanup_temp_files, temp_inputs + [compressed_path])

    reduction_pct = round(((original_size - compressed_size) / original_size) * 100, 1) if original_size > 0 else 0

    headers = {
        "X-Original-Size": str(original_size),
        "X-Compressed-Size": str(compressed_size),
        "X-Reduction-Percentage": f"{reduction_pct}%"
    }

    return FileResponse(
        path=compressed_path,
        media_type="application/pdf",
        filename="compressed_document.pdf",
        headers=headers,
        background=background_tasks
    )

@router.post("/to-image", summary="Convertir páginas de PDF a imágenes JPG/PNG")
async def convert_to_image(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(..., description="Archivo PDF fuente"),
    page_number: str = Form("1", description="Número de página (ej. '1', '3') o 'all' para todas las páginas"),
    format: str = Form("png", description="Formato de imagen: 'png' o 'jpeg'"),
    dpi: int = Form(150, description="DPI de resolución (72, 150, 300)")
):
    """
    Convierte una página o todas las páginas de un PDF a imagen PNG/JPG de alta resolución.
    Ideal para previsualizaciones del frontend o generación de miniaturas.
    """
    await validate_pdf_mime(file)

    output_path, temp_inputs, is_zip = await convert_pdf_to_images(file, page_number, format, dpi)

    background_tasks.add_task(cleanup_temp_files, temp_inputs + [output_path])

    media_type = "application/zip" if is_zip else f"image/{format.lower()}"
    filename = f"pdf_images.zip" if is_zip else f"page_{page_number}.{format.lower()}"

    return FileResponse(
        path=output_path,
        media_type=media_type,
        filename=filename,
        background=background_tasks
    )

@router.post("/ocr", summary="Extraer texto mediante OCR (Tesseract)")
async def extract_ocr(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(..., description="Archivo PDF escaneado"),
    language: str = Form("spa+eng", description="Código de idioma Tesseract (ej. 'spa', 'eng', 'spa+eng')")
):
    """
    Aplica OCR sobre documentos PDF escaneados para extraer texto completo y metadatos por página.
    """
    await validate_pdf_mime(file)

    result, temp_inputs = await extract_ocr_from_pdf(file, language)
    background_tasks.add_task(cleanup_temp_files, temp_inputs)

    return JSONResponse(content=result)
