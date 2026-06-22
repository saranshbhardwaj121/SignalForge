FROM python:3.12-slim

WORKDIR /app

# Install system dependencies required by psycopg and yfinance
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy package definition and application code
COPY pyproject.toml .
COPY backend/ backend/

# Install Python dependencies and package
RUN pip install --no-cache-dir .

# Expose FastAPI default port
EXPOSE 8000

# Start the FastAPI server
# Workers: start with 1; scale via container replicas on the platform
CMD ["uvicorn", "backend.app.main:app", "--host", "0.0.0.0", "--port", "8000"]
