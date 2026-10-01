# AGENTS.md

**DEMO / SYNTHETIC · for enablement only**

This repository is a demo fork of [pharmaverse/admiralmetabolic](https://github.com/pharmaverse/admiralmetabolic) (Apache-2.0). It supports enablement of a regulated software-development and change-control workflow for a chronic-disease pharma audience. It is not an upstream pharmaverse repository.

Do not open issues, pull requests, or comments on any pharmaverse repository. Open pull requests against `ptmfitch/admiralmetabolic-demo` `main` only. GitHub defaults fork pull requests at the upstream repository; check the base repository before creating one.

## Setup and test

macOS steps, written to be copied as-is, are in [docs/setup-macos.md](docs/setup-macos.md). No cloud keys or hosted-service logins are required.

From the repository root, after R is on the `PATH`:

```bash
make setup
make test
make demo
```

- `make setup` installs `renv` if it is missing, then runs `renv::restore(prompt = FALSE)` from `renv.lock`.
- `make test` runs `testthat::test_local(stop_on_failure = TRUE)`. That is the same test suite as `devtools::test()`, without installing the full `devtools` stack. `.Rprofile` turns off renv's startup consistency banner, because the lockfile intentionally records test dependencies that an explicit snapshot does not call "used".
- `make demo` runs `Rscript inst/demo/run_pipeline.R` when that file exists. If it does not, the target prints a short message and exits successfully.

`renv.lock` was written with `RENV_LOCKFILE_VERSION=1` (package, version, repository, requirements, hash). It pins the Imports and Depends tree plus `testthat` and `diffdf`, which the current tests need. Refresh it only on purpose:

```r
Sys.setenv(RENV_LOCKFILE_VERSION = "1")
renv::snapshot(
  packages = c(
    "admiral", "admiraldev", "cli", "dplyr", "lifecycle", "lubridate",
    "magrittr", "purrr", "rlang", "stringr", "tidyselect", "testthat", "diffdf"
  ),
  exclude = "renv",
  prompt = FALSE
)
```

A plain `renv::snapshot()` uses snapshot type `explicit` and would drop `testthat` and `diffdf`.

Continuous integration is `.github/workflows/test.yml`. It uses r-lib/actions to install hard dependencies plus `testthat` and `diffdf`, with the renv autoloader turned off, then runs `make test`. It runs on pull requests and on pushes to `main`.

## Where the demo derivation lives

- Synthetic inputs: `inst/demo/data/`
- Entry point: `inst/demo/run_pipeline.R`
- Output: `inst/demo/output/adwl.csv`

The shared contract is: `Rscript inst/demo/run_pipeline.R` writes `inst/demo/output/adwl.csv`. Demo tests are `tests/testthat/test-demo-*.R`. `make test` runs all package tests, including those files when they exist.

## Validated paths

`inst/demo/**` and `R/**` are validated paths. Changes there need change control. Do not edit package functions under `R/` to scaffold the demo. Do not rename the R package. Leave the upstream `DESCRIPTION` authors and [LICENSE.md](LICENSE.md) as they are.

People working this demo are under CSV, 21 CFR Part 11, Annex 11, and GAMP 5 change control, and they run clinical data on a Databricks lakehouse. The tooling produces evidence for your validated process. Do not describe it as GxP compliant.

## Hard rules

- No company or customer names in code, docs, commits, or pull request text. Use generic words such as sponsor, pharma, and chronic-disease. Do not add names to `DESCRIPTION`.
- Mark demo material `DEMO / SYNTHETIC · for enablement only`.
- Setup docs stay copy-paste runnable on a Mac, with no cloud keys or SaaS authentication.
- Leave pull requests open and ready for review. Do not merge them unless a person asks.
- Do not modify these paths from the foundation change; other changes own them:
  - `inst/demo/**`, `data-raw/demo_*`, `tests/testthat/test-demo-*.R`
  - `.cursor/**`, the pull request template, `CODEOWNERS`
  - `.github/workflows/evidence-pack.yml`
  - `docs/change-control/**`, `docs/audit/**`, `docs/run-sheet.md`, `docs/demo/canvas-prompt.md`
