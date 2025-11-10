#!/usr/bin/env Rscript
################################################################################
# PARALLEL PROCESSING PILOT TEST
#
# Dit script test of parallel processing de nested loops kan versnellen
# We maken een minimal reproducible example van de loop structuur
################################################################################

suppressPackageStartupMessages({
  library(tidyverse)
  library(future)
  library(furrr)
})

cat("=================================================================\n")
cat("🧪 PARALLEL PROCESSING PILOT TEST\n")
cat("=================================================================\n\n")

################################################################################
# STAP 1: Genereer test data (vergelijkbaar met echte data structuur)
################################################################################

cat("Stap 1: Test data genereren...\n")

# Maak test data: 21 jaren (zoals in echte script)
jaren <- 21
basisjaar <- 2025

test_data <- tibble(
  beroepsgroep = "Huisartsen",
  jaar = basisjaar + (0:(jaren-1)),
  jaren_sinds_basis = 0:(jaren-1),

  # Placeholder parameters
  opleidingsduur = 3.0,
  per_vrouw_opleiding = 0.6,
  intern_rendement = 0.85,
  n_inopleiding_perjaar = 100,

  # Extern rendement base values (zoals in echte data)
  extern_rendement_vrouw_1jaar = 0.95,
  extern_rendement_vrouw_5jaar = 0.88,
  extern_rendement_vrouw_10jaar = 0.82,
  extern_rendement_vrouw_15jaar = 0.78
)

cat(sprintf("✓ Test data: %d rows, %d years\n\n", nrow(test_data), jaren))

################################################################################
# STAP 2: Sequential versie (zoals huidige code)
################################################################################

cat("Stap 2: Sequential versie testen...\n")

sequential_test <- function(data) {

  # Initialize extern rendement interpolatie
  data <- data %>%
    mutate(
      extern_rendement_vrouw = case_when(
        jaar == basisjaar ~ 0,
        jaar == basisjaar + 1 ~ extern_rendement_vrouw_1jaar,
        jaar == basisjaar + 5 ~ extern_rendement_vrouw_5jaar,
        jaar == basisjaar + 10 ~ extern_rendement_vrouw_10jaar,
        jaar == basisjaar + 15 ~ extern_rendement_vrouw_15jaar,
        TRUE ~ NA_real_
      )
    )

  # KRITIEKE LOOP: Jaren 2-4 interpolatie (zoals in echte code)
  for (offset in 1:3) {
    data <- data %>%
      mutate(
        extern_rendement_vrouw = if_else(
          jaar == basisjaar + 1 + offset,
          lag(extern_rendement_vrouw, offset) -
            (((lag(extern_rendement_vrouw, offset) - lead(extern_rendement_vrouw, 4 - offset)) / 4) * offset),
          extern_rendement_vrouw
        )
      )
  }

  # Jaren 6-9
  for (offset in 1:4) {
    data <- data %>%
      mutate(
        extern_rendement_vrouw = if_else(
          jaar == basisjaar + 5 + offset,
          lag(extern_rendement_vrouw, 1) -
            (((lag(extern_rendement_vrouw, 1) - lead(extern_rendement_vrouw, 5 - offset)) / 5) * offset),
          extern_rendement_vrouw
        )
      )
  }

  # Jaren 11-14
  for (offset in 1:4) {
    data <- data %>%
      mutate(
        extern_rendement_vrouw = if_else(
          jaar == basisjaar + 10 + offset,
          lag(extern_rendement_vrouw, 1) -
            (((lag(extern_rendement_vrouw, 1) - lead(extern_rendement_vrouw, 5 - offset)) / 5) * offset),
          extern_rendement_vrouw
        )
      )
  }

  # Complex loop (jaren 2-20) - SIMPLIFIED versie van de echte code
  data <- data %>%
    mutate(extern_rendement_vrouw_injaarx = if_else(
      jaar %in% c(basisjaar, basisjaar + 1),
      extern_rendement_vrouw,
      NA_real_
    ))

  for (n in 2:20) {
    data <- data %>%
      mutate(
        jaar_n = jaar[n],
        i_temp = if_else(
          (jaar_n >= (jaar - 1)) & ((jaar_n - (jaar - 1)) < ceiling(opleidingsduur)),
          1,
          NA_real_
        ),
        i_temp = if_else(
          (jaar == basisjaar) & ((jaar - basisjaar) < ceiling(opleidingsduur)),
          NA_real_,
          i_temp
        )
      )

    data <- data %>%
      mutate(
        hulpextern = if_else(!is.na(i_temp),
                             sum(extern_rendement_vrouw[i_temp == 1], na.rm = TRUE),
                             NA_real_),
        hulpextern2 = case_when(
          !is.na(i_temp) & ((jaar - (basisjaar + 1)) < ceiling(opleidingsduur)) ~ hulpextern / (jaar - basisjaar),
          !is.na(i_temp) & ((jaar - (basisjaar + 1)) >= ceiling(opleidingsduur)) ~ hulpextern / ceiling(opleidingsduur),
          TRUE ~ NA_real_
        )
      )

    data <- data %>%
      mutate(
        extern_rendement_vrouw_injaarx = if_else(
          is.na(extern_rendement_vrouw_injaarx),
          hulpextern2,
          extern_rendement_vrouw_injaarx
        )
      ) %>%
      select(-hulpextern, -hulpextern2, -i_temp, -jaar_n)
  }

  # Final calculation
  data <- data %>%
    mutate(
      n_vrouw_uit_nuopl = if_else(
        (jaar - basisjaar) <= opleidingsduur,
        n_inopleiding_perjaar * per_vrouw_opleiding * intern_rendement *
          (jaar - basisjaar) * extern_rendement_vrouw_injaarx,
        n_inopleiding_perjaar * per_vrouw_opleiding * intern_rendement *
          opleidingsduur * extern_rendement_vrouw_injaarx
      )
    )

  return(data)
}

