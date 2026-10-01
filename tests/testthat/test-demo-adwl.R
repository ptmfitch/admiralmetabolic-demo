# DEMO / SYNTHETIC · for enablement only

# inst/demo is the source entry point (Rscript inst/demo/run_pipeline.R).
# R reserves inst/demo in a built package, so the build ignores that
# directory. Tests follow demo-src, which points at inst/demo.
demo_file <- function(...) {
  root <- testthat::test_path("demo-src")
  if (!dir.exists(root)) {
    root <- testthat::test_path("..", "..", "inst", "demo")
  }
  path <- file.path(root, ...)
  if (!file.exists(path)) {
    stop("Demo file not found: ", path, call. = FALSE)
  }
  path
}

source(demo_file("R", "derive_responder_flags.R"))
source(demo_file("R", "build_adwl.R"))

demo_adwl <- function() {
  if (!exists(".demo_adwl_cache", envir = .GlobalEnv)) {
    assign(".demo_adwl_cache", build_adwl(demo_file("data")), envir = .GlobalEnv)
  }
  get(".demo_adwl_cache", envir = .GlobalEnv)
}

test_that("demo ADWL has the contracted columns, visits, and parameters", {
  adwl <- demo_adwl()

  expect_named(
    adwl,
    c(
      "USUBJID", "TRT01P", "AVISIT", "AVISITN", "PARAMCD",
      "AVAL", "BASE", "CHG", "PCHG", "BMICAT", "RESP5FL", "RESP10FL"
    )
  )
  expect_equal(length(unique(adwl$USUBJID)), 198L)
  expect_setequal(adwl$TRT01P, c("ARM A", "ARM B", "ARM C"))
  expect_setequal(adwl$PARAMCD, c("WEIGHT", "BMI", "HBA1C"))
  expect_setequal(adwl$AVISITN, c(0L, 4L, 8L, 12L, 16L, 20L, 26L))
  expect_equal(nrow(adwl), 198L * 3L * 7L)
  expect_equal(anyDuplicated(adwl[, c("USUBJID", "PARAMCD", "AVISITN")]), 0L)

  subjects <- unique(adwl[, c("USUBJID", "TRT01P")])
  expect_equal(sum(subjects$TRT01P == "ARM A"), 66L)
  expect_equal(sum(subjects$TRT01P == "ARM B"), 66L)
  expect_equal(sum(subjects$TRT01P == "ARM C"), 66L)

  expect_equal(unique(adwl$AVISIT[adwl$AVISITN == 0L]), "Baseline")
  expect_equal(unique(adwl$AVISIT[adwl$AVISITN == 26L]), "Week 26")

  script <- readLines(demo_file("run_pipeline.R"))
  expect_true(any(grepl("output", script, fixed = TRUE)))
  expect_true(any(grepl("adwl.csv", script, fixed = TRUE)))
})

test_that("analysis output stays blinded", {
  adwl <- demo_adwl()
  blocked <- c("TRT01A", "TRTA", "ACTARM", "ACTARMCD", "ARM", "ARMCD")
  expect_false(any(blocked %in% names(adwl)))

  blob <- paste(as.character(unlist(adwl, use.names = FALSE)), collapse = "\n")
  expect_false(grepl("Placebo", blob, fixed = TRUE))
  expect_false(grepl("Low Dose", blob, fixed = TRUE))
  expect_false(grepl("High Dose", blob, fixed = TRUE))
  expect_false(grepl("TRT01A", blob, fixed = TRUE))

  key <- read.csv(demo_file("data", "unblinding_key.csv"), stringsAsFactors = FALSE)
  expect_named(key, c("USUBJID", "TRT01A"))
  expect_setequal(key$USUBJID, unique(adwl$USUBJID))
  expect_setequal(key$TRT01A, c("Placebo", "Low Dose", "High Dose"))

  sources <- c(
    demo_file("run_pipeline.R"),
    demo_file("R", "build_adwl.R"),
    demo_file("R", "derive_responder_flags.R")
  )
  src <- paste(unlist(lapply(sources, readLines)), collapse = "\n")
  expect_false(grepl("unblinding_key", src, fixed = TRUE))
  expect_false(grepl("TRT01A", src, fixed = TRUE))
})

