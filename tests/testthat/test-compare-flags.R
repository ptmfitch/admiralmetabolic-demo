compare_flags_env <- function() {
  path <- ""
  if ("admiralmetabolic" %in% loadedNamespaces()) {
    path <- system.file(
      "demo",
      "compare_flags.R",
      package = "admiralmetabolic"
    )
  }
  if (!nzchar(path)) {
    path <- testthat::test_path("..", "..", "inst", "demo", "compare_flags.R")
  }
  expect_true(file.exists(path))
  env <- new.env(parent = globalenv())
  sys.source(path, envir = env)
  env
}

rate_for <- function(result, flag, arm) {
  hits <- Filter(
    function(row) row$flag == flag && row$TRT01P == arm,
    result$responder_rates
  )
  expect_length(hits, 1)
  hits[[1]]
}

test_that("fixture: exact 5% loss moves RESP5FL and leaves RESP10FL", {
  env <- compare_flags_env()
  out_dir <- tempfile("flag-comparison-")
  result <- env$compare_responder_flags(
    before = testthat::test_path("fixtures", "adwl_before.csv"),
    after = testthat::test_path("fixtures", "adwl_after.csv"),
    out_dir = out_dir
  )

  arm_a <- rate_for(result, "RESP5FL", "ARM A")
  expect_equal(arm_a$before$n, 1L)
  expect_equal(arm_a$before$N, 3L)
  expect_equal(arm_a$before$pct, 33.3)
  expect_equal(arm_a$after$n, 2L)
  expect_equal(arm_a$after$N, 3L)
  expect_equal(arm_a$after$pct, 66.7)

  arm_b <- rate_for(result, "RESP5FL", "ARM B")
  expect_equal(arm_b$before$pct, 50)
  expect_equal(arm_b$after$n, 2L)
  expect_equal(arm_b$after$N, 2L)
  expect_equal(arm_b$after$pct, 100)

  arm_c <- rate_for(result, "RESP5FL", "ARM C")
  expect_equal(arm_c$before$pct, 50)
  expect_equal(arm_c$after$pct, 50)

  for (arm in c("ARM A", "ARM B", "ARM C")) {
    resp10 <- rate_for(result, "RESP10FL", arm)
    expect_equal(resp10$before, resp10$after)
  }
  expect_equal(rate_for(result, "RESP10FL", "ARM A")$before$pct, 33.3)
  expect_equal(rate_for(result, "RESP10FL", "ARM C")$before$n, 0L)

  changed <- result$subjects_resp5fl_changed
  expect_length(changed, 2)
  ids <- vapply(changed, `[[`, character(1), "USUBJID")
  expect_equal(ids, c("SYN-001", "SYN-004"))
  expect_equal(changed[[1]]$TRT01P, "ARM A")
  expect_equal(changed[[1]]$PCHG, -5)
  expect_equal(changed[[1]]$before, "N")
  expect_equal(changed[[1]]$after, "Y")
  expect_equal(changed[[2]]$TRT01P, "ARM B")
  expect_equal(changed[[2]]$before, "N")
  expect_equal(changed[[2]]$after, "Y")

  csv_path <- file.path(out_dir, "flag_comparison.csv")
  json_path <- file.path(out_dir, "flag_comparison.json")
  expect_true(file.exists(csv_path))
  expect_true(file.exists(json_path))

  written <- utils::read.csv(
    csv_path,
    stringsAsFactors = FALSE,
    na.strings = ""
  )
  moved <- written[written$record_type == "resp5fl_changed", ]
  expect_equal(moved$USUBJID, c("SYN-001", "SYN-004"))
  expect_equal(moved$PCHG, c(-5, -5))

  json <- paste(readLines(json_path, warn = FALSE), collapse = "\n")
  expect_match(json, "DEMO / SYNTHETIC", fixed = TRUE)
  expect_match(json, "\"USUBJID\": \"SYN-001\"", fixed = TRUE)
  expect_match(json, "\"pct\": 33.3", fixed = TRUE)
  expect_match(json, "\"pct\": 66.7", fixed = TRUE)
  expect_false(grepl("SYN-003", json, fixed = TRUE))
  expect_false(grepl("SYN-009", json, fixed = TRUE))
  expect_true(grepl("\u00b7", json, fixed = TRUE))

  if (nzchar(Sys.which("python3"))) {
    py <- tempfile(fileext = ".py")
    writeLines(
      "import json, sys\njson.load(open(sys.argv[1], encoding='utf-8'))\n",
      py
    )
    status <- system2("python3", c(py, json_path))
    expect_equal(as.integer(status), 0L)
  }
})

