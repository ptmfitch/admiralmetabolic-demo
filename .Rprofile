# The lockfile pins test dependencies (testthat, diffdf) that an explicit
# snapshot does not treat as project dependencies, and the autoloader
# installs renv itself beside them. Skip the startup consistency banner
# so `make test` output stays the test result.
Sys.setenv(RENV_CONFIG_SYNCHRONIZED_CHECK = "FALSE")
source("renv/activate.R")
