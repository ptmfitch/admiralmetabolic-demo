import { useState } from "react";
import type { Analysis, AnalysisConfig } from "../lib/analyze";
import { formatRate } from "../lib/analyze";
import { ANALYSIS_WEEKS, type AnalysisWeek } from "../lib/metrics";
import { formatPercent, formatSigned } from "../lib/format";
import { Shell } from "../components/Shell";

type Tab = "overview" | "responders" | "metabolic" | "time";

const TABS: { id: Tab; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "responders", label: "Responders" },
  { id: "metabolic", label: "Metabolic" },
  { id: "time", label: "Time-to-event" },
];

const HERO_DISCLAIMER =
  "Illustrative / fictional cohort — not a treatment claim. Not for clinical decision-making.";

export function DashboardScreen({ analysis, config }: { analysis: Analysis; config: AnalysisConfig }) {
  const [tab, setTab] = useState<Tab>("overview");
  const threshold15 = analysis.thresholds[0];
  const threshold20 = analysis.thresholds[1];
  const threshold25 = analysis.thresholds[2];
  const show = (section: Tab | "hero") => {
    if (section === "hero") return config.outputs.meanChange && (tab === "overview" || tab === "responders");
    if (tab !== "overview" && tab !== section) return false;
    if (section === "responders") return config.outputs.responders;
    if (section === "metabolic") return config.outputs.bmi || config.outputs.whtr || config.outputs.fli || config.outputs.homa;
    return config.outputs.tte;
  };

  return (
    <Shell
      nav={
        <>
          <nav aria-label="Outcome sections" className="flex items-center gap-1">
            {TABS.map((item) => {
              const current = tab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  aria-current={current ? "page" : undefined}
                  onClick={() => setTab(item.id)}
                  className={
                    current
                      ? "rounded-lg bg-card-muted px-3.5 py-2 text-xs font-semibold text-ink"
                      : "rounded-lg px-3.5 py-2 text-xs font-medium text-ink-soft"
                  }
                >
                  {item.label}
                </button>
              );
            })}
          </nav>
          <button
            type="button"
            onClick={() => exportFigures(analysis, config.primaryWeek)}
            className="rounded-lg border border-line bg-card px-3 py-2 text-xs font-medium text-ink"
          >
            Export figures (demo)
          </button>
        </>
      }
    >
      <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-5 px-10 py-6">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h1 className="text-[22px] font-bold">{`Weight outcomes · Week ${config.primaryWeek}`}</h1>
            <p className="mt-1 text-xs text-ink-soft">
              {`FAS · Active n=${analysis.nActive} · Placebo n=${analysis.nPlacebo} · Primary: % change in body weight from baseline`}
            </p>
          </div>
          <span className="rounded-full bg-brand-soft px-2.5 py-1.5 text-[11px] font-medium text-brand">
            Analysis complete
          </span>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Kpi
            label="Mean % weight change · Active"
            value={formatPercent(analysis.activeMeanPct)}
            chip={formatCompare(analysis.placeboMeanPct)}
            note="Primary endpoint · LS mean (±SE shown in chart)"
          />
          <Kpi
            label="Responders ≥15% · Active"
            value={threshold15 ? `${threshold15.activePct.toFixed(1)}%` : "—"}
            chip={threshold15 ? `${threshold15.activeCount} / ${threshold15.activeN} subjects` : ""}
            note={
              threshold20 && threshold25
                ? `Secondary: ≥20% ${threshold20.activePct.toFixed(1)}% · ≥25% ${threshold25.activePct.toFixed(1)}%`
                : ""
            }
          />
          <Kpi
            label="Mean weight change · Active"
            value={formatSigned(analysis.activeMeanKg, 1, " kg")}
            chip="from baseline"
            chipTone="ink"
            note="Absolute change · complementary to %"
          />
        </div>

        <p className="rounded-[10px] border border-disclosure-line bg-disclosure px-3.5 py-2.5 text-xs font-medium text-disclosure-ink">
          {HERO_DISCLAIMER}
        </p>

        {show("hero") || show("responders") ? (
          <div className="grid items-stretch gap-4 xl:grid-cols-[minmax(0,1fr)_420px]">
            {show("hero") ? <WeightChart analysis={analysis} /> : <div />}
            {show("responders") ? <ResponderCard analysis={analysis} week={config.primaryWeek} /> : null}
          </div>
        ) : null}

        {show("metabolic") ? <MetabolicRow analysis={analysis} config={config} /> : null}
        {show("time") ? <TimeToEvent analysis={analysis} /> : null}
      </div>
    </Shell>
  );
}

