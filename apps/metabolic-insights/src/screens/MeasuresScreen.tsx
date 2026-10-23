import { useMemo, useState } from "react";
import { flushSync } from "react-dom";
import { cn } from "@demo/ui/cn";
import { MeasureInput } from "../components/MeasureInput";
import { Shell } from "../components/Shell";
import {
  type EditableField,
  type Subject,
  type VisitName,
  fieldInRange,
  fieldRangeMessage,
} from "../lib/metrics";

const SCHEMA_ALERT_ID = "measures-schema-alert";

function measureInputId(usubjid: string, visit: "baseline" | "week24", field: EditableField): string {
  return `measure-${usubjid}-${visit}-${field}`;
}

type FilterId = "all" | "active" | "placebo" | "baseline" | "week24";

const FILTERS: { id: FilterId; label: string }[] = [
  { id: "all", label: "All subjects (48)" },
  { id: "active", label: "Arm: Active" },
  { id: "placebo", label: "Arm: Placebo" },
  { id: "baseline", label: "Visit: Baseline" },
  { id: "week24", label: "Visit: Week 24" },
];

const PREVIEW = ["CAD7-001", "CAD7-014", "CAD7-022", "CAD7-031"];

const COLUMNS: { field: EditableField; label: string; digits: number }[] = [
  { field: "weightKg", label: "Weight (kg)", digits: 1 },
  { field: "heightCm", label: "Height (cm)", digits: 0 },
  { field: "waistCm", label: "Waist (cm)", digits: 0 },
  { field: "glucoseMmolL", label: "Glucose (mmol/L)", digits: 1 },
  { field: "insulinUuMl", label: "Insulin (µU/mL)", digits: 1 },
  { field: "altUL", label: "ALT (U/L)", digits: 0 },
  { field: "astUL", label: "AST (U/L)", digits: 0 },
];

type Row = { subject: Subject; visit: VisitName; key: "baseline" | "week24" };

type CellErrors = {
  total: number;
  hidden: number;
  firstInvalidId: string | null;
  firstVisibleId: string | null;
  continueHint: string;
};

type AlertCopy = {
  summary: string;
  action: string | null;
  showAll: boolean;
};

function allMeasureRows(subjects: Subject[]): Row[] {
  const ordered = [...subjects].sort((a, b) => {
    const ai = PREVIEW.indexOf(a.usubjid);
    const bi = PREVIEW.indexOf(b.usubjid);
    if (ai !== -1 || bi !== -1) {
      if (ai === -1) return 1;
      if (bi === -1) return -1;
      return ai - bi;
    }
    return a.usubjid.localeCompare(b.usubjid);
  });
  const built: Row[] = [];
  for (const subject of ordered) {
    built.push({ subject, visit: "Baseline", key: "baseline" }, { subject, visit: "Week 24", key: "week24" });
  }
  return built;
}

function applySubjectFilter(rows: Row[], filter: FilterId): Row[] {
  if (filter === "active") return rows.filter((row) => row.subject.arm === "Active");
  if (filter === "placebo") return rows.filter((row) => row.subject.arm === "Placebo");
  if (filter === "baseline") return rows.filter((row) => row.visit === "Baseline");
  if (filter === "week24") return rows.filter((row) => row.visit === "Week 24");
  return rows;
}

function continueHint(total: number): string {
  const noun = total === 1 ? "field" : "fields";
  return `Fix ${total} invalid ${noun} to continue.`;
}

function invalidFieldCount(allRows: Row[], visibleRows: Row[]): CellErrors {
  const visibleKeys = new Set(visibleRows.map((row) => `${row.subject.usubjid}:${row.key}`));
  let total = 0;
  let hidden = 0;
  let firstInvalidId: string | null = null;
  let firstVisibleId: string | null = null;

  for (const row of allRows) {
    const shown = visibleKeys.has(`${row.subject.usubjid}:${row.key}`);
    for (const column of COLUMNS) {
      if (fieldInRange(column.field, row.subject[row.key][column.field])) continue;
      total += 1;
      const id = measureInputId(row.subject.usubjid, row.key, column.field);
      if (!firstInvalidId) firstInvalidId = id;
      if (shown) {
        if (!firstVisibleId) firstVisibleId = id;
      } else {
        hidden += 1;
      }
    }
  }

  return { total, hidden, firstInvalidId, firstVisibleId, continueHint: continueHint(total) };
}

function schemaAlertCopy(errors: CellErrors): AlertCopy | null {
  const { total, hidden } = errors;
  if (total === 0) return null;
  if (hidden === total) {
    if (total === 1) {
      return {
        summary: "1 field needs fixing. It's hidden by the current filter.",
        action: null,
        showAll: true,
      };
    }
    return {
      summary: `${total} fields need fixing. They're hidden by the current filter.`,
      action: null,
      showAll: true,
    };
  }
  if (hidden > 0) {
    return {
      summary: `${total} fields need fixing (${hidden} hidden by filter).`,
      action: "Correct them before analysis.",
      showAll: false,
    };
  }
  if (total === 1) {
    return {
      summary: "1 field is outside the expected unit range.",
      action: "Correct it before analysis.",
      showAll: false,
    };
  }
  return {
    summary: `${total} fields are outside the expected unit range.`,
    action: "Correct them before analysis.",
    showAll: false,
  };
}

