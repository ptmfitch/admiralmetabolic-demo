#!/usr/bin/env Rscript

# DEMO / SYNTHETIC · for enablement only
#
# Compare Week 26 responder flags on two demo ADWL extracts (before and
# after a derivation change). Base R only.
#
# The analysis row is PARAMCD WEIGHT at Week 26: AVISITN 26, or an AVISIT
# label that starts with "Week 26". RESP5FL / RESP10FL are Y/N flags for
# weight loss of at least 5% / 10%. PCHG is percent change from baseline,
# so -5 is a 5.0% loss.
#
#   Rscript inst/demo/compare_flags.R --before before.csv --after after.csv
#   Rscript inst/demo/compare_flags.R before.csv after.csv
#   Rscript inst/demo/compare_flags.R \
#     --before-ref <git-ref> --after-ref <git-ref>
#
# Writes <out-dir>/flag_comparison.csv and flag_comparison.json.
# Default out-dir is inst/demo/output.

demo_banner <- function() {
  "DEMO / SYNTHETIC \u00b7 for enablement only"
}

demo_rule <- function() {
  paste(
    "Week 26 weight responders on the demo ADWL extract.",
    "RESP5FL is Y at a loss of at least 5 percent.",
    "RESP10FL is Y at a loss of at least 10 percent.",
    "PCHG is percent change from baseline, so -5 is a 5.0 percent loss.",
    "A rate is n responders over N subjects with a Week 26 WEIGHT row",
    "in that masked arm."
  )
}

usage_text <- function() {
  paste(
    demo_banner(),
    "",
    "Compare Week 26 responder flags on two demo ADWL extracts.",
    "",
    "Usage:",
    "  Rscript inst/demo/compare_flags.R \\",
    "    --before before.csv --after after.csv",
    "  Rscript inst/demo/compare_flags.R before.csv after.csv [out-dir]",
    "  Rscript inst/demo/compare_flags.R \\",
    "    --before-ref <ref> --after-ref <ref>",
    "",
    "Options:",
    "  --before, --after       Paths to adwl.csv extracts",
    "  --before-ref, --after-ref",
    "                          Git refs. Each ref is read at --adwl-path",
    "  --adwl-path PATH        Path inside the repo",
    "                          (default inst/demo/output/adwl.csv)",
    "  --out-dir DIR           Output directory",
    "                          (default inst/demo/output)",
    "  -h, --help              Show this help",
    "",
    "Writes flag_comparison.csv and flag_comparison.json.",
    "Rates are n, N, and percent by TRT01P for RESP5FL and RESP10FL.",
    "The subject list is everyone whose RESP5FL value changed,",
    "with PCHG from the Week 26 WEIGHT row.",
    sep = "\n"
  )
}

compare_flags_invoked_directly <- function() {
  args <- commandArgs(trailingOnly = FALSE)
  file_args <- grep("^--file=", args, value = TRUE)
  if (length(file_args) != 1L) {
    return(FALSE)
  }
  invoked <- sub("^--file=", "", file_args)
  basename(normalizePath(invoked, mustWork = FALSE)) == "compare_flags.R"
}

assert_git_ref <- function(ref) {
  if (!is.character(ref) || length(ref) != 1L || is.na(ref) || !nzchar(ref)) {
    stop("Git ref must be a non-empty string.", call. = FALSE)
  }
  ok <- grepl("^[A-Za-z0-9][A-Za-z0-9._/-]*$", ref)
  has_dotdot <- grepl("\\.\\.", ref)
  has_slashslash <- grepl("//", ref, fixed = TRUE)
  if (!ok || has_dotdot || has_slashslash) {
    stop(
      "Git ref must be a branch, tag, or commit, for example main.",
      call. = FALSE
    )
  }
  ref
}

assert_repo_path <- function(path) {
  invalid_path <- !is.character(path) || length(path) != 1L || is.na(path) ||
    !nzchar(path)
  if (invalid_path) {
    stop("ADWL path must be a non-empty string.", call. = FALSE)
  }
  absolute <- startsWith(path, "/") || startsWith(path, "~") ||
    startsWith(path, "-")
  unsafe <- grepl("\\.\\.", path) || grepl("[[:space:]:\\\\]", path)
  if (absolute || unsafe) {
    stop(
      "ADWL path must be a relative path inside the git repo.",
      call. = FALSE
    )
  }
  path
}

