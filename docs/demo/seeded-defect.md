# DEMO / SYNTHETIC · for enablement only

Demo seed for the synthetic 26-week obesity/T2D analysis. This note is enablement material. It does not describe a defect in admiral or admiralmetabolic. The derivation in this fork is built on those open-source helpers, and the seed is only in the demo responder function.

## Seeded comparison

Week 26 weight-loss flags are set in `derive_weight_loss_responder_flags()` in `inst/demo/R/derive_responder_flags.R`.

Percent change (`PCHG`) is the signed ADaM value: a loss is negative. A 5% loss is `PCHG = -5.0`. A 10% loss is `PCHG = -10.0`. The SAP display rule rounds `PCHG` to 1 decimal before the flags are set, so those boundaries are exact and the comparison itself is the only difference.

- `RESP10FL` uses `PCHG <= -10`. A Week 26 weight loss of exactly 10.0% is `Y`. This is the intended rule.
- `RESP5FL` uses `PCHG < -5`. A Week 26 weight loss of exactly 5.0% is `N`. The intended rule is `PCHG <= -5`.

No other derivation is altered. Baseline, change, percent change, BMI, and BMI class come from admiral helpers (`derive_vars_merged`, `derive_param_bmi`, `derive_var_base`, `derive_var_chg`, `derive_var_pchg`, `derive_vars_cat`).

## Who sits on the boundary

The generator anchors Week 26 weight so the rounded percent change is exactly `-5.0` or `-10.0`. Counts below are on `WEIGHT` rows with `AVISITN == 26` in `inst/demo/output/adwl.csv`.

Exactly 5.0% weight loss: **9 subjects, 3 in each masked arm**.

| Masked arm | Actual treatment (unblinding key) | Exactly 5.0% | Exactly 10.0% |
| --- | --- | --- | --- |
| ARM A | High Dose | 3 | 2 |
| ARM B | Placebo | 3 | 2 |
| ARM C | Low Dose | 3 | 2 |

The actual treatment is stored only in `inst/demo/data/unblinding_key.csv` (`USUBJID`, `TRT01A`). The analysis file carries `TRT01P` (`ARM A` / `ARM B` / `ARM C`) and does not contain `TRT01A`.

## Responder rates at Week 26

`>= 5%` weight loss (`RESP5FL`), 66 subjects per arm. The inclusive column is what the reference fix produces. The seeded column is what `inst/demo/run_pipeline.R` writes today. The two columns differ by the 3 subjects at exactly 5.0% in that arm.

| Masked arm | Actual treatment | Seeded `PCHG < -5` | Inclusive `PCHG <= -5` |
| --- | --- | --- | --- |
| ARM A | High Dose | 63/66 (95.5%) | 66/66 (100.0%) |
| ARM B | Placebo | 8/66 (12.1%) | 11/66 (16.7%) |
| ARM C | Low Dose | 54/66 (81.8%) | 57/66 (86.4%) |

`>= 10%` weight loss (`RESP10FL`) is already inclusive, so the fix does not change it.

| Masked arm | Actual treatment | `RESP10FL` |
| --- | --- | --- |
| ARM A | High Dose | 54/66 (81.8%) |
| ARM B | Placebo | 2/66 (3.0%) |
| ARM C | Low Dose | 14/66 (21.2%) |

## What the checked-in tests cover

`tests/testthat/test-demo-adwl.R` checks the output shape, blinding, BMI class, change, percent change, and the inclusive 10% boundary. It also checks 5% losses that are strictly past 5% and losses that are short of 5%. It does not assert the exact 5.0% row, so the suite stays green with the seed in place.

## Reference fix

Branch `demo/reference-fix-5pct-boundary` (no pull request) adds `tests/testthat/test-demo-resp5-boundary.R`, which expects `RESP5FL == "Y"` when Week 26 `PCHG == -5`, and changes the 5% comparison from `<` to `<=`. That test fails on the seeded code and passes on the reference branch.
