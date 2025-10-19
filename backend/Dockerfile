# Backend Dockerfile
FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

WORKDIR /app

# System deps for pdf/ocr and image libs
RUN apt-get update && apt-get install -y \
    poppler-utils tesseract-ocr \
    libglib2.0-0 libsm6 libxext6 libxrender1 \
    libjpeg-dev zlib1g-dev libpng-dev libtiff5 libfreetype6-dev \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8000
CMD ["sh", "-lc", "uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000}"]
