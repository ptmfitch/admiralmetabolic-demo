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
