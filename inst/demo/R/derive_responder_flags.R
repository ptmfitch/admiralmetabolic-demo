# DEMO / SYNTHETIC · for enablement only
# Week 26 weight-loss flags for the synthetic obesity/T2D demo.
# Not part of the admiralmetabolic package API.

#' Flag Week 26 weight-loss responders.
#'
#' `RESP5FL` and `RESP10FL` are populated on the Week 26 `WEIGHT` row and
#' are missing on every other row. `PCHG` is the signed SAP value already
#' rounded to 1 decimal (a loss is negative).
#'
#' @param dataset Analysis dataset with `PARAMCD`, `AVISITN`, and `PCHG`.
#' @return The input dataset with `RESP5FL` and `RESP10FL`.
derive_weight_loss_responder_flags <- function(dataset) {
  dataset %>%
    mutate(
      .week26_weight = PARAMCD == "WEIGHT" & AVISITN == 26 & !is.na(PCHG),
      RESP5FL = case_when(
        !.week26_weight ~ NA_character_,
        PCHG <= -5 ~ "Y",
        TRUE ~ "N"
      ),
      RESP10FL = case_when(
        !.week26_weight ~ NA_character_,
        PCHG <= -10 ~ "Y",
        TRUE ~ "N"
      )
    ) %>%
    select(-.week26_weight)
}
