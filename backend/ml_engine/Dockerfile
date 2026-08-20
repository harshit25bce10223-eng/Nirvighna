# Nirvighna Production ML Engine Dockerfile
FROM python:3.11-slim

# Set environment variables
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PORT=8000 \
    DATABASE_URL="" \
    WEBHOOK_URL=""

# Set working directory
WORKDIR /app

# Install system dependencies (build-essential, libgomp1 for LightGBM/CatBoost)
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libgomp1 \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements file and install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application files
COPY . .

# Initialize synthetic baseline and train model if not present
RUN python generate_synthetic_data.py && python train_models.py

# Expose port
EXPOSE 8000

# Healthcheck
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:8000/health || exit 1

# Launch production Uvicorn server
CMD ["uvicorn", "prediction_service:app", "--host", "0.0.0.0", "--port", "8000"]
