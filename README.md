# admiralmetabolic demo <img src="man/figures/logo.png" align="right" width="200" style="margin-left:50px;"/>

**DEMO / SYNTHETIC · for enablement only**

This repository is a demo fork of [pharmaverse/admiralmetabolic](https://github.com/pharmaverse/admiralmetabolic), the metabolism extension of the [{admiral}](https://pharmaverse.org/e2eclinical/adam/) ADaM toolbox for obesity and diabetes analyses. Upstream development stays in the pharmaverse project. This fork is an enablement copy: a documented Mac setup, a locked dependency set, and one command that runs the package tests.

The R package is still named `admiralmetabolic`. It remains under the Apache-2.0 license in [LICENSE.md](LICENSE.md). Authors and copyright are unchanged from upstream; they are recorded in `DESCRIPTION`.

Chronic-disease study teams often work under CSV, 21 CFR Part 11, Annex 11, and GAMP 5 change control, with clinical data on a lakehouse. The checks in this fork produce evidence you can attach to your validated process.

## Run the tests

From a clean Mac, follow [docs/setup-macos.md](docs/setup-macos.md). After R is installed, the repository root is:

```bash
make setup
make test
```

`make setup` restores the packages pinned in `renv.lock`. `make test` runs the package tests with `testthat`. `make demo` runs `inst/demo/run_pipeline.R` when that file is present. Until the demo derivation is in the checkout, `make demo` prints a short message. When the script is present it writes `inst/demo/output/adwl.csv` from the synthetic data in `inst/demo/data/`.

If `make setup` finishes but `make demo` or `make test` fails with `there is no package called 'admiral'`, the project library is probably empty. `make setup` calls `renv::restore()` through `Rscript --vanilla`, which skips `.Rprofile` and the renv autoloader. Restore can report that the library is already synchronized without installing packages, especially when your R version differs from the one that wrote `renv.lock`. Run restore again with the project profile active, then retry:

```bash
Rscript -e 'renv::restore(prompt = FALSE)'
make demo
```

## Metabolic Insights walkthrough

**DEMO / SYNTHETIC · for enablement only**

The CAD-7 weight-outcomes walkthrough is a local UI under `apps/metabolic-insights`. It does not read clinical data and it does not change the R package.

From the repository root, with Node 20+ and pnpm:

```bash
pnpm install
pnpm dev:metabolic
```

Open the printed local URL. The flow is subject measures, analysis configuration, a short processing step, then the outcomes dashboard. `pnpm test:metabolic` runs the UI tests.

## What this fork changes

- `renv.lock` pins the packages required to install `{admiralmetabolic}` and run `make test`.
- `Makefile` provides `setup`, `test`, and `demo`.
- `.github/workflows/test.yml` uses [r-lib/actions](https://github.com/r-lib/actions) to install dependencies and run `make test` on pull requests and on pushes to `main`.

The upstream pharmaverse workflow is not used. It calls shared admiralci workflows, writes a coverage badge on a `badges` branch, and bumps the version with an org automation token. Those are not available on this fork.

## Upstream

- Source: <https://github.com/pharmaverse/admiralmetabolic>
- Documentation: <https://pharmaverse.github.io/admiralmetabolic/>
- admiral ecosystem: <https://pharmaverse.org/e2eclinical/adam/>
- CRAN: <https://CRAN.R-project.org/package=admiralmetabolic>