git_show_file <- function(ref, repo_path, work_tree = NULL) {
  ref <- assert_git_ref(ref)
  repo_path <- assert_repo_path(repo_path)
  bad_tree <- !is.null(work_tree) &&
    (length(work_tree) != 1L || startsWith(work_tree, "-"))
  if (bad_tree) {
    stop("work_tree must be a single directory path.", call. = FALSE)
  }
  args <- character()
  if (!is.null(work_tree)) {
    args <- c("-C", work_tree)
  }
  args <- c(args, "show", paste0(ref, ":", repo_path))
  tmp <- tempfile(fileext = ".csv")
  err <- tempfile(fileext = ".txt")
  status <- suppressWarnings(
    system2("git", args, stdout = tmp, stderr = err)
  )
  code <- status
  if (is.null(code)) {
    code <- attr(status, "status")
  }
  if (is.null(code)) {
    code <- 0L
  }
  detail <- paste(readLines(err, warn = FALSE), collapse = "\n")
  unlink(err)
  if (!identical(as.integer(code), 0L)) {
    unlink(tmp)
    stop(
      "Could not read ", repo_path, " from git ref ", ref, ".\n",
      detail,
      call. = FALSE
    )
  }
  tmp
}

read_adwl <- function(x) {
  if (is.data.frame(x)) {
    return(x)
  }
  if (!is.character(x) || length(x) != 1L || is.na(x) || !nzchar(x)) {
    stop("ADWL input must be a data frame or one file path.", call. = FALSE)
  }
  if (!file.exists(x)) {
    stop("ADWL file not found: ", x, call. = FALSE)
  }
  utils::read.csv(
    x,
    stringsAsFactors = FALSE,
    na.strings = c("NA", ""),
    check.names = FALSE
  )
}

normalize_flag <- function(x) {
  flag <- toupper(trimws(as.character(x)))
  flag[is.na(x) | !nzchar(flag) | flag %in% c("NA", "NAN")] <- NA_character_
  bad <- !is.na(flag) & !flag %in% c("Y", "N")
  if (any(bad)) {
    found <- paste(unique(flag[bad]), collapse = ", ")
    stop("Responder flags must be Y or N. Found: ", found, call. = FALSE)
  }
  flag
}

is_week_26 <- function(avisit, avisitn) {
  visit_n <- suppressWarnings(as.numeric(avisitn))
  by_number <- !is.na(visit_n) & visit_n == 26
  label <- tolower(trimws(ifelse(is.na(avisit), "", as.character(avisit))))
  by_label <- grepl("^week[[:space:]]*26\\b", label, perl = TRUE)
  by_number | by_label
}

week26_weight_rows <- function(df) {
  required <- c(
    "USUBJID", "TRT01P", "AVISIT", "AVISITN", "PARAMCD",
    "PCHG", "RESP5FL", "RESP10FL"
  )
  missing <- setdiff(required, names(df))
  if (length(missing) > 0L) {
    stop(
      "ADWL extract is missing columns: ",
      paste(missing, collapse = ", "),
      call. = FALSE
    )
  }
  param <- toupper(trimws(as.character(df$PARAMCD)))
  keep <- !is.na(param) & param == "WEIGHT" & is_week_26(df$AVISIT, df$AVISITN)
  out <- data.frame(
    USUBJID = as.character(df$USUBJID[keep]),
    TRT01P = trimws(as.character(df$TRT01P[keep])),
    PCHG = suppressWarnings(as.numeric(df$PCHG[keep])),
    RESP5FL = normalize_flag(df$RESP5FL[keep]),
    RESP10FL = normalize_flag(df$RESP10FL[keep]),
    stringsAsFactors = FALSE
  )
  blank_arm <- is.na(out$TRT01P) | !nzchar(out$TRT01P)
  out$TRT01P[blank_arm] <- "(blank)"
  duplicated_id <- out$USUBJID[duplicated(out$USUBJID)]
  if (length(duplicated_id) > 0L) {
    stop(
      "More than one Week 26 WEIGHT row for: ",
      paste(unique(duplicated_id), collapse = ", "),
      call. = FALSE
    )
  }
  out[order(out$USUBJID), , drop = FALSE]
}

round_half_up <- function(x, digits) {
  if (is.na(x)) {
    return(NA_real_)
  }
  scale <- 10^digits
  sign(x) * floor(abs(x) * scale + 0.5) / scale
}

arm_rate <- function(rows, arm, flag) {
  use <- rows$TRT01P == arm
  den <- sum(use)
  num <- sum(use & rows[[flag]] == "Y", na.rm = TRUE)
  list(
    n = as.integer(num),
    N = as.integer(den),
    pct = if (den == 0L) NA_real_ else round_half_up(100 * num / den, 1)
  )
}

