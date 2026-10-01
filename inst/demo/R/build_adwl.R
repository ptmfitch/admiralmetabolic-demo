# DEMO / SYNTHETIC · for enablement only
# ADaM-style weight, BMI, and HbA1c derivation for the synthetic demo.
# Built on admiral. Not part of the admiralmetabolic package API.

# SAP display precision: BMI, change from baseline, and percent change are
# rounded to 1 decimal before categorization and endpoint flags. Percent
# change is signed: a loss is negative.

suppressPackageStartupMessages({
  library(admiral)
  library(dplyr)
  library(rlang)
})

bmi_class_definition <- exprs(
  ~PARAMCD, ~condition, ~BMICAT,
  "BMI", AVAL < 18.5, "Underweight",
  "BMI", AVAL >= 18.5 & AVAL < 25, "Normal weight",
  "BMI", AVAL >= 25 & AVAL < 30, "Overweight",
  "BMI", AVAL >= 30 & AVAL < 35, "Obesity class I",
  "BMI", AVAL >= 35 & AVAL < 40, "Obesity class II",
  "BMI", AVAL >= 40, "Obesity class III",
  "BMI", is.na(AVAL), NA_character_
)

analysis_params <- c("WEIGHT", "BMI", "HBA1C")

adwl_columns <- c(
  "USUBJID", "TRT01P", "AVISIT", "AVISITN", "PARAMCD",
  "AVAL", "BASE", "CHG", "PCHG", "BMICAT", "RESP5FL", "RESP10FL"
)

#' Build the demo ADWL analysis dataset.
#'
#' Reads blinded subject and findings files from `data_dir`, derives BMI,
#' baseline, change, percent change, BMI class, and Week 26 responder flags.
#'
#' @param data_dir Directory containing `adsl.csv` and `findings.csv`.
#' @return Data frame with the demo ADWL columns.
build_adwl <- function(data_dir) {
  if (!exists("derive_weight_loss_responder_flags", mode = "function")) {
    stop(
      "Source inst/demo/R/derive_responder_flags.R before calling build_adwl().",
      call. = FALSE
    )
  }

  adsl <- read.csv(
    file.path(data_dir, "adsl.csv"),
    stringsAsFactors = FALSE
  )
  findings <- read.csv(
    file.path(data_dir, "findings.csv"),
    stringsAsFactors = FALSE
  )

  adsl <- adsl %>%
    select(USUBJID, TRT01P)

  findings <- findings %>%
    select(USUBJID, PARAMCD, PARAM, AVISIT, AVISITN, AVAL) %>%
    mutate(AVISITN = as.integer(AVISITN))

  adwl <- findings %>%
    derive_vars_merged(
      dataset_add = adsl,
      by_vars = exprs(USUBJID),
      new_vars = exprs(TRT01P)
    ) %>%
    derive_param_bmi(
      by_vars = exprs(USUBJID, TRT01P, AVISIT, AVISITN),
      weight_code = "WEIGHT",
      height_code = "HEIGHT",
      set_values_to = exprs(
        PARAMCD = "BMI",
        PARAM = "Body Mass Index (kg/m2)"
      ),
      get_unit_expr = extract_unit(PARAM),
      constant_by_vars = exprs(USUBJID)
    ) %>%
    mutate(
      AVISITN = as.integer(AVISITN),
      AVAL = if_else(PARAMCD == "BMI", round(AVAL, 1), AVAL)
    ) %>%
    filter(PARAMCD %in% analysis_params) %>%
    mutate(ABLFL = if_else(AVISITN == 0L, "Y", NA_character_)) %>%
    derive_var_base(
      by_vars = exprs(USUBJID, PARAMCD),
      source_var = AVAL,
      new_var = BASE
    ) %>%
    derive_var_chg() %>%
    derive_var_pchg() %>%
    mutate(
      CHG = if_else(AVISITN == 0L, NA_real_, round(CHG, 1)),
      PCHG = if_else(AVISITN == 0L, NA_real_, round(PCHG, 1))
    ) %>%
    derive_vars_cat(
      definition = bmi_class_definition,
      by_vars = exprs(PARAMCD)
    ) %>%
    derive_weight_loss_responder_flags() %>%
    select(all_of(adwl_columns)) %>%
    arrange(USUBJID, PARAMCD, AVISITN)

  as.data.frame(adwl)
}
