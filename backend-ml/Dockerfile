# backend-ml/Dockerfile

FROM python:3.10-slim

WORKDIR /app

# 1. Install system utilities
RUN apt-get update && apt-get install -y \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .

# --- TRUCO DE MAGIA ---
# 2. Install PyTorch CPU only
RUN pip install --no-cache-dir torch --index-url https://download.pytorch.org/whl/cpu

# 3. Install rest of dependencies
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Clean up pip cache
RUN rm -rf /root/.cache/pip

EXPOSE 8000
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]