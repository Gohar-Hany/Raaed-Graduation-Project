# ==========================================
# Raaed FastAPI Backend - Production Dockerfile
# ==========================================
# OPTIMIZED for fast rebuilds using Docker layer caching.
#
# Build:  docker build -t raaed-backend .
#
# LAYER ORDER MATTERS! Heavy downloads come first (cached forever),
# frequently-changing source code comes LAST.
# ==========================================

FROM python:3.10-slim-bookworm

# Set environment variables
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1 \
    HF_HUB_DISABLE_TELEMETRY=1 \
    HF_HUB_OFFLINE=0

WORKDIR /app

# ── Layer 1: HTTPS apt sources (never changes) ─────────────────────────
RUN echo 'deb https://deb.debian.org/debian bookworm main' > /etc/apt/sources.list && \
    echo 'deb https://deb.debian.org/debian bookworm-updates main' >> /etc/apt/sources.list && \
    echo 'deb https://deb.debian.org/debian-security bookworm-security main' >> /etc/apt/sources.list && \
    rm -f /etc/apt/sources.list.d/*

# ── Layer 2: System packages (rarely changes) ──────────────────────────
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

# ── Layer 3: PyTorch CPU (1.2GB - changes only on version bump) ────────
RUN pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cpu

# ── Layer 4: PaddlePaddle & PaddleOCR (900MB - changes rarely) ─────────
RUN pip install paddlepaddle>=2.6.0 paddleocr>=2.8.0

# ── Layer 5: Pin critical deps (changes rarely) ────────────────────────
RUN pip install "numpy>=1.24.0,<2.0.0" "tokenizers>=0.19.0,<0.30.0"

# ── Layer 6: Python requirements (changes when requirements.txt edits) ─
# IMPORTANT: Copy ONLY requirements.txt here (not before PyTorch!)
# This way, editing requirements.txt does NOT re-download PyTorch/Paddle.
COPY requirements.txt .
RUN pip install -r requirements.txt

# ── Layer 7-8: Pre-download HuggingFace models (~3GB total) ────────────
# These NEVER change unless you switch to a different model.
COPY download_models.py .
RUN python download_models.py embedding
RUN python download_models.py reranker
RUN rm download_models.py

# ── Layer 9: Source code (changes MOST often → LAST!) ───────────────────
# Only THIS layer rebuilds when you edit your Python code.
COPY src /app/src
RUN mkdir -p /app/src/assets/files /app/src/assets/database

ENV PYTHONPATH=/app/src
EXPOSE 5000
CMD ["uvicorn", "src.main:app", "--host", "0.0.0.0", "--port", "5000"]
