DEMO / SYNTHETIC · for enablement only

# Sample evidence-pack comment

This is a filled example of the comment `.github/workflows/evidence-pack.yml` maintains. The SHA and the test log are synthetic. It is not a live result, and it is not an approval.

~~~~
<!-- compliance-evidence-pack -->
DEMO / SYNTHETIC · for enablement only

Illustrative only. This comment produces evidence for your validated process. It is not an approval.

## Compliance Evidence Pack
Updated for 0123456789abcdef0123456789abcdef01234567

### Linked change request
- `CAD-1`

### Test results
Command: `make test`
Result: passed (exit 0)

Summary:

    OK: responder boundary includes exactly 5.0 percent

### Validated paths changed
- `inst/demo/run_pipeline.R`

### Scope
Validated paths checked here are `inst/demo/**` and `R/**`. QA has not accepted a risk tier. See SOP-DEMO-017.
~~~~

For this example the linked id is `CAD-1` because that key is the sample record for the inclusive `RESP5FL` rule (`CR-CAD-1.md`). A push that does not cite an id leaves "none found" in that section. A push that does not touch `inst/demo/**` or `R/**` leaves the validated-path list empty.
