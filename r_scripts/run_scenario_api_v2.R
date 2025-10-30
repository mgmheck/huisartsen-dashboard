#!/usr/bin/env Rscript
#===============================================================================
# INSTROOMADVIES SCENARIO 6: Verticale substitutie met tijdelijke trend
#
# Dit script berekent het complete scenario 6 en bepaalt het instroomadvies
# voor het evenwichtsjaar (2043)
#===============================================================================

suppressPackageStartupMessages({
  library(tidyverse)
})

#===============================================================================
# COMMAND LINE ARGUMENTEN (voor API gebruik)
#===============================================================================

args <- commandArgs(trailingOnly = TRUE)

if (length(args) >= 32) {
  # API mode: custom parameters
  instroom_override <- as.numeric(args[1])
  fte_vrouw_override <- as.numeric(args[2])
  fte_man_override <- as.numeric(args[3])
  intern_rendement_override <- as.numeric(args[4])

  # Extern rendement - 8 individuele waarden (ALTIJD waarden, geen NA check meer)
  extern_rendement_vrouw_1jaar_override <- as.numeric(args[5])
  extern_rendement_vrouw_5jaar_override <- as.numeric(args[6])
  extern_rendement_vrouw_10jaar_override <- as.numeric(args[7])
  extern_rendement_vrouw_15jaar_override <- as.numeric(args[8])
  extern_rendement_man_1jaar_override <- as.numeric(args[9])
  extern_rendement_man_5jaar_override <- as.numeric(args[10])
  extern_rendement_man_10jaar_override <- as.numeric(args[11])
  extern_rendement_man_15jaar_override <- as.numeric(args[12])

  # Altijd extern rendement overschrijven (we krijgen nu altijd waarden)
  OVERRIDE_EXTERN_RENDEMENT <- TRUE

  # Uitstroom - 8 individuele waarden (NIEUW - ALTIJD waarden, geen NA check meer)
  uitstroom_vrouw_5j_override <- as.numeric(args[13])
  uitstroom_man_5j_override <- as.numeric(args[14])
  uitstroom_vrouw_10j_override <- as.numeric(args[15])
  uitstroom_man_10j_override <- as.numeric(args[16])
  uitstroom_vrouw_15j_override <- as.numeric(args[17])
  uitstroom_man_15j_override <- as.numeric(args[18])
  uitstroom_vrouw_20j_override <- as.numeric(args[19])
  uitstroom_man_20j_override <- as.numeric(args[20])

  # Altijd uitstroom overschrijven (we krijgen nu altijd waarden)
  OVERRIDE_UITSTROOM <- TRUE

  # Nieuwe parameters: vraagcomponenten overrides (8 stuks) - OPGESCHOVEN
  # Als "NA" dan gebruik CSV defaults
  epi_midden_override <- args[21]
  soc_midden_override <- args[22]
  vak_midden_override <- args[23]
  eff_midden_override <- args[24]
  hor_midden_override <- args[25]
  tijd_midden_override <- args[26]
  ver_midden_override <- args[27]
  totale_zorgvraag_excl_ATV_midden_override <- args[28]

  # Check of vraagcomponenten moeten worden overschreven
  OVERRIDE_VRAAGCOMP <- !(epi_midden_override == "NA")

  if (OVERRIDE_VRAAGCOMP) {
    epi_midden_override <- as.numeric(epi_midden_override)
    soc_midden_override <- as.numeric(soc_midden_override)
    vak_midden_override <- as.numeric(vak_midden_override)
    eff_midden_override <- as.numeric(eff_midden_override)
    hor_midden_override <- as.numeric(hor_midden_override)
    tijd_midden_override <- as.numeric(tijd_midden_override)
    ver_midden_override <- as.numeric(ver_midden_override)
    totale_zorgvraag_excl_ATV_midden_override <- as.numeric(totale_zorgvraag_excl_ATV_midden_override)
  }

  # Nieuwe parameters: demografie factor en uitstroom factors - OPGESCHOVEN
  demografie_factor <- args[29]
  uitstroom_factor_vrouw <- args[30]
  uitstroom_factor_man <- args[31]

  # Check of factors moeten worden toegepast
  APPLY_DEMOGRAFIE_FACTOR <- !(demografie_factor == "NA")
  APPLY_UITSTROOM_FACTOR <- !(uitstroom_factor_vrouw == "NA" || uitstroom_factor_man == "NA")

  if (APPLY_DEMOGRAFIE_FACTOR) {
    demografie_factor <- as.numeric(demografie_factor)
  }

  if (APPLY_UITSTROOM_FACTOR) {
    uitstroom_factor_vrouw <- as.numeric(uitstroom_factor_vrouw)
    uitstroom_factor_man <- as.numeric(uitstroom_factor_man)
  }

  output_file <- args[32]
  API_MODE <- TRUE

  cat("=================================================================\n")
  cat("🔮 SCENARIO MODEL API v3 (Met Individuele Extern Rendement)\n")
  cat("=================================================================\n")
  cat(sprintf("Parameters:\n"))
  cat(sprintf("  - Instroom (cohort 3): %d personen/jaar\n", instroom_override))
  cat(sprintf("  - FTE vrouw: %.2f\n", fte_vrouw_override))
  cat(sprintf("  - FTE man: %.2f\n", fte_man_override))
  cat(sprintf("  - Intern rendement: %.3f (%.1f%%)\n", intern_rendement_override, intern_rendement_override * 100))

  if (OVERRIDE_EXTERN_RENDEMENT) {
    cat(sprintf("  - Extern rendement VROUW (individueel):\n"))
    cat(sprintf("      1 jaar:  %.3f (%.1f%%)\n", extern_rendement_vrouw_1jaar_override, extern_rendement_vrouw_1jaar_override * 100))
    cat(sprintf("      5 jaar:  %.3f (%.1f%%)\n", extern_rendement_vrouw_5jaar_override, extern_rendement_vrouw_5jaar_override * 100))
    cat(sprintf("      10 jaar: %.3f (%.1f%%)\n", extern_rendement_vrouw_10jaar_override, extern_rendement_vrouw_10jaar_override * 100))
    cat(sprintf("      15 jaar: %.3f (%.1f%%)\n", extern_rendement_vrouw_15jaar_override, extern_rendement_vrouw_15jaar_override * 100))
    cat(sprintf("  - Extern rendement MAN (individueel):\n"))
    cat(sprintf("      1 jaar:  %.3f (%.1f%%)\n", extern_rendement_man_1jaar_override, extern_rendement_man_1jaar_override * 100))
    cat(sprintf("      5 jaar:  %.3f (%.1f%%)\n", extern_rendement_man_5jaar_override, extern_rendement_man_5jaar_override * 100))
    cat(sprintf("      10 jaar: %.3f (%.1f%%)\n", extern_rendement_man_10jaar_override, extern_rendement_man_10jaar_override * 100))
    cat(sprintf("      15 jaar: %.3f (%.1f%%)\n", extern_rendement_man_15jaar_override, extern_rendement_man_15jaar_override * 100))
  }

  if (OVERRIDE_VRAAGCOMP) {
    cat(sprintf("\n  VRAAGCOMPONENTEN SIMULATIE:\n"))
    cat(sprintf("    - Epidemiologie: %.4f\n", epi_midden_override))
    cat(sprintf("    - Sociaal-cultureel: %.4f\n", soc_midden_override))
    cat(sprintf("    - Vakinhoudelijk: %.4f\n", vak_midden_override))
    cat(sprintf("    - Efficiency: %.4f\n", eff_midden_override))
    cat(sprintf("    - Horizontale substitutie: %.4f\n", hor_midden_override))
    cat(sprintf("    - Arbeidstijdverandering: %.4f\n", tijd_midden_override))
    cat(sprintf("    - Verticale substitutie: %.4f\n", ver_midden_override))
  }

  if (APPLY_DEMOGRAFIE_FACTOR) {
    cat(sprintf("\n  DEMOGRAFIE FACTOR: %.2f\n", demografie_factor))
  }

  if (APPLY_UITSTROOM_FACTOR) {
    cat(sprintf("\n  UITSTROOM FACTORS:\n"))
    cat(sprintf("    - Vrouwen: %.2f\n", uitstroom_factor_vrouw))
    cat(sprintf("    - Mannen: %.2f\n", uitstroom_factor_man))
  }

  cat("\n")
} else {
  # Standalone mode: gebruik defaults uit CSV
  API_MODE <- FALSE
  cat("=================================================================\n")
  cat("📊 INSTROOMADVIES SCENARIO 6\n")
  cat("=================================================================\n\n")
}

