# DEMO / SYNTHETIC · for enablement only
#
# Build the synthetic Week 26 obesity/T2D analysis file.
#
# Usage (from the package root):
#   Rscript inst/demo/run_pipeline.R
#
# Reads inst/demo/data/ and writes inst/demo/output/adwl.csv.

args <- commandArgs(trailingOnly = FALSE)
file_arg <- grep("^--file=", args, value = TRUE)
if (length(file_arg) == 0L) {
  stop("Run this file with Rscript so the demo data directory can be resolved.")
}
script_dir <- dirname(normalizePath(sub("^--file=", "", file_arg[[1]])))

source(file.path(script_dir, "R", "derive_responder_flags.R"))
source(file.path(script_dir, "R", "build_adwl.R"))

data_dir <- file.path(script_dir, "data")
out_dir <- file.path(script_dir, "output")
dir.create(out_dir, showWarnings = FALSE, recursive = TRUE)

adwl <- build_adwl(data_dir)
out_path <- file.path(out_dir, "adwl.csv")
write.csv(adwl, out_path, row.names = FALSE, na = "NA")

message("Wrote ", nrow(adwl), " rows to ", out_path)
