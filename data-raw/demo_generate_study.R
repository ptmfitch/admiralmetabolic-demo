# DEMO / SYNTHETIC · for enablement only
#
# Reproducible generator for a blinded 26-week obesity/T2D study.
# The committed CSVs under inst/demo/data/ are the demo inputs. Re-run
# this script from the package root to regenerate them:
#
#   Rscript data-raw/demo_generate_study.R
#
# SAP display rule used when the anchors are built: percent change from
# baseline is signed (a loss is negative) and rounded to 1 decimal.
# A fixed set of subjects is anchored so Week 26 weight loss rounds to
# 5.0% or 10.0%. Baseline BMI is at least 30, or at least 27 with T2D.
# Every subject in this study has T2D, and baseline HbA1c is 7.0-10.5%.
#
# Seed and RNG are pinned so a re-run matches the committed files.
# Actual treatment is written only to inst/demo/data/unblinding_key.csv.

RNGkind(kind = "default", normal.kind = "default", sample.kind = "Rejection")
set.seed(20261001)

args <- commandArgs(trailingOnly = FALSE)
file_arg <- grep("^--file=", args, value = TRUE)
if (length(file_arg) == 0L) {
  stop("Run this file with Rscript from a checkout of the demo fork.")
}
root <- normalizePath(file.path(
  dirname(normalizePath(sub("^--file=", "", file_arg[[1]]))),
  ".."
))
data_dir <- file.path(root, "inst", "demo", "data")
dir.create(data_dir, showWarnings = FALSE, recursive = TRUE)

studyid <- "SYNTH-OBT2D-26"
n_per_arm <- 66L
n <- n_per_arm * 3L
n_exact_5_per_arm <- 3L
n_exact_10_per_arm <- 2L
n_overweight <- 40L

# Masked labels are the only treatment values on the analysis inputs.
# The actual names live in the unblinding key.
actual_to_masked <- c(
  "Placebo" = "ARM B",
  "Low Dose" = "ARM C",
  "High Dose" = "ARM A"
)

visits <- data.frame(
  AVISIT = c(
    "Baseline", "Week 4", "Week 8", "Week 12", "Week 16", "Week 20", "Week 26"
  ),
  AVISITN = c(0L, 4L, 8L, 12L, 16L, 20L, 26L),
  stringsAsFactors = FALSE
)

loss_fraction <- function(week) {
  k <- 2.2
  (1 - exp(-k * week / 26)) / (1 - exp(-k))
}

bmi_of <- function(weight_kg, height_cm) {
  weight_kg / (height_cm * height_cm / 10000)
}

aval_for_pchg <- function(base, target) {
  target <- round(as.numeric(target), 1)
  center <- base * (1 + target / 100)
  grid <- round(seq(center - 4, center + 4, by = 0.1), 1)
  pchg <- round(100 * (grid - base) / abs(base), 1)
  ok <- which(abs(pchg - target) < 1e-8)
  if (length(ok) == 0L) {
    return(NA_real_)
  }
  grid[[ok[which.min(abs(grid[ok] - center))]]]
}

snap_weight_to_bmi <- function(weight_kg, height_cm, lo, hi) {
  weight_kg <- round(weight_kg, 1)
  for (step in 0:50) {
    for (sign in c(0, 1, -1)) {
      candidate <- round(weight_kg + sign * step * 0.1, 1)
      if (candidate < 45) {
        next
      }
      bmi <- round(bmi_of(candidate, height_cm), 1)
      if (bmi >= lo && bmi < hi) {
        return(candidate)
      }
    }
  }
  stop("Could not place a baseline weight inside the BMI band.")
}

sample_pchg <- function(n, mean, sd, lo, hi) {
  out <- numeric(n)
  for (i in seq_len(n)) {
    repeat {
      draw <- round(rnorm(1, mean, sd), 1)
      if (draw >= lo && draw <= hi && draw != -5 && draw != -10) {
        out[[i]] <- draw
        break
      }
    }
  }
  out
}

draw_hba1c <- function(n, mean, sd, lo, hi) {
  out <- numeric(n)
  for (i in seq_len(n)) {
    repeat {
      draw <- round(rnorm(1, mean, sd), 1)
      if (draw >= lo && draw <= hi) {
        out[[i]] <- draw
        break
      }
    }
  }
  out
}

usubjid <- sprintf("SYNTH-%03d", seq_len(n))
actual <- sample(rep(c("Placebo", "Low Dose", "High Dose"), each = n_per_arm))
trt01p <- unname(actual_to_masked[actual])
sex <- sample(c("F", "M"), n, replace = TRUE, prob = c(0.62, 0.38))
age <- sample(30:75, n, replace = TRUE)
height_cm <- as.integer(pmin(pmax(round(rnorm(n, 169, 9)), 152), 196))
band <- rep("obesity", n)
band[sample.int(n, n_overweight)] <- "overweight"

