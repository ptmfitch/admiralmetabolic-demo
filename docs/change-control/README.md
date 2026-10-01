DEMO / SYNTHETIC · for enablement only

# Study derivation change control

Illustrative kit for a chronic-disease ADaM demo. It produces evidence for your validated process. It does not replace that process.

| Document | Use |
| --- | --- |
| [sop-study-derivation-change-control.md](sop-study-derivation-change-control.md) | SOP-DEMO-017. How a derivation change is proposed, tested, reviewed, and left for a human to accept. |
| [validation-plan.md](validation-plan.md) | Written rules for `RESP5FL`, `RESP10FL`, blinding, traceability, and the audit trail. |
| [CR-CAD-1.md](CR-CAD-1.md) | Sample change request for the seeded 5.0% responder-boundary defect. Jira key `CAD-1`. |
| [CR-0002.md](CR-0002.md) | Change request for the Week 26 flag comparison. Id `CR-0002`. Not the sample boundary defect. |
| [compliance-reviewer.md](compliance-reviewer.md) | Prompt for a separate reviewer agent. It drafts a record and stops. It does not sign. |
| [hooks.md](hooks.md) | What the Cursor hooks allow, deny, and append. |
| [evidence-pack.md](evidence-pack.md) | What the pull-request evidence comment contains, and how the workflow updates it. |
| [sample-evidence-pack.md](sample-evidence-pack.md) | A filled example of that comment. |

Validated paths owned by this process: `inst/demo/**` and `R/**`. The demo pipeline is `Rscript inst/demo/run_pipeline.R`, which writes `inst/demo/output/adwl.csv`.
