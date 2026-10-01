# Run-sheet: Week 26 responder flag

DEMO / SYNTHETIC · for enablement only.

15 minutes on stage, after a short pre-flight. You are showing a change-control path for a chronic-disease ADaM derivation: a bug report, a cloud agent, a failing boundary test, a small fix, a pull request, an evidence comment, a Bugbot review, a human merge, then the before/after rates and the subjects who moved.

The seeded difference is one comparison in `inst/demo/R/derive_responder_flags.R`: `derive_weight_loss_responder_flags()` sets `RESP5FL` with `PCHG < -5`, so a Week 26 loss of exactly 5.0% is `N`. The written rule is `PCHG <= -5`. `RESP10FL` already uses `PCHG <= -10`. Package functions under `R/` stay as published. Counts and the reference branch are written down in `docs/demo/seeded-defect.md`.

Say these lines when you reach them. They are marked **Say this**.

- "I'm not an R programmer. That's the point."
- "We built on pharmaverse open-source work."
- "This produces evidence for your validated process. It doesn't replace it."

The comparison step reads two `adwl.csv` files and writes `inst/demo/output/flag_comparison.csv` and `inst/demo/output/flag_comparison.json`. Arms are masked (`ARM A`, `ARM B`, `ARM C`). Flags are `RESP5FL` (at least 5% weight loss at Week 26) and `RESP10FL` (at least 10%). `PCHG` is percent change from baseline, so `-5` is a 5.0% loss.

---

## Pre-flight (before the room)

Do this on `main` of `ptmfitch/admiralmetabolic-demo`, after the pipeline, hooks, and evidence-pack change are merged.

- [ ] `git remote -v` shows `ptmfitch/admiralmetabolic-demo`. Pull requests in this demo go to that repository, base branch `main`.
- [ ] Working tree is clean, on `main`, and matches `origin/main`.
- [ ] Bugbot is on for this repository, including reviews of draft pull requests. Rules are in `.cursor/BUGBOT.md`.
- [ ] GitHub Actions are enabled (repository Settings → Actions → Allow all actions), so `.github/workflows/test.yml` and `.github/workflows/evidence-pack.yml` can run.
- [ ] Slack channel `peter-clinical-adam-demo` exists and is connected to Cursor cloud agents. If you will use Jira instead, open the CAD board and ticket CAD-1: <https://fe-anysphere-demo.atlassian.net/jira/software/projects/CAD/boards/1238>
- [ ] You can start a Cursor cloud agent against this repository.
- [ ] `Rscript --version` prints an R version, and `make --version` prints a Make version.
- [ ] You have a terminal open at the repository root.
- [ ] Dependencies are restored. If `make test` says they are not installed, run `make setup` once (it restores `renv.lock`), then `make test` again. The seeded suite is green: `tests/testthat/test-demo-adwl.R` does not assert the exact 5.0% row.

Record the seeded commit and save the pre-fix extract. The later comparison needs this file.

```bash
git checkout main
git pull origin main
git rev-parse HEAD | tee /tmp/pre_demo_sha.txt
make demo
cp inst/demo/output/adwl.csv /tmp/adwl_before.csv
```

`make demo` runs `Rscript inst/demo/run_pipeline.R`. That script reads `inst/demo/data/` and writes `inst/demo/output/adwl.csv`. The output directory is gitignored, so keep the copy under `/tmp`.

Glance at the file. `TRT01P` is `ARM A`, `ARM B`, or `ARM C`. Week 26 weight rows (`PARAMCD` `WEIGHT`, `AVISIT` `Week 26`, `AVISITN` 26) carry `RESP5FL` and `RESP10FL` as `Y` or `N`. Other rows leave those flags blank. Do not open `inst/demo/data/unblinding_key.csv`.

---

## 0:00–2:00 — Open, then file the report

**Say this.** "I'm not an R programmer. That's the point. A Week 26 weight-loss responder at exactly 5.0% came back `N`. The rule we specified is at least 5%, so that boundary should be `Y`. I'll hand it to the agent. The agent finds the derivation, writes the test that fails, and fixes it. I approve the merge."

Paste the note below into Slack channel `peter-clinical-adam-demo`, or paste it as a comment on Jira CAD-1. This is the bug report the room can read.