#===============================================================================
# STAP 1: LAAD PARAMETERS EN BEREKEN BESCHIKBAAR AANBOD
#===============================================================================

cat("Stap 1: Parameters laden en beschikbaar aanbod berekenen...\n")

# Gebruik environment variable DATA_PATH, fallback naar lokaal path voor development
csv_file <- Sys.getenv("DATA_PATH", "/Users/mgmheck/Library/CloudStorage/OneDrive-Capaciteitsorgaan/040 - 049 HA/046 Data en analyse/2025-10-22_Parameterwaarden-2010-2013-2016-2019-2025_DEF.csv")
cat(sprintf("📁 CSV bestand: %s\n", csv_file))

params_raw <- read_delim(csv_file, delim = ";", show_col_types = FALSE)
params_meta <- params_raw %>% filter(is.na(`actual-projection`) | `actual-projection` == "")
params_actual <- params_raw %>% filter(`actual-projection` == "actual")
params_projection <- params_raw %>% filter(`actual-projection` == "projection")
params_combined <- bind_rows(params_meta, params_actual, params_projection)

raming_2025_numeric <- as.numeric(gsub(",", ".", params_combined$raming_2025))

unique_vars <- unique(params_combined$Variabele)
params_list <- list()
for (var in unique_vars) {
  indices <- which(params_combined$Variabele == var)
  last_idx <- indices[length(indices)]
  params_list[[var]] <- raming_2025_numeric[last_idx]
}

# Buitenland extern rendement aliassen
er_params <- c(
  "extern_rendement_vrouw_1jaar", "extern_rendement_vrouw_5jaar",
  "extern_rendement_vrouw_10jaar", "extern_rendement_vrouw_15jaar",
  "extern_rendement_man_1jaar", "extern_rendement_man_5jaar",
  "extern_rendement_man_10jaar", "extern_rendement_man_15jaar"
)

for (param in er_params) {
  if (!is.null(params_list[[param]])) {
    bl_param <- paste0(param, "bl")
    params_list[[bl_param]] <- params_list[[param]]
  }
}

params_list$beroepsgroep <- "Huisartsen"

#===============================================================================
# API MODE: OVERSCHRIJF PARAMETERS
#===============================================================================

