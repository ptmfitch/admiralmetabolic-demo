# DEMO / SYNTHETIC · for enablement only
# derive_param_glycstt vendored from pharmaverse/admiralmetabolic PR #134
# (commit 8425edba) for CAD-18 edge-case coverage.

glycstt_status <- function(data) {
  data %>%
    filter(PARAMCD == "GLYCSTT") %>%
    select(USUBJID, PARAMCD, AVISIT, AVISITN, AVALC) %>%
    arrange(USUBJID, AVISITN)
}

run_glycstt <- function(input, ...) {
  derive_param_glycstt(
    dataset = input,
    by_vars = exprs(STUDYID, USUBJID, AVISITN, AVISIT),
    order = exprs(AVISITN),
    set_values_to = exprs(PARAMCD = "GLYCSTT"),
    hba1c_code = "HBA1C",
    fpg_code = "FPG",
    get_unit_expr = AVALU,
    ...
  )
}

test_that("derive_param_glycstt Test 1: normoglycemic below prediabetic thresholds", {
  input_pct_mgdl <- tribble(
    ~STUDYID, ~USUBJID, ~PARAMCD, ~AVISIT, ~AVISITN, ~AVAL, ~AVALU,
    "STUDY01", "SUBJ001", "HBA1C", "BASELINE", 1, 5.6, "%",
    "STUDY01", "SUBJ001", "FPG", "BASELINE", 1, 99, "mg/dL"
  )

  input_si <- tribble(
    ~STUDYID, ~USUBJID, ~PARAMCD, ~AVISIT, ~AVISITN, ~AVAL, ~AVALU,
    "STUDY01", "SUBJ002", "HBA1C", "BASELINE", 1, 38, "mmol/mol",
    "STUDY01", "SUBJ002", "FPG", "BASELINE", 1, 5.5, "mmol/L"
  )

  expected <- tribble(
    ~USUBJID, ~PARAMCD, ~AVISIT, ~AVISITN, ~AVALC,
    "SUBJ001", "GLYCSTT", "BASELINE", 1, "NORMOGLYCEMIC",
    "SUBJ002", "GLYCSTT", "BASELINE", 1, "NORMOGLYCEMIC"
  )

  actual <- bind_rows(
    glycstt_status(run_glycstt(input_pct_mgdl)),
    glycstt_status(run_glycstt(input_si))
  )

  expect_dfs_equal(actual, expected, keys = c("USUBJID", "PARAMCD", "AVISIT"))
})

test_that("derive_param_glycstt Test 2: prediabetic at threshold with partner below", {
  input_hba1c_at_cut <- tribble(
    ~STUDYID, ~USUBJID, ~PARAMCD, ~AVISIT, ~AVISITN, ~AVAL, ~AVALU,
    "STUDY01", "SUBJ001", "HBA1C", "BASELINE", 1, 5.7, "%",
    "STUDY01", "SUBJ001", "FPG", "BASELINE", 1, 90, "mg/dL"
  )

  input_fpg_at_cut <- tribble(
    ~STUDYID, ~USUBJID, ~PARAMCD, ~AVISIT, ~AVISITN, ~AVAL, ~AVALU,
    "STUDY01", "SUBJ002", "HBA1C", "BASELINE", 1, 5.4, "%",
    "STUDY01", "SUBJ002", "FPG", "BASELINE", 1, 100, "mg/dL"
  )

  expected <- tribble(
    ~USUBJID, ~PARAMCD, ~AVISIT, ~AVISITN, ~AVALC,
    "SUBJ001", "GLYCSTT", "BASELINE", 1, "PREDIABETIC",
    "SUBJ002", "GLYCSTT", "BASELINE", 1, "PREDIABETIC"
  )

  actual <- bind_rows(
    glycstt_status(run_glycstt(input_hba1c_at_cut)),
    glycstt_status(run_glycstt(input_fpg_at_cut))
  )

  expect_dfs_equal(actual, expected, keys = c("USUBJID", "PARAMCD", "AVISIT"))
})

