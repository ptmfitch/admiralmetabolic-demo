# DEMO / SYNTHETIC · for enablement only

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

test_that("Week 26 weight loss of exactly 5.0% is a 5% responder", {
  adwl <- build_adwl(demo_file("data"))
  w26 <- adwl[adwl$PARAMCD == "WEIGHT" & adwl$AVISITN == 26L, ]
  at_5 <- w26[w26$PCHG == -5, ]

  expect_gte(nrow(at_5), 1L)
  expect_true(all(at_5$RESP5FL == "Y"))
  expect_gte(sum(at_5$TRT01P == "ARM A"), 1L)
  expect_gte(sum(at_5$TRT01P == "ARM B"), 1L)
  expect_gte(sum(at_5$TRT01P == "ARM C"), 1L)
})
