# Optimized Dockerfile voor Huisartsen Dashboard Backend
# Python Flask + R Support - Build time optimized

# Use rocker/tidyverse image with pre-installed tidyverse packages
# This bypasses Render's aggressive caching of R package installations
FROM rocker/tidyverse:4.3

# Set environment variables for faster builds
ENV DEBIAN_FRONTEND=noninteractive \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

# Install Python and system dependencies in one layer
# Combine commands to reduce layers and build time
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 \
    python3-pip \
    python3-dev \
    build-essential \
    curl \
    && rm -rf /var/lib/apt/lists/* \
    && apt-get clean

# Set working directory early
WORKDIR /app

# Copy only requirements first (better layer caching)
COPY api/requirements.txt /app/requirements.txt

# Install Python packages in one go (includes gunicorn)
RUN pip3 install --no-cache-dir -r requirements.txt

# No need to install tidyverse - it's pre-installed in rocker/tidyverse image!
# This eliminates 25-30 minutes of build time and bypasses Render's cache issues

# Install additional R packages needed by our scripts
RUN R -e "install.packages('zoo', repos='https://cloud.r-project.org/')"

# Copy application code (do this last for better caching)
COPY api/ /app/api/
COPY public/data/ /app/data/
COPY r_scripts/ /app/r_scripts/

# Set environment variables
ENV PYTHONPATH=/app \
    FLASK_ENV=production

# Railway provides PORT dynamically - don't hardcode it!
# Default to 5001 for local development
ENV PORT=5001

# Expose port (Railway will override this)
EXPOSE ${PORT}

# Simplified health check - use $PORT from environment
# Railway will inject the correct PORT
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD curl -f http://localhost:${PORT}/health || exit 1

# Start Flask app with gunicorn - use $PORT from environment
# Railway will inject PORT automatically (e.g., PORT=8080)
# Workers=2 voor parallel request processing (2 R scripts tegelijk)
CMD gunicorn --bind 0.0.0.0:$PORT \
     --workers 2 \
     --threads 4 \
     --timeout 120 \
     --worker-class sync \
     --access-logfile - \
     api.scenario_model:app