base_weight <- numeric(n)
for (i in seq_len(n)) {
  if (band[[i]] == "overweight") {
    raw_bmi <- runif(1, 27.4, 29.6)
    lo <- 27
    hi <- 30
  } else {
    u <- runif(1)
    if (u < 0.62) {
      raw_bmi <- runif(1, 30.3, 34.7)
    } else if (u < 0.9) {
      raw_bmi <- runif(1, 35.2, 39.6)
    } else {
      raw_bmi <- runif(1, 40.3, 46)
    }
    lo <- 30
    hi <- 70
  }
  base_weight[[i]] <- snap_weight_to_bmi(
    raw_bmi * (height_cm[[i]] / 100)^2,
    height_cm[[i]],
    lo,
    hi
  )
}

pchg26 <- numeric(n)
pchg26[actual == "Placebo"] <- sample_pchg(n_per_arm, -2.2, 2.6, -12, 4)
pchg26[actual == "Low Dose"] <- sample_pchg(n_per_arm, -7.4, 3.0, -18, 1)
pchg26[actual == "High Dose"] <- sample_pchg(n_per_arm, -13.2, 3.2, -22, -3)

bmi_lo <- ifelse(band == "overweight", 27, 30)
bmi_hi <- ifelse(band == "overweight", 30, 70)
week26_weight <- rep(NA_real_, n)

for (arm in c("Placebo", "Low Dose", "High Dose")) {
  idx <- which(actual == arm)
  idx <- idx[order(usubjid[idx])]
  pchg26[idx[seq_len(n_exact_5_per_arm)]] <- -5
  pchg26[idx[n_exact_5_per_arm + seq_len(n_exact_10_per_arm)]] <- -10
}

for (i in seq_len(n)) {
  placed <- aval_for_pchg(base_weight[[i]], pchg26[[i]])
  if (!is.na(placed)) {
    week26_weight[[i]] <- placed
    next
  }
  found <- FALSE
  for (step in 1:40) {
    for (sign in c(-1, 1)) {
      candidate <- round(base_weight[[i]] + sign * step * 0.1, 1)
      bmi <- round(bmi_of(candidate, height_cm[[i]]), 1)
      if (bmi < bmi_lo[[i]] || bmi >= bmi_hi[[i]]) {
        next
      }
      placed <- aval_for_pchg(candidate, pchg26[[i]])
      if (!is.na(placed)) {
        base_weight[[i]] <- candidate
        week26_weight[[i]] <- placed
        found <- TRUE
        break
      }
    }
    if (found) {
      break
    }
  }
  if (!found) {
    stop("Could not anchor Week 26 weight for ", usubjid[[i]])
  }
}

hba1c_base <- draw_hba1c(n, 8.2, 0.85, 7.0, 10.5)
hba1c_chg <- round(0.1 * pchg26 + rnorm(n, 0, 0.15), 1)
hba1c_w26 <- pmin(pmax(round(hba1c_base + hba1c_chg, 1), 5.5), 12.0)

post_weeks <- c(4L, 8L, 12L, 16L, 20L)
weight_rows <- vector("list", n)
hba1c_rows <- vector("list", n)
height_rows <- vector("list", n)

for (i in seq_len(n)) {
  visit_weight <- c(base_weight[[i]], rep(NA_real_, length(post_weeks)), week26_weight[[i]])
  visit_hba1c <- c(hba1c_base[[i]], rep(NA_real_, length(post_weeks)), hba1c_w26[[i]])
  for (j in seq_along(post_weeks)) {
    week <- post_weeks[[j]]
    fraction <- loss_fraction(week)
    jitter <- round(rnorm(1, 0, 0.25), 1)
    target <- round(pchg26[[i]] * fraction + jitter, 1)
    target <- min(max(target, -30), 6)
    aval <- aval_for_pchg(base_weight[[i]], target)
    if (is.na(aval)) {
      aval <- aval_for_pchg(base_weight[[i]], round(pchg26[[i]] * fraction, 1))
    }
    if (is.na(aval)) {
      aval <- round(base_weight[[i]] * (1 + pchg26[[i]] * fraction / 100), 1)
    }
    visit_weight[[j + 1L]] <- aval

    hba_target <- round(
      hba1c_base[[i]] + fraction * (hba1c_w26[[i]] - hba1c_base[[i]]) +
        round(rnorm(1, 0, 0.05), 1),
      1
    )
    visit_hba1c[[j + 1L]] <- min(max(hba_target, 5.5), 12.0)
  }

  height_rows[[i]] <- data.frame(
    STUDYID = studyid,
    USUBJID = usubjid[[i]],
    PARAMCD = "HEIGHT",
    PARAM = "Height (cm)",
    AVISIT = "Baseline",
    AVISITN = 0L,
    AVAL = height_cm[[i]],
    stringsAsFactors = FALSE
  )
  weight_rows[[i]] <- data.frame(
    STUDYID = studyid,
    USUBJID = usubjid[[i]],
    PARAMCD = "WEIGHT",
    PARAM = "Weight (kg)",
    AVISIT = visits$AVISIT,
    AVISITN = visits$AVISITN,
    AVAL = round(unlist(visit_weight), 1),
    stringsAsFactors = FALSE
  )
  hba1c_rows[[i]] <- data.frame(
    STUDYID = studyid,
    USUBJID = usubjid[[i]],
    PARAMCD = "HBA1C",
    PARAM = "HbA1c (%)",
    AVISIT = visits$AVISIT,
    AVISITN = visits$AVISITN,
    AVAL = round(unlist(visit_hba1c), 1),
    stringsAsFactors = FALSE
  )
}