test_that("derive_param_glycstt Test 3: single diabetic-range visit stays prediabetic", {
  input <- tribble(
    ~STUDYID, ~USUBJID, ~PARAMCD, ~AVISIT, ~AVISITN, ~AVAL, ~AVALU,
    "STUDY01", "SUBJ001", "HBA1C", "BASELINE", 1, 6.5, "%",
    "STUDY01", "SUBJ001", "FPG", "BASELINE", 1, 126, "mg/dL"
  )

  expected <- tribble(
    ~USUBJID, ~PARAMCD, ~AVISIT, ~AVISITN, ~AVALC,
    "SUBJ001", "GLYCSTT", "BASELINE", 1, "PREDIABETIC"
  )

  actual <- glycstt_status(run_glycstt(input))

  expect_dfs_equal(actual, expected, keys = c("USUBJID", "PARAMCD", "AVISIT"))
})

test_that("derive_param_glycstt Test 4: both markers confirm diabetes on later visit", {
  input <- tribble(
    ~STUDYID, ~USUBJID, ~PARAMCD, ~AVISIT, ~AVISITN, ~AVAL, ~AVALU,
    "STUDY01", "SUBJ001", "HBA1C", "WEEK 4", 1, 7.0, "%",
    "STUDY01", "SUBJ001", "FPG", "WEEK 4", 1, 130, "mg/dL",
    "STUDY01", "SUBJ001", "HBA1C", "WEEK 8", 2, 7.0, "%",
    "STUDY01", "SUBJ001", "FPG", "WEEK 8", 2, 130, "mg/dL"
  )

  expected <- tribble(
    ~USUBJID, ~PARAMCD, ~AVISIT, ~AVISITN, ~AVALC,
    "SUBJ001", "GLYCSTT", "WEEK 4", 1, "PREDIABETIC",
    "SUBJ001", "GLYCSTT", "WEEK 8", 2, "DIABETIC"
  )

  actual <- glycstt_status(run_glycstt(input))

  expect_dfs_equal(actual, expected, keys = c("USUBJID", "PARAMCD", "AVISIT"))
})

test_that("derive_param_glycstt Test 5: consecutive HbA1c confirms diabetes", {
  input <- tribble(
    ~STUDYID, ~USUBJID, ~PARAMCD, ~AVISIT, ~AVISITN, ~AVAL, ~AVALU,
    "STUDY01", "SUBJ001", "HBA1C", "WEEK 4", 1, 7.0, "%",
    "STUDY01", "SUBJ001", "FPG", "WEEK 4", 1, 90, "mg/dL",
    "STUDY01", "SUBJ001", "HBA1C", "WEEK 8", 2, 7.0, "%",
    "STUDY01", "SUBJ001", "FPG", "WEEK 8", 2, 90, "mg/dL"
  )

  expected <- tribble(
    ~USUBJID, ~PARAMCD, ~AVISIT, ~AVISITN, ~AVALC,
    "SUBJ001", "GLYCSTT", "WEEK 4", 1, "PREDIABETIC",
    "SUBJ001", "GLYCSTT", "WEEK 8", 2, "DIABETIC"
  )

  actual <- glycstt_status(run_glycstt(input))

  expect_dfs_equal(actual, expected, keys = c("USUBJID", "PARAMCD", "AVISIT"))
})

test_that("derive_param_glycstt Test 6: consecutive FPG confirms diabetes", {
  input <- tribble(
    ~STUDYID, ~USUBJID, ~PARAMCD, ~AVISIT, ~AVISITN, ~AVAL, ~AVALU,
    "STUDY01", "SUBJ001", "HBA1C", "WEEK 4", 1, 5.4, "%",
    "STUDY01", "SUBJ001", "FPG", "WEEK 4", 1, 130, "mg/dL",
    "STUDY01", "SUBJ001", "HBA1C", "WEEK 8", 2, 5.4, "%",
    "STUDY01", "SUBJ001", "FPG", "WEEK 8", 2, 130, "mg/dL"
  )

  expected <- tribble(
    ~USUBJID, ~PARAMCD, ~AVISIT, ~AVISITN, ~AVALC,
    "SUBJ001", "GLYCSTT", "WEEK 4", 1, "PREDIABETIC",
    "SUBJ001", "GLYCSTT", "WEEK 8", 2, "DIABETIC"
  )

  actual <- glycstt_status(run_glycstt(input))

  expect_dfs_equal(actual, expected, keys = c("USUBJID", "PARAMCD", "AVISIT"))
})

