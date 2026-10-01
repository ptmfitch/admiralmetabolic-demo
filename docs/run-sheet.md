# Run-sheet: Week 26 responder flag

DEMO / SYNTHETIC · for enablement only.

15 minutes on stage, after a short pre-flight. You are showing a change-control path for a chronic-disease ADaM derivation: a bug report, a cloud agent, a failing boundary test, a small fix, a pull request, an evidence comment, a Bugbot review, a human merge, then the before/after rates and the subjects who moved.

The seeded difference lives in the demo derivation that builds the ADWL extract. The pharmaverse package functions under `R/` stay as published.

Say these lines when you reach them. They are marked **Say this**.

- "I'm not an R programmer. That's the point."
- "We built on pharmaverse open-source work."
- "This produces evidence for your validated process. It doesn't replace it."

The comparison step reads two `adwl.csv` files and writes `inst/demo/output/flag_comparison.csv` and `inst/demo/output/flag_comparison.json`. Arms are masked (`ARM A`, `ARM B`, `ARM C`). Flags are `RESP5FL` (at least 5% weight loss at Week 26) and `RESP10FL` (at least 10%). `PCHG` is percent change from baseline, so `-5` is a 5.0% loss.

---

## Pre-flight (before the room)

Do this on the assembled demo repository, with the pipeline, the seeded derivation, the change-control pull request template, and the evidence-pack action already on `main`.

- [ ] `git remote -v` shows `ptmfitch/admiralmetabolic-demo`. Pull requests in this demo go to that repository, base branch `main`.
- [ ] Working tree is clean, on `main`, and matches `origin/main`.
- [ ] Bugbot is on for this repository, including reviews of draft pull requests.
- [ ] GitHub Actions are enabled (repository Settings → Actions → Allow all actions).
- [ ] Slack channel `peter-clinical-adam-demo` exists and is connected to Cursor cloud agents. If you will use Jira instead, open the CAD board and ticket CAD-1: <https://fe-anysphere-demo.atlassian.net/jira/software/projects/CAD/boards/1238>
- [ ] You can start a Cursor cloud agent against this repository.
- [ ] `Rscript --version` prints an R version, and `make --version` prints a Make version.
- [ ] You have a terminal open at the repository root.

Record the seeded commit and save the pre-fix extract. The later comparison needs this file.

```bash
git checkout main
git pull origin main
git rev-parse HEAD | tee /tmp/pre_demo_sha.txt
make demo
cp inst/demo/output/adwl.csv /tmp/adwl_before.csv
```

`make demo` is the same job as `Rscript inst/demo/run_pipeline.R`. It writes `inst/demo/output/adwl.csv`.

Glance at the file. `TRT01P` should be `ARM A`, `ARM B`, or `ARM C`. `RESP5FL` and `RESP10FL` are `Y` or `N`.

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

Where the difference lives: the demo derivation that sets RESP5FL while building the demo extract (under inst/demo/, and not inst/demo/compare_flags.R). In ADaM terms, percent change from baseline (PCHG) of -5 is exactly 5% weight loss, so the inclusive rule is PCHG <= -5. The same clinical rule written as a loss percent is weight_loss_pct >= 5. The seeded derivation uses a strict comparison, so the boundary is N.

Do this in order:

1. Find that derivation. If you cannot find a demo derivation that sets RESP5FL under inst/demo/ (other than compare_flags.R), stop and say the demo pipeline is not in the tree. Do not invent a fix anywhere else.
2. Add a failing testthat test for the exact 5.0% boundary, using synthetic subjects only. A subject at exactly 5.0% Week 26 weight loss must expect RESP5FL = Y. Run it and show that it fails on the current derivation.
3. Make the smallest change that makes that test pass. Do not change RESP10FL. Do not refactor unrelated code.
4. Run make test. If Make has no test target, run the new test file with testthat. The boundary test must pass. Do not delete or weaken tests/testthat/test-compare-flags.R.
5. Open a pull request against ptmfitch/admiralmetabolic-demo, base branch main. Before you create it, confirm the base repository is ptmfitch/admiralmetabolic-demo and not pharmaverse/admiralmetabolic. Never open an issue, pull request, or comment on any pharmaverse repository.
6. Use the pull request template in this repository and complete it, including the change-control sections if that is the template on the branch. Describe the boundary test and the demo ADWL flag RESP5FL. Leave the pull request open and ready for review. Do not open it as a draft. Do not merge it.
7. Do not post your own evidence-pack comment. A GitHub Action edits one comment on the pull request, with the text "Updated for <sha>", on each push.

Hard limits:

- Do not modify anything under R/, inst/templates/, vignettes/, or admiral itself.
- Do not modify inst/demo/compare_flags.R, docs/run-sheet.md, or docs/demo/canvas-prompt.md.
- Do not describe this as a defect in pharmaverse admiralmetabolic or in admiral. It is in the demo derivation.
- Do not describe the change as making a system compliant. If you describe the record, say it produces evidence for a validated process.
- Do not use company names, customer names, or real subject identifiers. Data in this demo are synthetic.
- Mark demo-only text "DEMO / SYNTHETIC · for enablement only".
- No cloud keys and no SaaS authentication.
```

While it runs, keep talking. You do not need to read the prompt aloud.

**Say this.** "We built on pharmaverse open-source work. The functions in the package stay as that project published them. The agent is only allowed to touch our demo derivation, and it has to show a test that failed on exactly 5.0% before it changes the code."

What you should see:

- A new test that expects `RESP5FL = Y` at exactly 5.0% Week 26 weight loss.
- A small diff in the demo derivation.
- A pull request whose base repository is `ptmfitch/admiralmetabolic-demo` and whose base branch is `main`.
- The pull request is ready for review.

If the base repository is anything under `pharmaverse`, close it and start again. Do not comment on that repository.

---

## 7:00–10:00 — Evidence comment, Bugbot, human merge

If the pull request is still not open at minute 8, go to [Fallback](#fallback) and keep the clock. Come back to this section only if the live pull request appears before you finish the canvas.

On the pull request:

1. Wait for the evidence-pack comment. It is one comment, edited on each push, and it contains `Updated for` plus the full commit SHA. Read the SHA on the latest commit and match it to that line.
2. Read the Bugbot review. If it asks for a change inside the demo derivation or the boundary test, let the agent apply that and wait for the evidence comment to show the new SHA. Ignore advice that edits `R/` or the published package.
3. You merge. The agent does not.

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

Open the JSON. You want three things on screen:

- `responder_rates` for `RESP5FL`, with `n`, `N`, and `pct` by masked arm, before and after.
- `responder_rates` for `RESP10FL`, with the same percent before and after.
- `subjects_resp5fl_changed`: a short list of `USUBJID`, `TRT01P`, `PCHG`, `before`, `after`. Those rows sit on the 5% boundary (`PCHG` of `-5`, a 5.0% loss). `before` is `N` and `after` is `Y`.

Use the count the script prints for these two files.

If the changed-subject list is empty, you compared two copies of the same extract. Check that `/tmp/adwl_before.csv` is the pre-flight file and `/tmp/adwl_after.csv` is from the merged fix (or from the fallback branch).

Git refs work when both commits contain `inst/demo/output/adwl.csv`:

```bash
Rscript inst/demo/compare_flags.R \
  --before-ref "$(cat /tmp/pre_demo_sha.txt)" \
  --after-ref HEAD
```

On stage, use the two CSV paths. The pipeline output is not something you need committed.

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

Use this when the live agent does not have a reviewable pull request by minute 8. The branch `demo/reference-fix-5pct-boundary` is the prepared fix for the same boundary.

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