if (API_MODE) {
  cat("Stap 1.5: Parameters overschrijven voor API mode...\n")

  # Instroom override
  params_list$n_inopleiding_perjaar3 <- instroom_override

  # Intern rendement override - ALLE drie cohorten
  params_list$intern_rendement <- intern_rendement_override
  params_list$intern_rendement2 <- intern_rendement_override
  params_list$intern_rendement3 <- intern_rendement_override
  cat(sprintf("  → Intern rendement: %.3f (%.1f%%)\n", intern_rendement_override, intern_rendement_override * 100))

  # FTE override - ALLEEN toekomstige perioden (5, 10, 15, 20 jaar)
  # NIET _basis want dat is voor de huidige voorraad!
  params_list$fte_vrouw_basis_vijf <- fte_vrouw_override
  params_list$fte_vrouw_basis_tien <- fte_vrouw_override
  params_list$fte_vrouw_basis_vijftien <- fte_vrouw_override
  params_list$fte_vrouw_basis_twintig <- fte_vrouw_override

  params_list$fte_man_basis_vijf <- fte_man_override
  params_list$fte_man_basis_tien <- fte_man_override
  params_list$fte_man_basis_vijftien <- fte_man_override
  params_list$fte_man_basis_twintig <- fte_man_override

  # Vraagcomponenten override - ALLEEN als OVERRIDE_VRAAGCOMP = TRUE
  if (OVERRIDE_VRAAGCOMP) {
    cat("  → Vraagcomponenten OVERRIDE actief\n")
    params_list$epi_midden <- epi_midden_override
    params_list$soc_midden <- soc_midden_override
    params_list$vak_midden <- vak_midden_override
    params_list$eff_midden <- eff_midden_override
    params_list$hor_midden <- hor_midden_override
    params_list$tijd_midden <- tijd_midden_override
    params_list$ver_midden <- ver_midden_override
    params_list$totale_zorgvraag_excl_ATV_midden <- totale_zorgvraag_excl_ATV_midden_override
  }

  # Uitstroom override - ALTIJD als OVERRIDE_UITSTROOM = TRUE (absolute waarden, geen factors)
  if (OVERRIDE_UITSTROOM) {
    cat("  → Uitstroom OVERRIDE actief (absolute waarden)\n")
    cat(sprintf("      Vrouw: 5j=%.3f, 10j=%.3f, 15j=%.3f, 20j=%.3f\n",
                uitstroom_vrouw_5j_override, uitstroom_vrouw_10j_override,
                uitstroom_vrouw_15j_override, uitstroom_vrouw_20j_override))
    cat(sprintf("      Man:   5j=%.3f, 10j=%.3f, 15j=%.3f, 20j=%.3f\n",
                uitstroom_man_5j_override, uitstroom_man_10j_override,
                uitstroom_man_15j_override, uitstroom_man_20j_override))

    # Direct overschrijven met absolute waarden (niet met factors!)
    params_list$uitstroom_vrouw_basis_vijf <- uitstroom_vrouw_5j_override
    params_list$uitstroom_vrouw_basis_tien <- uitstroom_vrouw_10j_override
    params_list$uitstroom_vrouw_basis_vijftien <- uitstroom_vrouw_15j_override
    params_list$uitstroom_vrouw_basis_twintig <- uitstroom_vrouw_20j_override

    params_list$uitstroom_man_basis_vijf <- uitstroom_man_5j_override
    params_list$uitstroom_man_basis_tien <- uitstroom_man_10j_override
    params_list$uitstroom_man_basis_vijftien <- uitstroom_man_15j_override
    params_list$uitstroom_man_basis_twintig <- uitstroom_man_20j_override
  }

  # Demografie factor - ALLEEN als APPLY_DEMOGRAFIE_FACTOR = TRUE
  if (APPLY_DEMOGRAFIE_FACTOR) {
    cat(sprintf("  → Demografie factor %.2f toegepast\n", demografie_factor))
    params_list$demo_5_midden <- params_list$demo_5_midden * demografie_factor
    params_list$demo_10_midden <- params_list$demo_10_midden * demografie_factor
    params_list$demo_15_midden <- params_list$demo_15_midden * demografie_factor
    params_list$demo_20_midden <- params_list$demo_20_midden * demografie_factor
  }

  # Uitstroom factors - ALLEEN als APPLY_UITSTROOM_FACTOR = TRUE
  # LET OP: Deze worden nu NIET meer gebruikt, want OVERRIDE_UITSTROOM heeft voorrang
  # Deze blijven enkel voor backwards compatibility als OVERRIDE_UITSTROOM = FALSE
  if (APPLY_UITSTROOM_FACTOR && !OVERRIDE_UITSTROOM) {
    cat(sprintf("  → Uitstroom factors toegepast (vrouw: %.2f, man: %.2f)\n",
                uitstroom_factor_vrouw, uitstroom_factor_man))
    params_list$uitstroom_vrouw_basis_vijf <- params_list$uitstroom_vrouw_basis_vijf * uitstroom_factor_vrouw
    params_list$uitstroom_vrouw_basis_tien <- params_list$uitstroom_vrouw_basis_tien * uitstroom_factor_vrouw
    params_list$uitstroom_vrouw_basis_vijftien <- params_list$uitstroom_vrouw_basis_vijftien * uitstroom_factor_vrouw
    params_list$uitstroom_vrouw_basis_twintig <- params_list$uitstroom_vrouw_basis_twintig * uitstroom_factor_vrouw

    params_list$uitstroom_man_basis_vijf <- params_list$uitstroom_man_basis_vijf * uitstroom_factor_man
    params_list$uitstroom_man_basis_tien <- params_list$uitstroom_man_basis_tien * uitstroom_factor_man
    params_list$uitstroom_man_basis_vijftien <- params_list$uitstroom_man_basis_vijftien * uitstroom_factor_man
    params_list$uitstroom_man_basis_twintig <- params_list$uitstroom_man_basis_twintig * uitstroom_factor_man
  }

  # Extern rendement override - ALLEEN als OVERRIDE_EXTERN_RENDEMENT = TRUE
  if (OVERRIDE_EXTERN_RENDEMENT) {
    cat("  → Extern rendement OVERRIDE actief (individuele waarden per periode)\n")

    # Extern rendement override - ALLE cohorten met individuele waarden per periode
    # Base cohort (geen suffix)
    params_list$extern_rendement_vrouw_1jaar <- extern_rendement_vrouw_1jaar_override
    params_list$extern_rendement_vrouw_5jaar <- extern_rendement_vrouw_5jaar_override
    params_list$extern_rendement_vrouw_10jaar <- extern_rendement_vrouw_10jaar_override
    params_list$extern_rendement_vrouw_15jaar <- extern_rendement_vrouw_15jaar_override

    params_list$extern_rendement_man_1jaar <- extern_rendement_man_1jaar_override
    params_list$extern_rendement_man_5jaar <- extern_rendement_man_5jaar_override
    params_list$extern_rendement_man_10jaar <- extern_rendement_man_10jaar_override
    params_list$extern_rendement_man_15jaar <- extern_rendement_man_15jaar_override

    # Buitenland (bl suffix)
    params_list$extern_rendement_vrouw_1jaartbl <- extern_rendement_vrouw_1jaar_override
    params_list$extern_rendement_vrouw_5jaartbl <- extern_rendement_vrouw_5jaar_override
    params_list$extern_rendement_vrouw_10jaartbl <- extern_rendement_vrouw_10jaar_override
    params_list$extern_rendement_vrouw_15jaartbl <- extern_rendement_vrouw_15jaar_override

    params_list$extern_rendement_man_1jaartbl <- extern_rendement_man_1jaar_override
    params_list$extern_rendement_man_5jaartbl <- extern_rendement_man_5jaar_override
    params_list$extern_rendement_man_10jaartbl <- extern_rendement_man_10jaar_override
    params_list$extern_rendement_man_15jaartbl <- extern_rendement_man_15jaar_override

    # Cohort 2 (tweede cohort)
    params_list$extern_rendement_vrouw_1jaar2 <- extern_rendement_vrouw_1jaar_override
    params_list$extern_rendement_vrouw_5jaar2 <- extern_rendement_vrouw_5jaar_override
    params_list$extern_rendement_vrouw_10jaar2 <- extern_rendement_vrouw_10jaar_override
    params_list$extern_rendement_vrouw_15jaar2 <- extern_rendement_vrouw_15jaar_override

    params_list$extern_rendement_man_1jaar2 <- extern_rendement_man_1jaar_override
    params_list$extern_rendement_man_5jaar2 <- extern_rendement_man_5jaar_override
    params_list$extern_rendement_man_10jaar2 <- extern_rendement_man_10jaar_override
    params_list$extern_rendement_man_15jaar2 <- extern_rendement_man_15jaar_override

    # Cohort 3 (derde cohort - na bijsturingsjaar)
    params_list$extern_rendement_vrouw_1jaar3 <- extern_rendement_vrouw_1jaar_override
    params_list$extern_rendement_vrouw_5jaar3 <- extern_rendement_vrouw_5jaar_override
    params_list$extern_rendement_vrouw_10jaar3 <- extern_rendement_vrouw_10jaar_override
    params_list$extern_rendement_vrouw_15jaar3 <- extern_rendement_vrouw_15jaar_override

    params_list$extern_rendement_man_1jaar3 <- extern_rendement_man_1jaar_override
    params_list$extern_rendement_man_5jaar3 <- extern_rendement_man_5jaar_override
    params_list$extern_rendement_man_10jaar3 <- extern_rendement_man_10jaar_override
    params_list$extern_rendement_man_15jaar3 <- extern_rendement_man_15jaar_override
  } else {
    cat("  → Extern rendement: GEBRUIK CSV DEFAULTS (tijd-afhankelijk)\n")
  }

  cat("✓ Parameters overschreven\n\n")
}