```text
DEMO / SYNTHETIC · for enablement only.

CAD-1. Week 26 weight responders at exactly 5.0% are flagged RESP5FL = N.

The rule on the demo ADWL extract is at least 5% weight loss, so exactly 5.0% is a responder (RESP5FL = Y). RESP10FL is the 10% flag. Arms in the extract are masked (ARM A / ARM B / ARM C).

The difference is in our demo derivation, the code that builds this demo extract. It is not in the pharmaverse package functions.
```

If Slack is what starts the cloud agent, skip this short note and paste the Cursor prompt from the next section into the channel instead. Otherwise post the short note, then start the agent yourself with that prompt.

---

## 2:00–7:00 — Cloud agent: failing test, then the fix

Start a Cursor cloud agent on `ptmfitch/admiralmetabolic-demo`, base branch `main`. Paste this whole prompt.

```text
DEMO / SYNTHETIC · for enablement only.

Investigate CAD-1 on ptmfitch/admiralmetabolic-demo. Jira board: https://fe-anysphere-demo.atlassian.net/jira/software/projects/CAD/boards/1238

Week 26 weight responders at exactly 5.0% are flagged RESP5FL = N on the demo ADWL extract. The rule is at least 5% weight loss, so exactly 5.0% must be RESP5FL = Y. RESP10FL is the 10% flag. Leave RESP10FL alone.

Where the difference lives: `inst/demo/R/derive_responder_flags.R`, function `derive_weight_loss_responder_flags`. `RESP5FL` is set with `PCHG < -5`. Percent change from baseline (`PCHG`) of -5 is exactly 5% weight loss, so the written rule is `PCHG <= -5`. `RESP10FL` is already `PCHG <= -10`. Leave that line as it is. The background note is `docs/demo/seeded-defect.md`. The sample change record is `docs/change-control/CR-CAD-1.md`.

Do this in order:

1. Read `derive_weight_loss_responder_flags`. If `PCHG < -5` is not the `RESP5FL` comparison, stop and say the seed is not the one this demo expects. Do not invent a fix anywhere else.
2. Add `tests/testthat/test-demo-resp5-boundary.R`. It must expect `RESP5FL == "Y"` when Week 26 `PCHG == -5`. Run `make test` and show that this new test fails while `tests/testthat/test-demo-adwl.R` still passes.
3. Change only `PCHG < -5` to `PCHG <= -5` in `inst/demo/R/derive_responder_flags.R`. Do not change `RESP10FL`. Do not edit `inst/demo/R/build_adwl.R`, `inst/demo/run_pipeline.R`, or anything under `inst/demo/data/`.
4. Run `make test` again. The boundary test and the existing demo tests must pass. Do not delete or weaken `tests/testthat/test-compare-flags.R` or `tests/testthat/test-demo-adwl.R`.
5. Open a pull request against `ptmfitch/admiralmetabolic-demo`, base branch `main`. Before you create it, confirm the base repository is `ptmfitch/admiralmetabolic-demo` and not `pharmaverse/admiralmetabolic`. Never open an issue, pull request, or comment on any pharmaverse repository. Put `CAD-1` in the pull request body so the evidence pack and Bugbot can see the change-request id.
6. Fill `.github/PULL_REQUEST_TEMPLATE.md` and leave it ready for review, not a draft. Use these change-control lines: CR / ticket ID `CAD-1`; Risk `medium`; GAMP category `5 custom`; Impacted datasets `ADWL / RESP5FL`; Test evidence `make test`. Leave Reviewer sign-off unsigned. Do not merge.
7. Do not post your own evidence-pack comment. `.github/workflows/evidence-pack.yml` runs `make test` and edits one pull request comment. The heading is `Compliance Evidence Pack`. The next line is `Updated for <sha>`, with the full head SHA.

Hard limits:

- Do not modify anything under `R/`, `inst/templates/`, `vignettes/`, or admiral itself.
- Do not modify `inst/demo/compare_flags.R`, `docs/run-sheet.md`, `docs/demo/canvas-prompt.md`, `.cursor/**`, `.github/CODEOWNERS`, `.github/PULL_REQUEST_TEMPLATE.md`, or `.github/workflows/evidence-pack.yml`.
- Do not read or join `inst/demo/data/unblinding_key.csv`.
- Do not describe this as a defect in pharmaverse admiralmetabolic or in admiral. It is in the demo derivation.
- Do not describe the change as making a system compliant. If you describe the record, say it produces evidence for a validated process.
- Do not use company names, customer names, or real subject identifiers. Data in this demo are synthetic.
- Mark demo-only text "DEMO / SYNTHETIC · for enablement only".
- No cloud keys and no SaaS authentication.
```

While it runs, keep talking. You do not need to read the prompt aloud.

**Say this.** "We built on pharmaverse open-source work. The functions in the package stay as that project published them. The agent is only allowed to touch our demo derivation, and it has to show a test that failed on exactly 5.0% before it changes the code."

What you should see:

- `tests/testthat/test-demo-resp5-boundary.R`, failing on `main`, then passing after the one-line change.
- A diff whose only derivation edit is `PCHG < -5` to `PCHG <= -5` in `inst/demo/R/derive_responder_flags.R`.
- A pull request whose base repository is `ptmfitch/admiralmetabolic-demo` and whose base branch is `main`, with `CAD-1` in the body.
- The pull request is ready for review. `.github/CODEOWNERS` asks `@ptmfitch` to review `inst/demo/**`.

If the base repository is anything under `pharmaverse`, close it and start again. Do not comment on that repository.

---

## 7:00–10:00 — Evidence comment, Bugbot, human merge

If the pull request is still not open at minute 8, go to [Fallback](#fallback) and keep the clock. Come back to this section only if the live pull request appears before you finish the canvas.

On the pull request:

1. Wait for the evidence-pack comment from `.github/workflows/evidence-pack.yml`. It is one comment, edited on each push. The heading is `Compliance Evidence Pack`, and the next line is `Updated for` plus the full head SHA. Match that SHA to the latest commit. The comment should name `CAD-1`, command `make test`, and the files under `inst/demo/**`.
2. Read the Bugbot review against `.cursor/BUGBOT.md`. After the inclusive fix, it should not still be filing **Exclusive responder boundary**. If it files **Missing change control reference** or **Missing test evidence**, the body is missing `CAD-1` or the boundary test is missing; let the agent correct that and wait for `Updated for` to show the new SHA. Leave package functions under `R/` untouched.
3. You merge. The agent does not. Write your name on the template's Reviewer sign-off line when you accept it.

**Say this.** "This produces evidence for your validated process. It doesn't replace it. Your change record still lives where you already keep it, under the Part 11, Annex 11, and GAMP 5 controls you run. The comment on this pull request is the pack you attach to that record. Bugbot reviewed the diff. I am the person who approves the merge."

After the merge:

```bash
git checkout main
git pull origin main
```

---

## 10:00–12:30 — Before and after flags

Produce the post-fix extract, then compare it to the file you saved in pre-flight.

```bash
make demo
cp inst/demo/output/adwl.csv /tmp/adwl_after.csv
Rscript inst/demo/compare_flags.R \
  --before /tmp/adwl_before.csv \
  --after /tmp/adwl_after.csv
```

The script prints how many subjects changed `RESP5FL` and writes:

- `inst/demo/output/flag_comparison.csv`
- `inst/demo/output/flag_comparison.json`

The script should print `RESP5FL changed for 9 subjects.` Those 9 rows are the Week 26 `WEIGHT` records with `PCHG` of `-5`, `before` `N` and `after` `Y`, three in each masked arm. `N` is 66 subjects per arm.

`RESP5FL` rates (n/N):

| Arm | Before (seeded `PCHG < -5`) | After (`PCHG <= -5`) |
| --- | --- | --- |
| ARM A | 63/66 (95.5%) | 66/66 (100%) |
| ARM B | 8/66 (12.1%) | 11/66 (16.7%) |
| ARM C | 54/66 (81.8%) | 57/66 (86.4%) |

`RESP10FL` does not move: ARM A 54/66 (81.8%), ARM B 2/66 (3.0%), ARM C 14/66 (21.2%). The same figures are in `docs/demo/seeded-defect.md`.

If the changed-subject list is empty, you compared two copies of the same extract. Check that `/tmp/adwl_before.csv` is the pre-flight file and `/tmp/adwl_after.csv` is from the merged fix (or from the fallback branch).

`inst/demo/output/` is gitignored, so `--before-ref` / `--after-ref` will not see `adwl.csv` on these commits. On stage, use the two CSV paths.

**Say this.** "Same shape of evidence when the analysis table lives in your lakehouse. A before extract, an after extract, rates by masked arm, and the subject rows that moved. No treatment names on this screen."

---

## 12:30–15:00 — Canvas

Paste the whole file `docs/demo/canvas-prompt.md` into Cursor. The text is also here, so you can copy it from this page.

```text
DEMO / SYNTHETIC · for enablement only.

Build one Cursor canvas from inst/demo/output/flag_comparison.json. One screen, one finding: Week 26 responder rates by masked arm, before and after, and the subjects whose RESP5FL changed. This is not a dashboard.

Read the JSON and embed its numbers. Do not invent arms, rates, subjects, or percents. Do not fetch anything. Do not add a file under this repo. Do not add a second page, filters, date ranges, site splits, or edit controls.

Before writing the canvas, read the Cursor canvas skill and the SDK declarations it points at. Import only from cursor/canvas. Take colors from useHostTheme(). No gradients, box shadows, or emoji. Do not wrap every block in a Card. Do not pass props that are not in the SDK. BarChart takes categories, series, and valueSuffix. It has no axis-title prop. Table takes headers and rows. If a list in the JSON is empty, omit that heading and table. Do not render an empty state.

Lay the screen out in this order:

1. An H1: "Week 26 responders, before and after". Under it, one sentence: subjects at exactly 5.0% weight loss now count for RESP5FL. Then a Callout with tone "neutral" and title "DEMO / SYNTHETIC · for enablement only". The Callout body is the JSON rule text. Do not pass a custom icon.

2. An H2: "RESP5FL responder rate by arm (%)". One grouped BarChart. Categories are the masked arms in the order they appear on RESP5FL rows in responder_rates (the TRT01P values). Two series, named exactly Before and After, using each arm's pct for RESP5FL. Set valueSuffix to "%" and showValues to true. Under the chart, a Text caption: "Week 26 WEIGHT. Percent is n responders / N subjects in the masked arm. Source: inst/demo/output/flag_comparison.json."

3. An H2: "RESP10FL responder rate by arm". One Table, not a second chart. Columns: Arm, Before n/N, Before %, After n/N, After %. One row per arm from the RESP10FL rates. This is so a reader can see whether the 10% rates moved.

4. An H2: "Subjects whose RESP5FL changed". One Table from subjects_resp5fl_changed. Columns: USUBJID, TRT01P, PCHG, Before, After. PCHG is percent change from baseline at Week 26. A negative PCHG is weight loss. If that array is empty, omit this heading and table.

Stop there.
```

Open the canvas beside the chat. Walk two beats only: the bars moved for the 5% flag, and the table is the subjects on that boundary. The 10% table is the check that the other flag stayed put.

Stop. Do not add a second chart on stage.

---

## Fallback

Use this when the live agent does not have a reviewable pull request by minute 8. The branch `demo/reference-fix-5pct-boundary` is the prepared fix: it changes `PCHG < -5` to `PCHG <= -5` in `inst/demo/R/derive_responder_flags.R` and adds `tests/testthat/test-demo-resp5-boundary.R`. There is no pull request for that branch.

```bash
git fetch origin demo/reference-fix-5pct-boundary
git checkout demo/reference-fix-5pct-boundary
make demo
cp inst/demo/output/adwl.csv /tmp/adwl_after.csv
Rscript inst/demo/compare_flags.R \
  --before /tmp/adwl_before.csv \
  --after /tmp/adwl_after.csv
```

**Say this.** "This branch is the reference fix, the same boundary change, so we can finish the rates and the canvas on time. The live agent is still doing that change on its own pull request."

Then paste the canvas prompt and finish the last section. If `git fetch` cannot find `demo/reference-fix-5pct-boundary`, stay with the live agent and say the reference branch is not on the remote yet.

---

## Reset, so you can run it again

Use this only on `ptmfitch/admiralmetabolic-demo`, and only when you are putting that demo fork back to the seeded commit. Do not push to a pharmaverse repository.

You recorded the seed in `/tmp/pre_demo_sha.txt` during pre-flight.

```bash
git checkout main
git fetch origin
git reset --hard "$(cat /tmp/pre_demo_sha.txt)"
git push --force-with-lease origin main
git clean -fd -- inst/demo/output
rm -f /tmp/adwl_before.csv /tmp/adwl_after.csv
```

Close the demo pull request without merging if it is still open. Delete the local agent branch when you no longer need it:

```bash
git branch -D <agent-branch>
```

If other people are using this fork and you need to keep history, revert the demo commits instead of rewriting `main`:

```bash
git checkout main
git pull origin main
git revert --no-edit "$(cat /tmp/pre_demo_sha.txt)..HEAD"
git push origin main
```

That puts the seeded derivation back on `main`. Run the pre-flight again before the next show, including a fresh `/tmp/adwl_before.csv`.