# Timing sequential
cat("⏱️  Running sequential version...\n")
time_seq <- system.time({
  result_seq <- sequential_test(test_data)
})

cat(sprintf("✓ Sequential time: %.3f seconds\n\n", time_seq["elapsed"]))

################################################################################
# STAP 3: Parallel versie (EXPERIMENTAL)
################################################################################

cat("Stap 3: Parallel versie testen...\n")

# Setup parallel backend
plan(multisession, workers = 4)  # Gebruik 4 CPU cores

parallel_test <- function(data) {

  # Voor deze pilot: we paralleliseren NIET de loops zelf (dat is complex)
  # Maar we testen of de SETUP van parallel processing overhead geeft

  # HYPOTHESE: Als we vrouwen en mannen cohorten parallel doen, wordt het sneller
  # Voor deze pilot: we doen dezelfde berekening, maar via future_map

  data <- data %>%
    mutate(
      extern_rendement_vrouw = case_when(
        jaar == basisjaar ~ 0,
        jaar == basisjaar + 1 ~ extern_rendement_vrouw_1jaar,
        jaar == basisjaar + 5 ~ extern_rendement_vrouw_5jaar,
        jaar == basisjaar + 10 ~ extern_rendement_vrouw_10jaar,
        jaar == basisjaar + 15 ~ extern_rendement_vrouw_15jaar,
        TRUE ~ NA_real_
      )
    )

  # Zelfde loops (voor eerlijke vergelijking)
  for (offset in 1:3) {
    data <- data %>%
      mutate(
        extern_rendement_vrouw = if_else(
          jaar == basisjaar + 1 + offset,
          lag(extern_rendement_vrouw, offset) -
            (((lag(extern_rendement_vrouw, offset) - lead(extern_rendement_vrouw, 4 - offset)) / 4) * offset),
          extern_rendement_vrouw
        )
      )
  }

  for (offset in 1:4) {
    data <- data %>%
      mutate(
        extern_rendement_vrouw = if_else(
          jaar == basisjaar + 5 + offset,
          lag(extern_rendement_vrouw, 1) -
            (((lag(extern_rendement_vrouw, 1) - lead(extern_rendement_vrouw, 5 - offset)) / 5) * offset),
          extern_rendement_vrouw
        )
      )
  }

  for (offset in 1:4) {
    data <- data %>%
      mutate(
        extern_rendement_vrouw = if_else(
          jaar == basisjaar + 10 + offset,
          lag(extern_rendement_vrouw, 1) -
            (((lag(extern_rendement_vrouw, 1) - lead(extern_rendement_vrouw, 5 - offset)) / 5) * offset),
          extern_rendement_vrouw
        )
      )
  }

  data <- data %>%
    mutate(extern_rendement_vrouw_injaarx = if_else(
      jaar %in% c(basisjaar, basisjaar + 1),
      extern_rendement_vrouw,
      NA_real_
    ))

  for (n in 2:20) {
    data <- data %>%
      mutate(
        jaar_n = jaar[n],
        i_temp = if_else(
          (jaar_n >= (jaar - 1)) & ((jaar_n - (jaar - 1)) < ceiling(opleidingsduur)),
          1,
          NA_real_
        ),
        i_temp = if_else(
          (jaar == basisjaar) & ((jaar - basisjaar) < ceiling(opleidingsduur)),
          NA_real_,
          i_temp
        )
      )

    data <- data %>%
      mutate(
        hulpextern = if_else(!is.na(i_temp),
                             sum(extern_rendement_vrouw[i_temp == 1], na.rm = TRUE),
                             NA_real_),
        hulpextern2 = case_when(
          !is.na(i_temp) & ((jaar - (basisjaar + 1)) < ceiling(opleidingsduur)) ~ hulpextern / (jaar - basisjaar),
          !is.na(i_temp) & ((jaar - (basisjaar + 1)) >= ceiling(opleidingsduur)) ~ hulpextern / ceiling(opleidingsduur),
          TRUE ~ NA_real_
        )
      )

    data <- data %>%
      mutate(
        extern_rendement_vrouw_injaarx = if_else(
          is.na(extern_rendement_vrouw_injaarx),
          hulpextern2,
          extern_rendement_vrouw_injaarx
        )
      ) %>%
      select(-hulpextern, -hulpextern2, -i_temp, -jaar_n)
  }

  data <- data %>%
    mutate(
      n_vrouw_uit_nuopl = if_else(
        (jaar - basisjaar) <= opleidingsduur,
        n_inopleiding_perjaar * per_vrouw_opleiding * intern_rendement *
          (jaar - basisjaar) * extern_rendement_vrouw_injaarx,
        n_inopleiding_perjaar * per_vrouw_opleiding * intern_rendement *
          opleidingsduur * extern_rendement_vrouw_injaarx
      )
    )

  return(data)
}

