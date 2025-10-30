################################################################################
# Capaciteitsraming benodigd aanbod
#
# Vertaald van Stata naar R door Claude
# Origineel gemaakt door Linda Flinterman, 12-06-2020
# R versie: 2025-10-24
#
# In dit script wordt het benodigde aanbod gegeven de veranderingen in de
# beroepsgroep voor verschillende scenario's berekend voor een periode van
# 20 jaar na het basisjaar.
#
# BELANGRIJK: Dit script kan pas gerund worden na beschikbaar_aanbod.R
#
# Scenario's:
# Stap 0: Hulpvariabelen aanmaken
# Stap 1: Demografisch scenario
# Stap 2: Werkproces scenario met tijdelijke trend
# Stap 3: Werkproces scenario met doorgaande trend
# Stap 4: Arbeidstijd scenario met tijdelijke trend
# Stap 5: Arbeidstijd scenario met doorgaande trend (UITGESCHAKELD)
# Stap 6: Verticale substitutie met tijdelijke trend
# Stap 7: Verticale substitutie met doorgaande trend (UITGESCHAKELD)
# Stap 8-9: Maximale waarden scenarios (UITGESCHAKELD)
#
# Aanpassingen versie 3.2:
# - Multiplicatieve model regels zijn uitgezet (niet verwijderd)
# - Additieve model regels aangepast (scenario 5-9)
################################################################################

library(tidyverse)

# Data inlezen (output van beschikbaar_aanbod.R)
data <- read_csv("/Users/mgmheck/Library/CloudStorage/OneDrive-Capaciteitsorgaan/040 - 049 HA/047 Capaciteitsplan/Capaciteitsplan 2025-2030/Visuals/Scripts/beschikbaar_aanbod_output.csv")

################################################################################
# STAP 0: Hulpvariabelen aanmaken
################################################################################

# Trendjaar variabelen
data <- data %>%
  mutate(
    trend_t = if_else((jaar - basisjaar) < (trendjaar - basisjaar), jaar - basisjaar, trendjaar - basisjaar),
    trend_d = jaar - basisjaar
  )

# FTE uit toekomstige instroom en FTE zonder toekomstige instroom
data <- data %>%
  mutate(
    fte_toekomst = n_man_nabijst * fte_man + n_vrouw_nabijst * fte_vrouw,
    fte_zonder_toekomst = fte_totaal - fte_toekomst
  )

################################################################################
# Scenario 1: Demografisch scenario
################################################################################

# Per jaar de demografische verandering berekenen voor laag, midden en hoog

# Demografische variabelen aanmaken voor laag/midden/hoog
data <- data %>%
  group_by(beroepsgroep) %>%
  mutate(
    demografie_laag = case_when(
      jaar == basisjaar ~ 0,
      jaar == basisjaar + 5 ~ demo_5_laag,
      jaar == basisjaar + 10 ~ demo_10_laag,
      jaar == basisjaar + 15 ~ demo_15_laag,
      jaar == basisjaar + 20 ~ demo_20_laag,
      TRUE ~ NA_real_
    ),
    demografie_midden = case_when(
      jaar == basisjaar ~ 0,
      jaar == basisjaar + 5 ~ demo_5_midden,
      jaar == basisjaar + 10 ~ demo_10_midden,
      jaar == basisjaar + 15 ~ demo_15_midden,
      jaar == basisjaar + 20 ~ demo_20_midden,
      TRUE ~ NA_real_
    ),
    demografie_hoog = case_when(
      jaar == basisjaar ~ 0,
      jaar == basisjaar + 5 ~ demo_5_hoog,
      jaar == basisjaar + 10 ~ demo_10_hoog,
      jaar == basisjaar + 15 ~ demo_15_hoog,
      jaar == basisjaar + 20 ~ demo_20_hoog,
      TRUE ~ NA_real_
    )
  ) %>%
  ungroup()

