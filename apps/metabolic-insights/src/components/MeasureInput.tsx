import { useEffect, useState } from "react";
import { cn } from "@demo/ui/cn";
import { formatMeasure } from "../lib/format";

export function MeasureInput({
  value,
  digits,
  label,
  invalid,
  onChange,
}: {
  value: number;
  digits: number;
  label: string;
  invalid: boolean;
  onChange: (value: number) => void;
}) {
  const formatted = formatMeasure(value, digits);
  const [text, setText] = useState(formatted);

  useEffect(() => {
    setText(formatted);
  }, [formatted]);

  return (
    <input
      aria-label={label}
      aria-invalid={invalid}
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
  );
}