function Kpi({
  label,
  value,
  chip,
  note,
  chipTone = "brand",
}: {
  label: string;
  value: string;
  chip: string;
  note: string;
  chipTone?: "brand" | "ink";
}) {
  return (
    <article className="rounded-2xl border border-line bg-card p-5">
      <p className="text-xs font-medium text-muted">{label}</p>
      <div className="mt-2 flex items-end gap-2.5">
        <p className="text-[32px] leading-none font-bold tracking-tight">{value}</p>
        <span
          className={
            chipTone === "brand"
              ? "mb-1 rounded-md bg-brand-wash px-2 py-1 text-xs font-semibold text-brand"
              : "mb-1 rounded-md bg-ink-wash px-2 py-1 text-xs font-semibold text-ink"
          }
        >
          {chip}
        </span>
      </div>
      <p className="mt-3 text-[11px] text-muted">{note}</p>
    </article>
  );
}

function formatCompare(placeboPct: number): string {
  return `vs ${formatPercent(placeboPct)} PBO`;
}

function WeightChart({ analysis }: { analysis: Analysis }) {
  const width = 860;
  const height = 250;
  const padL = 44;
  const padR = 16;
  const padT = 18;
  const padB = 32;
  const lows = [...analysis.series.Active, ...analysis.series.Placebo].map((point) => point.meanPct - point.se);
  const floor = Math.min(-20, ...lows);
  const yMin = Math.floor(floor / 5) * 5;
  const yMax = 0;
  const plotW = width - padL - padR;
  const plotH = height - padT - padB;
  const x = (week: number) => padL + (week / 24) * plotW;
  const y = (pct: number) => padT + ((yMax - pct) / (yMax - yMin)) * plotH;
  const ticks: number[] = [];
  for (let tick = 0; tick >= yMin; tick -= 5) ticks.push(tick);

  const path = (arm: "Active" | "Placebo") =>
    analysis.series[arm]
      .map((point, index) => `${index === 0 ? "M" : "L"} ${x(point.week)} ${y(point.meanPct)}`)
      .join(" ");

  return (
    <section className="rounded-2xl border border-line bg-card p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-[15px] font-semibold">Mean percent change in body weight</h2>
          <p className="mt-1 text-[11px] text-muted">% from baseline · weeks 0–24 · LS mean ± SE</p>
        </div>
        <div className="flex items-center gap-4 text-[11px] font-medium text-ink-soft">
          <span className="flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-brand" aria-hidden="true" /> Active
          </span>
          <span className="flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-placebo" aria-hidden="true" /> Placebo
          </span>
        </div>
      </div>
      <svg viewBox={`0 0 ${width} ${height}`} className="mt-4 h-[250px] w-full rounded-xl bg-canvas" role="img" aria-label="Mean percent change in body weight by week">
        {ticks.map((tick) => (
          <g key={tick}>
            <line x1={padL} x2={width - padR} y1={y(tick)} y2={y(tick)} stroke="#e0ddd8" strokeWidth="1" />
            <text x={4} y={y(tick) + 3} fill="#78766e" fontSize="10">
              {formatPercent(tick, 0)}
            </text>
          </g>
        ))}
        {(["Placebo", "Active"] as const).map((arm) => (
          <g key={arm}>
            {analysis.series[arm].map((point) => (
              <line
                key={`${arm}-se-${point.week}`}
                x1={x(point.week)}
                x2={x(point.week)}
                y1={y(point.meanPct - point.se)}
                y2={y(point.meanPct + point.se)}
                stroke={arm === "Active" ? "#0f766e" : "#78766e"}
                strokeWidth="2"
                opacity="0.45"
              />
            ))}
            <path d={path(arm)} fill="none" stroke={arm === "Active" ? "#0f766e" : "#78766e"} strokeWidth="2.5" />
            {analysis.series[arm].map((point) => (
              <circle key={`${arm}-${point.week}`} cx={x(point.week)} cy={y(point.meanPct)} r="4" fill={arm === "Active" ? "#0f766e" : "#78766e"} />
            ))}
          </g>
        ))}
        {ANALYSIS_WEEKS.map((week) => (
          <text key={week} x={x(week)} y={height - 8} textAnchor="middle" fill="#78766e" fontSize="10">
            {week}
          </text>
        ))}
        <text x={width / 2} y={height - 8} textAnchor="start" fill="#78766e" fontSize="10" dx="28">
          Week
        </text>
      </svg>
    </section>
  );
}