# Tussenliggende jaren opvullen voor alle drie varianten
for (var in c("laag", "midden", "hoog")) {
  var_name <- paste0("demografie_", var)

  # Jaren 1-4
  for (offset in 1:4) {
    data <- data %>%
      group_by(beroepsgroep) %>%
      mutate(
        !!var_name := if_else(
          jaar == basisjaar + offset,
          lag(!!sym(var_name), offset) - (((lag(!!sym(var_name), offset) - lead(!!sym(var_name), 5 - offset)) / 5) * offset),
          !!sym(var_name)
        )
      ) %>%
      ungroup()
  }

  # Jaren 6-9
  for (offset in 1:4) {
    data <- data %>%
      group_by(beroepsgroep) %>%
      mutate(
        !!var_name := if_else(
          jaar == basisjaar + 5 + offset,
          lag(!!sym(var_name), offset) - (((lag(!!sym(var_name), offset) - lead(!!sym(var_name), 5 - offset)) / 5) * offset),
          !!sym(var_name)
        )
      ) %>%
      ungroup()
  }

  # Jaren 11-14
  for (offset in 1:4) {
    data <- data %>%
      group_by(beroepsgroep) %>%
      mutate(
        !!var_name := if_else(
          jaar == basisjaar + 10 + offset,
          lag(!!sym(var_name), offset) - (((lag(!!sym(var_name), offset) - lead(!!sym(var_name), 5 - offset)) / 5) * offset),
          !!sym(var_name)
        )
      ) %>%
      ungroup()
  }

  # Jaren 16-19
  for (offset in 1:4) {
    data <- data %>%
      group_by(beroepsgroep) %>%
      mutate(
        !!var_name := if_else(
          jaar == basisjaar + 15 + offset,
          lag(!!sym(var_name), offset) - (((lag(!!sym(var_name), offset) - lead(!!sym(var_name), 5 - offset)) / 5) * offset),
          !!sym(var_name)
        )
      ) %>%
      ungroup()
  }
}

# Berekenen benodigde groei scenario 1
data <- data %>%
  mutate(
    scen1_groei_laag = (1 + onv_vraag_laag) * (1 + demografie_laag) - 1,
    scen1_groei_midden = (1 + onv_vraag_midden) * (1 + demografie_midden) - 1,
    scen1_groei_hoog = (1 + onv_vraag_hoog) * (1 + demografie_hoog) - 1
  )

# Berekenen benodigd aanbod in FTE
data <- data %>%
  group_by(beroepsgroep) %>%
  mutate(
    scen1_fte_laag = first(fte_totaal) * (1 + scen1_groei_laag),
    scen1_fte_midden = first(fte_totaal) * (1 + scen1_groei_midden),
    scen1_fte_hoog = first(fte_totaal) * (1 + scen1_groei_hoog)
  ) %>%
  ungroup()

# Verschil in aanbod en benodigd gegeven huidige aanbod
data <- data %>%
  mutate(
    scen1_tekort_laag = fte_totaal / scen1_fte_laag - 1,
    scen1_tekort_midden = fte_totaal / scen1_fte_midden - 1,
    scen1_tekort_hoog = fte_totaal / scen1_fte_hoog - 1
  )

# Benodigde toekomstige instroom per jaar
data <- data %>%
  mutate(
    scen1_ben_instroom_laag = if_else(
      jaar <= bijsturingsjaar + opleidingsduur,
      0,
      (scen1_fte_laag - fte_zonder_toekomst) * n_inopleiding_perjaar2 / fte_toekomst
    ),
    scen1_ben_instroom_midden = if_else(
      jaar <= bijsturingsjaar + opleidingsduur,
      0,
      (scen1_fte_midden - fte_zonder_toekomst) * n_inopleiding_perjaar2 / fte_toekomst
    ),
    scen1_ben_instroom_hoog = if_else(
      jaar <= bijsturingsjaar + opleidingsduur,
      0,
      (scen1_fte_hoog - fte_zonder_toekomst) * n_inopleiding_perjaar2 / fte_toekomst
    )
  )

# Benodigd extra aanbod in personen per jaar
data <- data %>%
  mutate(
    scen1_ben_pers_laag = if_else(
      jaar <= bijsturingsjaar + opleidingsduur,
      0,
      (scen1_ben_instroom_laag / n_inopleiding_perjaar2) * n_totaal_nabijst
    ),
    scen1_ben_pers_midden = if_else(
      jaar <= bijsturingsjaar + opleidingsduur,
      0,
      (scen1_ben_instroom_midden / n_inopleiding_perjaar2) * n_totaal_nabijst
    ),
    scen1_ben_pers_hoog = if_else(
      jaar <= bijsturingsjaar + opleidingsduur,
      0,
      (scen1_ben_instroom_hoog / n_inopleiding_perjaar2) * n_totaal_nabijst
    )
  )