build_rates <- function(before_rows, after_rows) {
  arms <- sort(unique(c(before_rows$TRT01P, after_rows$TRT01P)))
  rates <- list()
  for (flag in c("RESP5FL", "RESP10FL")) {
    for (arm in arms) {
      rates[[length(rates) + 1L]] <- list(
        flag = flag,
        TRT01P = arm,
        before = arm_rate(before_rows, arm, flag),
        after = arm_rate(after_rows, arm, flag)
      )
    }
  }
  rates
}

flag_values_differ <- function(before, after) {
  left <- ifelse(is.na(before), "", as.character(before))
  right <- ifelse(is.na(after), "", as.character(after))
  left != right
}

build_changed_subjects <- function(before_rows, after_rows) {
  left <- before_rows[, c("USUBJID", "TRT01P", "PCHG", "RESP5FL"), drop = FALSE]
  right <- after_rows[, c("USUBJID", "TRT01P", "PCHG", "RESP5FL"), drop = FALSE]
  names(left) <- c("USUBJID", "TRT01P_before", "PCHG_before", "before")
  names(right) <- c("USUBJID", "TRT01P_after", "PCHG_after", "after")
  merged <- merge(left, right, by = "USUBJID", all = TRUE, sort = TRUE)
  if (nrow(merged) == 0L) {
    return(list())
  }
  changed <- flag_values_differ(merged$before, merged$after)
  merged <- merged[changed, , drop = FALSE]
  if (nrow(merged) == 0L) {
    return(list())
  }
  merged <- merged[order(merged$USUBJID), , drop = FALSE]
  subjects <- vector("list", nrow(merged))
  for (i in seq_len(nrow(merged))) {
    trt <- merged$TRT01P_after[i]
    if (is.na(trt) || !nzchar(trt)) {
      trt <- merged$TRT01P_before[i]
    }
    pchg <- merged$PCHG_after[i]
    if (is.na(pchg)) {
      pchg <- merged$PCHG_before[i]
    }
    subjects[[i]] <- list(
      USUBJID = merged$USUBJID[i],
      TRT01P = trt,
      PCHG = pchg,
      before = merged$before[i],
      after = merged$after[i]
    )
  }
  subjects
}

build_flag_comparison <- function(before_df, after_df) {
  before_rows <- week26_weight_rows(before_df)
  after_rows <- week26_weight_rows(after_df)
  list(
    banner = demo_banner(),
    endpoint = "Week 26 WEIGHT",
    rule = demo_rule(),
    responder_rates = build_rates(before_rows, after_rows),
    subjects_resp5fl_changed = build_changed_subjects(before_rows, after_rows)
  )
}

json_escape <- function(x) {
  x <- enc2utf8(x)
  x <- gsub("\\", "\\\\", x, fixed = TRUE)
  x <- gsub("\"", "\\\"", x, fixed = TRUE)
  x <- gsub("\b", "\\b", x, fixed = TRUE)
  x <- gsub("\f", "\\f", x, fixed = TRUE)
  x <- gsub("\n", "\\n", x, fixed = TRUE)
  x <- gsub("\r", "\\r", x, fixed = TRUE)
  x <- gsub("\t", "\\t", x, fixed = TRUE)
  x
}

format_json_number <- function(x) {
  if (is.nan(x) || is.infinite(x)) {
    stop("Non-finite number in comparison output.", call. = FALSE)
  }
  if (abs(x - round(x)) < 1e-8) {
    return(sprintf("%.0f", round(x)))
  }
  tenths <- round(x * 10) / 10
  if (abs(x - tenths) < 1e-8) {
    return(sprintf("%.1f", tenths))
  }
  text <- sub("0+$", "", sprintf("%.6f", round(x, 6)))
  sub("\\.$", "", text)
}