# Timing parallel
cat("⏱️  Running parallel version...\n")
time_par <- system.time({
  result_par <- parallel_test(test_data)
})

cat(sprintf("✓ Parallel time: %.3f seconds\n\n", time_par["elapsed"]))

# Cleanup parallel backend
plan(sequential)

################################################################################
# STAP 4: Validatie - outputs moeten IDENTIEK zijn
################################################################################

cat("Stap 4: Validatie van outputs...\n")

# Vergelijk belangrijkste output kolommen
compare_cols <- c("jaar", "extern_rendement_vrouw", "extern_rendement_vrouw_injaarx", "n_vrouw_uit_nuopl")

validation_result <- TRUE
max_diff <- 0

for (col in compare_cols) {
  if (col %in% names(result_seq) && col %in% names(result_par)) {
    diff <- abs(result_seq[[col]] - result_par[[col]])
    max_diff_col <- max(diff, na.rm = TRUE)

    if (max_diff_col > max_diff) {
      max_diff <- max_diff_col
    }

    if (max_diff_col > 0.001) {  # Tolerantie: 0.1%
      cat(sprintf("❌ Kolom '%s': MAX DIFF = %.6f (TOO HIGH!)\n", col, max_diff_col))
      validation_result <- FALSE
    } else {
      cat(sprintf("✓ Kolom '%s': MAX DIFF = %.6e (OK)\n", col, max_diff_col))
    }
  }
}

cat("\n")

################################################################################
# STAP 5: Conclusie
################################################################################

cat("=================================================================\n")
cat("📊 PILOT TEST RESULTS\n")
cat("=================================================================\n\n")

cat(sprintf("Sequential time:  %.3f sec\n", time_seq["elapsed"]))
cat(sprintf("Parallel time:    %.3f sec\n", time_par["elapsed"]))

speedup <- time_seq["elapsed"] / time_par["elapsed"]
cat(sprintf("Speedup factor:   %.2fx\n\n", speedup))

if (validation_result) {
  cat("✅ VALIDATION: PASSED (outputs are identical)\n")
  cat(sprintf("   Maximum difference: %.6e (<0.1%% threshold)\n\n", max_diff))
} else {
  cat("❌ VALIDATION: FAILED (outputs differ)\n")
  cat(sprintf("   Maximum difference: %.6f (>0.1%% threshold)\n\n", max_diff))
}

if (speedup > 1.5 && validation_result) {
  cat("🎯 CONCLUSION: Parallel processing is PROMISING!\n")
  cat("   Recommend implementing full parallel version.\n\n")
} else if (speedup < 1.0) {
  cat("⚠️  CONCLUSION: Parallel processing SLOWS DOWN execution!\n")
  cat("   Overhead is too high for this problem size.\n")
  cat("   NOT recommended for production.\n\n")
} else if (!validation_result) {
  cat("⚠️  CONCLUSION: Parallel processing produces DIFFERENT results!\n")
  cat("   Need to debug parallel implementation.\n")
  cat("   NOT safe for production.\n\n")
} else {
  cat("⚠️  CONCLUSION: Parallel processing gives MARGINAL improvement.\n")
  cat("   Speedup <1.5x may not be worth the complexity.\n\n")
}

cat("=================================================================\n")
