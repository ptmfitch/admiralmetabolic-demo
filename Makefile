# Demo targets for a clean machine. Run from the repository root.
# DEMO / SYNTHETIC · for enablement only

.DEFAULT_GOAL := test
.PHONY: setup test demo

# Install renv if needed, then restore the locked packages in renv.lock.
# Uses the CRAN URL recorded in the lockfile. renv turns that into a
# binary repository for the current operating system when one is published.
setup:
	Rscript --vanilla -e 'if (!requireNamespace("renv", quietly = TRUE)) install.packages("renv", repos = "https://cloud.r-project.org")'
	Rscript --vanilla -e 'renv::restore(prompt = FALSE)'

# Package tests. Same suite as testthat::test_local() / devtools::test().
test:
	@Rscript -e 'if (!requireNamespace("testthat", quietly = TRUE)) { cat("Dependencies are not installed.\nFrom the repository root, run: make setup\nThen run: make test\n", file = stderr()); quit(status = 1) }; testthat::test_local(stop_on_failure = TRUE)'

# Synthetic derivation. The script is added by the demo-pipeline change.
demo:
	@if [ -f inst/demo/run_pipeline.R ]; then \
		Rscript inst/demo/run_pipeline.R; \
	else \
		printf '%s\n' \
			'DEMO / SYNTHETIC · for enablement only' \
			'inst/demo/run_pipeline.R is not in this checkout.' \
			'The demo derivation adds that script. When it is present, make demo runs it and writes inst/demo/output/adwl.csv.'; \
	fi
