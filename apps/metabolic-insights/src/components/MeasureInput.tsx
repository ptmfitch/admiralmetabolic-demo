import { useEffect, useId, useState } from "react";
import { cn } from "@demo/ui/cn";
import { formatMeasure } from "../lib/format";

export function MeasureInput({
  value,
  digits,
  label,
  invalid,
  describedBy,
  onChange,
}: {
  value: number;
  digits: number;
  label: string;
  invalid: boolean;
  describedBy?: string;
  onChange: (value: number) => void;
}) {
  const formatted = formatMeasure(value, digits);
  const [text, setText] = useState(formatted);
  const messageId = useId();
  const description = invalid ? [messageId, describedBy].filter(Boolean).join(" ") : undefined;

  // A partial entry such as "84." parses as 84 and would otherwise be rewritten to "84.0" mid-keystroke.
  useEffect(() => {
    setText((current) => {
      const parsed = Number(current);
      if (current.trim() !== "" && Number.isFinite(parsed) && parsed === value) return current;
      return formatted;
    });
  }, [formatted, value]);

  return (
    <div className="flex items-center gap-1.5">
      <input
        aria-label={label}
        aria-invalid={invalid}
        aria-describedby={description}
        inputMode="decimal"
        value={text}
        onChange={(event) => {
          const next = event.target.value;
          setText(next);
          const parsed = Number(next);
          if (next.trim() !== "" && Number.isFinite(parsed)) onChange(parsed);
        }}
        onBlur={() => {
          const parsed = Number(text);
          if (Number.isFinite(parsed)) {
            onChange(parsed);
            setText(formatMeasure(parsed, digits));
          } else {
            setText(formatted);
          }
        }}
        className={cn(
          "w-[4.5rem] rounded-md border bg-canvas px-2 py-1.5 text-xs font-medium text-ink",
          invalid ? "border-band-high" : "border-line",
        )}
      />
      {invalid ? (
        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-band-high">
          <span
            aria-hidden="true"
            className="inline-flex size-4 shrink-0 items-center justify-center rounded-sm border border-current text-[10px] font-bold leading-none"
          >
            !
          </span>
          <span id={messageId}>Out of range</span>
        </span>
      ) : null}
    </div>
  );
}