# Benodigde personen scenario 1
data <- data %>%
  mutate(
    scen1_pers_laag = if_else(
      scen1_ben_pers_laag == 0,
      n_totaal / (1 + scen1_tekort_laag),
      n_totaal - n_totaal_nabijst + scen1_ben_pers_laag
    ),
    scen1_pers_midden = if_else(
      scen1_ben_pers_midden == 0,
      n_totaal / (1 + scen1_tekort_midden),
      n_totaal - n_totaal_nabijst + scen1_ben_pers_midden
    ),
    scen1_pers_hoog = if_else(
      scen1_ben_pers_hoog == 0,
      n_totaal / (1 + scen1_tekort_hoog),
      n_totaal - n_totaal_nabijst + scen1_ben_pers_hoog
    ),
    scen1_pers_laag2 = scen1_fte_laag / fte_gem,
    scen1_pers_midden2 = scen1_fte_midden / fte_gem,
    scen1_pers_hoog2 = scen1_fte_hoog / fte_gem
  )

################################################################################
# Scenario 2: Werkproces scenario met tijdelijke trend
################################################################################

# Aanmaken variabelen scenario 2
data <- data %>%
  mutate(
    scen2_groei_laag = (1 + (epi_laag + sociaal_laag + vakinh_laag + effic_laag + horsub_laag) * trend_t) *
      (1 + demografie_laag) * (1 + onv_vraag_laag) - 1,
    scen2_groei_midden = (1 + (epi_midden + sociaal_midden + vakinh_midden + effic_midden + horsub_midden) * trend_t) *
      (1 + demografie_midden) * (1 + onv_vraag_midden) - 1,
    scen2_groei_hoog = (1 + (epi_hoog + sociaal_hoog + vakinh_hoog + effic_hoog + horsub_hoog) * trend_t) *
      (1 + demografie_hoog) * (1 + onv_vraag_hoog) - 1
  )

# Berekenen benodigd aanbod in FTE
data <- data %>%
  group_by(beroepsgroep) %>%
  mutate(
    scen2_fte_laag = first(fte_totaal) * (1 + scen2_groei_laag),
    scen2_fte_midden = first(fte_totaal) * (1 + scen2_groei_midden),
    scen2_fte_hoog = first(fte_totaal) * (1 + scen2_groei_hoog)
  ) %>%
  ungroup()

# Verschil in aanbod en benodigd
data <- data %>%
  mutate(
    scen2_tekort_laag = fte_totaal / scen2_fte_laag - 1,
    scen2_tekort_midden = fte_totaal / scen2_fte_midden - 1,
    scen2_tekort_hoog = fte_totaal / scen2_fte_hoog - 1
  )

# Benodigde toekomstige instroom
data <- data %>%
  mutate(
    scen2_ben_instroom_laag = if_else(
      jaar <= bijsturingsjaar + opleidingsduur,
      0,
      (scen2_fte_laag - fte_zonder_toekomst) * n_inopleiding_perjaar2 / fte_toekomst
    ),
    scen2_ben_instroom_midden = if_else(
      jaar <= bijsturingsjaar + opleidingsduur,
      0,
      (scen2_fte_midden - fte_zonder_toekomst) * n_inopleiding_perjaar2 / fte_toekomst
    ),
    scen2_ben_instroom_hoog = if_else(
      jaar <= bijsturingsjaar + opleidingsduur,
      0,
      (scen2_fte_hoog - fte_zonder_toekomst) * n_inopleiding_perjaar2 / fte_toekomst
    )
  )

