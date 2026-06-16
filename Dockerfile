# ==========================================
# Raaed FastAPI Backend - Production Dockerfile
# ==========================================

# Use official lightweight Python image (Bookworm = Debian 12 Stable)
FROM python:3.10-slim-bookworm

# Set environment variables
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1 \
    HF_HUB_DISABLE_TELEMETRY=1 \
    HF_HUB_OFFLINE=0

WORKDIR /app

# ── ROOT CAUSE FIX: Force HTTPS for all apt sources ─────────────────────
# Many ISPs intercept plain HTTP traffic via transparent proxies and return
# 403 Forbidden. Switching to HTTPS bypasses this completely.
RUN echo 'deb https://deb.debian.org/debian bookworm main' > /etc/apt/sources.list && \
    echo 'deb https://deb.debian.org/debian bookworm-updates main' >> /etc/apt/sources.list && \
    echo 'deb https://deb.debian.org/debian-security bookworm-security main' >> /etc/apt/sources.list && \
    rm -f /etc/apt/sources.list.d/*

# Install ca-certificates first (needed for HTTPS apt), then system deps
RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates \
    build-essential \
    python3-dev \
    git \
    libgl1-mesa-glx \
    libglib2.0-0 \
    libgomp1 \
    libpng-dev \
    libjpeg-dev \
    libtiff-dev \
    poppler-utils \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements.txt first to leverage Docker cache
COPY requirements.txt .

# Install PyTorch CPU first to avoid heavy GPU weights in cloud deployment
RUN pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cpu

# Install PaddlePaddle & PaddleOCR
RUN pip install paddlepaddle>=2.6.0 paddleocr>=2.8.0

# Pin critical dependencies to prevent version conflicts (numpy < 2, tokenizers)
RUN pip install "numpy>=1.24.0,<2.0.0" "tokenizers>=0.19.0,<0.30.0"

# Install remaining dependencies
RUN pip install -r requirements.txt

# ── Pre-download HuggingFace models (SEPARATE steps for Docker cache) ───
COPY download_models.py .

# Step A: Embedding model (~1.2 GB)
RUN python download_models.py embedding

# Step B: Reranker model (~1.1 GB)
RUN python download_models.py reranker

# Clean up download script
RUN rm download_models.py

# Copy the source code
COPY src /app/src

# Create local data directories (mount points for Azure Files)
RUN mkdir -p /app/src/assets/files /app/src/assets/database

# Set pythonpath so routes and helpers can be imported correctly
ENV PYTHONPATH=/app/src

# Expose backend port
EXPOSE 5000

# Run FastAPI application
CMD ["uvicorn", "src.main:app", "--host", "0.0.0.0", "--port", "5000"]