findings <- do.call(rbind, c(height_rows, weight_rows, hba1c_rows))
findings <- findings[order(findings$USUBJID, findings$PARAMCD, findings$AVISITN), ]
rownames(findings) <- NULL

base_bmi <- round(bmi_of(base_weight, height_cm), 1)
adsl <- data.frame(
  STUDYID = studyid,
  USUBJID = usubjid,
  TRT01P = trt01p,
  AGE = age,
  SEX = sex,
  T2DFL = "Y",
  HEIGHTCM = height_cm,
  stringsAsFactors = FALSE
)
adsl <- adsl[order(adsl$USUBJID), ]
rownames(adsl) <- NULL

key <- data.frame(
  USUBJID = usubjid,
  TRT01A = actual,
  stringsAsFactors = FALSE
)
key <- key[order(key$USUBJID), ]
rownames(key) <- NULL

write.csv(
  findings,
  file.path(data_dir, "findings.csv"),
  row.names = FALSE
)
write.csv(
  adsl,
  file.path(data_dir, "adsl.csv"),
  row.names = FALSE
)
write.csv(
  key,
  file.path(data_dir, "unblinding_key.csv"),
  row.names = FALSE
)

# Confirm the committed values, not the in-memory draws, hit the anchors.
findings_r <- read.csv(file.path(data_dir, "findings.csv"), stringsAsFactors = FALSE)
adsl_r <- read.csv(file.path(data_dir, "adsl.csv"), stringsAsFactors = FALSE)
key_r <- read.csv(file.path(data_dir, "unblinding_key.csv"), stringsAsFactors = FALSE)

w_base <- findings_r[findings_r$PARAMCD == "WEIGHT" & findings_r$AVISITN == 0, ]
w_26 <- findings_r[findings_r$PARAMCD == "WEIGHT" & findings_r$AVISITN == 26, ]
paired <- merge(w_base, w_26, by = "USUBJID", suffixes = c("_base", "_w26"))
paired$PCHG <- round(
  100 * (paired$AVAL_w26 - paired$AVAL_base) / abs(paired$AVAL_base),
  1
)
paired <- merge(paired, adsl_r[, c("USUBJID", "TRT01P")], by = "USUBJID")
paired <- merge(paired, key_r, by = "USUBJID")

h_base <- findings_r[findings_r$PARAMCD == "HBA1C" & findings_r$AVISITN == 0, ]
ht <- findings_r[findings_r$PARAMCD == "HEIGHT", ]

stopifnot(nrow(adsl_r) == n)
stopifnot(all(adsl_r$TRT01P %in% c("ARM A", "ARM B", "ARM C")))
stopifnot(!("TRT01A" %in% names(adsl_r)))
stopifnot(!("TRT01A" %in% names(findings_r)))
stopifnot(identical(names(key_r), c("USUBJID", "TRT01A")))
stopifnot(all(key_r$TRT01A %in% c("Placebo", "Low Dose", "High Dose")))
stopifnot(all(h_base$AVAL >= 7 & h_base$AVAL <= 10.5))
stopifnot(all(adsl_r$T2DFL == "Y"))
stopifnot(all(base_bmi >= 27))
stopifnot(sum(base_bmi < 30) >= 20)
stopifnot(sum(base_bmi >= 30) >= 100)
stopifnot(sum(paired$PCHG == -5) == 9)
stopifnot(sum(paired$PCHG == -10) == 6)
stopifnot(all(tapply(paired$PCHG == -5, paired$TRT01A, sum) == n_exact_5_per_arm))
stopifnot(all(tapply(paired$PCHG == -10, paired$TRT01A, sum) == n_exact_10_per_arm))
stopifnot(any(paired$PCHG < -10), any(paired$PCHG > -10 & paired$PCHG < -5))
stopifnot(any(paired$PCHG < -5), any(paired$PCHG > -5))
arm_means <- tapply(paired$PCHG, paired$TRT01A, mean)
stopifnot(arm_means[["High Dose"]] < arm_means[["Low Dose"]])
stopifnot(arm_means[["Low Dose"]] < arm_means[["Placebo"]])
stopifnot(length(unique(ht$USUBJID)) == n)

message("Subjects: ", n)
message("Baseline BMI < 30: ", sum(base_bmi < 30))
message("Baseline BMI >= 30: ", sum(base_bmi >= 30))
message("Mean Week 26 PCHG by actual treatment:")
print(round(arm_means, 2))
message("Exact -5.0 by masked arm:")
print(tapply(paired$PCHG == -5, paired$TRT01P, sum))
message("Exact -5.0 by actual treatment:")
print(tapply(paired$PCHG == -5, paired$TRT01A, sum))
message("Exact -10.0 by masked arm:")
print(tapply(paired$PCHG == -10, paired$TRT01P, sum))
message("Wrote ", nrow(findings_r), " finding rows to ", data_dir)