test_that("BMI class follows the analysis cuts on the current BMI", {
  adwl <- demo_adwl()
  bmi <- adwl[adwl$PARAMCD == "BMI", ]
  expected <- ifelse(
    is.na(bmi$AVAL),
    NA_character_,
    ifelse(
      bmi$AVAL < 18.5, "Underweight",
      ifelse(
        bmi$AVAL < 25, "Normal weight",
        ifelse(
          bmi$AVAL < 30, "Overweight",
          ifelse(
            bmi$AVAL < 35, "Obesity class I",
            ifelse(bmi$AVAL < 40, "Obesity class II", "Obesity class III")
          )
        )
      )
    )
  )
  expect_equal(bmi$BMICAT, expected)
  expect_true(all(is.na(adwl$BMICAT[adwl$PARAMCD != "BMI"])))

  baseline <- bmi[bmi$AVISITN == 0L, ]
  expect_true(all(baseline$AVAL >= 27))
  expect_true(any(baseline$AVAL < 30))
  expect_true(any(baseline$AVAL >= 30))
  expect_true(any(baseline$BMICAT == "Overweight"))
  expect_true(any(baseline$BMICAT == "Obesity class I"))
})

test_that("baseline, change, and percent change follow the 1-decimal rule", {
  adwl <- demo_adwl()
  baseline <- adwl[adwl$AVISITN == 0L, ]
  expect_true(all(baseline$AVAL == baseline$BASE))
  expect_true(all(is.na(baseline$CHG)))
  expect_true(all(is.na(baseline$PCHG)))

  base_rows <- adwl[adwl$AVISITN == 0L, c("USUBJID", "PARAMCD", "AVAL")]
  names(base_rows)[3] <- "AVAL0"
  merged <- merge(adwl, base_rows, by = c("USUBJID", "PARAMCD"), sort = FALSE)
  expect_equal(merged$BASE, merged$AVAL0)

  post <- adwl[adwl$AVISITN > 0L, ]
  expect_false(anyNA(post$AVAL))
  expect_false(anyNA(post$BASE))
  expect_equal(post$CHG, round(post$AVAL - post$BASE, 1))
  expect_equal(
    post$PCHG,
    round(100 * (post$AVAL - post$BASE) / abs(post$BASE), 1)
  )
  expect_equal(post$PCHG, round(post$PCHG, 1))

  hba1c <- adwl[adwl$PARAMCD == "HBA1C" & adwl$AVISITN == 0L, ]
  expect_true(all(hba1c$AVAL >= 7 & hba1c$AVAL <= 10.5))
})

test_that("the 10% weight-loss flag is inclusive and limited to Week 26", {
  adwl <- demo_adwl()
  off <- adwl[!(adwl$PARAMCD == "WEIGHT" & adwl$AVISITN == 26L), ]
  expect_true(all(is.na(off$RESP5FL)))
  expect_true(all(is.na(off$RESP10FL)))

  w26 <- adwl[adwl$PARAMCD == "WEIGHT" & adwl$AVISITN == 26L, ]
  expect_true(all(w26$RESP5FL %in% c("Y", "N")))
  expect_true(all(w26$RESP10FL %in% c("Y", "N")))

  at_10 <- w26[w26$PCHG == -10, ]
  expect_gte(nrow(at_10), 1L)
  expect_true(all(at_10$RESP10FL == "Y"))

  more_than_10 <- w26[w26$PCHG < -10, ]
  expect_gte(nrow(more_than_10), 1L)
  expect_true(all(more_than_10$RESP10FL == "Y"))

  less_than_10 <- w26[w26$PCHG > -10, ]
  expect_gte(nrow(less_than_10), 1L)
  expect_true(all(less_than_10$RESP10FL == "N"))

  expect_gte(sum(w26$PCHG < -5), 1L)
  expect_gte(sum(w26$PCHG > -5), 1L)
  expect_true(all(w26$RESP5FL[w26$PCHG < -5] == "Y"))
  expect_true(all(w26$RESP5FL[w26$PCHG > -5] == "N"))
})
