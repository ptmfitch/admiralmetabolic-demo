import { ChevronDown } from "lucide-react";
import type { ReactNode } from "react";
import type { AnalysisConfig } from "../lib/analyze";
import type { AnalysisWeek } from "../lib/metrics";
import { Shell } from "../components/Shell";

const OUTPUTS: { key: keyof AnalysisConfig["outputs"]; title: string; detail: string }[] = [
  { key: "meanChange", title: "Mean % weight change (±SE)", detail: "By arm · primary visual" },
  { key: "responders", title: "Responder rates ≥15 / ≥20 / ≥25%", detail: "Secondary flags" },
  { key: "bmi", title: "BMI (kg/m²) + WHO class bands", detail: "Underweight → Obese III" },
  { key: "whtr", title: "WHtR bands", detail: "<0.5 / 0.5–<0.6 / ≥0.6" },
  { key: "fli", title: "FLI (0–100) bands", detail: "<30 / 30–<60 / ≥60" },
  { key: "homa", title: "HOMA-IR", detail: "Glucose mmol/L · insulin mU/L ÷ 22.5" },
  { key: "tte", title: "Time to ≥X% weight reduction", detail: "Cumulative incidence bars (weeks 0–24)" },
];

export function ConfigScreen({
  config,
  subjectCount,
  onChange,
  onBack,
  onRun,
}: {
  config: AnalysisConfig;
  subjectCount: number;
  onChange: (config: AnalysisConfig) => void;
  onBack: () => void;
  onRun: () => void;
}) {
  const setWeek = (primaryWeek: AnalysisWeek) => onChange({ ...config, primaryWeek });
  const toggle = (key: keyof AnalysisConfig["outputs"]) =>
    onChange({ ...config, outputs: { ...config.outputs, [key]: !config.outputs[key] } });

  return (
    <Shell>
      <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-6 px-10 py-7">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Analysis configuration</h1>
          <p className="mt-1.5 text-[13px] text-ink-soft">
            Define population, endpoints, and output datasets before running the ADaM-based weight analysis.
          </p>
        </div>

        <div className="grid items-start gap-5 lg:grid-cols-2">
          <section className="rounded-2xl border border-line bg-card p-6">
            <h2 className="text-base font-semibold">Population &amp; visits</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <SelectField label="Analysis set" value={`FAS — Full Analysis Set (n=${subjectCount})`}>
                <option>{`FAS — Full Analysis Set (n=${subjectCount})`}</option>
              </SelectField>
              <SelectField label="Treatment arms" value="Active vs Placebo">
                <option>Active vs Placebo</option>
              </SelectField>
              <SelectField label="Baseline visit" value="Week 0 / Day 1">
                <option>Week 0 / Day 1</option>
              </SelectField>
              <label className="flex flex-col gap-1.5 text-xs font-semibold text-ink-soft">
                Primary timepoint
                <span className="relative">
                  <select
                    aria-label="Primary timepoint"
                    value={config.primaryWeek}
                    onChange={(event) => setWeek(Number(event.target.value) as AnalysisWeek)}
                    className="w-full appearance-none rounded-[10px] border border-line bg-card px-3.5 py-3 text-sm font-medium text-ink"
                  >
                    <option value={12}>Week 12</option>
                    <option value={24}>Week 24</option>
                  </select>
                  <ChevronDown className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-muted" aria-hidden="true" />
                </span>
              </label>
            </div>
            <div className="mt-4">
              <p className="text-xs font-semibold text-ink-soft">Primary endpoint</p>
              <p className="mt-1.5 inline-flex rounded-[10px] border border-line bg-canvas px-3.5 py-3 text-sm font-medium text-ink">
                Percent change in body weight from baseline
              </p>
              <p className="mt-1.5 text-[11px] text-muted">CONTINUOUS · ADVS.AVAL</p>
            </div>
          </section>

          <section className="rounded-2xl border border-line bg-card p-6">
            <h2 className="text-base font-semibold">Derived outputs</h2>
            <ul className="mt-4 flex flex-col gap-4">
              {OUTPUTS.map((output) => {
                const checked = config.outputs[output.key];
                return (
                  <li key={output.key}>
                    <label className="flex cursor-pointer items-center gap-3 rounded-[10px] bg-canvas px-3 py-2.5 focus-within:outline focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-brand">
                      <input
                        type="checkbox"
                        className="sr-only"
                        checked={checked}
                        onChange={() => toggle(output.key)}
                      />
                      <span
                        aria-hidden="true"
                        className={checked ? "size-[18px] rounded bg-brand" : "size-[18px] rounded border border-line bg-card"}
                      />
                      <span>
                        <span className="block text-[13px] font-medium text-ink">{output.title}</span>
                        <span className="block text-[11px] text-muted">{output.detail}</span>
                      </span>
                    </label>
                  </li>
                );
              })}
            </ul>
          </section>
        </div>

        <div className="flex items-end justify-between gap-6">
          <button
            type="button"
            onClick={onBack}
            className="rounded-[10px] border border-line bg-card px-[18px] py-3 text-[13px] font-medium text-ink"
          >
            Back to measures
          </button>
          <div className="flex flex-col items-end gap-2">
            <button
              type="button"
              onClick={onRun}
              className="rounded-xl bg-brand px-[22px] py-3.5 text-sm font-semibold text-white"
            >
              Run weight outcomes analysis
            </button>
            <p className="text-[11px] text-muted">
              {`Creates demo analysis summaries · ~${subjectCount} subjects · Week ${config.primaryWeek} primary`}
            </p>
          </div>
        </div>
      </div>
    </Shell>
  );
}

function SelectField({
  label,
  value,
  children,
}: {
  label: string;
  value: string;
  children: ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1.5 text-xs font-semibold text-ink-soft">
      {label}
      <span className="relative">
        <select
          aria-label={label}
          defaultValue={value}
          className="w-full appearance-none rounded-[10px] border border-line bg-card px-3.5 py-3 text-sm font-medium text-ink"
        >
          {children}
        </select>
        <ChevronDown className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-muted" aria-hidden="true" />
      </span>
    </label>
  );
}
