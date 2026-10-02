import { useEffect, useState } from "react";
import { Shell } from "../components/Shell";

const STEPS = [
  "Loaded / schema-checked subject measures (ADVS / ADLB)",
  "Built analysis population (FAS, n=48)",
  "Computing % change from baseline & responders",
  "Deriving BMI, WHtR, FLI, HOMA-IR bands",
  "Rendering cumulative incidence (weeks 0–24)",
] as const;

export function ProcessingScreen({
  populationN,
  primaryWeek,
  onDone,
}: {
  populationN: number;
  primaryWeek: number;
  onDone: () => void;
}) {
  const [cursor, setCursor] = useState(2);
  const steps = STEPS.map((label, index) =>
    index === 1 ? `Built analysis population (FAS, n=${populationN})` : label,
  );

  useEffect(() => {
    if (cursor >= steps.length) {
      const done = window.setTimeout(onDone, 600);
      return () => window.clearTimeout(done);
    }
    const timer = window.setTimeout(() => setCursor((current) => current + 1), 800);
    return () => window.clearTimeout(timer);
  }, [cursor, onDone, steps.length]);

  const progress = Math.min(100, ((Math.min(cursor, steps.length - 1) + 1) / steps.length) * 100);
  const remaining = Math.max(3, (steps.length - cursor + 1) * 3);

  return (
    <Shell step={{ current: 3, label: "Processing" }}>
      <div className="flex flex-1 items-center justify-center px-4 py-8 lg:px-10 lg:py-16">
        <section className="w-full max-w-[720px] rounded-[20px] border border-line bg-card p-5 lg:p-10">
          <h1 className="text-[22px] font-bold">Running analysis</h1>
          <p className="mt-2 text-[13px] text-ink-soft">
            {`CAD-7 weight outcomes · FAS · Week ${primaryWeek} primary`}
          </p>
          <div
            className="mt-7 h-2 overflow-hidden rounded-full bg-card-muted"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(progress)}
            aria-label="Analysis progress"
          >
            <div className="h-2 rounded-full bg-brand transition-all duration-500" style={{ width: `${progress}%` }} />
          </div>
          <ol className="mt-7 flex flex-col gap-4" aria-live="polite">
            {steps.map((label, index) => {
              const state = index < cursor ? "done" : index === cursor ? "active" : "pending";
              return (
                <li key={label} className="flex items-center gap-3">
                  <span
                    aria-hidden="true"
                    className={
                      state === "pending"
                        ? "size-3 rounded-full border border-line bg-card"
                        : "size-3 rounded-full bg-brand"
                    }
                  />
                  <span
                    className={
                      state === "pending"
                        ? "text-sm whitespace-normal text-muted"
                        : "text-sm font-medium whitespace-normal text-ink"
                    }
                  >
                    {label}
                  </span>
                </li>
              );
            })}
          </ol>
          <p className="mt-7 text-xs text-muted">{`Estimated remaining: ~${remaining} seconds`}</p>
        </section>
      </div>
    </Shell>
  );
}
