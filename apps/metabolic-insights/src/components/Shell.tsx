import type { ReactNode } from "react";
import { cn } from "@demo/ui/cn";

const DISCLOSURE = "Demo · synthetic data · not for clinical use";

export type WalkthroughStep = {
  current: 1 | 2 | 3 | 4;
  label: string;
};

export function Shell({
  children,
  nav,
  step,
}: {
  children: ReactNode;
  nav?: ReactNode;
  step?: WalkthroughStep;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-canvas text-ink">
      <div className="sticky top-0 z-40">
        <header className="flex min-h-16 flex-wrap items-center justify-between gap-x-4 gap-y-2 border-b border-line bg-card px-4 py-3 lg:flex-nowrap lg:gap-6 lg:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <span className="size-7 shrink-0 rounded-lg bg-brand" aria-hidden="true" />
            <span className="flex min-w-0 flex-col leading-none">
              <span className="text-sm font-semibold">Metabolic Insights</span>
              <span className="mt-1 text-[11px] text-muted">CAD-7 · Weight Outcomes</span>
            </span>
            {step ? <StepChip step={step} /> : null}
          </div>
          <div className="flex min-w-0 flex-wrap items-center gap-2">{nav ?? <StudyBadge />}</div>
        </header>
        <div
          role="note"
          className="border-b border-disclosure-line bg-disclosure px-4 py-2 text-center text-xs font-semibold text-disclosure-ink"
        >
          {DISCLOSURE}
        </div>
      </div>
      <div className="flex min-h-0 flex-1 flex-col">{children}</div>
    </div>
  );
}

function StepChip({ step }: { step: WalkthroughStep }) {
  const phone = `${step.current} / 4`;
  const wide = `${step.current} / 4 ${step.label}`;
  return (
    <span className="shrink-0 rounded-md bg-brand-soft px-2 py-1 text-[10px] font-medium text-brand lg:text-[11px]">
      <span className="lg:hidden">{phone}</span>
      <span className="hidden lg:inline">{wide}</span>
    </span>
  );
}

export function StudyBadge() {
  return (
    <div className="flex items-center gap-4">
      <span className="hidden text-xs font-medium text-ink-soft lg:inline">Protocol CAD-7-WO</span>
      <span className="rounded-full bg-brand-soft px-2.5 py-1.5 text-[11px] font-medium text-brand">
        Demo study
      </span>
    </div>
  );
}

export function StickyActions({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "fixed inset-x-0 bottom-0 z-30 flex gap-2 border-t border-line bg-card px-4 pt-3 pb-4 lg:static lg:z-auto lg:border-0 lg:bg-transparent lg:p-0",
        className,
      )}
    >
      {children}
    </div>
  );
}
