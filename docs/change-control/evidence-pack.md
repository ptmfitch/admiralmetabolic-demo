DEMO / SYNTHETIC · for enablement only

# Evidence pack on the pull request

Illustrative only. The comment produces evidence for your validated process. It does not validate the change, and it is not an approval.

## Workflow

`.github/workflows/evidence-pack.yml` runs on each pull request open, reopen, and push.

1. Set up R with `r-lib/actions/setup-r` and `r-lib/actions/setup-r-dependencies`, the same shape as a lean R package check.
2. Run tests. If a `Makefile` target named `test` exists, the command is `make test`. Until that target exists, the command is `Rscript -e 'testthat::test_local(stop_on_failure = TRUE)'`.
3. Publish one comment. A later push edits that same comment. It does not add a second one.

The workflow uses `GITHUB_TOKEN` only. The head SHA in the comment is the pull request head, not the merge commit.

If GitHub Actions is disabled on this fork, the file is still the workflow and it will not run until Actions is enabled. `bash scripts/test-hooks.sh` and `python3 scripts/evidence-pack.py self-test` check the pieces that do not need Actions. A pull request from a fork of this fork cannot edit the comment: `GITHUB_TOKEN` is read-only on those runs. Branches in this repository can.

## Comment

The comment starts with the marker `<!-- compliance-evidence-pack -->` so the next run can find it. The visible heading is `Compliance Evidence Pack`. Directly under that heading:

```
Updated for <sha>
```

`<sha>` is the full head SHA of that push.

The body also has:

- the Jira key or `CR-` id parsed from the pull request body and the branch name
- the test command, pass or fail, and a short log tail
- the files changed under `inst/demo/**` and `R/**`

Parsing reads a Jira key (project letters, a hyphen, digits) or a `CR-` id from the pull request body and the branch name. HTML comments are skipped, so an example left in the template comment is not linked. A requirement id such as `URS-WL-01` stays a requirement id. Matching is case-insensitive, so a branch named `cursor/fix-cad-1` yields `CAD-1`. The key has to end at a token boundary, so `kit-8de6` and a UUID fragment such as `ab65-5d22` are left alone. If no id is present, the comment says none was found.

## What a person still does

Read the comment, compare it to the diff, and sign the pull request template if they accept the change. The workflow does not approve, request a formal review decision, or merge.