# Bereken beschikbaar aanbod
# Get directory of current script (works in Rscript context)
script_path <- commandArgs(trailingOnly = FALSE)
script_path <- sub("--file=", "", grep("--file=", script_path, value = TRUE))
if (length(script_path) > 0) {
  script_dir <- dirname(script_path)
} else {
  # Fallback: assume we're in the r_scripts directory
  script_dir <- "."
}
cat(sprintf("📂 Script directory: %s\n", script_dir))
cat(sprintf("📂 Working directory: %s\n", getwd()))
source(file.path(script_dir, "beschikbaar_aanbod.R"))

jaren <- 21
data <- tibble(!!!params_list) %>%
  slice(rep(1, jaren)) %>%
  mutate(
    jaar = basisjaar + (row_number() - 1),
    jaren_sinds_basis = jaar - basisjaar
  )

data <- bereken_beschikbaar_aanbod(data)

cat("✓ Beschikbaar aanbod berekend\n\n")

#===============================================================================
# STAP 2: BEREKEN SCENARIO 1 (nodig voor scenario 6)
#===============================================================================

cat("Stap 2: Scenario 1 berekenen (baseline)...\n")

# Hulpvariabelen
data <- data %>%
  mutate(
    trend_t = if_else((jaar - basisjaar) < (trendjaar - basisjaar),
                      jaar - basisjaar, trendjaar - basisjaar),
    trend_d = jaar - basisjaar,
    fte_toekomst = n_man_nabijst * fte_man + n_vrouw_nabijst * fte_vrouw,
    fte_zonder_toekomst = fte_totaal - fte_toekomst
  )

