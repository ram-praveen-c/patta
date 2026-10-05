# Production Dockerfile for LandLens AI Backend
FROM python:3.11-slim

# Prevent Python from writing pyc files and enable unbuffered logging
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV MALLOC_ARENA_MAX=2

# Install system dependencies: Tesseract OCR with English, Tamil, and Hindi language packs
RUN apt-get update && apt-get install -y --no-install-recommends \
    tesseract-ocr \
    tesseract-ocr-eng \
    tesseract-ocr-tam \
    tesseract-ocr-hin \
    libgl1 \
    libglib2.0-0 \
    curl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend application code
COPY . .

# Environment variables
ENV TESSDATA_PREFIX=/app/tessdata
ENV PORT=8000
ENV HOST=0.0.0.0

EXPOSE 8000

# Start FastAPI application with dynamic host and port (single worker to fit 512MB RAM)
CMD ["sh", "-c", "uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000} --workers 1"]
