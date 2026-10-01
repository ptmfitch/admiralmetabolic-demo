DEMO / SYNTHETIC · for enablement only

# Validation plan summary — demo ADWL responder flags

Illustrative only. These are the written rules for the demo pipeline. They produce a baseline the change-control SOP can cite. They do not validate the package, the study, or the lakehouse.

Pipeline: `Rscript inst/demo/run_pipeline.R`

Output: `inst/demo/output/adwl.csv` (dataset ADWL)

Tests: `make test`

Procedure: SOP-DEMO-017 (`sop-study-derivation-change-control.md`)

## Responder flags

Weight loss is the percent lost from baseline. A larger positive number is more weight loss. Percent change (`PCHG`) is the signed ADaM percent change, so 5.0% weight loss is `PCHG` of -5.0.

| Id | Rule |
| --- | --- |
| URS-WL-01 | `RESP5FL` is `"Y"` when weight loss from baseline is greater than or equal to 5.0 percent, and `"N"` otherwise. Exactly 5.0% is `"Y"`. The same subjects satisfy `PCHG <= -5.0`. |
| URS-WL-02 | `RESP10FL` is `"Y"` when weight loss from baseline is greater than or equal to 10.0 percent, and `"N"` otherwise. Exactly 10.0% is `"Y"`. The same subjects satisfy `PCHG <= -10.0`. |
| URS-WL-03 | The pipeline writes both flags on `inst/demo/output/adwl.csv`. A subject who is a 10% responder is also a 5% responder. |

The seeded defect is an exclusive check on `RESP5FL`: a subject at exactly 5.0% weight loss is left as a non-responder. The written rule is already inclusive. Correcting the code onto URS-WL-01 does not change the written threshold (SOP-DEMO-017 §5.2). Sample record: Jira `CAD-1`.

## Blinding

| Id | Rule |
| --- | --- |
| URS-BL-01 | Derivations do not read `inst/demo/data/unblinding_key.csv` and do not join it into `adwl.csv` or any other output. |
| URS-BL-02 | Treatment assignment used in a locked analysis comes from the sponsor's unblinding procedure on the governed lakehouse, not from a key file in this workspace. |

## Traceability and evidence

| Id | Rule |
| --- | --- |
| URS-TR-01 | A pull request that changes `inst/demo/**` or `R/**` cites a Jira key or a `CR-` id in the body or the branch name. |
| URS-EV-01 | That same pull request changes a file under `tests/` unless the only validated-path edits are markdown. |
| URS-AU-01 | An agent edit appends one JSON line to `docs/audit/agent-hooks.jsonl` with a timestamp, an event name, and a path. The line does not include file contents. |

## What this plan does not cover

Promotion of a reviewed script onto the governed lakehouse, database lock, and the sponsor's validation report are outside this repository. The evidence pack on the pull request is an input to that process.