# Demografie interpoleren voor alle varianten
for (variant in c("laag", "midden", "hoog")) {
  var_name <- paste0("demografie_", variant)

  data <- data %>%
    group_by(beroepsgroep) %>%
    mutate(
      !!var_name := case_when(
        jaar == basisjaar ~ 0,
        jaar == basisjaar + 5 ~ !!sym(paste0("demo_5_", variant)),
        jaar == basisjaar + 10 ~ !!sym(paste0("demo_10_", variant)),
        jaar == basisjaar + 15 ~ !!sym(paste0("demo_15_", variant)),
        jaar == basisjaar + 20 ~ !!sym(paste0("demo_20_", variant)),
        TRUE ~ NA_real_
      )
    ) %>%
    ungroup()

  # Interpolatie
  for (offset in 1:4) {
    data <- data %>%
      mutate(
        !!var_name := if_else(
          jaar == basisjaar + offset,
          lag(!!sym(var_name), offset) - (((lag(!!sym(var_name), offset) - lead(!!sym(var_name), 5 - offset)) / 5) * offset),
          !!sym(var_name)
        )
      )
  }

  for (offset in 1:4) {
    data <- data %>%
      mutate(
        !!var_name := if_else(
          jaar == basisjaar + 5 + offset,
          lag(!!sym(var_name), offset) - (((lag(!!sym(var_name), offset) - lead(!!sym(var_name), 5 - offset)) / 5) * offset),
          !!sym(var_name)
        )
      )
  }

  for (offset in 1:4) {
    data <- data %>%
      mutate(
        !!var_name := if_else(
          jaar == basisjaar + 10 + offset,
          lag(!!sym(var_name), offset) - (((lag(!!sym(var_name), offset) - lead(!!sym(var_name), 5 - offset)) / 5) * offset),
          !!sym(var_name)
        )
      )
  }

  for (offset in 1:4) {
    data <- data %>%
      mutate(
        !!var_name := if_else(
          jaar == basisjaar + 15 + offset,
          lag(!!sym(var_name), offset) - (((lag(!!sym(var_name), offset) - lead(!!sym(var_name), 5 - offset)) / 5) * offset),
          !!sym(var_name)
        )
      )
  }
}

# Scenario 1 berekeningen
data <- data %>%
  mutate(
    scen1_groei_laag = (1 + onv_vraag_laag) * (1 + demografie_laag) - 1,
    scen1_groei_midden = (1 + onv_vraag_midden) * (1 + demografie_midden) - 1,
    scen1_groei_hoog = (1 + onv_vraag_hoog) * (1 + demografie_hoog) - 1
  ) %>%
  group_by(beroepsgroep) %>%
  mutate(
    scen1_fte_laag = first(fte_totaal) * (1 + scen1_groei_laag),
    scen1_fte_midden = first(fte_totaal) * (1 + scen1_groei_midden),
    scen1_fte_hoog = first(fte_totaal) * (1 + scen1_groei_hoog)
  ) %>%
  ungroup()

cat("✓ Scenario 1 berekend\n\n")

#===============================================================================
# STAP 3: BEREKEN SCENARIO 6 (Verticale substitutie, additief)
#===============================================================================

cat("Stap 3: Scenario 6 berekenen (Verticale substitutie + tijdelijke trend)...\n")

# Scenario 6: Multiplicatief model (zoals Excel rekenmodel)
# Formule: ((1 + (non_demo_params * trend_t)) * (1 + demografie) * (1 + onv_vraag)) - 1
data <- data %>%
  mutate(
    scen6_groei_laag_a = ((1 + (((1/(1-tijd_laag))-1) + epi_laag + soc_laag + vak_laag +
      eff_laag + hor_laag + ver_laag) * trend_t) * (1 + demografie_laag) * (1 + onv_vraag_laag)) - 1,
    scen6_groei_midden_a = ((1 + (((1/(1-tijd_midden))-1) + epi_midden + soc_midden + vak_midden +
      eff_midden + hor_midden + ver_midden) * trend_t) * (1 + demografie_midden) * (1 + onv_vraag_midden)) - 1,
    scen6_groei_hoog_a = ((1 + (((1/(1-tijd_hoog))-1) + epi_hoog + soc_hoog + vak_hoog +
      eff_hoog + hor_hoog + ver_hoog) * trend_t) * (1 + demografie_hoog) * (1 + onv_vraag_hoog)) - 1
  )

# Benodigd aanbod in FTE
data <- data %>%
  group_by(beroepsgroep) %>%
  mutate(
    scen6_fte_laag_a = first(fte_totaal) * (1 + scen6_groei_laag_a),
    scen6_fte_midden_a = first(fte_totaal) * (1 + scen6_groei_midden_a),
    scen6_fte_hoog_a = first(fte_totaal) * (1 + scen6_groei_hoog_a)
  ) %>%
  ungroup()

# Tekort/overschot
data <- data %>%
  mutate(
    scen6_tekort_laag_a = fte_totaal / scen6_fte_laag_a - 1,
    scen6_tekort_midden_a = fte_totaal / scen6_fte_midden_a - 1,
    scen6_tekort_hoog_a = fte_totaal / scen6_fte_hoog_a - 1
  )

cat("✓ Scenario 6 berekend\n\n")

#===============================================================================
# STAP 4: BEREKEN BENODIGDE INSTROOM
#===============================================================================

cat("Stap 4: Benodigde instroom berekenen...\n")

data <- data %>%
  mutate(
    sc6_ftetekort_laag_a = scen6_fte_laag_a - fte_totaal,
    ben_instroom_sc6_laag_a = n_inopleiding_perjaar3 + sc6_ftetekort_laag_a / fte_toekomst * n_inopleiding_perjaar3,

    sc6_ftetekort_midden_a = scen6_fte_midden_a - fte_totaal,
    ben_instroom_sc6_midden_a = n_inopleiding_perjaar3 + sc6_ftetekort_midden_a / fte_toekomst * n_inopleiding_perjaar3,

    sc6_ftetekort_hoog_a = scen6_fte_hoog_a - fte_totaal,
    ben_instroom_sc6_hoog_a = n_inopleiding_perjaar3 + sc6_ftetekort_hoog_a / fte_toekomst * n_inopleiding_perjaar3
  )

cat("✓ Benodigde instroom berekend\n\n")