# Benodigd extra aanbod in personen
data <- data %>%
  mutate(
    scen2_ben_pers_laag = if_else(
      jaar <= bijsturingsjaar + opleidingsduur,
      0,
      (scen2_ben_instroom_laag / n_inopleiding_perjaar2) * n_totaal_nabijst
    ),
    scen2_ben_pers_midden = if_else(
      jaar <= bijsturingsjaar + opleidingsduur,
      0,
      (scen2_ben_instroom_midden / n_inopleiding_perjaar2) * n_totaal_nabijst
    ),
    scen2_ben_pers_hoog = if_else(
      jaar <= bijsturingsjaar + opleidingsduur,
      0,
      (scen2_ben_instroom_hoog / n_inopleiding_perjaar2) * n_totaal_nabijst
    )
  )

# Benodigde personen scenario 2
data <- data %>%
  mutate(
    scen2_pers_laag = if_else(
      scen2_ben_pers_laag == 0,
      n_totaal / (1 + scen2_tekort_laag),
      n_totaal - n_totaal_nabijst + scen2_ben_pers_laag
    ),
    scen2_pers_midden = if_else(
      scen2_ben_pers_midden == 0,
      n_totaal / (1 + scen2_tekort_midden),
      n_totaal - n_totaal_nabijst + scen2_ben_pers_midden
    ),
    scen2_pers_hoog = if_else(
      scen2_ben_pers_hoog == 0,
      n_totaal / (1 + scen2_tekort_hoog),
      n_totaal - n_totaal_nabijst + scen2_ben_pers_hoog
    )
  )

################################################################################
# Scenario 3: Werkproces scenario met doorgaande trend
################################################################################

# Aanmaken variabelen scenario 3
data <- data %>%
  mutate(
    scen3_groei_laag = (1 + (epi_laag + sociaal_laag + vakinh_laag + effic_laag + horsub_laag) * trend_d) *
      (1 + demografie_laag) * (1 + onv_vraag_laag) - 1,
    scen3_groei_midden = (1 + (epi_midden + sociaal_midden + vakinh_midden + effic_midden + horsub_midden) * trend_d) *
      (1 + demografie_midden) * (1 + onv_vraag_midden) - 1,
    scen3_groei_hoog = (1 + (epi_hoog + sociaal_hoog + vakinh_hoog + effic_hoog + horsub_hoog) * trend_d) *
      (1 + demografie_hoog) * (1 + onv_vraag_hoog) - 1
  )

# Berekenen benodigd aanbod in FTE
data <- data %>%
  group_by(beroepsgroep) %>%
  mutate(
    scen3_fte_laag = first(fte_totaal) * (1 + scen3_groei_laag),
    scen3_fte_midden = first(fte_totaal) * (1 + scen3_groei_midden),
    scen3_fte_hoog = first(fte_totaal) * (1 + scen3_groei_hoog)
  ) %>%
  ungroup()

# Verschil in aanbod en benodigd
data <- data %>%
  mutate(
    scen3_tekort_laag = fte_totaal / scen3_fte_laag - 1,
    scen3_tekort_midden = fte_totaal / scen3_fte_midden - 1,
    scen3_tekort_hoog = fte_totaal / scen3_fte_hoog - 1
  )

# Benodigde toekomstige instroom
data <- data %>%
  mutate(
    scen3_ben_instroom_laag = if_else(
      jaar <= bijsturingsjaar + opleidingsduur,
      0,
      (scen3_fte_laag - fte_zonder_toekomst) * n_inopleiding_perjaar2 / fte_toekomst
    ),
    scen3_ben_instroom_midden = if_else(
      jaar <= bijsturingsjaar + opleidingsduur,
      0,
      (scen3_fte_midden - fte_zonder_toekomst) * n_inopleiding_perjaar2 / fte_toekomst
    ),
    scen3_ben_instroom_hoog = if_else(
      jaar <= bijsturingsjaar + opleidingsduur,
      0,
      (scen3_fte_hoog - fte_zonder_toekomst) * n_inopleiding_perjaar2 / fte_toekomst
    )
  )

# Benodigd extra aanbod in personen
data <- data %>%
  mutate(
    scen3_ben_pers_laag = if_else(
      jaar <= bijsturingsjaar + opleidingsduur,
      0,
      (scen3_ben_instroom_laag / n_inopleiding_perjaar2) * n_totaal_nabijst
    ),
    scen3_ben_pers_midden = if_else(
      jaar <= bijsturingsjaar + opleidingsduur,
      0,
      (scen3_ben_instroom_midden / n_inopleiding_perjaar2) * n_totaal_nabijst
    ),
    scen3_ben_pers_hoog = if_else(
      jaar <= bijsturingsjaar + opleidingsduur,
      0,
      (scen3_ben_instroom_hoog / n_inopleiding_perjaar2) * n_totaal_nabijst
    )
  )