test_that("derive_param_glycstt Test 7: HbA1c then FPG confirms diabetes", {
  input <- tribble(
    ~STUDYID, ~USUBJID, ~PARAMCD, ~AVISIT, ~AVISITN, ~AVAL, ~AVALU,
    "STUDY01", "SUBJ001", "HBA1C", "WEEK 4", 1, 7.0, "%",
    "STUDY01", "SUBJ001", "FPG", "WEEK 4", 1, 90, "mg/dL",
    "STUDY01", "SUBJ001", "HBA1C", "WEEK 8", 2, 5.4, "%",
    "STUDY01", "SUBJ001", "FPG", "WEEK 8", 2, 130, "mg/dL"
  )

  expected <- tribble(
    ~USUBJID, ~PARAMCD, ~AVISIT, ~AVISITN, ~AVALC,
    "SUBJ001", "GLYCSTT", "WEEK 4", 1, "PREDIABETIC",
    "SUBJ001", "GLYCSTT", "WEEK 8", 2, "DIABETIC"
  )

  actual <- glycstt_status(run_glycstt(input))

  expect_dfs_equal(actual, expected, keys = c("USUBJID", "PARAMCD", "AVISIT"))
})

test_that("derive_param_glycstt Test 8: FPG then HbA1c confirms diabetes", {
  input <- tribble(
    ~STUDYID, ~USUBJID, ~PARAMCD, ~AVISIT, ~AVISITN, ~AVAL, ~AVALU,
    "STUDY01", "SUBJ001", "HBA1C", "WEEK 4", 1, 5.4, "%",
    "STUDY01", "SUBJ001", "FPG", "WEEK 4", 1, 130, "mg/dL",
    "STUDY01", "SUBJ001", "HBA1C", "WEEK 8", 2, 7.0, "%",
    "STUDY01", "SUBJ001", "FPG", "WEEK 8", 2, 90, "mg/dL"
  )

  expected <- tribble(
    ~USUBJID, ~PARAMCD, ~AVISIT, ~AVISITN, ~AVALC,
    "SUBJ001", "GLYCSTT", "WEEK 4", 1, "PREDIABETIC",
    "SUBJ001", "GLYCSTT", "WEEK 8", 2, "DIABETIC"
  )

  actual <- glycstt_status(run_glycstt(input))

  expect_dfs_equal(actual, expected, keys = c("USUBJID", "PARAMCD", "AVISIT"))
})

test_that("derive_param_glycstt Test 9: confirmed diabetes does not carry forward", {
  input <- tribble(
    ~STUDYID, ~USUBJID, ~PARAMCD, ~AVISIT, ~AVISITN, ~AVAL, ~AVALU,
    "STUDY01", "SUBJ001", "HBA1C", "WEEK 4", 1, 7.0, "%",
    "STUDY01", "SUBJ001", "FPG", "WEEK 4", 1, 130, "mg/dL",
    "STUDY01", "SUBJ001", "HBA1C", "WEEK 8", 2, 7.0, "%",
    "STUDY01", "SUBJ001", "FPG", "WEEK 8", 2, 130, "mg/dL",
    "STUDY01", "SUBJ001", "HBA1C", "WEEK 12", 3, 5.4, "%",
    "STUDY01", "SUBJ001", "FPG", "WEEK 12", 3, 90, "mg/dL"
  )

  expected <- tribble(
    ~USUBJID, ~PARAMCD, ~AVISIT, ~AVISITN, ~AVALC,
    "SUBJ001", "GLYCSTT", "WEEK 4", 1, "PREDIABETIC",
    "SUBJ001", "GLYCSTT", "WEEK 8", 2, "DIABETIC",
    "SUBJ001", "GLYCSTT", "WEEK 12", 3, "NORMOGLYCEMIC"
  )

  actual <- glycstt_status(run_glycstt(input))

  expect_dfs_equal(actual, expected, keys = c("USUBJID", "PARAMCD", "AVISIT"))
})

