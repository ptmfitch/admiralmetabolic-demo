# Screening risk bands on an existing FLI score.
# Locked labels: <30, 30–<60, ≥60. The mid band excludes 60.
# These bands are not a diagnosis.

fli_avalcat_lookup <- function() {
  exprs(
    ~PARAMCD, ~condition,             ~AVALCAT1,     ~AVALCA1N,
    "FLI",    AVAL < 30,              "<30",         1,
    "FLI",    AVAL >= 30 & AVAL < 60, "30–<60",      2,
    "FLI",    AVAL >= 60,             "≥60",         3,
    "FLI",    is.na(AVAL),            NA_character_, NA_integer_
  )
}

test_that("FLI screening risk bands use the locked cutpoints", {
  input <- tribble(
    ~USUBJID, ~PARAMCD, ~AVAL, ~ABLFL,
    "01", "FLI", 0, NA_character_,
    "02", "FLI", 29.9, "Y",
    "02", "FLI", 30, NA_character_,
    "03", "FLI", 30, "Y",
    "03", "FLI", 60, NA_character_,
    "04", "FLI", 100, "Y",
    "05", "FLI", NA_real_, NA_character_,
    "06", "TRIG", 150, "Y"
  )

  categorized <- input %>%
    admiral::derive_vars_cat(
      definition = fli_avalcat_lookup(),
      by_vars = exprs(PARAMCD)
    ) %>%
    admiral::derive_var_base(
      by_vars = exprs(USUBJID, PARAMCD),
      source_var = AVALCAT1,
      new_var = BASECAT1
    ) %>%
    admiral::derive_var_base(
      by_vars = exprs(USUBJID, PARAMCD),
      source_var = AVALCA1N,
      new_var = BASECA1N
    )

  expect_equal(
    categorized$AVALCAT1,
    c("<30", "<30", "30–<60", "30–<60", "≥60", "≥60", NA, NA)
  )
  expect_equal(categorized$AVALCA1N, c(1, 1, 2, 2, 3, 3, NA, NA))
  # Baseline band stays on the baseline record. 30 is mid; 60 is upper.
  expect_equal(
    categorized$BASECAT1,
    c(NA, "<30", "<30", "30–<60", "30–<60", "≥60", NA, NA)
  )
  expect_equal(categorized$BASECA1N, c(NA, 1, 1, 2, 2, 3, NA, NA))
  expect_equal(categorized$PARAMCD[[8]], "TRIG")
  expect_true(is.na(categorized$AVALCAT1[[8]]))
})

test_that("FLI vignette and template keep the locked labels and do not overclaim", {
  roots <- c(
    testthat::test_path("..", "..", "vignettes", "adlb.Rmd"),
    testthat::test_path("..", "..", "inst", "templates", "ad_adlb.R")
  )
  locked <- c('"<30"', '"30–<60"', '"≥60"')
  for (path in roots) {
    text <- paste(readLines(path, warn = FALSE), collapse = "\n")
    for (label in locked) {
      expect_true(grepl(label, text, fixed = TRUE), info = paste(path, label))
    }
    expect_true(grepl("AVAL >= 30 & AVAL < 60", text, fixed = TRUE), info = path)
    expect_true(grepl("AVAL >= 60", text, fixed = TRUE), info = path)
    expect_false(grepl("30–60", text, fixed = TRUE), info = path)
    expect_false(grepl("30-60", text, fixed = TRUE), info = path)
    expect_false(grepl("MASH|NAFLD|fibrosis", text, ignore.case = TRUE), info = path)
    expect_true(grepl("0.953 * log(AVAL.TRIG)", text, fixed = TRUE), info = path)
  }
})