test_that("Week 26 label counts when AVISITN is blank, Week 16 does not", {
  env <- compare_flags_env()
  row <- function(id, visit, visitn, pchg, resp5) {
    data.frame(
      USUBJID = id,
      TRT01P = "ARM A",
      AVISIT = visit,
      AVISITN = visitn,
      PARAMCD = "WEIGHT",
      AVAL = NA_real_,
      BASE = NA_real_,
      CHG = NA_real_,
      PCHG = pchg,
      BMICAT = NA_character_,
      RESP5FL = resp5,
      RESP10FL = "N",
      stringsAsFactors = FALSE
    )
  }
  before <- rbind(
    row("SYN-010", "WEEK 26", NA_real_, -5, "N"),
    row("SYN-011", "Week 16", 16, -40, "Y")
  )
  after <- before
  after$RESP5FL[after$USUBJID == "SYN-010"] <- "Y"
  out_dir <- tempfile("flag-label-")
  before_path <- tempfile(fileext = ".csv")
  after_path <- tempfile(fileext = ".csv")
  utils::write.csv(before, before_path, row.names = FALSE, na = "")
  utils::write.csv(after, after_path, row.names = FALSE, na = "")

  result <- env$compare_responder_flags(before_path, after_path, out_dir)
  rate <- rate_for(result, "RESP5FL", "ARM A")
  expect_equal(rate$before$N, 1L)
  expect_equal(rate$before$n, 0L)
  expect_equal(rate$after$n, 1L)
  expect_equal(result$subjects_resp5fl_changed[[1]]$USUBJID, "SYN-010")
  expect_equal(result$subjects_resp5fl_changed[[1]]$PCHG, -5)
})

test_that("git refs and bad inputs", {
  env <- compare_flags_env()
  expect_error(env$assert_git_ref("--help"), "Git ref")
  expect_error(
    env$week26_weight_rows(data.frame(USUBJID = "SYN-001")),
    "missing columns"
  )
  bad <- utils::read.csv(
    testthat::test_path("fixtures", "adwl_before.csv"),
    stringsAsFactors = FALSE
  )
  bad$RESP5FL[bad$USUBJID == "SYN-002" & bad$PARAMCD == "WEIGHT"] <- "MAYBE"
  expect_error(env$week26_weight_rows(bad), "Y or N")

  skip_if_not(nzchar(Sys.which("git")))
  repo <- tempfile("adwl-repo-")
  dir.create(file.path(repo, "inst", "demo", "output"), recursive = TRUE)
  target <- file.path(repo, "inst", "demo", "output", "adwl.csv")
  system2("git", c("-C", repo, "init", "-q", "-b", "main"))
  system2("git", c("-C", repo, "config", "user.email", "demo@example.com"))
  system2("git", c("-C", repo, "config", "user.name", "Demo"))
  system2("git", c("-C", repo, "config", "commit.gpgsign", "false"))
  file.copy(testthat::test_path("fixtures", "adwl_before.csv"), target)
  system2("git", c("-C", repo, "add", "inst/demo/output/adwl.csv"))
  system2("git", c("-C", repo, "commit", "-q", "-m", "before"))
  before_ref <- trimws(system2(
    "git",
    c("-C", repo, "rev-parse", "HEAD"),
    stdout = TRUE
  ))
  file.copy(
    testthat::test_path("fixtures", "adwl_after.csv"),
    target,
    overwrite = TRUE
  )
  system2("git", c("-C", repo, "add", "inst/demo/output/adwl.csv"))
  system2("git", c("-C", repo, "commit", "-q", "-m", "after"))
  after_ref <- trimws(system2(
    "git",
    c("-C", repo, "rev-parse", "HEAD"),
    stdout = TRUE
  ))

  from_git <- env$compare_responder_flags(
    before = env$git_show_file(before_ref, "inst/demo/output/adwl.csv", repo),
    after = env$git_show_file(after_ref, "inst/demo/output/adwl.csv", repo),
    out_dir = tempfile("from-git-")
  )
  moved <- vapply(
    from_git$subjects_resp5fl_changed,
    `[[`,
    character(1),
    "USUBJID"
  )
  expect_equal(moved, c("SYN-001", "SYN-004"))

  script <- normalizePath(
    testthat::test_path("..", "..", "inst", "demo", "compare_flags.R"),
    mustWork = TRUE
  )
  out_dir <- tempfile("cli-out-")
  old <- getwd()
  on.exit(setwd(old), add = TRUE)
  setwd(repo)
  cli_out <- system2(
    "Rscript",
    c(
      script,
      "--before-ref", before_ref,
      "--after-ref", after_ref,
      "--out-dir", out_dir
    ),
    stdout = TRUE,
    stderr = TRUE
  )
  status <- attr(cli_out, "status")
  if (is.null(status)) {
    status <- 0L
  }
  expect_equal(as.integer(status), 0L)
  cli_text <- paste(cli_out, collapse = "\n")
  expect_match(cli_text, "RESP5FL changed for 2 subjects", fixed = TRUE)
  expect_true(file.exists(file.path(out_dir, "flag_comparison.json")))
})