#===============================================================================
# STAP 4.5: IMPACTANALYSE (Decompositie instroomadvies)
#===============================================================================
# Vertaald vanuit Stata script: "Impact analyse_3.2.do"
# Deze analyse decompo neert het instroomadvies in de bijdrage van verschillende factoren.

cat("Stap 4.5: Impactanalyse berekenen...\n")

# Hulpvariabele: fte_start (fte_totaal uit basisjaar, forward-filled)
data <- data %>%
  group_by(beroepsgroep) %>%
  mutate(
    fte_start = if_else(jaar == basisjaar, fte_totaal, NA_real_),
    fte_start = zoo::na.locf(fte_start, na.rm = FALSE)
  ) %>%
  ungroup()

# Hulpvariabele: FTE van cohort nabij studeren
data <- data %>%
  mutate(
    fte_nabijst = n_man_nabijst * fte_man + n_vrouw_nabijst * fte_vrouw
  )

# === VRAAGFACTOREN ===

# Impact demografie (alleen directe demografische groei)
data <- data %>%
  mutate(
    impact_demo_midden = demografie_midden * (fte_start * (1 + onv_vraag_midden)) *
                         n_inopleiding_perjaar3 / fte_nabijst
  )

# Impact epidemiologie (tijdelijke trend en duurzame trend)
data <- data %>%
  mutate(
    impact_epi_midden_t = (trend_t * epi_midden * (1 + demografie_midden)) *
                          (fte_start * (1 + onv_vraag_midden) * n_inopleiding_perjaar3 / fte_nabijst),
    impact_epi_midden_d = (trend_d * epi_midden * (1 + demografie_midden)) *
                          (fte_start * (1 + onv_vraag_midden) * n_inopleiding_perjaar3 / fte_nabijst)
  )

# Impact sociaal-cultureel
data <- data %>%
  mutate(
    impact_soc_midden_t = (trend_t * soc_midden * (1 + demografie_midden)) *
                          (fte_start * (1 + onv_vraag_midden) * n_inopleiding_perjaar3 / fte_nabijst),
    impact_soc_midden_d = (trend_d * soc_midden * (1 + demografie_midden)) *
                          (fte_start * (1 + onv_vraag_midden) * n_inopleiding_perjaar3 / fte_nabijst)
  )

# Impact vakinhoudelijk
data <- data %>%
  mutate(
    impact_vak_midden_t = (trend_t * vak_midden * (1 + demografie_midden)) *
                          (fte_start * (1 + onv_vraag_midden) * n_inopleiding_perjaar3 / fte_nabijst),
    impact_vak_midden_d = (trend_d * vak_midden * (1 + demografie_midden)) *
                          (fte_start * (1 + onv_vraag_midden) * n_inopleiding_perjaar3 / fte_nabijst)
  )

# Impact efficiency
data <- data %>%
  mutate(
    impact_eff_midden_t = (trend_t * eff_midden * (1 + demografie_midden)) *
                          (fte_start * (1 + onv_vraag_midden) * n_inopleiding_perjaar3 / fte_nabijst),
    impact_eff_midden_d = (trend_d * eff_midden * (1 + demografie_midden)) *
                          (fte_start * (1 + onv_vraag_midden) * n_inopleiding_perjaar3 / fte_nabijst)
  )

# Impact horizontale substitutie
data <- data %>%
  mutate(
    impact_hor_midden_t = (trend_t * hor_midden * (1 + demografie_midden)) *
                          (fte_start * (1 + onv_vraag_midden) * n_inopleiding_perjaar3 / fte_nabijst),
    impact_hor_midden_d = (trend_d * hor_midden * (1 + demografie_midden)) *
                          (fte_start * (1 + onv_vraag_midden) * n_inopleiding_perjaar3 / fte_nabijst)
  )

# Impact ATV (Arbeidstijdverandering)
# ATV wordt berekend via ((1/(1-tijd_midden))-1)
data <- data %>%
  mutate(
    atv_effect = ((1/(1-tijd_midden))-1),
    impact_atv_midden_t = (trend_t * atv_effect * (1 + demografie_midden)) *
                          (fte_start * (1 + onv_vraag_midden) * n_inopleiding_perjaar3 / fte_nabijst),
    impact_atv_midden_d = (trend_d * atv_effect * (1 + demografie_midden)) *
                          (fte_start * (1 + onv_vraag_midden) * n_inopleiding_perjaar3 / fte_nabijst)
  )

# Impact verticale substitutie
data <- data %>%
  mutate(
    impact_ver_midden_t = (trend_t * ver_midden * (1 + demografie_midden)) *
                          (fte_start * (1 + onv_vraag_midden) * n_inopleiding_perjaar3 / fte_nabijst),
    impact_ver_midden_d = (trend_d * ver_midden * (1 + demografie_midden)) *
                          (fte_start * (1 + onv_vraag_midden) * n_inopleiding_perjaar3 / fte_nabijst)
  )

# === AANBODFACTOREN ===

# Impact onvervulde vraag (vacatures)
data <- data %>%
  mutate(
    impact_ovv_midden = onv_vraag_midden * fte_start * n_inopleiding_perjaar3 / fte_nabijst
  )

# Impact uitstroom (huidige cohort dat uitstroomt)
data <- data %>%
  mutate(
    impact_uitstroom = (fte_start - (huidig_man * fte_man + huidig_vrouw * fte_vrouw)) *
                       n_inopleiding_perjaar3 / fte_nabijst
  )

# Impact aantal nu in opleiding (cohort 1)
data <- data %>%
  mutate(
    impact_nuinopl = -((n_man_uit_nuopl * fte_man + n_vrouw_uit_nuopl * fte_vrouw) *
                       n_inopleiding_perjaar3 / fte_nabijst)
  )