# Benodigde personen scenario 3
data <- data %>%
  mutate(
    scen3_pers_laag = if_else(
      scen3_ben_pers_laag == 0,
      n_totaal / (1 + scen3_tekort_laag),
      n_totaal - n_totaal_nabijst + scen3_ben_pers_laag
    ),
    scen3_pers_midden = if_else(
      scen3_ben_pers_midden == 0,
      n_totaal / (1 + scen3_tekort_midden),
      n_totaal - n_totaal_nabijst + scen3_ben_pers_midden
    ),
    scen3_pers_hoog = if_else(
      scen3_ben_pers_hoog == 0,
      n_totaal / (1 + scen3_tekort_hoog),
      n_totaal - n_totaal_nabijst + scen3_ben_pers_hoog
    )
  )

################################################################################
# Scenario 4: Arbeidstijd scenario met tijdelijke trend (ADDITIEF)
################################################################################

# Aanmaken variabelen scenario 4 - additief model
data <- data %>%
  mutate(
    scen4_groei_laag_a = (((1 / (1 - atv_laag * trend_t)) +
      ((epi_laag + sociaal_laag + vakinh_laag + effic_laag + horsub_laag) * trend_t))) *
      (1 + demografie_laag) * (1 + onv_vraag_laag) - 1,
    scen4_groei_midden_a = (((1 / (1 - atv_midden * trend_t)) +
      ((epi_midden + sociaal_midden + vakinh_midden + effic_midden + horsub_midden) * trend_t))) *
      (1 + demografie_midden) * (1 + onv_vraag_midden) - 1,
    scen4_groei_hoog_a = (((1 / (1 - atv_hoog * trend_t)) +
      ((epi_hoog + sociaal_hoog + vakinh_hoog + effic_hoog + horsub_hoog) * trend_t))) *
      (1 + demografie_hoog) * (1 + onv_vraag_hoog) - 1
  )

# Berekenen benodigd aanbod in FTE
data <- data %>%
  group_by(beroepsgroep) %>%
  mutate(
    scen4_fte_laag_a = first(fte_totaal) * (1 + scen4_groei_laag_a),
    scen4_fte_midden_a = first(fte_totaal) * (1 + scen4_groei_midden_a),
    scen4_fte_hoog_a = first(fte_totaal) * (1 + scen4_groei_hoog_a)
  ) %>%
  ungroup()

# Verschil in aanbod en benodigd
data <- data %>%
  mutate(
    scen4_tekort_laag_a = fte_totaal / scen4_fte_laag_a - 1,
    scen4_tekort_midden_a = fte_totaal / scen4_fte_midden_a - 1,
    scen4_tekort_hoog_a = fte_totaal / scen4_fte_hoog_a - 1
  )

# Benodigde toekomstige instroom
data <- data %>%
  mutate(
    scen4_ben_instroom_laag_a = if_else(
      jaar <= bijsturingsjaar + opleidingsduur,
      0,
      (scen4_fte_laag_a - fte_zonder_toekomst) * n_inopleiding_perjaar2 / fte_toekomst
    ),
    scen4_ben_instroom_midden_a = if_else(
      jaar <= bijsturingsjaar + opleidingsduur,
      0,
      (scen4_fte_midden_a - fte_zonder_toekomst) * n_inopleiding_perjaar2 / fte_toekomst
    ),
    scen4_ben_instroom_hoog_a = if_else(
      jaar <= bijsturingsjaar + opleidingsduur,
      0,
      (scen4_fte_hoog_a - fte_zonder_toekomst) * n_inopleiding_perjaar2 / fte_toekomst
    )
  )

