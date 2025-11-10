#!/usr/bin/env Rscript
# Install required packages for parallel processing optimization

# Check and install future
if (!require("future", quietly = TRUE)) {
  cat("Installing future package...\n")
  install.packages("future", repos = "https://cloud.r-project.org", quiet = FALSE)
  cat("✓ future installed successfully\n\n")
} else {
  cat("✓ future already installed\n\n")
}

# Check and install furrr
if (!require("furrr", quietly = TRUE)) {
  cat("Installing furrr package...\n")
  install.packages("furrr", repos = "https://cloud.r-project.org", quiet = FALSE)
  cat("✓ furrr installed successfully\n\n")
} else {
  cat("✓ furrr already installed\n\n")
}

# Verify installation
cat("=================================================================\n")
cat("📦 PACKAGE VERIFICATION\n")
cat("=================================================================\n\n")

future_version <- packageVersion("future")
furrr_version <- packageVersion("furrr")

cat(sprintf("future version: %s\n", future_version))
cat(sprintf("furrr version:  %s\n", furrr_version))

cat("\n✅ All packages installed and verified!\n")