function ResponderCard({ analysis, week }: { analysis: Analysis; week: AnalysisWeek }) {
  return (
    <section className="rounded-2xl border border-line bg-card p-5">
      <h2 className="text-[15px] font-semibold">Weight responders</h2>
      <p className="mt-1 text-[11px] text-muted">{`% of subjects reaching threshold at Week ${week}`}</p>
      <div className="mt-4 flex flex-col gap-4">
        {analysis.thresholds.map((row) => (
          <div key={row.threshold}>
            <div className="flex items-baseline justify-between gap-3">
              <span className="text-xs font-semibold">{`≥${row.threshold}%`}</span>
              <span className="text-[11px] whitespace-pre text-muted">
                {`Active ${row.activePct.toFixed(1)}%  ·  PBO ${row.placeboPct.toFixed(1)}%`}
              </span>
            </div>
            <div className="mt-1.5 h-2.5 overflow-hidden rounded-full bg-card-muted">
              <div className="h-2.5 rounded-full bg-brand" style={{ width: `${Math.min(100, row.activePct)}%` }} />
            </div>
          </div>
        ))}
      </div>
      <p className="mt-4 text-[11px] text-muted">Secondary visuals — mean % change remains primary.</p>
    </section>
  );
}

type BandTone = "low" | "mid" | "high";

const BAND_TONE: Record<string, BandTone> = {
  normal: "low",
  overweight: "mid",
  obese: "high",
  "lt0.5": "low",
  mid: "mid",
  "ge0.6": "high",
  lt30: "low",
  ge60: "high",
};

const BAND_COLOR: Record<BandTone, string> = {
  low: "var(--color-band-low)",
  mid: "var(--color-band-mid)",
  high: "var(--color-band-high)",
};

function BandSwatch({ bandKey }: { bandKey: string }) {
  const tone = BAND_TONE[bandKey] ?? "low";
  const patternClass = tone === "mid" ? "band-swatch-mid" : tone === "high" ? "band-swatch-high" : "";
  return (
    <span
      aria-hidden="true"
      data-band-tone={tone}
      className={`band-swatch size-2.5 shrink-0 rounded-[3px] ${patternClass}`}
      style={{ ["--band-swatch-color" as string]: BAND_COLOR[tone] }}
    />
  );
}

function MetabolicRow({ analysis, config }: { analysis: Analysis; config: AnalysisConfig }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {config.outputs.bmi ? (
        <BandCard
          title="BMI (kg/m²)"
          subtitle={`WHO class · Week ${config.primaryWeek} Active`}
          rows={analysis.bmiBands}
        />
      ) : null}
      {config.outputs.whtr ? (
        <BandCard title="WHtR" subtitle="Waist / height · dimensionless" rows={analysis.whtrBands} />
      ) : null}
      {config.outputs.fli ? (
        <BandCard title="FLI (0–100)" subtitle="Fatty liver index bands" rows={analysis.fliBands} />
      ) : null}
      {config.outputs.homa ? (
        <section className="rounded-2xl border border-line bg-card p-[18px]">
          <h2 className="text-sm font-semibold">HOMA-IR</h2>
          <p className="mt-1 text-[11px] text-muted">Glucose mmol/L · insulin mU/L · /22.5</p>
          <ul className="mt-3 flex flex-col gap-3 text-xs">
            <HomaRow label="Median Active" value={analysis.homaMedianActive.toFixed(1)} tone="bg-brand" />
            <HomaRow label="Median Placebo" value={analysis.homaMedianPlacebo.toFixed(1)} tone="bg-placebo" />
            <HomaRow label="Δ vs baseline Active" value={formatSigned(analysis.homaDeltaActive, 1)} tone="bg-band-low" />
          </ul>
        </section>
      ) : null}
    </div>
  );
}