# Impact aantal in opleiding tot bijsturing (cohort 2)
data <- data %>%
  mutate(
    impact_tussenopl = -((n_man_uit_tussopl * fte_man + n_vrouw_uit_tussopl * fte_vrouw) *
                         n_inopleiding_perjaar3 / fte_nabijst)
  )

# Impact instroom buitenland
data <- data %>%
  mutate(
    impact_buitenland = -((n_man_buitenland * fte_man + n_vrouw_buitenland * fte_vrouw) *
                          n_inopleiding_perjaar3 / fte_nabijst)
  )

# === TOTALEN PER SCENARIO ===

# Scenario 1: Alleen demografie
data <- data %>%
  mutate(
    totaal_impact_sc1_midden = impact_uitstroom + impact_nuinopl + impact_tussenopl +
                               impact_buitenland + impact_ovv_midden + impact_demo_midden
  )

# Scenario 2: Demografie + niet-demo factoren (tijdelijke trend)
data <- data %>%
  mutate(
    totaal_impact_sc2_midden = impact_uitstroom + impact_nuinopl + impact_tussenopl +
                               impact_buitenland + impact_ovv_midden + impact_demo_midden +
                               impact_epi_midden_t + impact_soc_midden_t + impact_vak_midden_t +
                               impact_eff_midden_t + impact_hor_midden_t
  )

# Scenario 3: Demografie + niet-demo factoren (duurzame trend)
data <- data %>%
  mutate(
    totaal_impact_sc3_midden = impact_uitstroom + impact_nuinopl + impact_tussenopl +
                               impact_buitenland + impact_ovv_midden + impact_demo_midden +
                               impact_epi_midden_d + impact_soc_midden_d + impact_vak_midden_d +
                               impact_eff_midden_d + impact_hor_midden_d
  )

# Scenario 6: Volledige model (inclusief ATV en verticale substitutie)
data <- data %>%
  mutate(
    totaal_impact_sc6_midden = impact_uitstroom + impact_nuinopl + impact_tussenopl +
                               impact_buitenland + impact_ovv_midden + impact_demo_midden +
                               impact_epi_midden_t + impact_soc_midden_t + impact_vak_midden_t +
                               impact_eff_midden_t + impact_hor_midden_t +
                               impact_atv_midden_t + impact_ver_midden_t
  )

cat("✓ Impactanalyse berekend\n")
cat(sprintf("  - %d vraagfactoren geïdentificeerd\n", 8))
cat(sprintf("  - %d aanbodfactoren geïdentificeerd\n", 5))
cat(sprintf("  - %d scenario totalen berekend\n\n", 4))

#===============================================================================
# STAP 5: TOON RESULTATEN
#===============================================================================

cat("=================================================================\n")
cat("📊 SCENARIO 6 RESULTATEN\n")
cat("=================================================================\n\n")

# Bepaal evenwichtsjaar
evenwichtsjaar <- data$evenwichtsjaar1[1]

cat(sprintf("Basisjaar:       %d\n", data$basisjaar[1]))
cat(sprintf("Bijsturingsjaar: %d\n", data$bijsturingsjaar[1]))
cat(sprintf("Evenwichtsjaar:  %d\n", evenwichtsjaar))
cat(sprintf("Trendjaar:       %d\n\n", data$trendjaar[1]))

# Selecteer key jaren
key_jaren <- c(2025, 2027, 2030, 2035, 2043, 2045)
resultaten <- data %>%
  filter(jaar %in% key_jaren) %>%
  select(jaar, fte_totaal,
         scen6_fte_laag_a, scen6_fte_midden_a, scen6_fte_hoog_a,
         scen6_tekort_laag_a, scen6_tekort_midden_a, scen6_tekort_hoog_a,
         ben_instroom_sc6_laag_a, ben_instroom_sc6_midden_a, ben_instroom_sc6_hoog_a)

cat("─────────────────────────────────────────────────────────────────\n")
cat("ONTWIKKELING OVER TIJD (Scenario 6 - Midden variant)\n")
cat("─────────────────────────────────────────────────────────────────\n\n")

for (i in 1:nrow(resultaten)) {
  row <- resultaten[i, ]
  cat(sprintf("Jaar %d:\n", row$jaar))
  cat(sprintf("  Beschikbaar FTE:     %8.1f\n", row$fte_totaal))
  cat(sprintf("  Benodigd FTE:        %8.1f\n", row$scen6_fte_midden_a))
  cat(sprintf("  Tekort/Overschot:    %+7.1f%%\n", row$scen6_tekort_midden_a * 100))
  if (is.finite(row$ben_instroom_sc6_midden_a)) {
    cat(sprintf("  Benodigde instroom:  %8.1f\n\n", row$ben_instroom_sc6_midden_a))
  } else {
    cat(sprintf("  Benodigde instroom:  (nog niet relevant)\n\n"))
  }
}

#===============================================================================
# STAP 6: INSTROOMADVIES EVENWICHTSJAAR
#===============================================================================

cat("=================================================================\n")
cat("🎯 INSTROOMADVIES EVENWICHTSJAAR %d\n", evenwichtsjaar)
cat("=================================================================\n\n")

evenwicht <- data %>% filter(jaar == evenwichtsjaar)

cat("SCENARIO 6: Verticale substitutie + tijdelijke trend (ADDITIEF)\n\n")

cat("LAAG VARIANT:\n")
cat(sprintf("  Beschikbaar FTE:     %8.1f\n", evenwicht$fte_totaal))
cat(sprintf("  Benodigd FTE:        %8.1f\n", evenwicht$scen6_fte_laag_a))
cat(sprintf("  FTE tekort:          %+8.1f  (%+.1f%%)\n",
            evenwicht$sc6_ftetekort_laag_a, evenwicht$scen6_tekort_laag_a * 100))
