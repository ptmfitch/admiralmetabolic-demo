# Set up on macOS

**DEMO / SYNTHETIC · for enablement only**

These steps take a clean Mac from clone to a green `make test` for this demo fork of [pharmaverse/admiralmetabolic](https://github.com/pharmaverse/admiralmetabolic). Copy each block into Terminal. Nothing here asks for a cloud key, a personal access token, or a sign-in to a hosted service.

The R package name stays `admiralmetabolic`. License and upstream authors are unchanged.

## What to expect

Measured on the Linux VM that produced this lockfile (Ubuntu 24.04, 8 vCPU, R 4.3.3) on 1 October 2026:

| Step | Wall clock |
| --- | --- |
| R plus the locked package set, from a machine with no R installed | 4 minutes 22 seconds |
| `make test` after that install (13 tests, 0 failures) | 3.7 seconds |

CRAN and Posit Package Manager were not reachable from that VM, so R came from Ubuntu and the packages were built from source. On a Mac, step 2 installs the current R release and `make setup` restores `renv.lock` from CRAN binaries (renv uses the Posit public binary repository when a binary exists for your R version). That skips the compile, so a Mac is usually faster than the VM time above. The first `make setup` is the long step. Later `make test` runs are a few seconds.

`renv.lock` records R 4.3.3 because that is the R that wrote it. A newer R release prints a version notice during restore. Continue. The package needs R 4.1 or newer, and the package versions stay pinned.

## 1. Command Line Tools

`git` and `make` come from the Xcode Command Line Tools.

```bash
xcode-select -p || xcode-select --install
```

If a dialog opens, finish it before the next step. Then confirm:

```bash
git --version
make --version
```

## 2. Install R

rig installs the current R release and is the copy-paste path. This block picks the Apple silicon or Intel installer from `uname -m`.

```bash
arch=$(uname -m)
case "$arch" in
  arm64) rig_pkg="rig-0.10.0-macOS-arm64.pkg" ;;
  x86_64) rig_pkg="rig-0.10.0-macOS-x86_64.pkg" ;;
  *) echo "Unsupported architecture: $arch"; exit 1 ;;
esac
curl -fL -o "/tmp/${rig_pkg}" "https://github.com/r-lib/rig/releases/download/v0.10.0/${rig_pkg}"
sudo installer -pkg "/tmp/${rig_pkg}" -target /
rig add release
R --version
```

Homebrew alternative, if you already use it:

```bash
brew install --cask rig
rig add release
```

CRAN installer alternative: download the macOS package for your chip from <https://cran.r-project.org/bin/macosx/>, run it, then continue at step 3. Open a new Terminal window so `Rscript` is on your `PATH`.

## 3. Clone and restore the lockfile

```bash
git clone https://github.com/ptmfitch/admiralmetabolic-demo.git
cd admiralmetabolic-demo
make setup
```

`make setup` installs `renv` from CRAN if it is not already installed, then runs `renv::restore()` against `renv.lock`. It does not prompt.

If you would rather install with pak and you accept that versions will float instead of matching the lockfile:

```bash
Rscript --vanilla -e 'install.packages("pak", repos = "https://cloud.r-project.org")'
Rscript --vanilla -e 'pak::local_install_deps(dependencies = c("Depends", "Imports", "LinkingTo")); pak::pkg_install(c("testthat", "diffdf"))'
```

Use `make setup` for the demo. That is the reproducible path.

## 4. Run the tests

```bash
make test
```

A green run ends with `FAIL 0` and a zero exit status. There are 13 tests in the package suite today. More are added when the demo derivation lands; `make test` runs those too.

## 5. Demo pipeline

```bash
make demo
```

Until `inst/demo/run_pipeline.R` is in your checkout, this prints a short message. After that file is present, the same command writes `inst/demo/output/adwl.csv`.

## If something fails

- `make: command not found` or `git: command not found`: finish the Command Line Tools install and open a new Terminal window.
- `Dependencies are not installed`: you are in the repository root and have not run `make setup`.
- `Rscript: command not found`: `rig add release` did not finish, or the shell was opened before R was installed. Run `rig add release` again, then `R --version`.
- renv cannot download packages: confirm <https://cloud.r-project.org> opens in a browser. This setup does not use a private package server.
- Restore warns that the lockfile was written with R 4.3.3: expected when you are on a newer release. Let the restore finish.
