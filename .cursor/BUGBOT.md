# Bugbot review rules

DEMO / SYNTHETIC · for enablement only.

These rules are a demo of change-control review for clinical study derivations. They produce evidence for your validated process. They do not make this repository, the package, or a study validated.

Apply them on every pull request that touches a validated derivation path. When a rule says to flag a finding, file that finding with the title below. Bugbot flags the pull request. Making the Bugbot check required in branch protection is what turns those flags into a merge block. Do not approve, sign, or dismiss the finding yourself.

Illustrative only. Synthetic study data — not a submission, a locked analysis, or a medical conclusion.

## Paths

- Validated derivation paths: `inst/demo/**` and `R/**`
- Demo ADaM pipeline: `Rscript inst/demo/run_pipeline.R` writes `inst/demo/output/adwl.csv`
- Responder flags on that output: `RESP5FL` (5% weight-loss responder) and `RESP10FL` (10% weight-loss responder)
- Restricted unblinding file: `inst/demo/data/unblinding_key.csv`
- Tests that count as evidence: `tests/**`
- Change-control SOP: `docs/change-control/sop-study-derivation-change-control.md` (SOP-DEMO-017)
- Requirements: `docs/change-control/validation-plan.md`
- Sample change request for the seeded boundary defect: Jira key `CAD-1` (`docs/change-control/CR-CAD-1.md`)

## Missing change control reference

If the pull request changes any file under `inst/demo/**` or `R/**`, read the pull request description and branch name.

Flag a finding titled **Missing change control reference** when neither the description nor the branch name contains a change-request id. An id is either a Jira key of the form `CAD-1` (letters, a hyphen, digits) or `CR-` plus three to six digits (`CR-\d{3,6}`).

`CAD-1` identifies the sample responder-boundary defect only. If the only id present is `CAD-1` and the diff does not change `RESP5FL`, `RESP10FL`, or the 5.0 / 10.0 weight-loss threshold, flag a finding titled **Change request does not match the diff**. Reusing the sample ticket does not identify a different change.

## Exclusive responder boundary

Read the SAP rule in `docs/change-control/validation-plan.md` (URS-WL-01 and URS-WL-02) before reviewing a derivation change.

- `RESP5FL` is `"Y"` when weight loss from baseline is greater than or equal to 5.0 percent. Exactly 5.0% is a responder.
- `RESP10FL` is `"Y"` when weight loss from baseline is greater than or equal to 10.0 percent. Exactly 10.0% is a responder.

Flag a finding titled **Exclusive responder boundary** when a changed comparison defines either flag with a strict inequality that drops the equality case. Examples that fail the SAP: weight loss `> 5`, weight loss `> 10`, or a percent-change comparison that keeps only values beyond the threshold and omits the threshold itself (`PCHG < -5` when the written rule is `PCHG <= -5`).

Do not flag an inclusive comparison (`>= 5`, `>= 10`, or `PCHG <= -5` / `PCHG <= -10`). The seeded defect is the exclusive 5.0% check. Fixing it onto the written inclusive rule is a correction, not a new threshold.

## Unblinding key in a derivation

Flag a finding titled **Unblinding key in derivation** when a changed file reads `inst/demo/data/unblinding_key.csv`, copies it, or joins it into `inst/demo/output/adwl.csv` or any other output.

Treatment assignment for a locked analysis comes from the sponsor's unblinding procedure on the governed lakehouse. It does not come from a key file in this workspace. Do not suggest pasting the key into a script, a test fixture, or the agent transcript.

## Missing test evidence

If the pull request changes any file under `inst/demo/**` or `R/**` other than a markdown file, and does not also change a file under `tests/`, flag a finding titled **Missing test evidence**.

A test change counts only when it is in the same pull request diff. Point at the derivation files that lack a corresponding test diff. Do not accept "tests already exist on the base branch" as coverage for a new derivation change. The shared test command is `make test`.

## Audit-trail change requires QA impact assessment

If the pull request modifies `.cursor/hooks/**` or `docs/audit/**`, flag a finding titled **Audit-trail change requires QA impact assessment**.

Raise it even when the edit looks internal, cosmetic, or limited to comments. State that a human QA role has to assess impact on the append-only record (who, what, when, why) before merge. The hook log stores a timestamp, an event name, a path, and a conversation id. It must not start storing file contents. Do not mark the finding resolved inside the review.

## Subject identifiers

If a changed line adds a string literal that looks like a real subject, patient, or medical-record identifier, flag a finding titled **Possible subject identifier**.

Flag literals such as `USUBJID` values copied from a live study, `PAT-12345`, `MRN-001234`, NHS-style numbers, or SSN-style numbers.

Do not flag synthetic demo ids already used as examples in `docs/change-control/`, such as `SYN-001`.

## Regulatory impact

When the pull request touches `inst/demo/**`, `R/**`, `.cursor/hooks/**`, or `docs/audit/**`, end the review with a regulatory-impact note. Use exactly one tier:

- **none** — docs or comments only, no change to a flag, threshold, population, output dataset, or stored audit record
- **minor** — behavior stays inside an already written requirement in `docs/change-control/validation-plan.md`, including a correction that makes code match that requirement without editing the written threshold, population, flag definition, or blinding rule (SOP-DEMO-017 §5.2). The inclusive `RESP5FL` fix is this tier when the written rule is already `>= 5.0`
- **revalidation likely** — the change edits a written threshold, population, endpoint flag definition, or blinding rule, or the impact cannot be explained from the current requirements (SOP-DEMO-017 §5.3)

Give the reasons in a few sentences and cite the SOP section and any URS id you used. Do not call the change validated. Do not call the repository validated. Say that the note produces evidence for your validated process, and that a human decides the tier.