function BandCard({
  title,
  subtitle,
  rows,
}: {
  title: string;
  subtitle: string;
  rows: Analysis["bmiBands"];
}) {
  return (
    <section className="rounded-2xl border border-line bg-card p-[18px]">
      <h2 className="text-sm font-semibold">{title}</h2>
      <p className="mt-1 text-[11px] text-muted">{subtitle}</p>
      <ul className="mt-3 flex flex-col gap-3">
        {rows.map((row) => (
          <li key={row.key} className="flex items-center gap-2 text-xs">
            <BandSwatch bandKey={row.key} />
            <span className="font-medium">{row.label}</span>
            <span className="ml-auto font-semibold text-ink-soft">{`${row.pct}%`}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

function HomaRow({ label, value, tone }: { label: string; value: string; tone: string }) {
  return (
    <li className="flex items-center gap-2">
      <span className={`size-2.5 rounded-[3px] ${tone}`} aria-hidden="true" />
      <span className="font-medium">{label}</span>
      <span className="ml-auto font-semibold text-ink-soft">{value}</span>
    </li>
  );
}

function TimeToEvent({ analysis }: { analysis: Analysis }) {
  const max = Math.max(10, ...analysis.incidence.flatMap((point) => [point.activePct, point.placeboPct]));
  return (
    <section className="rounded-2xl border border-line bg-card p-5">
      <div className="flex items-baseline justify-between gap-4">
        <h2 className="text-sm font-semibold">Time to ≥15% weight reduction</h2>
        <p className="text-[11px] text-muted">Cumulative incidence · Active vs Placebo · weeks 0–24</p>
      </div>
      <div className="mt-4 flex h-[140px] items-end gap-3 rounded-[10px] bg-canvas px-4 pt-4 pb-2">
        {analysis.incidence.map((point) => (
          <div key={point.week} className="flex flex-1 flex-col items-center justify-end gap-1">
            <div className="flex h-[100px] w-full items-end justify-center gap-1">
              <div
                className="w-5 rounded-t bg-brand"
                style={{ height: `${Math.max(2, (point.activePct / max) * 100)}px` }}
                title={`Active week ${point.week}: ${point.activePct.toFixed(1)}%`}
              />
              <div
                className="w-5 rounded-t bg-placebo/50"
                style={{ height: `${Math.max(2, (point.placeboPct / max) * 100)}px` }}
                title={`Placebo week ${point.week}: ${point.placeboPct.toFixed(1)}%`}
              />
            </div>
            <span className="text-[10px] text-muted">{weekLabel(point.week)}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

function weekLabel(week: AnalysisWeek): string {
  return `W${week}`;
}

function exportFigures(analysis: Analysis, week: AnalysisWeek): void {
  const lines = [
    "DEMO / SYNTHETIC · for enablement only",
    HERO_DISCLAIMER,
    `Week,${week}`,
    `Active mean percent change,${analysis.activeMeanPct.toFixed(1)}`,
    `Placebo mean percent change,${analysis.placeboMeanPct.toFixed(1)}`,
    `Active mean kg change,${analysis.activeMeanKg.toFixed(1)}`,
    ...analysis.thresholds.map(
      (row) =>
        `Responders >=${row.threshold}%,${formatRate(row.activeCount, row.activeN)} active,${formatRate(row.placeboCount, row.placeboN)} placebo`,
    ),
    ...analysis.bmiBands.map((row) => `BMI ${row.label},${row.pct}%`),
    ...analysis.whtrBands.map((row) => `WHtR ${row.label},${row.pct}%`),
    ...analysis.fliBands.map((row) => `FLI ${row.label},${row.pct}%`),
    `HOMA-IR median active,${analysis.homaMedianActive.toFixed(1)}`,
    `HOMA-IR median placebo,${analysis.homaMedianPlacebo.toFixed(1)}`,
    `HOMA-IR delta vs baseline active,${analysis.homaDeltaActive.toFixed(1)}`,
  ];
  const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "cad7-weight-outcomes-demo.csv";
  link.click();
  URL.revokeObjectURL(url);
}
