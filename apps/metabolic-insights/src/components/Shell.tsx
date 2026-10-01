import type { ReactNode } from "react";

const DISCLOSURE = "Demo · synthetic data · not for clinical use";

export function Shell({
  children,
  nav,
}: {
  children: ReactNode;
  nav?: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-canvas text-ink">
      <header className="flex h-16 items-center justify-between gap-6 border-b border-line bg-card px-8">
        <div className="flex items-center gap-3">
          <span className="size-7 shrink-0 rounded-lg bg-brand" aria-hidden="true" />
          <span className="flex flex-col leading-none">
            <span className="text-sm font-semibold">Metabolic Insights</span>
            <span className="mt-1 text-[11px] text-muted">CAD-7 · Weight Outcomes</span>
          </span>
        </div>
        {nav ?? <StudyBadge />}
      </header>
      <div
        role="note"
        className="border-b border-disclosure-line bg-disclosure px-4 py-2 text-center text-xs font-semibold text-disclosure-ink"
      >
        {DISCLOSURE}
      </div>
      {children}
    </div>
  );
}

export function StudyBadge() {
  return (
    <div className="flex items-center gap-4">
      <span className="text-xs font-medium text-ink-soft">Protocol CAD-7-WO</span>
      <span className="rounded-full bg-brand-soft px-2.5 py-1.5 text-[11px] font-medium text-brand">
        Demo study
      </span>
    </div>
  );
}