export function MeasuresScreen({
  subjects,
  onChange,
  onImport,
  onContinue,
}: {
  subjects: Subject[];
  onChange: (usubjid: string, visit: "baseline" | "week24", field: EditableField, value: number) => void;
  onImport: () => void;
  onContinue: () => void;
}) {
  const [filter, setFilter] = useState<FilterId>("all");
  const [importNote, setImportNote] = useState<string | null>(null);
  const allRows = useMemo(() => allMeasureRows(subjects), [subjects]);
  const rows = useMemo(() => applySubjectFilter(allRows, filter), [allRows, filter]);
  const errors = useMemo(() => invalidFieldCount(allRows, rows), [allRows, rows]);
  const alertCopy = schemaAlertCopy(errors);
  const schemaOk = errors.total === 0;

  const revealHiddenErrors = () => {
    const id = errors.firstInvalidId;
    // The target cell is not mounted until the filter clears.
    flushSync(() => setFilter("all"));
    if (!id) return;
    document.getElementById(id)?.focus();
  };

  return (
    <Shell>
      {/* Header is h-16 and the disclosure bar is 33px; both include their borders. */}
      <div className="mx-auto flex w-full max-w-[1440px] scroll-pb-24 flex-col max-md:h-[calc(100dvh-97px)] max-md:overflow-y-auto">
        <div className="flex flex-col gap-6 px-10 py-7">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Subject measures</h1>
              <p className="mt-1.5 text-[13px] text-ink-soft">
                ADVS / ADLB baseline &amp; on-treatment records · editable before analysis
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                onImport();
                setImportNote("Loaded / schema-checked subject measures (ADVS / ADLB)");
              }}
              className="rounded-[10px] border border-line bg-card px-4 py-2.5 text-[13px] font-medium text-ink"
            >
              Import ADaM
            </button>
          </div>

          <div className="flex flex-col gap-6">
            <div className="flex flex-wrap gap-2" role="group" aria-label="Subject filters">
              {FILTERS.map((item) => {
                const selected = filter === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => setFilter(item.id)}
                    className={cn(
                      "rounded-full px-3 py-2 text-xs font-medium",
                      selected ? "border border-line bg-card text-ink-soft" : "bg-ink text-white",
                    )}
                  >
                    {item.label}
                  </button>
                );
              })}
            </div>
            {importNote ? <p className="text-xs font-medium text-brand">{importNote}</p> : null}
          </div>

          {alertCopy ? (
            <p id={SCHEMA_ALERT_ID} className="text-xs text-band-high" role="alert">
              {alertCopy.summary}{" "}
              {alertCopy.showAll ? (
                <button type="button" className="underline" onClick={revealHiddenErrors}>
                  Show all
                </button>
              ) : errors.firstVisibleId && alertCopy.action ? (
                <a
                  href={`#${errors.firstVisibleId}`}
                  className="underline"
                  onClick={(event) => {
                    const input = document.getElementById(errors.firstVisibleId ?? "");
                    if (!input) return;
                    event.preventDefault();
                    input.focus();
                  }}
                >
                  {alertCopy.action}
                </a>
              ) : (
                alertCopy.action
              )}
            </p>
          ) : null}

          <div className="overflow-hidden rounded-2xl border border-line bg-card">
            <div className="max-md:overflow-x-auto md:max-h-[430px] md:overflow-auto">
              <table className="w-full border-collapse text-left">
                <thead className="sticky top-0 bg-card-muted">
                  <tr>
                    {["USUBJID", "Arm", "Visit", ...COLUMNS.map((column) => column.label)].map((label) => (
                      <th key={label} scope="col" className="px-3.5 py-3 text-[11px] font-semibold text-muted">
                        {label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, index) => (
                    <tr key={`${row.subject.usubjid}-${row.visit}`} className={index % 2 === 1 ? "bg-row-alt" : "bg-card"}>
                      <th scope="row" className="px-3.5 py-2 text-xs font-medium text-ink">
                        {row.subject.usubjid}
                      </th>
                      <td className="px-3.5 py-2 text-xs text-ink">{row.subject.arm}</td>
                      <td className="px-3.5 py-2 text-xs text-ink">{row.visit}</td>
                      {COLUMNS.map((column) => {
                        const value = row.subject[row.key][column.field];
                        const invalid = !fieldInRange(column.field, value);
                        return (
                          <td key={column.field} className="px-3.5 py-1.5">
                            <MeasureInput
                              value={value}
                              digits={column.digits}
                              invalid={invalid}
                              message={fieldRangeMessage(column.field)}
                              inputId={measureInputId(row.subject.usubjid, row.key, column.field)}
                              describedBy={invalid ? SCHEMA_ALERT_ID : undefined}
                              label={`${row.subject.usubjid} ${row.visit} ${column.label}`}
                              onChange={(next) => onChange(row.subject.usubjid, row.key, column.field, next)}
                            />
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <p className="text-xs text-muted">
            Editable for walkthrough only — changes are not audited / Part 11 controlled.
          </p>
        </div>

        <div className="z-10 mt-auto flex h-24 shrink-0 flex-col items-end justify-center gap-1.5 border-t border-line bg-canvas px-10 max-md:sticky max-md:bottom-0 md:h-auto md:border-0 md:bg-transparent">
          <button
            type="button"
            aria-disabled={schemaOk ? undefined : true}
            aria-describedby={schemaOk ? undefined : SCHEMA_ALERT_ID}
            onClick={() => {
              if (!schemaOk) return;
              onContinue();
            }}
            className={cn(
              "rounded-[10px] bg-brand px-4 py-2.5 text-[13px] font-semibold text-white",
              !schemaOk && "cursor-not-allowed opacity-50",
            )}
          >
            Continue to analysis setup
          </button>
          <p className="text-right text-xs text-ink-soft">
            {schemaOk ? "Ready to continue to Analysis Setup" : errors.continueHint}
          </p>
        </div>
      </div>
    </Shell>
  );
}
