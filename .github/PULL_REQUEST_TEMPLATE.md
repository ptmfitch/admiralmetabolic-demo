DEMO / SYNTHETIC · for enablement only

This record is evidence for your validated process. It is not an approval, and it does not replace CSV, 21 CFR Part 11, Annex 11, or GAMP 5 change control.

## Change control

- CR / ticket ID: <!-- Jira key such as CAD-1, or CR- plus digits. A new change needs its own id. -->
- Risk: <!-- low | medium | high -->
- GAMP category: <!-- 1 infrastructure | 3 non-configured | 4 configured | 5 custom -->
- Impacted datasets, variables, and flags: <!-- e.g. ADWL / RESP5FL, RESP10FL -->
- Test evidence: <!-- command and result. Shared contract: `make test`. Pipeline: `Rscript inst/demo/run_pipeline.R` -->
- Reviewer sign-off: <!-- human name, role, and date. Leave this unsigned until a person signs. Agents do not sign. -->

## Notes for reviewers

- Validated derivation paths: `inst/demo/**` and `R/**`. Those paths require a human review (`@ptmfitch` in `.github/CODEOWNERS`).
- The demo SAP rule is inclusive: `RESP5FL` includes exactly 5.0% weight loss, and `RESP10FL` includes exactly 10.0%. See `docs/change-control/validation-plan.md`.
- Do not read or join `inst/demo/data/unblinding_key.csv` into agent context or into `inst/demo/output/adwl.csv`.
- Requirements and the sample defect record: `docs/change-control/`.