to_json <- function(x, indent = 0L) {
  pad <- strrep("  ", indent)
  inner <- strrep("  ", indent + 1L)
  if (is.null(x)) {
    return("null")
  }
  if (is.atomic(x) && length(x) == 1L) {
    if (is.logical(x)) {
      if (is.na(x)) {
        return("null")
      }
      return(if (isTRUE(x)) "true" else "false")
    }
    if (is.numeric(x)) {
      if (is.na(x)) {
        return("null")
      }
      return(format_json_number(x))
    }
    if (is.character(x)) {
      if (is.na(x)) {
        return("null")
      }
      return(paste0("\"", json_escape(x), "\""))
    }
  }
  if (is.list(x) && !is.null(names(x)) && all(nzchar(names(x)))) {
    if (length(x) == 0L) {
      return("{}")
    }
    parts <- vapply(names(x), function(name) {
      value <- to_json(x[[name]], indent + 1L)
      paste0(inner, "\"", json_escape(name), "\": ", value)
    }, character(1))
    return(paste0("{\n", paste(parts, collapse = ",\n"), "\n", pad, "}"))
  }
  if (is.list(x) || (is.atomic(x) && length(x) != 1L)) {
    if (length(x) == 0L) {
      return("[]")
    }
    items <- if (is.list(x)) x else as.list(x)
    parts <- vapply(items, function(item) {
      paste0(inner, to_json(item, indent + 1L))
    }, character(1))
    return(paste0("[\n", paste(parts, collapse = ",\n"), "\n", pad, "]"))
  }
  stop("Cannot encode comparison value as JSON.", call. = FALSE)
}

empty_comparison_frame <- function() {
  data.frame(
    record_type = character(),
    flag = character(),
    TRT01P = character(),
    before_n = integer(),
    before_N = integer(),
    before_pct = numeric(),
    after_n = integer(),
    after_N = integer(),
    after_pct = numeric(),
    USUBJID = character(),
    PCHG = numeric(),
    before = character(),
    after = character(),
    stringsAsFactors = FALSE
  )
}

rates_frame <- function(rates) {
  n <- length(rates)
  if (n == 0L) {
    return(empty_comparison_frame())
  }
  data.frame(
    record_type = rep("responder_rate", n),
    flag = vapply(rates, `[[`, character(1), "flag"),
    TRT01P = vapply(rates, `[[`, character(1), "TRT01P"),
    before_n = vapply(rates, function(r) r$before$n, integer(1)),
    before_N = vapply(rates, function(r) r$before$N, integer(1)),
    before_pct = vapply(rates, function(r) r$before$pct, numeric(1)),
    after_n = vapply(rates, function(r) r$after$n, integer(1)),
    after_N = vapply(rates, function(r) r$after$N, integer(1)),
    after_pct = vapply(rates, function(r) r$after$pct, numeric(1)),
    USUBJID = rep(NA_character_, n),
    PCHG = rep(NA_real_, n),
    before = rep(NA_character_, n),
    after = rep(NA_character_, n),
    stringsAsFactors = FALSE
  )
}

flag_or_na <- function(x) {
  if (is.null(x) || length(x) == 0L || is.na(x)) {
    return(NA_character_)
  }
  as.character(x)
}

changed_frame <- function(subjects) {
  n <- length(subjects)
  if (n == 0L) {
    return(empty_comparison_frame())
  }
  data.frame(
    record_type = rep("resp5fl_changed", n),
    flag = rep("RESP5FL", n),
    TRT01P = vapply(subjects, `[[`, character(1), "TRT01P"),
    before_n = rep(NA_integer_, n),
    before_N = rep(NA_integer_, n),
    before_pct = rep(NA_real_, n),
    after_n = rep(NA_integer_, n),
    after_N = rep(NA_integer_, n),
    after_pct = rep(NA_real_, n),
    USUBJID = vapply(subjects, `[[`, character(1), "USUBJID"),
    PCHG = vapply(subjects, function(s) as.numeric(s$PCHG), numeric(1)),
    before = vapply(subjects, function(s) flag_or_na(s$before), character(1)),
    after = vapply(subjects, function(s) flag_or_na(s$after), character(1)),
    stringsAsFactors = FALSE
  )
}

write_flag_comparison <- function(result, out_dir) {
  dir.create(out_dir, recursive = TRUE, showWarnings = FALSE)
  csv_path <- file.path(out_dir, "flag_comparison.csv")
  json_path <- file.path(out_dir, "flag_comparison.json")
  frame <- rbind(
    rates_frame(result$responder_rates),
    changed_frame(result$subjects_resp5fl_changed)
  )
  utils::write.csv(
    frame,
    csv_path,
    row.names = FALSE,
    na = "",
    fileEncoding = "UTF-8"
  )
  public <- result[c(
    "banner", "endpoint", "rule",
    "responder_rates", "subjects_resp5fl_changed"
  )]
  writeLines(to_json(public), json_path, useBytes = TRUE)
  list(csv = csv_path, json = json_path)
}

