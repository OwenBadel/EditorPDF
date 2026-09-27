# PDF Professional - Heavy Operations REST API (FastAPI)

## 📌 Arquitectura y Principios de Diseño
Este microservicio fue diseñado por un Senior Backend Engineer siguiendo estrictos principios de:
1. **Stateless (Sin Estado)**: Ninguna sesión o archivo se persiste a largo plazo en el servidor. El flujo es: `Upload -> In-Memory/Temp Scratchpad -> Process -> Stream Response -> Background Cleanup`.
2. **Prevención de Saturación de Disco**: Uso de `tempfile` en `/tmp` con `fastapi.BackgroundTasks` que elimina de forma determinista todos los archivos intermedios y finales inmediatamente después de entregarlos al cliente HTTP.
3. **Validación de Seguridad**: Doble validación de archivos (Content-Type `application/pdf` + Inspección de Magic Bytes `%PDF-`) y middleware con rechazo `413 Request Entity Too Large` para cargas mayores a 20MB.
4. **Alto Rendimiento**: Integración con **PyMuPDF (fitz)** compilado en C y **Ghostscript** para compresión agresiva y manipulación vectorial a velocidades de milisegundos.

---

## 🚀 Endpoints Principales

### 1. `POST /api/pdf/merge`
Une múltiples archivos PDF en un único documento preservando vectores y enlaces.
```bash
curl -X POST "http://localhost:8000/api/pdf/merge" \
  -H "accept: application/pdf" \
  -H "Content-Type: multipart/form-data" \
  -F "files=@contrato_parte1.pdf;type=application/pdf" \
  -F "files=@contrato_parte2.pdf;type=application/pdf" \
  --output doc_unido.pdf
```

### 2. `POST /api/pdf/split`
Extrae rangos específicos o divide en un ZIP.
- `page_ranges`: ej. `"1-3, 5, 8-10"`
- `mode`: `"single"` (un PDF consolidado) o `"zip"` (un PDF individual por cada página).
```bash
curl -X POST "http://localhost:8000/api/pdf/split" \
  -F "file=@manual_completo.pdf" \
  -F "page_ranges=1-3, 5" \
  -F "mode=zip" \
  --output paginas_extraidas.zip
```

### 3. `POST /api/pdf/compress`
Reduce el peso optimizando streams y purgando metadatos obsoletos.
Headers de respuesta retornados:
- `X-Original-Size`: Tamaño antes de compresión (bytes)
- `X-Compressed-Size`: Tamaño optimizado (bytes)
- `X-Reduction-Percentage`: Porcentaje de ahorro (ej. `68%`)
```bash
curl -X POST "http://localhost:8000/api/pdf/compress" \
  -F "file=@documento_pesado.pdf" \
  -F "quality=medium" \
  -F "strip_metadata=true" \
  --output documento_optimizado.pdf
```

### 4. `POST /api/pdf/to-image`
Convierte páginas a PNG o JPG con control de DPI (72, 150, 300 DPI).
```bash
curl -X POST "http://localhost:8000/api/pdf/to-image" \
  -F "file=@plano_arquitectura.pdf" \
  -F "page_number=1" \
  -F "format=png" \
  -F "dpi=300" \
  --output pagina_1_hd.png
```

### 5. `POST /api/pdf/ocr`
Reconocimiento óptico de caracteres multilingüe vía Tesseract OCR.
```bash
curl -X POST "http://localhost:8000/api/pdf/ocr" \
  -F "file=@factura_escaneada.pdf" \
  -F "language=spa+eng"
```
