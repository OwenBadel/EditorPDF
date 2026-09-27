"""
PDF Professional - High Performance Stateless REST API (FastAPI)
Author: Senior Backend Engineer
Description: Microservice for heavy PDF operations (Merge, Split, Compress, Render, OCR)
"""

import os
import shutil
import tempfile
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from routers import pdf

# 20MB file size limit in bytes
MAX_UPLOAD_SIZE = 20 * 1024 * 1024

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Setup temporary processing workspace
    app.state.temp_dir = tempfile.mkdtemp(prefix="pdf_pro_api_")
    print(f"[INIT] PDF Processing scratch space created at {app.state.temp_dir}")
    yield
    # Teardown workspace on shutdown
    if os.path.exists(app.state.temp_dir):
        shutil.rmtree(app.state.temp_dir, ignore_errors=True)
        print("[CLEANUP] Scratch space purged cleanly.")

app = FastAPI(
    title="PDF Professional Heavy Operations API",
    description="Stateless, high-throughput microservice for PDF merging, splitting, lossless/lossy compression, high-res rendering, and OCR text extraction.",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
    lifespan=lifespan,
)

# Robust CORS Configuration for Frontend Consumers
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:5173",
        "https://*.run.app",
        "*"
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
    expose_headers=["Content-Disposition", "X-Original-Size", "X-Compressed-Size", "X-Reduction-Percentage"]
)

# Custom Middleware to enforce 20MB payload limit before buffering
@app.middleware("http")
async def enforce_payload_limit(request: Request, call_next):
    content_length = request.headers.get("content-length")
    if content_length and int(content_length) > MAX_UPLOAD_SIZE:
        return JSONResponse(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            content={
                "error": "El archivo excede el límite máximo permitido de 20MB.",
                "max_allowed_bytes": MAX_UPLOAD_SIZE,
                "received_bytes": int(content_length),
            }
        )
    return await call_next(request)

# Include PDF processing router
app.include_router(pdf.router, prefix="/api/pdf", tags=["PDF Heavy Operations"])

@app.get("/api/health", tags=["Monitoring"])
async def health_check():
    return {
        "status": "healthy",
        "engine": "FastAPI + PyMuPDF (fitz) + Ghostscript",
        "stateless": True,
        "max_upload_mb": MAX_UPLOAD_SIZE // (1024 * 1024)
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
