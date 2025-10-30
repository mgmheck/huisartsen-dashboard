# Optimized Dockerfile voor Huisartsen Dashboard Backend
# Python Flask + R Support - Build time optimized

# Use smaller R base image with pre-compiled packages
FROM rocker/r-ver:4.3

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

# Install ONLY essential R packages (reduced from 4 to 2)
# Use binary packages when available (faster)
RUN R -e "options(repos = c(CRAN = 'https://cloud.r-project.org/')); \
    install.packages(c('jsonlite', 'dplyr'), \
    dependencies = FALSE, \
    Ncpus = 2)"

# Copy application code (do this last for better caching)
COPY api/ /app/api/
COPY public/data/ /app/data/
COPY r_scripts/ /app/r_scripts/

# Set environment variables
ENV PYTHONPATH=/app \
    PORT=10000 \
    FLASK_ENV=production

# Expose port
EXPOSE 10000

# Simplified health check (no requests library dependency in check)
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD curl -f http://localhost:10000/health || exit 1

# Start Flask app with gunicorn (optimized workers)
CMD ["gunicorn", "--bind", "0.0.0.0:10000", \
     "--workers", "1", \
     "--threads", "4", \
     "--timeout", "120", \
     "--access-logfile", "-", \
     "api.scenario_model:app"]
