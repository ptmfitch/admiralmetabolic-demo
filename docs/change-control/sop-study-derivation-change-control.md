DEMO / SYNTHETIC · for enablement only

# SOP-DEMO-017 — Change control for study derivation code

Illustrative only. This is a demo procedure for clinical ADaM derivations in a chronic-disease study, not a sponsor SOP. Following it produces evidence for your validated process. It does not replace CSV, 21 CFR Part 11, Annex 11, or GAMP 5 change control, and it does not make the package or the study validated.

The governed lakehouse is out of scope. Nothing in this repository deploys code or data there. A human promotes a reviewed derivation through the sponsor's own process.

## 1. Purpose

Keep a traceable record when someone changes the code that defines a study derivation, before that code is a candidate for the governed lakehouse.

The validated paths are:

- `inst/demo/**` — the demo ADaM pipeline. `Rscript inst/demo/run_pipeline.R` writes `inst/demo/output/adwl.csv` with `RESP5FL` and `RESP10FL`.
- `R/**` — package functions that implement derivations.

## 2. Roles

| Role | Does | Does not |
| --- | --- | --- |
| Author | Opens a change request, edits code, runs tests, fills in the pull request | Sign off on their own change |
| Reviewer agent | Drafts an impact note from the diff and this SOP | Approve, sign, merge, or dismiss a finding |
| Human reviewer | Reviews validated paths (`@ptmfitch` in `.github/CODEOWNERS`) | Delegate the acceptance decision to an agent |
| QA | Accepts the risk tier and the GAMP category | Treat a generated comment as a signature |

## 3. What starts a change

1. Write a change request before editing a validated path. Use a Jira key (the demo key looks like `CAD-1`) or an id of the form `CR-` plus digits.
2. Put that id in the pull request body. The evidence-pack workflow also reads it from the branch name.
3. State the risk (low, medium, or high) and the GAMP category the author proposes:
   - Category 1 — infrastructure software
   - Category 3 — non-configured products
   - Category 4 — configured products
   - Category 5 — custom applications
   Custom R that computes an analysis flag is category 5 unless a human records a different category.
4. Name the impacted datasets, variables, and flags. For this demo, the output dataset is ADWL (`inst/demo/output/adwl.csv`).

`CAD-1` is the sample record for the seeded `RESP5FL` boundary defect (`CR-CAD-1.md`). A different change needs its own id. Reusing `CAD-1` on an unrelated diff does not identify that change.

## 4. What the author implements

4.1 Keep the derivation inside the written rules in `validation-plan.md`. Do not quietly edit a threshold, a population, a flag definition, or the blinding rule.

4.2 A correction onto an already written rule — for example, making `RESP5FL` include subjects at exactly 5.0% weight loss when the plan already says the boundary is inclusive — stays a minor change (§5.2). Changing the written 5.0% or 10.0% threshold is not minor (§5.3).

4.3 Accompany a derivation change with a test in the same pull request. The shared command is `make test`. "Tests already exist on the base branch" does not cover a new diff.

4.4 Do not read `inst/demo/data/unblinding_key.csv` into agent context, and do not join it into `adwl.csv` or any other output. The read hook and the shell hook both refuse that file. Treatment assignment for a locked analysis comes from the sponsor's unblinding procedure, not from a key file in this workspace.

## 5. How to classify the impact

The author proposes a tier. A reviewer agent may draft the same tier. A human accepts it. Agreement between the draft and the author is not acceptance.

### 5.1 None

Documentation or comments only. No change to a flag, a threshold, a population, an output dataset, or the stored audit record.

### 5.2 Minor

The diff is explained by a requirement id already in `validation-plan.md`, and the written threshold, population, flag definition, and blinding rule are unchanged. Use this tier for a correction that makes code match the written rule, including the inclusive `RESP5FL` boundary, and for a result-preserving refactor. Call out a missing test if `tests/` did not change.

### 5.3 Revalidation likely

The diff edits a written threshold, population, endpoint flag definition, or blinding rule, or the new behavior cannot be tied to a requirement id. This tier means a human has to decide whether the sponsor's validation needs to be repeated. The agent does not make that decision.

## 6. Evidence on the pull request

On each push, `.github/workflows/evidence-pack.yml` runs the tests and keeps a single evidence-pack comment. A later push edits that comment and sets the `Updated for <sha>` line to the new head SHA. The comment lists the linked id, the test result, and the files changed under the validated paths.

The comment is evidence. It is not an approval. If GitHub Actions is turned off on the fork, the workflow does not run and the comment is absent until Actions is enabled.

Bugbot rules in `.cursor/BUGBOT.md` flag a missing change-request id, an exclusive responder boundary, use of the unblinding key, a derivation change without a test, and an audit-hook change that needs a QA look. A human decides whether a flag blocks the merge.

## 7. Human handoff

The pull request template has a reviewer sign-off line. Leave it unsigned until a person writes their name, role, and date. Agents do not sign that line, do not mark the pull request approved, and do not merge it.

After a human accepts the change, promotion onto the governed lakehouse is a separate step in the sponsor's process. This repository does not perform it.

## 8. Audit trail

Edits made through the agent append a JSON line under `docs/audit/agent-hooks.jsonl`. The file is local and gitignored. The record is a timestamp, an event name, a path, and a conversation id. It does not contain file contents. See `docs/audit/README.md`.

A change to the hook scripts needs a QA impact note before merge, because the trail is part of the evidence.