cat(sprintf("  ➜ INSTROOM ADVIES:   %8.0f  personen/jaar\n\n",
            evenwicht$ben_instroom_sc6_laag_a))

cat("MIDDEN VARIANT:\n")
cat(sprintf("  Beschikbaar FTE:     %8.1f\n", evenwicht$fte_totaal))
cat(sprintf("  Benodigd FTE:        %8.1f\n", evenwicht$scen6_fte_midden_a))
cat(sprintf("  FTE tekort:          %+8.1f  (%+.1f%%)\n",
            evenwicht$sc6_ftetekort_midden_a, evenwicht$scen6_tekort_midden_a * 100))
cat(sprintf("  ➜ INSTROOM ADVIES:   %8.0f  personen/jaar\n\n",
            evenwicht$ben_instroom_sc6_midden_a))

cat("HOOG VARIANT:\n")
cat(sprintf("  Beschikbaar FTE:     %8.1f\n", evenwicht$fte_totaal))
cat(sprintf("  Benodigd FTE:        %8.1f\n", evenwicht$scen6_fte_hoog_a))
cat(sprintf("  FTE tekort:          %+8.1f  (%+.1f%%)\n",
            evenwicht$sc6_ftetekort_hoog_a, evenwicht$scen6_tekort_hoog_a * 100))
cat(sprintf("  ➜ INSTROOM ADVIES:   %8.0f  personen/jaar\n\n",
            evenwicht$ben_instroom_sc6_hoog_a))

#===============================================================================
# STAP 7: VERGELIJKING MET SCENARIO 1
#===============================================================================

cat("─────────────────────────────────────────────────────────────────\n")
cat("VERGELIJKING: Scenario 1 vs Scenario 6 (Evenwichtsjaar %d)\n", evenwichtsjaar)
cat("─────────────────────────────────────────────────────────────────\n\n")

cat("SCENARIO 1 (Alleen demografie) - Midden:\n")
cat(sprintf("  Benodigd FTE:        %8.1f\n", evenwicht$scen1_fte_midden))
cat(sprintf("  Benodigde instroom:  %8.0f  personen/jaar\n\n",
            evenwicht$n_inopleiding_perjaar3 + (evenwicht$scen1_fte_midden - evenwicht$fte_totaal) / evenwicht$fte_toekomst * evenwicht$n_inopleiding_perjaar3))

cat("SCENARIO 6 (Alle factoren) - Midden:\n")
cat(sprintf("  Benodigd FTE:        %8.1f\n", evenwicht$scen6_fte_midden_a))
cat(sprintf("  Benodigde instroom:  %8.0f  personen/jaar\n\n",
            evenwicht$ben_instroom_sc6_midden_a))

verschil_fte <- evenwicht$scen6_fte_midden_a - evenwicht$scen1_fte_midden
verschil_instroom <- evenwicht$ben_instroom_sc6_midden_a - (evenwicht$n_inopleiding_perjaar3 + (evenwicht$scen1_fte_midden - evenwicht$fte_totaal) / evenwicht$fte_toekomst * evenwicht$n_inopleiding_perjaar3)

cat("IMPACT VAN EXTRA FACTOREN (werkproces, arbeidstijd, vert.sub):\n")
cat(sprintf("  Extra FTE nodig:     %+8.1f\n", verschil_fte))
cat(sprintf("  Extra instroom:      %+8.0f  personen/jaar\n\n", verschil_instroom))

#===============================================================================
# STAP 8: PARAMETEROVERZICHT
#===============================================================================

cat("=================================================================\n")
cat("📋 GEBRUIKTE PARAMETERS (Midden variant)\n")
cat("=================================================================\n\n")

params_overzicht <- data %>% filter(jaar == 2025) %>%
  select(onv_vraag_midden, epi_midden, soc_midden, vak_midden,
         eff_midden, hor_midden, tijd_midden, ver_midden) %>%
  gather(parameter, waarde)

for (i in 1:nrow(params_overzicht)) {
  row <- params_overzicht[i, ]
  param_name <- case_when(
    row$parameter == "onv_vraag_midden" ~ "Onvervulde vraag",
    row$parameter == "epi_midden" ~ "Epidemiologie",
    row$parameter == "soc_midden" ~ "Sociaal-cultureel",
    row$parameter == "vak_midden" ~ "Vakinhoudelijk",
    row$parameter == "eff_midden" ~ "Efficiency",
    row$parameter == "hor_midden" ~ "Horizontale substitutie",
    row$parameter == "tijd_midden" ~ "Arbeidstijdverandering",
    row$parameter == "ver_midden" ~ "Verticale substitutie",
    TRUE ~ row$parameter
  )
  cat(sprintf("  %-25s: %+7.4f  (%+.2f%%)\n", param_name, row$waarde, row$waarde * 100))
}

cat("\n=================================================================\n")
cat("✅ BEREKENING VOLTOOID\n")
cat("=================================================================\n\n")

#===============================================================================
# API MODE: SCHRIJF OUTPUT NAAR CSV
#===============================================================================

if (API_MODE) {
  cat("Stap 6: Output schrijven naar CSV voor API...\n")

  # Filter jaren 2025-2043 (evenwichtsjaar)
  # Selecteer ALLE kolommen - de Python API zal de juiste selecteren
  output_data <- data %>%
    filter(jaar <= 2043)

  # Schrijf naar CSV
  write.csv(output_data, output_file, row.names = FALSE)

  cat(sprintf("✓ Output geschreven naar: %s\n", output_file))
  cat(sprintf("✓ Aantal jaren: %d (2025-%d)\n\n", nrow(output_data), max(output_data$jaar)))

  cat("=================================================================\n")
  cat("✅ API BEREKENING COMPLEET\n")
  cat("=================================================================\n\n")
}
