# Use a lightweight Python base image to reduce final artifact size
FROM python:3.10-slim

# Set the working directory for the application
WORKDIR /app

# 1. Install system-level dependencies required for building Python packages
#    - build-essential: Includes gcc/g++ for compiling native extensions
#    - Clean up apt cache immediately to keep layer size small
RUN apt-get update && apt-get install -y \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Copy only the requirements file first to leverage Docker layer caching
COPY requirements.txt .

# --- DEPENDENCY RESOLUTION STRATEGY ---

# 2. Upgrade pip and install build dependencies from standard PyPI.
#    We strictly install 'flit_core' and a stable 'jinja2' FIRST from the official index.
#    This prevents pip from failing later when it tries to find them in the 
#    restricted PyTorch repository (which doesn't host them).
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir "flit_core<4" "jinja2>=3.0"

# 3. Install PyTorch (CPU-only version).
#    - We use --index-url to force downloading from the PyTorch wheel repository.
#    - Since 'jinja2' is already installed, pip won't try to pull it from here,
#      avoiding the metadata conflict error.
#    - Using the CPU version reduces image size by ~4GB (no CUDA drivers).
RUN pip install --no-cache-dir torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cpu

# 4. Install the remaining project dependencies.
#    This will skip 'torch' and 'jinja2' as they are already satisfied.
RUN pip install --no-cache-dir -r requirements.txt

# --- APPLICATION SETUP ---

# Copy the rest of the application code
COPY . .

# Final cleanup to remove temporary pip cache files
RUN rm -rf /root/.cache/pip

# Expose the port that Uvicorn will listen on
EXPOSE 8000

# Start the application using Uvicorn production server
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]