compare_responder_flags <- function(
  before,
  after,
  out_dir = "inst/demo/output"
) {
  same_file <- is.character(before) && is.character(after) &&
    length(before) == 1L && length(after) == 1L &&
    file.exists(before) && file.exists(after) &&
    normalizePath(before) == normalizePath(after)
  if (same_file) {
    message(
      "Before and after are the same file. No RESP5FL change will appear."
    )
  }
  result <- build_flag_comparison(read_adwl(before), read_adwl(after))
  result$paths <- write_flag_comparison(result, out_dir)
  result
}

take_option <- function(args, index, flag) {
  if (index > length(args)) {
    stop("Missing value after ", flag, call. = FALSE)
  }
  list(value = args[[index]], index = index)
}

parse_compare_args <- function(args) {
  opts <- list(
    before = NULL,
    after = NULL,
    before_ref = NULL,
    after_ref = NULL,
    adwl_path = "inst/demo/output/adwl.csv",
    out_dir = "inst/demo/output",
    out_dir_set = FALSE,
    help = FALSE
  )
  positional <- character()
  index <- 1L
  while (index <= length(args)) {
    arg <- args[[index]]
    if (arg %in% c("-h", "--help")) {
      opts$help <- TRUE
    } else if (arg == "--before") {
      taken <- take_option(args, index + 1L, arg)
      opts$before <- taken$value
      index <- taken$index
    } else if (arg == "--after") {
      taken <- take_option(args, index + 1L, arg)
      opts$after <- taken$value
      index <- taken$index
    } else if (arg == "--before-ref") {
      taken <- take_option(args, index + 1L, arg)
      opts$before_ref <- taken$value
      index <- taken$index
    } else if (arg == "--after-ref") {
      taken <- take_option(args, index + 1L, arg)
      opts$after_ref <- taken$value
      index <- taken$index
    } else if (arg == "--adwl-path") {
      taken <- take_option(args, index + 1L, arg)
      opts$adwl_path <- taken$value
      index <- taken$index
    } else if (arg == "--out-dir") {
      taken <- take_option(args, index + 1L, arg)
      opts$out_dir <- taken$value
      opts$out_dir_set <- TRUE
      index <- taken$index
    } else if (startsWith(arg, "-")) {
      stop("Unknown argument: ", arg, call. = FALSE)
    } else {
      positional <- c(positional, arg)
    }
    index <- index + 1L
  }
  if (is.null(opts$before) && length(positional) >= 1L) {
    opts$before <- positional[[1]]
  }
  if (is.null(opts$after) && length(positional) >= 2L) {
    opts$after <- positional[[2]]
  }
  if (!opts$out_dir_set && length(positional) >= 3L) {
    opts$out_dir <- positional[[3]]
  }
  opts
}

compare_flags_cli <- function(args = commandArgs(trailingOnly = TRUE)) {
  opts <- parse_compare_args(args)
  if (isTRUE(opts$help)) {
    cat(usage_text(), "\n", sep = "")
    return(invisible(NULL))
  }
  has_files <- !is.null(opts$before) || !is.null(opts$after)
  has_refs <- !is.null(opts$before_ref) || !is.null(opts$after_ref)
  if (has_files && has_refs) {
    stop("Pass CSV paths or git refs, not both.", call. = FALSE)
  }
  if (!has_files && !has_refs) {
    stop(usage_text(), call. = FALSE)
  }
  if (has_refs) {
    if (is.null(opts$before_ref) || is.null(opts$after_ref)) {
      stop("Git mode needs both --before-ref and --after-ref.", call. = FALSE)
    }
    temps <- character()
    on.exit(unlink(temps), add = TRUE)
    before <- git_show_file(opts$before_ref, opts$adwl_path)
    temps <- c(temps, before)
    after <- git_show_file(opts$after_ref, opts$adwl_path)
    temps <- c(temps, after)
  } else {
    if (is.null(opts$before) || is.null(opts$after)) {
      stop(
        "File mode needs both a before extract and an after extract.",
        call. = FALSE
      )
    }
    before <- opts$before
    after <- opts$after
  }
  result <- compare_responder_flags(before, after, opts$out_dir)
  n_changed <- length(result$subjects_resp5fl_changed)
  noun <- if (n_changed == 1L) "subject" else "subjects"
  cat(demo_banner(), "\n", sep = "")
  cat("Wrote ", result$paths$csv, "\n", sep = "")
  cat("Wrote ", result$paths$json, "\n", sep = "")
  cat("RESP5FL changed for ", n_changed, " ", noun, ".\n", sep = "")
  invisible(result)
}

if (isTRUE(compare_flags_invoked_directly())) {
  compare_flags_cli()
}
