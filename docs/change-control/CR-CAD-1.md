DEMO / SYNTHETIC · for enablement only

# CAD-1 — Sample change request

Illustrative only. This file shows the shape of a change record for the seeded responder-boundary defect. It is not an approval, a signature, or a quality-system record. The tooling produces evidence for your validated process.

Jira key: `CAD-1`

| Field | Value |
| --- | --- |
| Id | CAD-1 |
| Title | Include subjects at exactly 5.0% weight loss in RESP5FL |
| Status | Open example — not accepted, not signed |
| Requestor | demo.author (synthetic role) |
| Date | 2026-10-01 |
| Area | `inst/demo/**` (ADWL pipeline). Package functions under `R/**` only if the fix has to live there. |
| Risk | Medium — subjects on the 5% boundary are misclassified on a responder flag. The miss is limited to the equality case. |
| GAMP category | 5 — custom study-derivation code. A human can record a different category. |
| Classification | Minor (SOP-DEMO-017 §5.2), once the diff only corrects code onto the written rule |
| Requirements | URS-WL-01, URS-WL-03, URS-EV-01 |

## Description

The demo SAP rule (URS-WL-01) says `RESP5FL` is `"Y"` when weight loss from baseline is greater than or equal to 5.0 percent. Exactly 5.0% is a responder.

The seeded derivation excludes that equality case, so a subject at exactly 5.0% weight loss is not flagged. `RESP10FL` uses the same inclusive rule at 10.0% (URS-WL-02) and should be checked for the same pattern while the 5% flag is fixed.

The output under test is `inst/demo/output/adwl.csv`, produced by `Rscript inst/demo/run_pipeline.R`.

This record does not change the written threshold. A pull request that edits 5.0 or 10.0 in the validation plan is a different change and needs its own id (SOP-DEMO-017 §5.3).

## Test evidence

Expected with the fix, in the same pull request:

- A test under `tests/` that includes a subject at exactly 5.0% weight loss and expects `RESP5FL = "Y"`.
- Command: `make test`

Not run as part of authoring this sample record.

## Blinding

The fix must not read or join `inst/demo/data/unblinding_key.csv` (URS-BL-01).

## Impact note

Tier: minor, if the diff only makes the comparison inclusive. Reason: URS-WL-01 already states the inclusive boundary. The defect is code that does not match the written rule. QA has not accepted this tier.

## Human handoff

Not signed. A later implementer puts `CAD-1` in the pull request body or branch name. A human reviewer on the validated path writes the sign-off line. An agent does not.

Do not reuse `CAD-1` for a change that does not touch `RESP5FL`, `RESP10FL`, or the 5.0 / 10.0 threshold.
