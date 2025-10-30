################################################################################
# Capaciteitsraming beschikbaar aanbod
#
# Vertaald van Stata naar R door Claude
# Origineel gemaakt door Linda Flinterman, 17-03-2020
# R versie: 2025-10-24
#
# In dit script wordt het beschikbare aanbod gegeven de in- en uitstroom
# verwachtingen van een beroepsgroep berekend voor een periode van 20 jaar
# na het basisjaar.
#
# De volgende parameters worden berekend:
# 1. De huidige groep werkzame personen per jaar
# 2. De huidige groep in opleiding per jaar
# 3. De groep die in opleiding komt tot het 1e bijsturingsjaar per jaar
# 4. De groep die in opleiding komt vanaf het bijsturingsjaar per jaar
# 5. De groep die vanaf nu uit het buitenland komt
#
# Stappen:
# Stap 0: Variabele voor de jaren aanmaken
# Stap 1: Huidige groep werkzame personen
# Stap 2: Groep in opleiding in basisjaar
# Stap 3: Groep in opleiding tot 1e bijsturingsjaar
# Stap 4: Groep in opleiding vanaf het 1e bijsturingsjaar
# Stap 5: Instroom vanuit het buitenland
# Stap 6: Totaal beschikbare aanbod
# Stap 7: Totaal aantal in opleiding
################################################################################

library(tidyverse)

# Functie om lineaire interpolatie uit te voeren zoals Stata dat doet
interpolate_years <- function(data, var_name, step_size = 5) {
  # Deze functie vult tussenliggende jaren op met lineaire interpolatie
  # tussen bekende waardes op interval-jaren
  data
}

################################################################################
# FUNCTIE: Bereken beschikbaar aanbod
################################################################################
# Deze functie verwacht een data frame met:
# - Alle parameters (aanbod_personen, per_vrouw_basis, etc.)
# - Een 'jaar' kolom met 21 rijen per beroepsgroep (basisjaar tot basisjaar+20)
################################################################################