# Benodigd extra aanbod in personen
data <- data %>%
  mutate(
    scen4_ben_pers_laag_a = if_else(
      jaar <= bijsturingsjaar + opleidingsduur,
      0,
      (scen4_ben_instroom_laag_a / n_inopleiding_perjaar2) * n_totaal_nabijst
    ),
    scen4_ben_pers_midden_a = if_else(
      jaar <= bijsturingsjaar + opleidingsduur,
      0,
      (scen4_ben_instroom_midden_a / n_inopleiding_perjaar2) * n_totaal_nabijst
    ),
    scen4_ben_pers_hoog_a = if_else(
      jaar <= bijsturingsjaar + opleidingsduur,
      0,
      (scen4_ben_instroom_hoog_a / n_inopleiding_perjaar2) * n_totaal_nabijst
    )
  )

# Benodigde personen scenario 4
data <- data %>%
  mutate(
    scen4_pers_laag_a = if_else(
      scen4_ben_pers_laag_a == 0,
      n_totaal / (1 + scen4_tekort_laag_a),
      n_totaal - n_totaal_nabijst + scen4_ben_pers_laag_a
    ),
    scen4_pers_midden_a = if_else(
      scen4_ben_pers_midden_a == 0,
      n_totaal / (1 + scen4_tekort_midden_a),
      n_totaal - n_totaal_nabijst + scen4_ben_pers_midden_a
    ),
    scen4_pers_hoog_a = if_else(
      scen4_ben_pers_hoog_a == 0,
      n_totaal / (1 + scen4_tekort_hoog_a),
      n_totaal - n_totaal_nabijst + scen4_ben_pers_hoog_a
    )
  )

################################################################################
# Scenario 5: Arbeidstijd scenario met doorgaande trend
# OPMERKING: Scenario 5 is UITGESCHAKELD in het originele Stata script
# Dit blijft uitgeschakeld in de R versie
################################################################################

# Scenario 5 code is gecommentarieerd in Stata en wordt hier niet geïmplementeerd

################################################################################
# Scenario 6: Verticale substitutie met tijdelijke trend (MULTIPLICATIEF)
################################################################################

# Aanmaken variabelen scenario 6 - multiplicatief model (zoals Excel rekenmodel)
# Formule: ((1 + (non_demo_params * trend_t)) * (1 + demografie) * (1 + onv_vraag)) - 1
data <- data %>%
  mutate(
    scen6_groei_laag_a = ((1 + (((1/(1-atv_laag))-1) + epi_laag + sociaal_laag + vakinh_laag +
      effic_laag + horsub_laag + vertsub_laag) * trend_t) * (1 + demografie_laag) * (1 + onv_vraag_laag)) - 1,
    scen6_groei_midden_a = ((1 + (((1/(1-atv_midden))-1) + epi_midden + sociaal_midden + vakinh_midden +
      effic_midden + horsub_midden + vertsub_midden) * trend_t) * (1 + demografie_midden) * (1 + onv_vraag_midden)) - 1,
    scen6_groei_hoog_a = ((1 + (((1/(1-atv_hoog))-1) + epi_hoog + sociaal_hoog + vakinh_hoog +
      effic_hoog + horsub_hoog + vertsub_hoog) * trend_t) * (1 + demografie_hoog) * (1 + onv_vraag_hoog)) - 1
  )

# Berekenen benodigd aanbod in FTE
data <- data %>%
  group_by(beroepsgroep) %>%
  mutate(
    scen6_fte_laag_a = first(fte_totaal) * (1 + scen6_groei_laag_a),
    scen6_fte_midden_a = first(fte_totaal) * (1 + scen6_groei_midden_a),
    scen6_fte_hoog_a = first(fte_totaal) * (1 + scen6_groei_hoog_a)
  ) %>%
  ungroup()

# Verschil in aanbod en benodigd
data <- data %>%
  mutate(
    scen6_tekort_laag_a = fte_totaal / scen6_fte_laag_a - 1,
    scen6_tekort_midden_a = fte_totaal / scen6_fte_midden_a - 1,
    scen6_tekort_hoog_a = fte_totaal / scen6_fte_hoog_a - 1
  )

