import { useMemo, useState } from "react";
import { cn } from "@demo/ui/cn";
import { MeasureInput } from "../components/MeasureInput";
import { Shell } from "../components/Shell";
import {
  type EditableField,
  type Subject,
  type VisitName,
  EDITABLE_FIELDS,
  fieldInRange,
} from "../lib/metrics";

const SCHEMA_ALERT_ID = "measures-schema-alert";

function invalidFieldCount(subjects: Subject[]): number {
  let count = 0;
  for (const subject of subjects) {
    for (const visit of ["baseline", "week24"] as const) {
      for (const field of EDITABLE_FIELDS) {
        if (!fieldInRange(field, subject[visit][field])) count += 1;
      }
    }
  }
  return count;
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
  const invalidCount = useMemo(() => invalidFieldCount(subjects), [subjects]);
  const schemaOk = invalidCount === 0;

  const rows = useMemo(() => {
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
    return built.filter((row) => {
      if (filter === "active") return row.subject.arm === "Active";
      if (filter === "placebo") return row.subject.arm === "Placebo";
      if (filter === "baseline") return row.visit === "Baseline";
      if (filter === "week24") return row.visit === "Week 24";
      return true;
    });
  }, [filter, subjects]);

  return (
    <Shell>
      <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-6 px-10 py-7">
        <div className="flex items-start justify-between gap-6">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Subject measures</h1>
            <p className="mt-1.5 text-[13px] text-ink-soft">
              ADVS / ADLB baseline &amp; on-treatment records · editable before analysis
            </p>
          </div>
          <div className="flex flex-col items-end gap-1.5">
            <div className="flex items-center gap-2.5">
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
            </div>
            {schemaOk ? null : (
              <p className="text-right text-xs text-ink-soft">
                Fix {invalidCount} invalid {invalidCount === 1 ? "field" : "fields"} to continue.
              </p>
            )}
          </div>
        </div>

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

        <div className="overflow-hidden rounded-2xl border border-line bg-card">
          <div className="max-h-[430px] overflow-auto">
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

        {!schemaOk ? (
          <p id={SCHEMA_ALERT_ID} className="text-xs text-band-high" role="alert">
            {invalidCount} {invalidCount === 1 ? "field is" : "fields are"} outside the expected unit range.
            Correct them before analysis.
          </p>
        ) : null}
        <p className="text-xs text-muted">
          Editable for walkthrough only — changes are not audited / Part 11 controlled.
        </p>
      </div>
    </Shell>
  );
}