bereken_beschikbaar_aanbod <- function(data) {

################################################################################
# Stap 1: Huidige groep werkzame personen
################################################################################

# Bereken per jaar hoeveel vrouwen/mannen en totaal aantal personen er over zijn
# van de huidige groep werkzame personen

### Vrouwen ###

# Aantal vrouwen op de jaren waar we gegevens over uitstroom hebben (5, 10, 15, 20 jaar)
data <- data %>%
  group_by(beroepsgroep) %>%
  mutate(
    huidig_vrouw = case_when(
      jaar == basisjaar ~ aanbod_personen * per_vrouw_basis,
      jaar == basisjaar + 5 ~ (aanbod_personen * per_vrouw_basis) - (aanbod_personen * per_vrouw_basis * uitstroom_vrouw_basis_vijf),
      jaar == basisjaar + 10 ~ (aanbod_personen * per_vrouw_basis) - (aanbod_personen * per_vrouw_basis * uitstroom_vrouw_basis_tien),
      jaar == basisjaar + 15 ~ (aanbod_personen * per_vrouw_basis) - (aanbod_personen * per_vrouw_basis * uitstroom_vrouw_basis_vijftien),
      jaar == basisjaar + 20 ~ (aanbod_personen * per_vrouw_basis) - (aanbod_personen * per_vrouw_basis * uitstroom_vrouw_basis_twintig),
      TRUE ~ NA_real_
    )
  ) %>%
  ungroup()

# Tussenliggende jaren opvullen met lineaire interpolatie
# Jaren 1-4 (tussen basisjaar en +5)
for (offset in 1:4) {
  data <- data %>%
    group_by(beroepsgroep) %>%
    mutate(
      huidig_vrouw = if_else(
        jaar == basisjaar + offset,
        lag(huidig_vrouw, offset) - (((lag(huidig_vrouw, offset) - lead(huidig_vrouw, 5 - offset)) / 5) * offset),
        huidig_vrouw
      )
    ) %>%
    ungroup()
}

# Jaren 6-9 (tussen +5 en +10)
for (offset in 1:4) {
  data <- data %>%
    group_by(beroepsgroep) %>%
    mutate(
      huidig_vrouw = if_else(
        jaar == basisjaar + 5 + offset,
        lag(huidig_vrouw, offset) - (((lag(huidig_vrouw, offset) - lead(huidig_vrouw, 5 - offset)) / 5) * offset),
        huidig_vrouw
      )
    ) %>%
    ungroup()
}

# Jaren 11-14 (tussen +10 en +15)
for (offset in 1:4) {
  data <- data %>%
    group_by(beroepsgroep) %>%
    mutate(
      huidig_vrouw = if_else(
        jaar == basisjaar + 10 + offset,
        lag(huidig_vrouw, offset) - (((lag(huidig_vrouw, offset) - lead(huidig_vrouw, 5 - offset)) / 5) * offset),
        huidig_vrouw
      )
    ) %>%
    ungroup()
}

# Jaren 16-19 (tussen +15 en +20)
# KRITIEKE FIX: Stata gebruikt jaar 15 als referentie, NIET het vorige jaar!
# Stata regel 75-78: huidig_vrouw[_n-offset] - (((huidig_vrouw[_n-offset]-huidig_vrouw[_n+(5-offset)])/5)*offset)
for (offset in 1:4) {
  data <- data %>%
    group_by(beroepsgroep) %>%
    mutate(
      huidig_vrouw = if_else(
        jaar == basisjaar + 15 + offset,
        lag(huidig_vrouw, offset) - (((lag(huidig_vrouw, offset) - lead(huidig_vrouw, 5 - offset)) / 5) * offset),
        huidig_vrouw
      )
    ) %>%
    ungroup()
}

### Mannen ###

# Aantal mannen op de jaren waar we gegevens over uitstroom hebben
data <- data %>%
  group_by(beroepsgroep) %>%
  mutate(
    huidig_man = case_when(
      jaar == basisjaar ~ aanbod_personen * (1 - per_vrouw_basis),
      jaar == basisjaar + 5 ~ (aanbod_personen * (1 - per_vrouw_basis)) - (aanbod_personen * (1 - per_vrouw_basis) * uitstroom_man_basis_vijf),
      jaar == basisjaar + 10 ~ (aanbod_personen * (1 - per_vrouw_basis)) - (aanbod_personen * (1 - per_vrouw_basis) * uitstroom_man_basis_tien),
      jaar == basisjaar + 15 ~ (aanbod_personen * (1 - per_vrouw_basis)) - (aanbod_personen * (1 - per_vrouw_basis) * uitstroom_man_basis_vijftien),
      jaar == basisjaar + 20 ~ (aanbod_personen * (1 - per_vrouw_basis)) - (aanbod_personen * (1 - per_vrouw_basis) * uitstroom_man_basis_twintig),
      TRUE ~ NA_real_
    )
  ) %>%
  ungroup()

# Tussenliggende jaren opvullen (zelfde logica als vrouwen)
# Jaren 1-4
for (offset in 1:4) {
  data <- data %>%
    group_by(beroepsgroep) %>%
    mutate(
      huidig_man = if_else(
        jaar == basisjaar + offset,
        lag(huidig_man, offset) - (((lag(huidig_man, offset) - lead(huidig_man, 5 - offset)) / 5) * offset),
        huidig_man
      )
    ) %>%
    ungroup()
}

# Jaren 6-9
for (offset in 1:4) {
  data <- data %>%
    group_by(beroepsgroep) %>%
    mutate(
      huidig_man = if_else(
        jaar == basisjaar + 5 + offset,
        lag(huidig_man, offset) - (((lag(huidig_man, offset) - lead(huidig_man, 5 - offset)) / 5) * offset),
        huidig_man
      )
    ) %>%
    ungroup()
}

# Jaren 11-14
for (offset in 1:4) {
  data <- data %>%
    group_by(beroepsgroep) %>%
    mutate(
      huidig_man = if_else(
        jaar == basisjaar + 10 + offset,
        lag(huidig_man, offset) - (((lag(huidig_man, offset) - lead(huidig_man, 5 - offset)) / 5) * offset),
        huidig_man
      )
    ) %>%
    ungroup()
}

# Jaren 16-19
# KRITIEKE FIX: Stata gebruikt jaar 15 als referentie, NIET het vorige jaar!
for (offset in 1:4) {
  data <- data %>%
    group_by(beroepsgroep) %>%
    mutate(
      huidig_man = if_else(
        jaar == basisjaar + 15 + offset,
        lag(huidig_man, offset) - (((lag(huidig_man, offset) - lead(huidig_man, 5 - offset)) / 5) * offset),
        huidig_man
      )
    ) %>%
    ungroup()
}

### Totaal ###
data <- data %>%
  mutate(huidig_totaal = huidig_vrouw + huidig_man)

################################################################################
# Stap 2: Groep in opleiding in basisjaar
################################################################################

# Bereken per jaar hoeveel vrouwen/mannen die nu in opleiding zijn
# beschikbaar zijn/komen voor de arbeidsmarkt

### Vrouwen ###

# Hulpvariabele extern rendement maken voor jaren waarin we het rendement kennen
data <- data %>%
  group_by(beroepsgroep) %>%
  mutate(
    extern_rendement_vrouw = case_when(
      jaar == basisjaar ~ 0,
      jaar == basisjaar + 1 ~ extern_rendement_vrouw_1jaar,
      jaar == basisjaar + 5 ~ extern_rendement_vrouw_5jaar,
      jaar == basisjaar + 10 ~ extern_rendement_vrouw_10jaar,
      jaar == basisjaar + 15 ~ extern_rendement_vrouw_15jaar,
      TRUE ~ NA_real_
    )
  ) %>%
  ungroup()

# Voor de tussenliggende jaren het rendement opvullen
# Jaren 2-4 (tussen 1 en 5)
for (offset in 1:3) {
  data <- data %>%
    group_by(beroepsgroep) %>%
    mutate(
      extern_rendement_vrouw = if_else(
        jaar == basisjaar + 1 + offset,
        lag(extern_rendement_vrouw, offset) - (((lag(extern_rendement_vrouw, offset) - lead(extern_rendement_vrouw, 4 - offset)) / 4) * offset),
        extern_rendement_vrouw
      )
    ) %>%
    ungroup()
}

# Jaren 6-9 (tussen 5 en 10)
for (offset in 1:4) {
  data <- data %>%
    group_by(beroepsgroep) %>%
    mutate(
      extern_rendement_vrouw = if_else(
        jaar == basisjaar + 5 + offset,
        lag(extern_rendement_vrouw, 1) - (((lag(extern_rendement_vrouw, 1) - lead(extern_rendement_vrouw, 5 - offset)) / 5) * offset),
        extern_rendement_vrouw
      )
    ) %>%
    ungroup()
}

# Jaren 11-14 (tussen 10 en 15)
for (offset in 1:4) {
  data <- data %>%
    group_by(beroepsgroep) %>%
    mutate(
      extern_rendement_vrouw = if_else(
        jaar == basisjaar + 10 + offset,
        lag(extern_rendement_vrouw, 1) - (((lag(extern_rendement_vrouw, 1) - lead(extern_rendement_vrouw, 5 - offset)) / 5) * offset),
        extern_rendement_vrouw
      )
    ) %>%
    ungroup()
}

# Jaren 16-20 (extrapolatie na 15)
data <- data %>%
  group_by(beroepsgroep) %>%
  mutate(
    extern_rendement_vrouw = case_when(
      jaar == basisjaar + 16 ~ lag(extern_rendement_vrouw, 1) - (((lag(extern_rendement_vrouw, 6) - lag(extern_rendement_vrouw, 1)) / 5) * 1),
      jaar == basisjaar + 17 ~ lag(extern_rendement_vrouw, 2) - (((lag(extern_rendement_vrouw, 7) - lag(extern_rendement_vrouw, 2)) / 5) * 2),
      jaar == basisjaar + 18 ~ lag(extern_rendement_vrouw, 3) - (((lag(extern_rendement_vrouw, 8) - lag(extern_rendement_vrouw, 3)) / 5) * 3),
      jaar == basisjaar + 19 ~ lag(extern_rendement_vrouw, 4) - (((lag(extern_rendement_vrouw, 9) - lag(extern_rendement_vrouw, 4)) / 5) * 4),
      jaar == basisjaar + 20 ~ lag(extern_rendement_vrouw, 5) - (((lag(extern_rendement_vrouw, 10) - lag(extern_rendement_vrouw, 5)) / 5) * 5),
      TRUE ~ extern_rendement_vrouw
    )
  ) %>%
  ungroup()

# Omzetten naar totaal rendement waarbij rekening gehouden wordt met
# het aantal jaren dat men uit opleiding is
data <- data %>%
  group_by(beroepsgroep) %>%
  mutate(
    extern_rendement_vrouw_injaarx = if_else(
      jaar %in% c(basisjaar, basisjaar + 1),
      extern_rendement_vrouw,
      NA_real_
    )
  ) %>%
  ungroup()

# Complex loop voor jaren 2-20 (Stata lines 161-176)
# Dit is de meest complexe berekening in het hele script
for (n in 2:20) {
  # Bepalen welke jaren meegenomen worden per jaar
  # KRITIEKE FIX: gebruik jaar[n] als vaste waarde, NIET lead(jaar, 21-n)!
  # Stata: jaar[`n'] betekent de n-de rij van de jaar kolom (vaste waarde)
  # R: data$jaar[n] binnen group_by context

  data <- data %>%
    group_by(beroepsgroep) %>%
    mutate(
      # Haal jaar_n op als vaste waarde (n-de rij binnen group)
      jaar_n = jaar[n],
      # Haal ook jaar_n_plus_1 op voor de laatste conditie
      jaar_n_plus_1 = if(n < n()) jaar[n + 1] else NA_real_,

      # Conditie 1: jaar[n] >= (jaar-1) EN (jaar[n] - (jaar-1)) < ceil(opleidingsduur)
      i_temp = if_else(
        (jaar_n >= (jaar - 1)) & ((jaar_n - (jaar - 1)) < ceiling(opleidingsduur)),
        1,
        NA_real_
      ),
      # Conditie 2: exclusie voor basisjaar
      i_temp = if_else(
        (jaar == basisjaar) & ((jaar - basisjaar) < ceiling(opleidingsduur)),
        NA_real_,
        i_temp
      ),
      # Conditie 3: extra exclusie voor non-integer opleidingsduur
      i_temp = if_else(
        (n > opleidingsduur) & ((jaar - basisjaar) >= n) & (opleidingsduur != ceiling(opleidingsduur)),
        NA_real_,
        i_temp
      ),
      # Conditie 4: speciale inclusie voor non-integer opleidingsduur
      i_temp = if_else(
        (n > opleidingsduur) & (jaar == (jaar_n_plus_1 - ceiling(opleidingsduur))) & (opleidingsduur != ceiling(opleidingsduur)) & !is.na(jaar_n_plus_1),
        1,
        i_temp
      )
    ) %>%
    ungroup()

  # Gemiddeld rendement bepalen
  data <- data %>%
    group_by(beroepsgroep) %>%
    mutate(
      hulpextern = if_else(!is.na(i_temp), sum(extern_rendement_vrouw[i_temp == 1], na.rm = TRUE), NA_real_),
      hulpextern2 = case_when(
        !is.na(i_temp) & ((jaar - (basisjaar + 1)) < ceiling(opleidingsduur)) ~ hulpextern / (jaar - basisjaar),
        !is.na(i_temp) & ((jaar - (basisjaar + 1)) >= ceiling(opleidingsduur)) ~ hulpextern / ceiling(opleidingsduur),
        TRUE ~ NA_real_
      )
    ) %>%
    ungroup()

  # Wegschrijven naar goede variabele
  data <- data %>%
    group_by(beroepsgroep) %>%
    mutate(
      extern_rendement_vrouw_injaarx = if_else(
        is.na(extern_rendement_vrouw_injaarx),
        hulpextern2,
        extern_rendement_vrouw_injaarx
      ),
      extern_rendement_vrouw_injaarx = if_else(
        is.na(extern_rendement_vrouw_injaarx) & !is.na(lag(hulpextern2, 1)) &
          (n > ceiling(opleidingsduur)) & (opleidingsduur != ceiling(opleidingsduur)),
        lag(hulpextern2, 1),
        extern_rendement_vrouw_injaarx
      )
    ) %>%
    select(-hulpextern, -hulpextern2, -i_temp, -jaar_n, -jaar_n_plus_1) %>%
    ungroup()
}

# Berekenen aantal per jaar uitstroom uit de opleiding
data <- data %>%
  mutate(
    n_vrouw_uit_nuopl = if_else(
      (jaar - basisjaar) <= opleidingsduur,
      n_inopleiding_perjaar * per_vrouw_opleiding * intern_rendement * (jaar - basisjaar) * extern_rendement_vrouw_injaarx,
      n_inopleiding_perjaar * per_vrouw_opleiding * intern_rendement * opleidingsduur * extern_rendement_vrouw_injaarx
    )
  )

### Mannen ###
# Exact dezelfde logica als voor vrouwen, maar dan met man variabelen

data <- data %>%
  group_by(beroepsgroep) %>%
  mutate(
    extern_rendement_man = case_when(
      jaar == basisjaar ~ 0,
      jaar == basisjaar + 1 ~ extern_rendement_man_1jaar,
      jaar == basisjaar + 5 ~ extern_rendement_man_5jaar,
      jaar == basisjaar + 10 ~ extern_rendement_man_10jaar,
      jaar == basisjaar + 15 ~ extern_rendement_man_15jaar,
      TRUE ~ NA_real_
    )
  ) %>%
  ungroup()

# Tussenliggende jaren opvullen (jaren 2-4)
for (offset in 1:3) {
  data <- data %>%
    group_by(beroepsgroep) %>%
    mutate(
      extern_rendement_man = if_else(
        jaar == basisjaar + 1 + offset,
        lag(extern_rendement_man, offset) - (((lag(extern_rendement_man, offset) - lead(extern_rendement_man, 4 - offset)) / 4) * offset),
        extern_rendement_man
      )
    ) %>%
    ungroup()
}

# Jaren 6-9
for (offset in 1:4) {
  data <- data %>%
    group_by(beroepsgroep) %>%
    mutate(
      extern_rendement_man = if_else(
        jaar == basisjaar + 5 + offset,
        lag(extern_rendement_man, 1) - (((lag(extern_rendement_man, 1) - lead(extern_rendement_man, 5 - offset)) / 5) * offset),
        extern_rendement_man
      )
    ) %>%
    ungroup()
}

# Jaren 11-14
for (offset in 1:4) {
  data <- data %>%
    group_by(beroepsgroep) %>%
    mutate(
      extern_rendement_man = if_else(
        jaar == basisjaar + 10 + offset,
        lag(extern_rendement_man, 1) - (((lag(extern_rendement_man, 1) - lead(extern_rendement_man, 5 - offset)) / 5) * offset),
        extern_rendement_man
      )
    ) %>%
    ungroup()
}

# Jaren 16-20
data <- data %>%
  group_by(beroepsgroep) %>%
  mutate(
    extern_rendement_man = case_when(
      jaar == basisjaar + 16 ~ lag(extern_rendement_man, 1) - (((lag(extern_rendement_man, 6) - lag(extern_rendement_man, 1)) / 5) * 1),
      jaar == basisjaar + 17 ~ lag(extern_rendement_man, 2) - (((lag(extern_rendement_man, 7) - lag(extern_rendement_man, 2)) / 5) * 2),
      jaar == basisjaar + 18 ~ lag(extern_rendement_man, 3) - (((lag(extern_rendement_man, 8) - lag(extern_rendement_man, 3)) / 5) * 3),
      jaar == basisjaar + 19 ~ lag(extern_rendement_man, 4) - (((lag(extern_rendement_man, 9) - lag(extern_rendement_man, 4)) / 5) * 4),
      jaar == basisjaar + 20 ~ lag(extern_rendement_man, 5) - (((lag(extern_rendement_man, 10) - lag(extern_rendement_man, 5)) / 5) * 5),
      TRUE ~ extern_rendement_man
    )
  ) %>%
  ungroup()

# Omzetten naar injaarx
data <- data %>%
  mutate(
    extern_rendement_man_injaarx = if_else(
      jaar %in% c(basisjaar, basisjaar + 1),
      extern_rendement_man,
      NA_real_
    )
  )

# Loop voor jaren 2-20 (zelfde logica als vrouwen)
# KRITIEKE FIX: gebruik jaar[n] als vaste waarde, NIET lead(jaar, 21-n)!
for (n in 2:20) {
  data <- data %>%
    group_by(beroepsgroep) %>%
    mutate(
      # Haal jaar_n op als vaste waarde (n-de rij binnen group)
      jaar_n = jaar[n],
      jaar_n_plus_1 = if(n < n()) jaar[n + 1] else NA_real_,

      # Conditie 1: jaar[n] >= (jaar-1) EN (jaar[n] - (jaar-1)) < ceil(opleidingsduur)
      i_temp = if_else(
        (jaar_n >= (jaar - 1)) & ((jaar_n - (jaar - 1)) < ceiling(opleidingsduur)),
        1,
        NA_real_
      ),
      # Conditie 2: Als jaar==basisjaar, zet i_temp op NA
      i_temp = if_else(
        (jaar == basisjaar) & ((jaar - basisjaar) < ceiling(opleidingsduur)),
        NA_real_,
        i_temp
      ),
      # Conditie 3: Speciale behandeling bij fractional opleidingsduur
      i_temp = if_else(
        (n > opleidingsduur) & ((jaar - basisjaar) >= n) & (opleidingsduur != ceiling(opleidingsduur)),
        NA_real_,
        i_temp
      ),
      # Conditie 4: Extra rij toevoegen bij fractional duration
      i_temp = if_else(
        (n > opleidingsduur) & (jaar == (jaar_n_plus_1 - ceiling(opleidingsduur))) & (opleidingsduur != ceiling(opleidingsduur)),
        1,
        i_temp
      )
    ) %>%
    ungroup()

  data <- data %>%
    group_by(beroepsgroep) %>%
    mutate(
      hulpextern = if_else(!is.na(i_temp), sum(extern_rendement_man[i_temp == 1], na.rm = TRUE), NA_real_),
      hulpextern2 = case_when(
        !is.na(i_temp) & ((jaar - (basisjaar + 1)) < ceiling(opleidingsduur)) ~ hulpextern / (jaar - basisjaar),
        !is.na(i_temp) & ((jaar - (basisjaar + 1)) >= ceiling(opleidingsduur)) ~ hulpextern / ceiling(opleidingsduur),
        TRUE ~ NA_real_
      )
    ) %>%
    ungroup()

  data <- data %>%
    group_by(beroepsgroep) %>%
    mutate(
      extern_rendement_man_injaarx = if_else(
        is.na(extern_rendement_man_injaarx),
        hulpextern2,
        extern_rendement_man_injaarx
      ),
      extern_rendement_man_injaarx = if_else(
        is.na(extern_rendement_man_injaarx) & !is.na(lag(hulpextern2, 1)) &
          (n > ceiling(opleidingsduur)) & (opleidingsduur != ceiling(opleidingsduur)),
        lag(hulpextern2, 1),
        extern_rendement_man_injaarx
      )
    ) %>%
    select(-hulpextern, -hulpextern2, -i_temp, -jaar_n, -jaar_n_plus_1) %>%
    ungroup()
}

# Berekenen aantal per jaar
data <- data %>%
  mutate(
    n_man_uit_nuopl = if_else(
      (jaar - basisjaar) <= opleidingsduur,
      n_inopleiding_perjaar * (1 - per_vrouw_opleiding) * intern_rendement * (jaar - basisjaar) * extern_rendement_man_injaarx,
      n_inopleiding_perjaar * (1 - per_vrouw_opleiding) * intern_rendement * opleidingsduur * extern_rendement_man_injaarx
    )
  )

### Totaal ###
data <- data %>%
  mutate(n_totaal_uit_nuopl = n_vrouw_uit_nuopl + n_man_uit_nuopl)

################################################################################
# Stap 3: Groep in opleiding tot 1e bijsturingsjaar
################################################################################

# Dit is vergelijkbaar met stap 2, maar alleen voor jaren tot bijsturingsjaar

### Vrouwen ###

# Hulpvariabele extern rendement 2
data <- data %>%
  mutate(
    extern_rendement_vrouw2 = case_when(
      jaar == basisjaar ~ 0,
      jaar == basisjaar + 1 ~ extern_rendement_vrouw_1jaar2,
      jaar == basisjaar + 5 ~ extern_rendement_vrouw_5jaar2,
      jaar == basisjaar + 10 ~ extern_rendement_vrouw_10jaar2,
      jaar == basisjaar + 15 ~ extern_rendement_vrouw_15jaar2,
      TRUE ~ NA_real_
    )
  )

# Tussenliggende jaren opvullen (zelfde als stap 2)
for (offset in 1:3) {
  data <- data %>%
    group_by(beroepsgroep) %>%
    mutate(
      extern_rendement_vrouw2 = if_else(
        jaar == basisjaar + 1 + offset,
        lag(extern_rendement_vrouw2, offset) - (((lag(extern_rendement_vrouw2, offset) - lead(extern_rendement_vrouw2, 4 - offset)) / 4) * offset),
        extern_rendement_vrouw2
      )
    ) %>%
    ungroup()
}

for (offset in 1:4) {
  data <- data %>%
    group_by(beroepsgroep) %>%
    mutate(
      extern_rendement_vrouw2 = if_else(
        jaar == basisjaar + 5 + offset,
        lag(extern_rendement_vrouw2, 1) - (((lag(extern_rendement_vrouw2, 1) - lead(extern_rendement_vrouw2, 5 - offset)) / 5) * offset),
        extern_rendement_vrouw2
      )
    ) %>%
    ungroup()
}

for (offset in 1:4) {
  data <- data %>%
    group_by(beroepsgroep) %>%
    mutate(
      extern_rendement_vrouw2 = if_else(
        jaar == basisjaar + 10 + offset,
        lag(extern_rendement_vrouw2, 1) - (((lag(extern_rendement_vrouw2, 1) - lead(extern_rendement_vrouw2, 5 - offset)) / 5) * offset),
        extern_rendement_vrouw2
      )
    ) %>%
    ungroup()
}

data <- data %>%
  group_by(beroepsgroep) %>%
  mutate(
    extern_rendement_vrouw2 = case_when(
      jaar == basisjaar + 16 ~ lag(extern_rendement_vrouw2, 1) - (((lag(extern_rendement_vrouw2, 6) - lag(extern_rendement_vrouw2, 1)) / 5) * 1),
      jaar == basisjaar + 17 ~ lag(extern_rendement_vrouw2, 2) - (((lag(extern_rendement_vrouw2, 7) - lag(extern_rendement_vrouw2, 2)) / 5) * 2),
      jaar == basisjaar + 18 ~ lag(extern_rendement_vrouw2, 3) - (((lag(extern_rendement_vrouw2, 8) - lag(extern_rendement_vrouw2, 3)) / 5) * 3),
      jaar == basisjaar + 19 ~ lag(extern_rendement_vrouw2, 4) - (((lag(extern_rendement_vrouw2, 9) - lag(extern_rendement_vrouw2, 4)) / 5) * 4),
      jaar == basisjaar + 20 ~ lag(extern_rendement_vrouw2, 5) - (((lag(extern_rendement_vrouw2, 10) - lag(extern_rendement_vrouw2, 5)) / 5) * 5),
      TRUE ~ extern_rendement_vrouw2
    )
  ) %>%
  ungroup()

# Omzetten naar injaarx2
data <- data %>%
  mutate(
    extern_rendement_vrouw_injaarx2 = if_else(
      jaar == basisjaar,
      extern_rendement_vrouw,
      NA_real_
    ),
    extern_rendement_vrouw_injaarx2 = if_else(
      (jaar - basisjaar) <= ceiling(opleidingsduur2),
      1,
      extern_rendement_vrouw_injaarx2
    )
  )

# KRITIEKE FIX: In Stata blijft hulpextern2 BESTAAN over iteraties heen!
# Initialiseer hulpextern2 kolom voor alle iteraties
data <- data %>%
  mutate(hulpextern2_cohort2 = NA_real_)

# Loop voor jaren 1-20 (aangepast voor bijsturingsjaar logica)
# KRITIEKE FIX: gebruik jaar[n] als vaste waarde, NIET lead(jaar, 21-n)!
for (n in 1:20) {
  data <- data %>%
    group_by(beroepsgroep) %>%
    mutate(
      # Haal jaar_n op als vaste waarde (n-de rij binnen group)
      jaar_n = jaar[n],

      # Conditie 1: jaar[n] >= (jaar-1) EN (jaar[n] - (jaar-1)) < (bijsturingsjaar-basisjaar)
      i_temp = if_else(
        (jaar_n >= (jaar - 1)) & ((jaar_n - (jaar - 1)) < (bijsturingsjaar - basisjaar)),
        1,
        NA_real_
      ),
      # Conditie 2: exclusie voor basisjaar
      i_temp = if_else(
        (jaar == basisjaar) & ((jaar - basisjaar) < (bijsturingsjaar - basisjaar)),
        NA_real_,
        i_temp
      )
    ) %>%
    ungroup()

  data <- data %>%
    group_by(beroepsgroep) %>%
    mutate(
      hulpextern = if_else(!is.na(i_temp), sum(extern_rendement_vrouw2[i_temp == 1], na.rm = TRUE), NA_real_),
      # Update hulpextern2_cohort2 als i_temp niet NA is
      hulpextern2_cohort2 = case_when(
        !is.na(i_temp) & ((jaar - (basisjaar + 1)) < (bijsturingsjaar - basisjaar)) ~ hulpextern / (jaar - basisjaar),
        !is.na(i_temp) & ((jaar - (basisjaar + 1)) >= (bijsturingsjaar - basisjaar)) ~ hulpextern / (bijsturingsjaar - basisjaar),
        # BELANGRIJK: Behoud oude waarde als i_temp NA is!
        TRUE ~ hulpextern2_cohort2
      )
    ) %>%
    ungroup()

  # KRITIEK: Stata regel 303 zegt:
  # replace extern_rendement_vrouw_injaarx2=hulpextern2[_n-(ceil(opleidingsduur2))] if extern_rendement_vrouw_injaarx2==.
  # Nu kan hulpextern2_cohort2[i-offset] een waarde hebben uit eerdere iteraties!

  offset <- as.integer(ceiling(unique(data$opleidingsduur2)[1]))

  for (i in (offset + 1):nrow(data)) {
    if (is.na(data$extern_rendement_vrouw_injaarx2[i])) {
      data$extern_rendement_vrouw_injaarx2[i] <- data$hulpextern2_cohort2[i - offset]
    }
  }

  # Cleanup alleen i_temp en hulpextern (NIET hulpextern2_cohort2!)
  data <- data %>%
    select(-hulpextern, -i_temp, -jaar_n)
}

# Nu pas cleanup hulpextern2_cohort2 na alle iteraties
data <- data %>%
  select(-hulpextern2_cohort2)

# Berekenen aantal per jaar
data <- data %>%
  mutate(
    n_vrouw_uit_tussopl = case_when(
      ((jaar - basisjaar - opleidingsduur2) > 0) & ((jaar - basisjaar - opleidingsduur2) < (bijsturingsjaar - basisjaar)) ~
        n_inopleiding_perjaar2 * per_vrouw_opleiding2 * intern_rendement2 * (jaar - opleidingsduur2 - basisjaar) * extern_rendement_vrouw_injaarx2,
      (jaar - basisjaar - opleidingsduur2) >= (bijsturingsjaar - basisjaar) ~
        n_inopleiding_perjaar2 * per_vrouw_opleiding2 * intern_rendement2 * (bijsturingsjaar - basisjaar) * extern_rendement_vrouw_injaarx2,
      (jaar - basisjaar - opleidingsduur2) <= 0 ~
        n_inopleiding_perjaar2 * per_vrouw_opleiding2 * intern_rendement2 * 0 * extern_rendement_vrouw_injaarx2,
      TRUE ~ 0
    )
  )

### Mannen ###
# Zelfde logica als vrouwen

data <- data %>%
  mutate(
    extern_rendement_man2 = case_when(
      jaar == basisjaar ~ 0,
      jaar == basisjaar + 1 ~ extern_rendement_man_1jaar2,
      jaar == basisjaar + 5 ~ extern_rendement_man_5jaar2,
      jaar == basisjaar + 10 ~ extern_rendement_man_10jaar2,
      jaar == basisjaar + 15 ~ extern_rendement_man_15jaar2,
      TRUE ~ NA_real_
    )
  )

# Tussenliggende jaren (identiek aan vrouwen2)
for (offset in 1:3) {
  data <- data %>%
    group_by(beroepsgroep) %>%
    mutate(
      extern_rendement_man2 = if_else(
        jaar == basisjaar + 1 + offset,
        lag(extern_rendement_man2, offset) - (((lag(extern_rendement_man2, offset) - lead(extern_rendement_man2, 4 - offset)) / 4) * offset),
        extern_rendement_man2
      )
    ) %>%
    ungroup()
}

for (offset in 1:4) {
  data <- data %>%
    group_by(beroepsgroep) %>%
    mutate(
      extern_rendement_man2 = if_else(
        jaar == basisjaar + 5 + offset,
        lag(extern_rendement_man2, 1) - (((lag(extern_rendement_man2, 1) - lead(extern_rendement_man2, 5 - offset)) / 5) * offset),
        extern_rendement_man2
      )
    ) %>%
    ungroup()
}

for (offset in 1:4) {
  data <- data %>%
    group_by(beroepsgroep) %>%
    mutate(
      extern_rendement_man2 = if_else(
        jaar == basisjaar + 10 + offset,
        lag(extern_rendement_man2, 1) - (((lag(extern_rendement_man2, 1) - lead(extern_rendement_man2, 5 - offset)) / 5) * offset),
        extern_rendement_man2
      )
    ) %>%
    ungroup()
}

data <- data %>%
  group_by(beroepsgroep) %>%
  mutate(
    extern_rendement_man2 = case_when(
      jaar == basisjaar + 16 ~ lag(extern_rendement_man2, 1) - (((lag(extern_rendement_man2, 6) - lag(extern_rendement_man2, 1)) / 5) * 1),
      jaar == basisjaar + 17 ~ lag(extern_rendement_man2, 2) - (((lag(extern_rendement_man2, 7) - lag(extern_rendement_man2, 2)) / 5) * 2),
      jaar == basisjaar + 18 ~ lag(extern_rendement_man2, 3) - (((lag(extern_rendement_man2, 8) - lag(extern_rendement_man2, 3)) / 5) * 3),
      jaar == basisjaar + 19 ~ lag(extern_rendement_man2, 4) - (((lag(extern_rendement_man2, 9) - lag(extern_rendement_man2, 4)) / 5) * 4),
      jaar == basisjaar + 20 ~ lag(extern_rendement_man2, 5) - (((lag(extern_rendement_man2, 10) - lag(extern_rendement_man2, 5)) / 5) * 5),
      TRUE ~ extern_rendement_man2
    )
  ) %>%
  ungroup()

data <- data %>%
  mutate(
    extern_rendement_man_injaarx2 = if_else(
      jaar == basisjaar,
      extern_rendement_man2,
      NA_real_
    ),
    extern_rendement_man_injaarx2 = if_else(
      (jaar - basisjaar) <= ceiling(opleidingsduur2),
      1,
      extern_rendement_man_injaarx2
    )
  )

# KRITIEKE FIX: Zelfde bug als bij vrouwen - gebruik jaar[n] ipv lead!
for (n in 1:20) {
  data <- data %>%
    group_by(beroepsgroep) %>%
    mutate(
      jaar_n = jaar[n],
      i_temp = if_else(
        (jaar_n >= (jaar - 1)) & ((jaar_n - (jaar - 1)) < (bijsturingsjaar - basisjaar)),
        1,
        NA_real_
      ),
      i_temp = if_else(
        (jaar == basisjaar) & ((jaar - basisjaar) < (bijsturingsjaar - basisjaar)),
        NA_real_,
        i_temp
      )
    ) %>%
    ungroup()

  data <- data %>%
    group_by(beroepsgroep) %>%
    mutate(
      hulpextern = if_else(!is.na(i_temp), sum(extern_rendement_man2[i_temp == 1], na.rm = TRUE), NA_real_),
      hulpextern2 = case_when(
        !is.na(i_temp) & ((jaar - (basisjaar + 1)) < (bijsturingsjaar - basisjaar)) ~ hulpextern / (jaar - basisjaar),
        !is.na(i_temp) & ((jaar - (basisjaar + 1)) >= (bijsturingsjaar - basisjaar)) ~ hulpextern / (bijsturingsjaar - basisjaar),
        TRUE ~ NA_real_
      )
    ) %>%
    ungroup()

  data <- data %>%
    group_by(beroepsgroep) %>%
    mutate(
      extern_rendement_man_injaarx2 = if_else(
        is.na(extern_rendement_man_injaarx2),
        lag(hulpextern2, as.integer(ceiling(first(opleidingsduur2)))),
        extern_rendement_man_injaarx2
      )
    ) %>%
    select(-hulpextern, -hulpextern2, -i_temp, -jaar_n) %>%
    ungroup()
}

data <- data %>%
  mutate(
    n_man_uit_tussopl = case_when(
      ((jaar - basisjaar - opleidingsduur2) > 0) & ((jaar - basisjaar - opleidingsduur2) < (bijsturingsjaar - basisjaar)) ~
        n_inopleiding_perjaar2 * (1 - per_vrouw_opleiding2) * intern_rendement2 * (jaar - opleidingsduur2 - basisjaar) * extern_rendement_man_injaarx2,
      (jaar - basisjaar - opleidingsduur2) >= (bijsturingsjaar - basisjaar) ~
        n_inopleiding_perjaar2 * (1 - per_vrouw_opleiding2) * intern_rendement2 * (bijsturingsjaar - basisjaar) * extern_rendement_man_injaarx2,
      (jaar - basisjaar - opleidingsduur2) <= 0 ~
        n_inopleiding_perjaar2 * (1 - per_vrouw_opleiding2) * intern_rendement2 * 0 * extern_rendement_man_injaarx2,
      TRUE ~ 0
    )
  )

### Totaal ###
data <- data %>%
  mutate(n_totaal_uit_tussopl = n_vrouw_uit_tussopl + n_man_uit_tussopl)

################################################################################
# Stap 4: Groep in opleiding vanaf het 1e bijsturingsjaar
################################################################################

# Vergelijkbaar met stap 2 en 3, maar start vanaf bijsturingsjaar

### Vrouwen ###

data <- data %>%
  mutate(
    extern_rendement_vrouw3 = case_when(
      jaar == basisjaar ~ 0,
      jaar == basisjaar + 1 ~ extern_rendement_vrouw_1jaar3,
      jaar == basisjaar + 5 ~ extern_rendement_vrouw_5jaar3,
      jaar == basisjaar + 10 ~ extern_rendement_vrouw_10jaar3,
      jaar == basisjaar + 15 ~ extern_rendement_vrouw_15jaar3,
      TRUE ~ NA_real_
    )
  )

# Tussenliggende jaren (zelfde patroon)
for (offset in 1:3) {
  data <- data %>%
    group_by(beroepsgroep) %>%
    mutate(
      extern_rendement_vrouw3 = if_else(
        jaar == basisjaar + 1 + offset,
        lag(extern_rendement_vrouw3, offset) - (((lag(extern_rendement_vrouw3, offset) - lead(extern_rendement_vrouw3, 4 - offset)) / 4) * offset),
        extern_rendement_vrouw3
      )
    ) %>%
    ungroup()
}

for (offset in 1:4) {
  data <- data %>%
    group_by(beroepsgroep) %>%
    mutate(
      extern_rendement_vrouw3 = if_else(
        jaar == basisjaar + 5 + offset,
        lag(extern_rendement_vrouw3, 1) - (((lag(extern_rendement_vrouw3, 1) - lead(extern_rendement_vrouw3, 5 - offset)) / 5) * offset),
        extern_rendement_vrouw3
      )
    ) %>%
    ungroup()
}

for (offset in 1:4) {
  data <- data %>%
    group_by(beroepsgroep) %>%
    mutate(
      extern_rendement_vrouw3 = if_else(
        jaar == basisjaar + 10 + offset,
        lag(extern_rendement_vrouw3, 1) - (((lag(extern_rendement_vrouw3, 1) - lead(extern_rendement_vrouw3, 5 - offset)) / 5) * offset),
        extern_rendement_vrouw3
      )
    ) %>%
    ungroup()
}

data <- data %>%
  group_by(beroepsgroep) %>%
  mutate(
    extern_rendement_vrouw3 = case_when(
      jaar == basisjaar + 16 ~ lag(extern_rendement_vrouw3, 1) - (((lag(extern_rendement_vrouw3, 6) - lag(extern_rendement_vrouw3, 1)) / 5) * 1),
      jaar == basisjaar + 17 ~ lag(extern_rendement_vrouw3, 2) - (((lag(extern_rendement_vrouw3, 7) - lag(extern_rendement_vrouw3, 2)) / 5) * 2),
      jaar == basisjaar + 18 ~ lag(extern_rendement_vrouw3, 3) - (((lag(extern_rendement_vrouw3, 8) - lag(extern_rendement_vrouw3, 3)) / 5) * 3),
      jaar == basisjaar + 19 ~ lag(extern_rendement_vrouw3, 4) - (((lag(extern_rendement_vrouw3, 9) - lag(extern_rendement_vrouw3, 4)) / 5) * 4),
      jaar == basisjaar + 20 ~ lag(extern_rendement_vrouw3, 5) - (((lag(extern_rendement_vrouw3, 10) - lag(extern_rendement_vrouw3, 5)) / 5) * 5),
      TRUE ~ extern_rendement_vrouw3
    )
  ) %>%
  ungroup()

data <- data %>%
  mutate(
    extern_rendement_vrouw_injaarx3 = if_else(
      jaar == basisjaar,
      extern_rendement_vrouw3,
      NA_real_
    ),
    extern_rendement_vrouw_injaarx3 = if_else(
      (jaar - basisjaar) <= (ceiling(opleidingsduur3) + (bijsturingsjaar - basisjaar)),
      1,
      extern_rendement_vrouw_injaarx3
    )
  )

for (n in 1:20) {
  data <- data %>%
    group_by(beroepsgroep) %>%
    mutate(
      i_temp = if_else(
        lead(jaar, 21 - n) >= (jaar - 1),
        1,
        NA_real_
      ),
      i_temp = if_else(
        (jaar == basisjaar) & ((jaar - basisjaar) < opleidingsduur3),
        NA_real_,
        i_temp
      )
    ) %>%
    ungroup()

  data <- data %>%
    group_by(beroepsgroep) %>%
    mutate(
      hulpextern = if_else(!is.na(i_temp), sum(extern_rendement_vrouw3[i_temp == 1], na.rm = TRUE), NA_real_),
      hulpextern2 = if_else(!is.na(i_temp), hulpextern / (jaar - basisjaar), NA_real_)
    ) %>%
    ungroup()

  data <- data %>%
    group_by(beroepsgroep) %>%
    mutate(
      extern_rendement_vrouw_injaarx3 = if_else(
        is.na(extern_rendement_vrouw_injaarx3),
        lag(hulpextern2, as.integer(ceiling(first(opleidingsduur3)) + (first(bijsturingsjaar) - first(basisjaar)))),
        extern_rendement_vrouw_injaarx3
      )
    ) %>%
    select(-hulpextern, -hulpextern2, -i_temp) %>%
    ungroup()
}

data <- data %>%
  mutate(
    n_vrouw_nabijst = n_inopleiding_perjaar3 * per_vrouw_opleiding3 * intern_rendement3 *
      (jaar - opleidingsduur3 - (bijsturingsjaar - basisjaar) - basisjaar) * extern_rendement_vrouw_injaarx3,
    n_vrouw_nabijst = if_else(
      (jaar - bijsturingsjaar - opleidingsduur3) < 0,
      n_inopleiding_perjaar3 * per_vrouw_opleiding3 * intern_rendement3 * 0 * extern_rendement_vrouw_injaarx3,
      n_vrouw_nabijst
    )
  )

### Mannen ###

data <- data %>%
  mutate(
    extern_rendement_man3 = case_when(
      jaar == basisjaar ~ 0,
      jaar == basisjaar + 1 ~ extern_rendement_man_1jaar3,
      jaar == basisjaar + 5 ~ extern_rendement_man_5jaar3,
      jaar == basisjaar + 10 ~ extern_rendement_man_10jaar3,
      jaar == basisjaar + 15 ~ extern_rendement_man_15jaar3,
      TRUE ~ NA_real_
    )
  )

for (offset in 1:3) {
  data <- data %>%
    group_by(beroepsgroep) %>%
    mutate(
      extern_rendement_man3 = if_else(
        jaar == basisjaar + 1 + offset,
        lag(extern_rendement_man3, offset) - (((lag(extern_rendement_man3, offset) - lead(extern_rendement_man3, 4 - offset)) / 4) * offset),
        extern_rendement_man3
      )
    ) %>%
    ungroup()
}

for (offset in 1:4) {
  data <- data %>%
    group_by(beroepsgroep) %>%
    mutate(
      extern_rendement_man3 = if_else(
        jaar == basisjaar + 5 + offset,
        lag(extern_rendement_man3, 1) - (((lag(extern_rendement_man3, 1) - lead(extern_rendement_man3, 5 - offset)) / 5) * offset),
        extern_rendement_man3
      )
    ) %>%
    ungroup()
}

for (offset in 1:4) {
  data <- data %>%
    group_by(beroepsgroep) %>%
    mutate(
      extern_rendement_man3 = if_else(
        jaar == basisjaar + 10 + offset,
        lag(extern_rendement_man3, 1) - (((lag(extern_rendement_man3, 1) - lead(extern_rendement_man3, 5 - offset)) / 5) * offset),
        extern_rendement_man3
      )
    ) %>%
    ungroup()
}

data <- data %>%
  group_by(beroepsgroep) %>%
  mutate(
    extern_rendement_man3 = case_when(
      jaar == basisjaar + 16 ~ lag(extern_rendement_man3, 1) - (((lag(extern_rendement_man3, 6) - lag(extern_rendement_man3, 1)) / 5) * 1),
      jaar == basisjaar + 17 ~ lag(extern_rendement_man3, 2) - (((lag(extern_rendement_man3, 7) - lag(extern_rendement_man3, 2)) / 5) * 2),
      jaar == basisjaar + 18 ~ lag(extern_rendement_man3, 3) - (((lag(extern_rendement_man3, 8) - lag(extern_rendement_man3, 3)) / 5) * 3),
      jaar == basisjaar + 19 ~ lag(extern_rendement_man3, 4) - (((lag(extern_rendement_man3, 9) - lag(extern_rendement_man3, 4)) / 5) * 4),
      jaar == basisjaar + 20 ~ lag(extern_rendement_man3, 5) - (((lag(extern_rendement_man3, 10) - lag(extern_rendement_man3, 5)) / 5) * 5),
      TRUE ~ extern_rendement_man3
    )
  ) %>%
  ungroup()

data <- data %>%
  mutate(
    extern_rendement_man_injaarx3 = if_else(
      jaar == basisjaar,
      extern_rendement_man3,
      NA_real_
    ),
    extern_rendement_man_injaarx3 = if_else(
      (jaar - basisjaar) <= (ceiling(opleidingsduur3) + (bijsturingsjaar - basisjaar)),
      1,
      extern_rendement_man_injaarx3
    )
  )

for (n in 1:20) {
  data <- data %>%
    group_by(beroepsgroep) %>%
    mutate(
      i_temp = if_else(
        lead(jaar, 21 - n) >= (jaar - 1),
        1,
        NA_real_
      ),
      i_temp = if_else(
        (jaar == basisjaar) & ((jaar - basisjaar) < opleidingsduur3),
        NA_real_,
        i_temp
      )
    ) %>%
    ungroup()

  data <- data %>%
    group_by(beroepsgroep) %>%
    mutate(
      hulpextern = if_else(!is.na(i_temp), sum(extern_rendement_man3[i_temp == 1], na.rm = TRUE), NA_real_),
      hulpextern2 = if_else(!is.na(i_temp), hulpextern / (jaar - basisjaar), NA_real_)
    ) %>%
    ungroup()

  data <- data %>%
    group_by(beroepsgroep) %>%
    mutate(
      extern_rendement_man_injaarx3 = if_else(
        is.na(extern_rendement_man_injaarx3),
        lag(hulpextern2, as.integer(ceiling(first(opleidingsduur3)) + (first(bijsturingsjaar) - first(basisjaar)))),
        extern_rendement_man_injaarx3
      )
    ) %>%
    select(-hulpextern, -hulpextern2, -i_temp) %>%
    ungroup()
}

data <- data %>%
  mutate(
    n_man_nabijst = n_inopleiding_perjaar3 * (1 - per_vrouw_opleiding3) * intern_rendement3 *
      (jaar - opleidingsduur3 - (bijsturingsjaar - basisjaar) - basisjaar) * extern_rendement_man_injaarx3,
    n_man_nabijst = if_else(
      (jaar - bijsturingsjaar - opleidingsduur3) < 0,
      n_inopleiding_perjaar3 * (1 - per_vrouw_opleiding3) * intern_rendement3 * 0 * extern_rendement_man_injaarx3,
      n_man_nabijst
    )
  )

### Totaal ###
data <- data %>%
  mutate(n_totaal_nabijst = n_vrouw_nabijst + n_man_nabijst)

################################################################################
# Stap 5: Instroom vanuit het buitenland
################################################################################

### Vrouwen ###

data <- data %>%
  group_by(beroepsgroep) %>%
  mutate(
    extern_rendement_vrouwbl = case_when(
      jaar == basisjaar ~ 0,
      jaar == basisjaar + 1 ~ extern_rendement_vrouw_1jaarbl,
      jaar == basisjaar + 5 ~ extern_rendement_vrouw_5jaarbl,
      jaar == basisjaar + 10 ~ extern_rendement_vrouw_10jaarbl,
      jaar == basisjaar + 15 ~ extern_rendement_vrouw_15jaarbl,
      TRUE ~ NA_real_
    )
  ) %>%
  ungroup()

# Tussenliggende jaren
for (offset in 1:3) {
  data <- data %>%
    group_by(beroepsgroep) %>%
    mutate(
      extern_rendement_vrouwbl = if_else(
        jaar == basisjaar + 1 + offset,
        lag(extern_rendement_vrouwbl, offset) - (((lag(extern_rendement_vrouwbl, offset) - lead(extern_rendement_vrouwbl, 4 - offset)) / 4) * offset),
        extern_rendement_vrouwbl
      )
    ) %>%
    ungroup()
}

for (offset in 1:4) {
  data <- data %>%
    group_by(beroepsgroep) %>%
    mutate(
      extern_rendement_vrouwbl = if_else(
        jaar == basisjaar + 5 + offset,
        lag(extern_rendement_vrouwbl, 1) - (((lag(extern_rendement_vrouwbl, 1) - lead(extern_rendement_vrouwbl, 5 - offset)) / 5) * offset),
        extern_rendement_vrouwbl
      )
    ) %>%
    ungroup()
}

for (offset in 1:4) {
  data <- data %>%
    group_by(beroepsgroep) %>%
    mutate(
      extern_rendement_vrouwbl = if_else(
        jaar == basisjaar + 10 + offset,
        lag(extern_rendement_vrouwbl, 1) - (((lag(extern_rendement_vrouwbl, 1) - lead(extern_rendement_vrouwbl, 5 - offset)) / 5) * offset),
        extern_rendement_vrouwbl
      )
    ) %>%
    ungroup()
}

data <- data %>%
  group_by(beroepsgroep) %>%
  mutate(
    extern_rendement_vrouwbl = case_when(
      jaar == basisjaar + 16 ~ lag(extern_rendement_vrouwbl, 1) - (((lag(extern_rendement_vrouwbl, 6) - lag(extern_rendement_vrouwbl, 1)) / 5) * 1),
      jaar == basisjaar + 17 ~ lag(extern_rendement_vrouwbl, 2) - (((lag(extern_rendement_vrouwbl, 7) - lag(extern_rendement_vrouwbl, 2)) / 5) * 2),
      jaar == basisjaar + 18 ~ lag(extern_rendement_vrouwbl, 3) - (((lag(extern_rendement_vrouwbl, 8) - lag(extern_rendement_vrouwbl, 3)) / 5) * 3),
      jaar == basisjaar + 19 ~ lag(extern_rendement_vrouwbl, 4) - (((lag(extern_rendement_vrouwbl, 9) - lag(extern_rendement_vrouwbl, 4)) / 5) * 4),
      jaar == basisjaar + 20 ~ lag(extern_rendement_vrouwbl, 5) - (((lag(extern_rendement_vrouwbl, 10) - lag(extern_rendement_vrouwbl, 5)) / 5) * 5),
      TRUE ~ extern_rendement_vrouwbl
    )
  ) %>%
  ungroup()

data <- data %>%
  mutate(
    extern_rendement_vrouw_injaarxbl = if_else(
      jaar == basisjaar,
      extern_rendement_vrouwbl,
      NA_real_
    )
  )

for (n in 1:21) {
  data <- data %>%
    group_by(beroepsgroep) %>%
    mutate(
      i_temp = if_else(lead(jaar, 21 - n) >= (jaar - 1), 1, NA_real_)
    ) %>%
    ungroup()

  data <- data %>%
    group_by(beroepsgroep) %>%
    mutate(
      hulpextern = if_else(!is.na(i_temp), sum(extern_rendement_vrouwbl[i_temp == 1], na.rm = TRUE), NA_real_),
      hulpextern2 = if_else(!is.na(i_temp), hulpextern / (jaar - basisjaar), NA_real_)
    ) %>%
    ungroup()

  data <- data %>%
    group_by(beroepsgroep) %>%
    mutate(
      extern_rendement_vrouw_injaarxbl = if_else(
        is.na(extern_rendement_vrouw_injaarxbl),
        hulpextern2,
        extern_rendement_vrouw_injaarxbl
      )
    ) %>%
    select(-hulpextern, -hulpextern2, -i_temp) %>%
    ungroup()
}

data <- data %>%
  mutate(
    n_vrouw_buitenland = n_buitenland * per_vrouw_buitenland * (jaar - basisjaar) * extern_rendement_vrouw_injaarxbl
  )

### Mannen ###

data <- data %>%
  group_by(beroepsgroep) %>%
  mutate(
    extern_rendement_manbl = case_when(
      jaar == basisjaar ~ 0,
      jaar == basisjaar + 1 ~ extern_rendement_man_1jaarbl,
      jaar == basisjaar + 5 ~ extern_rendement_man_5jaarbl,
      jaar == basisjaar + 10 ~ extern_rendement_man_10jaarbl,
      jaar == basisjaar + 15 ~ extern_rendement_man_15jaarbl,
      TRUE ~ NA_real_
    )
  ) %>%
  ungroup()

for (offset in 1:3) {
  data <- data %>%
    group_by(beroepsgroep) %>%
    mutate(
      extern_rendement_manbl = if_else(
        jaar == basisjaar + 1 + offset,
        lag(extern_rendement_manbl, offset) - (((lag(extern_rendement_manbl, offset) - lead(extern_rendement_manbl, 4 - offset)) / 4) * offset),
        extern_rendement_manbl
      )
    ) %>%
    ungroup()
}

for (offset in 1:4) {
  data <- data %>%
    group_by(beroepsgroep) %>%
    mutate(
      extern_rendement_manbl = if_else(
        jaar == basisjaar + 5 + offset,
        lag(extern_rendement_manbl, 1) - (((lag(extern_rendement_manbl, 1) - lead(extern_rendement_manbl, 5 - offset)) / 5) * offset),
        extern_rendement_manbl
      )
    ) %>%
    ungroup()
}

for (offset in 1:4) {
  data <- data %>%
    group_by(beroepsgroep) %>%
    mutate(
      extern_rendement_manbl = if_else(
        jaar == basisjaar + 10 + offset,
        lag(extern_rendement_manbl, 1) - (((lag(extern_rendement_manbl, 1) - lead(extern_rendement_manbl, 5 - offset)) / 5) * offset),
        extern_rendement_manbl
      )
    ) %>%
    ungroup()
}

data <- data %>%
  group_by(beroepsgroep) %>%
  mutate(
    extern_rendement_manbl = case_when(
      jaar == basisjaar + 16 ~ lag(extern_rendement_manbl, 1) - (((lag(extern_rendement_manbl, 6) - lag(extern_rendement_manbl, 1)) / 5) * 1),
      jaar == basisjaar + 17 ~ lag(extern_rendement_manbl, 2) - (((lag(extern_rendement_manbl, 7) - lag(extern_rendement_manbl, 2)) / 5) * 2),
      jaar == basisjaar + 18 ~ lag(extern_rendement_manbl, 3) - (((lag(extern_rendement_manbl, 8) - lag(extern_rendement_manbl, 3)) / 5) * 3),
      jaar == basisjaar + 19 ~ lag(extern_rendement_manbl, 4) - (((lag(extern_rendement_manbl, 9) - lag(extern_rendement_manbl, 4)) / 5) * 4),
      jaar == basisjaar + 20 ~ lag(extern_rendement_manbl, 5) - (((lag(extern_rendement_manbl, 10) - lag(extern_rendement_manbl, 5)) / 5) * 5),
      TRUE ~ extern_rendement_manbl
    )
  ) %>%
  ungroup()

data <- data %>%
  mutate(
    extern_rendement_man_injaarxbl = if_else(
      jaar == basisjaar,
      extern_rendement_manbl,
      NA_real_
    )
  )

for (n in 1:21) {
  data <- data %>%
    group_by(beroepsgroep) %>%
    mutate(
      i_temp = if_else(lead(jaar, 21 - n) >= (jaar - 1), 1, NA_real_
      )
    ) %>%
    ungroup()

  data <- data %>%
    group_by(beroepsgroep) %>%
    mutate(
      hulpextern = if_else(!is.na(i_temp), sum(extern_rendement_manbl[i_temp == 1], na.rm = TRUE), NA_real_),
      hulpextern2 = if_else(!is.na(i_temp), hulpextern / (jaar - basisjaar), NA_real_)
    ) %>%
    ungroup()

  data <- data %>%
    group_by(beroepsgroep) %>%
    mutate(
      extern_rendement_man_injaarxbl = if_else(
        is.na(extern_rendement_man_injaarxbl),
        hulpextern2,
        extern_rendement_man_injaarxbl
      )
    ) %>%
    select(-hulpextern, -hulpextern2, -i_temp) %>%
    ungroup()
}

data <- data %>%
  mutate(
    n_man_buitenland = n_buitenland * (1 - per_vrouw_buitenland) * (jaar - basisjaar) * extern_rendement_man_injaarxbl
  )

### Totaal ###
data <- data %>%
  mutate(n_totaal_buitenland = n_vrouw_buitenland + n_man_buitenland)

################################################################################
# Stap 6: Totaal beschikbare aanbod
################################################################################

# Hulpvariabele voor FTE

### Vrouwen ###
data <- data %>%
  mutate(
    fte_vrouw = case_when(
      jaar == basisjaar ~ fte_vrouw_basis,
      jaar == basisjaar + 5 ~ fte_vrouw_basis_vijf,
      jaar == basisjaar + 10 ~ fte_vrouw_basis_tien,
      jaar == basisjaar + 15 ~ fte_vrouw_basis_vijftien,
      jaar == basisjaar + 20 ~ fte_vrouw_basis_twintig,
      TRUE ~ NA_real_
    )
  )

# Tussenliggende jaren opvullen (jaren 1-4)
for (offset in 1:4) {
  data <- data %>%
    mutate(
      fte_vrouw = if_else(
        jaar == basisjaar + offset,
        lag(fte_vrouw, offset) - (((lag(fte_vrouw, offset) - lead(fte_vrouw, 5 - offset)) / 5) * offset),
        fte_vrouw
      )
    )
}

# Jaren 6-9
for (offset in 1:4) {
  data <- data %>%
    mutate(
      fte_vrouw = if_else(
        jaar == basisjaar + 5 + offset,
        lag(fte_vrouw, offset) - (((lag(fte_vrouw, offset) - lead(fte_vrouw, 5 - offset)) / 5) * offset),
        fte_vrouw
      )
    )
}

# Jaren 11-14
for (offset in 1:4) {
  data <- data %>%
    mutate(
      fte_vrouw = if_else(
        jaar == basisjaar + 10 + offset,
        lag(fte_vrouw, offset) - (((lag(fte_vrouw, offset) - lead(fte_vrouw, 5 - offset)) / 5) * offset),
        fte_vrouw
      )
    )
}

# Jaren 16-19
for (offset in 1:4) {
  data <- data %>%
    mutate(
      fte_vrouw = if_else(
        jaar == basisjaar + 15 + offset,
        lag(fte_vrouw, offset) - (((lag(fte_vrouw, offset) - lead(fte_vrouw, 5 - offset)) / 5) * offset),
        fte_vrouw
      )
    )
}

### Mannen ###
data <- data %>%
  mutate(
    fte_man = case_when(
      jaar == basisjaar ~ fte_man_basis,
      jaar == basisjaar + 5 ~ fte_man_basis_vijf,
      jaar == basisjaar + 10 ~ fte_man_basis_tien,
      jaar == basisjaar + 15 ~ fte_man_basis_vijftien,
      jaar == basisjaar + 20 ~ fte_man_basis_twintig,
      TRUE ~ NA_real_
    )
  )

# Tussenliggende jaren (jaren 1-4)
for (offset in 1:4) {
  data <- data %>%
    mutate(
      fte_man = if_else(
        jaar == basisjaar + offset,
        lag(fte_man, offset) - (((lag(fte_man, offset) - lead(fte_man, 5 - offset)) / 5) * offset),
        fte_man
      )
    )
}

# Jaren 6-9
for (offset in 1:4) {
  data <- data %>%
    mutate(
      fte_man = if_else(
        jaar == basisjaar + 5 + offset,
        lag(fte_man, offset) - (((lag(fte_man, offset) - lead(fte_man, 5 - offset)) / 5) * offset),
        fte_man
      )
    )
}

# Jaren 11-14
for (offset in 1:4) {
  data <- data %>%
    mutate(
      fte_man = if_else(
        jaar == basisjaar + 10 + offset,
        lag(fte_man, offset) - (((lag(fte_man, offset) - lead(fte_man, 5 - offset)) / 5) * offset),
        fte_man
      )
    )
}

# Jaren 16-19
for (offset in 1:4) {
  data <- data %>%
    mutate(
      fte_man = if_else(
        jaar == basisjaar + 15 + offset,
        lag(fte_man, offset) - (((lag(fte_man, offset) - lead(fte_man, 5 - offset)) / 5) * offset),
        fte_man
      )
    )
}

# Totaal aantal mannen, vrouwen en totaal berekenen
data <- data %>%
  mutate(
    n_vrouwen = huidig_vrouw + n_vrouw_uit_nuopl + n_vrouw_uit_tussopl + n_vrouw_nabijst + n_vrouw_buitenland,
    n_mannen = huidig_man + n_man_uit_nuopl + n_man_uit_tussopl + n_man_nabijst + n_man_buitenland,
    n_totaal = n_vrouwen + n_mannen,
    n_totaal_check = huidig_totaal + n_totaal_uit_nuopl + n_totaal_uit_tussopl + n_totaal_nabijst + n_totaal_buitenland
  )

# Totaal aan FTE berekenen
data <- data %>%
  mutate(
    fte_vrouwen = n_vrouwen * fte_vrouw,
    fte_mannen = n_mannen * fte_man,
    fte_totaal = fte_mannen + fte_vrouwen,
    fte_gem = fte_totaal / n_totaal,
    aandeel_vrouwen = n_vrouwen / n_totaal
  )

# Groei FTE
data <- data %>%
  mutate(groei_fte = NA_real_)

for (n in 1:20) {
  data <- data %>%
    mutate(
      groei_fte = if_else(
        (jaar - n) == basisjaar,
        (1 - (lag(fte_totaal, n) / fte_totaal)) * 100,
        groei_fte
      )
    )
}

################################################################################
# Stap 7: Totaal aantal in opleiding
################################################################################

data <- data %>%
  mutate(
    inopl_nu = if_else(
      (jaar - basisjaar) <= opleidingsduur,
      (n_inopleiding_perjaar * opleidingsduur) - (n_inopleiding_perjaar * (jaar - basisjaar)),
      NA_real_
    ),
    inopl_tussen = case_when(
      jaar == basisjaar ~ 0,
      (jaar - basisjaar) <= (bijsturingsjaar - basisjaar) ~ n_inopleiding_perjaar2 * (jaar - basisjaar),
      (jaar - basisjaar) < opleidingsduur2 ~ n_inopleiding_perjaar2 * (jaar - basisjaar),
      ((jaar - basisjaar) > (bijsturingsjaar - basisjaar)) &
        (jaar - basisjaar <= (bijsturingsjaar - basisjaar + opleidingsduur2)) ~
        ((n_inopleiding_perjaar2 * (bijsturingsjaar - basisjaar)) -
           (n_inopleiding_perjaar2 * (jaar - basisjaar - opleidingsduur2))),
      TRUE ~ 0
    ),
    inopl_straks = case_when(
      jaar <= bijsturingsjaar ~ 0,
      (jaar - bijsturingsjaar) <= opleidingsduur3 ~ n_inopleiding_perjaar3 * (jaar - bijsturingsjaar),
      (jaar - bijsturingsjaar) > opleidingsduur3 ~ n_inopleiding_perjaar3 * opleidingsduur3,
      TRUE ~ 0
    )
  )

# Totaal in opleiding
data <- data %>%
  mutate(
    inopl_nu = replace_na(inopl_nu, 0),
    inopl_tussen = replace_na(inopl_tussen, 0),
    inopl_straks = replace_na(inopl_straks, 0),
    inopl_totaal = inopl_nu + inopl_tussen + inopl_straks
  )

################################################################################
# Return data
################################################################################

  return(data)
}

################################################################################
# EINDE FUNCTIE
################################################################################