test_that("derive_param_glycstt Test 10: missing partner uses OR logic against NA", {
  # Partner missing at the visit under test; the other marker appears on a
  # different visit so pivot_wider still sees both PARAMCD values in the dataset.
  input_fpg_normo <- tribble(
    ~STUDYID, ~USUBJID, ~PARAMCD, ~AVISIT, ~AVISITN, ~AVAL, ~AVALU,
    "STUDY01", "SUBJ001", "FPG", "BASELINE", 1, 90, "mg/dL",
    "STUDY01", "SUBJ001", "HBA1C", "WEEK 4", 2, 5.4, "%"
  )

  input_fpg_predi <- tribble(
    ~STUDYID, ~USUBJID, ~PARAMCD, ~AVISIT, ~AVISITN, ~AVAL, ~AVALU,
    "STUDY01", "SUBJ002", "FPG", "BASELINE", 1, 100, "mg/dL",
    "STUDY01", "SUBJ002", "HBA1C", "WEEK 4", 2, 5.4, "%"
  )

  input_hba1c_normo <- tribble(
    ~STUDYID, ~USUBJID, ~PARAMCD, ~AVISIT, ~AVISITN, ~AVAL, ~AVALU,
    "STUDY01", "SUBJ003", "HBA1C", "BASELINE", 1, 5.4, "%",
    "STUDY01", "SUBJ003", "FPG", "WEEK 4", 2, 90, "mg/dL"
  )

  input_hba1c_predi <- tribble(
    ~STUDYID, ~USUBJID, ~PARAMCD, ~AVISIT, ~AVISITN, ~AVAL, ~AVALU,
    "STUDY01", "SUBJ004", "HBA1C", "BASELINE", 1, 5.7, "%",
    "STUDY01", "SUBJ004", "FPG", "WEEK 4", 2, 90, "mg/dL"
  )

  expected <- tribble(
    ~USUBJID, ~PARAMCD, ~AVISIT, ~AVISITN, ~AVALC,
    "SUBJ001", "GLYCSTT", "BASELINE", 1, "NORMOGLYCEMIC",
    "SUBJ002", "GLYCSTT", "BASELINE", 1, "PREDIABETIC",
    "SUBJ003", "GLYCSTT", "BASELINE", 1, "NORMOGLYCEMIC",
    "SUBJ004", "GLYCSTT", "BASELINE", 1, "PREDIABETIC"
  )

  actual <- bind_rows(
    glycstt_status(run_glycstt(input_fpg_normo)),
    glycstt_status(run_glycstt(input_fpg_predi)),
    glycstt_status(run_glycstt(input_hba1c_normo)),
    glycstt_status(run_glycstt(input_hba1c_predi))
  ) %>%
    filter(AVISIT == "BASELINE")

  expect_dfs_equal(actual, expected, keys = c("USUBJID", "PARAMCD", "AVISIT"))
})

test_that("derive_param_glycstt Test 11: unsupported unit errors", {
  input <- tribble(
    ~STUDYID, ~USUBJID, ~PARAMCD, ~AVISIT, ~AVISITN, ~AVAL, ~AVALU,
    "STUDY01", "SUBJ001", "HBA1C", "BASELINE", 1, 5.4, "%",
    "STUDY01", "SUBJ001", "FPG", "BASELINE", 1, 90, "g/L"
  )

  expect_error(run_glycstt(input))
})

test_that("derive_param_glycstt Test 12: zero-row input errors in confirmation step", {
  input <- tribble(
    ~STUDYID, ~USUBJID, ~PARAMCD, ~AVISIT, ~AVISITN, ~AVAL, ~AVALU
  )

  expect_error(run_glycstt(input))
})
