# Dockerfile voor Huisartsen Dashboard Backend
# Python Flask + R Support

# Start met R base image (bevat R runtime)
FROM rocker/r-ver:4.3.2

# Install Python en system dependencies
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    python3-dev \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy Python requirements en installeer dependencies
COPY api/requirements.txt /app/
RUN pip3 install --no-cache-dir -r requirements.txt

# Install gunicorn voor production server
RUN pip3 install gunicorn

# Install R packages die nodig zijn voor scenario model
RUN R -e "install.packages(c('dplyr', 'tidyr', 'readr', 'jsonlite'), repos='https://cloud.r-project.org/')"

# Copy application code
COPY api/ /app/api/
COPY public/data/ /app/data/

# Copy R scripts (als ze apart zijn)
# COPY r_scripts/ /app/r_scripts/

# Maak directory voor R scripts
RUN mkdir -p /app/r_scripts

# Expose port
EXPOSE 10000

# Set Python path
ENV PYTHONPATH=/app
ENV PORT=10000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD python3 -c "import requests; requests.get('http://localhost:10000/api/health')" || exit 1

# Start Flask app met gunicorn
CMD ["gunicorn", "--bind", "0.0.0.0:10000", "--workers", "2", "--timeout", "120", "api.scenario_model:app"]