# Benodigde toekomstige instroom
data <- data %>%
  mutate(
    scen6_ben_instroom_laag_a = if_else(
      jaar <= bijsturingsjaar + opleidingsduur,
      0,
      (scen6_fte_laag_a - fte_zonder_toekomst) * n_inopleiding_perjaar2 / fte_toekomst
    ),
    scen6_ben_instroom_midden_a = if_else(
      jaar <= bijsturingsjaar + opleidingsduur,
      0,
      (scen6_fte_midden_a - fte_zonder_toekomst) * n_inopleiding_perjaar2 / fte_toekomst
    ),
    scen6_ben_instroom_hoog_a = if_else(
      jaar <= bijsturingsjaar + opleidingsduur,
      0,
      (scen6_fte_hoog_a - fte_zonder_toekomst) * n_inopleiding_perjaar2 / fte_toekomst
    )
  )

# Benodigd extra aanbod in personen
data <- data %>%
  mutate(
    scen6_ben_pers_laag_a = if_else(
      jaar <= bijsturingsjaar + opleidingsduur,
      0,
      (scen6_ben_instroom_laag_a / n_inopleiding_perjaar2) * n_totaal_nabijst
    ),
    scen6_ben_pers_midden_a = if_else(
      jaar <= bijsturingsjaar + opleidingsduur,
      0,
      (scen6_ben_instroom_midden_a / n_inopleiding_perjaar2) * n_totaal_nabijst
    ),
    scen6_ben_pers_hoog_a = if_else(
      jaar <= bijsturingsjaar + opleidingsduur,
      0,
      (scen6_ben_instroom_hoog_a / n_inopleiding_perjaar2) * n_totaal_nabijst
    )
  )

# Benodigde personen scenario 6
data <- data %>%
  mutate(
    scen6_pers_laag_a = if_else(
      scen6_ben_pers_laag_a == 0,
      n_totaal / (1 + scen6_tekort_laag_a),
      n_totaal - n_totaal_nabijst + scen6_ben_pers_laag_a
    ),
    scen6_pers_midden_a = if_else(
      scen6_ben_pers_midden_a == 0,
      n_totaal / (1 + scen6_tekort_midden_a),
      n_totaal - n_totaal_nabijst + scen6_ben_pers_midden_a
    ),
    scen6_pers_hoog_a = if_else(
      scen6_ben_pers_hoog_a == 0,
      n_totaal / (1 + scen6_tekort_hoog_a),
      n_totaal - n_totaal_nabijst + scen6_ben_pers_hoog_a
    )
  )

################################################################################
# Scenario 7: Verticale substitutie met doorgaande trend
# OPMERKING: Scenario 7 is UITGESCHAKELD in het originele Stata script
# Dit blijft uitgeschakeld in de R versie
################################################################################

# Scenario 7 code is gecommentarieerd in Stata en wordt hier niet geïmplementeerd

################################################################################
# Scenario 8 & 9: Maximale waarden scenarios
# OPMERKING: Scenario's 8 en 9 zijn UITGESCHAKELD in het originele Stata script
# Dit blijft uitgeschakeld in de R versie
################################################################################

# Scenario 8 & 9 code is gecommentarieerd in Stata en wordt hier niet geïmplementeerd

################################################################################
# Output opslaan
################################################################################

write_csv(data, "/Users/mgmheck/Library/CloudStorage/OneDrive-Capaciteitsorgaan/040 - 049 HA/047 Capaciteitsplan/Capaciteitsplan 2025-2030/Visuals/Scripts/benodigd_aanbod_output.csv")

print("Benodigd aanbod berekening voltooid!")
print(paste("Aantal rijen output:", nrow(data)))
print(paste("Aantal kolommen:", ncol(data)))

# Toon overzicht van scenario's
print("\nBerekende scenario's:")
print("- Scenario 1: Demografisch (laag/midden/hoog)")
print("- Scenario 2: Werkproces tijdelijk (laag/midden/hoog)")
print("- Scenario 3: Werkproces doorgaand (laag/midden/hoog)")
print("- Scenario 4: Arbeidstijd tijdelijk ADDITIEF (laag/midden/hoog)")
print("- Scenario 5: UITGESCHAKELD")
print("- Scenario 6: Verticale substitutie tijdelijk ADDITIEF (laag/midden/hoog)")
print("- Scenario 7: UITGESCHAKELD")
print("- Scenario 8-9: UITGESCHAKELD")
